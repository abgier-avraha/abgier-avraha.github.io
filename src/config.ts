import type { SocialObjects } from "./types";

export const SITE = {
  website: "https://abgier-avraha.github.io/",
  author: "Abgier Avraha",
  desc: "A blog for React TypeScript and Dotnet developers.",
  title: "Producing Value",
  // TODO: replace image
  ogImage: "default-og.png",
  lightAndDarkMode: true,
  postPerPage: 3,
};

// TODO: replace and enable image
export const LOGO_IMAGE = {
  enable: false,
  svg: false,
  width: 216,
  height: 46,
};
// TODO: replace favicon

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/abgier-avraha",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://au.linkedin.com/in/abgier-avraha-240510126",
    linkTitle: `${SITE.title} on LinkedIn`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:abgier.avraha@gmail.com",
    linkTitle: `Send an email to ${SITE.title}`,
    active: true,
  },
];
