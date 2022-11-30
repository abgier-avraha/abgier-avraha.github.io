import type { MarkdownInstance } from "astro";
import type { Frontmatter } from "../types";
import { slufigyAll } from "./slugify";

const getPostsByTag = (posts: MarkdownInstance<Frontmatter>[], tag: string) =>
  posts.filter(post => slufigyAll(post.frontmatter.tags).includes(tag));

export default getPostsByTag;
