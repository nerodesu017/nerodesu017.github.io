import { defineDocumentType, makeSource } from "contentlayer/source-files"
import rehypePrism from "@mapbox/rehype-prism"
import {visit} from "unist-util-visit";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
// import { inspect } from "util";

/** @type {import('contentlayer/source-files').ComputedFields} */
const computedFields = {
  slug: {
    type: "string",
    resolve: (doc) => `/${doc._raw.flattenedPath}`,
  },
  slugAsParams: {
    type: "string",
    resolve: (doc) => doc._raw.flattenedPath.split("/").slice(1).join("/"),
  },
}

export const Page = defineDocumentType(() => ({
  name: "Page",
  filePathPattern: `pages/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    keywords: {
      type: "string"
    },
    author: {
      type: "string"
    },
    date: {
      type: "string"
    }
  },
  computedFields,
}))

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `posts/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    date: {
      type: "date",
      required: true,
    },
    keywords: {
      type: "string"
    },
    author: {
      type: "string"
    },
    layout: {
      type: "string"
    },
    categories: {
      type: "json"
    },
    tags: {
      type: "json"
    }
  },
  computedFields,
}))

export default makeSource({
  contentDirPath: "./content",
  documentTypes: [Post, Page],
  mdx: {
    rehypePlugins: [
      rehypePrism,
      rehypeKatex,
      () => {
        return (tree, file) => {
          // console.log(tree);
          let types = new Set();
          visit(tree, 'element', (node, index, parent) => {
            // console.log(node.tagName);
            if(node.tagName !== "pre")return;
            if(!node.hasOwnProperty("properties"))return;
            if(!node.properties.hasOwnProperty("className"))return;
            if(!node.properties.className.some(cls => cls.startsWith("language-")))return;
          })
        }
      }
    ],
    remarkPlugins: [
      remarkGfm,
      remarkMath,
      () => {
        return (tree, file) => {
          visit(tree, "code", (node) => {
            const attrib = `raw_escaped_code="${escape(node.value)}"`;
            if(node.meta){
              node.meta += " " + attrib;
            } else {
              node.meta = attrib;
            }
          })
        }
      }
    ]
  }
})
