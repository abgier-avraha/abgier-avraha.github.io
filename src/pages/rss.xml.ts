import rss from "@astrojs/rss";
import slugify from "@utils/slugify";
import type { MarkdownInstance } from "astro";
import { SITE } from "src/config";
import type { Frontmatter } from "src/types";

const postImportResult = import.meta.glob<MarkdownInstance<Frontmatter>>(
  "../contents/**/**/*.md",
  {
    eager: true,
  }
);
const posts = Object.values(postImportResult);

export const get = () =>
  rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    items: posts
      .filter(({ frontmatter }) => !frontmatter.draft)
      .map(({ frontmatter }) => ({
        link: `posts/${slugify(frontmatter)}`,
        title: frontmatter.title,
        description: frontmatter.description,
        pubDate: new Date(frontmatter.datetime),
      })),
  });
