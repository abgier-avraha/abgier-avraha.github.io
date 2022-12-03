---
author: Abgier Avraha
datetime: 2022-12-1T11:00:00.348Z
title: React Testing with React Context
slug: react-testing-with-react-context
featured: true
draft: false
tags:
  - guide
  - typescript
  - react
  - github
  - hooks
  - context
  - provider
  - vite
  - vitest
ogImage: ""
description: A guide for utilizing service abstractions through React Context to swap out real services with mock services in tests.
---

The following article is a guide for using abstractions with the React Context API to write cleaner automated tests for React. Using abstractions for services, such as HTTP API's and browser specific API's, allows you to easily reimplement those services with mock data for your testing environment. Using Dotnet's impressive set of interfaces to power everything on the backend drove me to see what benefits more abstraction could bring to the frontend.

## Table of contents

## JS Module Mocking vs React Context

### JS Module Mocking

Most React devs may have come across module mocking at some point. We won't be using Jest in this guide in favor of Vitest but you may be familiar with this documentation on mocking modules manually/automatically https://jestjs.io/docs/manual-mocks#mocking-user-modules. Module mocking achieves a similar goal of replacing the implementation of a file with one that is more appropriate for tests. The main downsides of module mocking is that

- It depends on having a mock file in a Jest specified folder `module_dir/__mocks__/module_file_name.js`
- Or manually replacing a module at a given path via `jest.mock("./module_path", () => mockModule )`.

This can be immensely useful when working on brownfield projects with many existing modules but for other projects we can declare and hook into abstractions to avoid module mocking all together. We can also statically verify that our test will actually work by just making sure our test files compile in TypeScript.

### React Context

React Context allows us to access any value in any component nested within a provider component. So imagine the value we have is an instance of a class which is preventing us from writing our tests because it is dependent on external services on the internet or browser specific API's which are unavailable in the test suite. We can swap out the instance of that class with a fake one in our tests and bypass module mocking all together.

Imagine replacing this:

```tsx
<ApiProvider implementation={api}>
  <App />
</ApiProvider>
```

With this to be able to run your test:

```tsx
<ApiProvider implementation={fakeApi}>
  <App />
</ApiProvider>
```

In the code below we will create an API service interface. We will then select the appropriate API service implementation depending on whether the code is running in our web browser or within automated tests. We can then pass it into our API context provider component. The API service will be accessible through a React hook called `useApi()`.

## Using React Context with Service Interfaces

### Creating an API Interface

So this will be the interface that we need to implement before passing our API service to the API service context provider.

```tsx
// src/services/api-service/IApiService.ts
export interface PostDTO {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export interface IApiService {
  getPosts(): Promise<PostDTO[]>;
}
```

### Implementing Our API Interface

Our real implementation of the API service for production and development.

```tsx
// src/services/api-service/implementations/ApiService.ts
import { IApiService, PostDTO } from "../IApiService";

export class ApiService implements IApiService {
  async getPosts(): Promise<PostDTO[]> {
    const res = await fetch(
      "https://jsonplaceholder.typicode.com/posts?userId=1"
    );
    return await res.json();
  }
}
```

### Providing Our API Implementation Through React Context

Instead of the `<ApiProvider />` deciding what API service implementation we have to use, we can provide our own implementation of the API service through the `implementation` prop. The `useApi()` hook which fetches the implementation from our provider will be the gateway for whenever we want to make API calls.

```tsx
// src/hooks/ApiProvider.tsx
import React, { useContext } from "react";
import { IApiService } from "../services/api-service/IApiService";
import { ApiService } from "../services/api-service/providers/ApiService";

interface IProps {
  implementation: IApiService;
  children: React.ReactNode;
}

// Initialize the context with a default value
const ApiContext = React.createContext<IApiService>(new ApiService());

export function ApiProvider(props: IProps) {
  return (
    <ApiContext.Provider value={props.implementation}>
      {props.children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  return useContext(ApiContext);
}
```

### Accessing Our Implementation with a Hook

`index.tsx` will be the root of our application and provide our app with any context it requires.

```tsx
// src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ApiProvider } from "./hooks/ApiProvider";
import { ApiService } from "./services/api-service/implementations/ApiService";

const api = new ApiService();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApiProvider implementation={api}>
      <App />
    </ApiProvider>
  </React.StrictMode>
);
```

`<App />` will be our the entrypoint closest to our root. It is currently wrapped by `index.tsx` which includes a provider for the real API service. We will wrap `<App />` with a different provider in our tests so that we can work with a fake implementation of our API service.

```tsx
// src/App.tsx
import { Posts } from "./components/Posts";

function App() {
  return <Posts />;
}

export default App;
```

`<Posts />` is the component that will actually consume data from the API service and display it.

```tsx
// src/components/Posts.tsx
import { useAsync } from "react-async-hook";
import { useApi } from "../hooks/ApiProvider";
import "./Posts.css";

export function Posts() {
  const api = useApi();
  const fetcher = useAsync(api.getPosts, []);

  if (fetcher.result === undefined) {
    return null;
  }

  return (
    <div className="container">
      {fetcher.result.map(post => (
        <div key={post.id} className="basic-card basic-card-aqua">
          <div className="card-content">
            <span className="card-title">{post.title}</span>
            <p className="card-text">{post.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

Go ahead and run `npm start` to see that our `<Posts />` component is fetching real data via an XHR request.

## Writing Tests

### Creating a Fake API Implementation

Our fake implementation of the API service for general automated testing.

```tsx
// src/services/api-service/implementations/FakeApiService.ts
import { IApiService, PostDTO } from "../IApiService";

export class FakeApiService implements IApiService {
  async getPosts(): Promise<PostDTO[]> {
    return FakePostsRes;
  }
}

const FakePostsRes: PostDTO[] = [
  {
    userId: 1,
    id: 1,
    title: "Mock post 1",
    body: "Mock body for post 1.",
  },
  {
    userId: 1,
    id: 2,
    title: "Mock post 2",
    body: "Mock body for post 2.",
  },
  {
    userId: 1,
    id: 3,
    title: "Mock post 3",
    body: "Mock body for post 3.",
  },
];
```

### Providing the Fake API in Tests

`<TestProvider />` will wrap our tests and will allow us to seamlessly and safely swap out the implementation passed into our context provider. It will use the fake implementation of our API by default but the implementation can be swapped out per test, allowing us to test an endless number of scenarios.

```tsx
// src/test-utils/TestProvider.tsx
import { ApiProvider } from "../hooks/ApiProvider";
import { IApiService } from "../services/api-service/IApiService";
import { FakeApiService } from "../services/api-service/implementations/FakeApiService";

// A safe default for tests
const api = new FakeApiService();

interface IProps {
  children: React.ReactNode;
  apiService?: IApiService;
}

/*
  You can use this component to add multiple other service providers
  that are generally required for your test cases.
*/
export function TestProvider(props: IProps) {
  return (
    <ApiProvider implementation={props.apiService ?? api}>
      {props.children}
    </ApiProvider>
  );
}
```

### Writing Our Test

In this test we create a mock implementation of the `getPosts()` method in our API so that we can monitor how how often it is called and make assertions on what will show up on the screen.

```tsx
// src/App.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import App from "./App";
import { TestProvider } from "./test-utils/TestProvider";

it("Renders posts from the API service", async () => {
  // Arrange
  const getPosts = async () => [
    {
      userId: 1,
      id: 1,
      title: "Mock post 1",
      body: "Mock body for post 1.",
    },
  ];

  const getPostsMock: typeof getPosts = vi.fn().mockImplementation(getPosts);

  // Act
  render(
    <TestProvider
      apiService={{
        getPosts: getPostsMock,
      }}
    >
      <App />
    </TestProvider>
  );

  // Assert
  await waitFor(() => {
    expect(getPostsMock).toHaveBeenCalledOnce();

    expect(screen.getByText("Mock post 1")).toBeInTheDocument();
    expect(screen.getByText("Mock body for post 1.")).toBeInTheDocument();
  });
});
```

Go ahead and run `npm test` to see that our `<Posts />` component is rendering mock data in our tests.

## Github Example Repo

All of the code snippets above originate from this repo. https://github.com/abgier-avraha/React-Testing-with-React-Context-Example
