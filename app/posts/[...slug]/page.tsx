import { notFound } from "next/navigation";
import { allPosts } from "contentlayer/generated";

import { Metadata } from "next";
import { Mdx } from "@/components/mdx-components";

import "./local.css";

import "./light-theme.css";
import "./dark-theme.css";
import { dateToString } from "@/utils/dateToString";

interface PostProps {
  params: {
    slug: string[];
  };
}

async function getPostFromParams(params: PostProps["params"]) {
  const slug = params?.slug?.join("/");
  const post = allPosts.find((post) => post.slugAsParams === slug);

  if (!post) {
    null;
  }

  return post;
}

export async function generateMetadata({
  params,
}: PostProps): Promise<Metadata> {
  const post = await getPostFromParams(params);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords ? post.keywords : undefined,
    openGraph: {
      images: ["/og.png"],
      type: "article",
      siteName: "Nerodesu017",
      description: post.description
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      images: ["/og.png"],
      description: post.description,
    }
  };
}

export async function generateStaticParams(): Promise<PostProps["params"][]> {
  return allPosts.map((post) => ({
    slug: post.slugAsParams.split("/"),
  }));
}

export default async function PostPage({ params }: PostProps) {
  const post = await getPostFromParams(params);

  if (!post) {
    notFound();
  }

  return (
    <>
      <article className="py-6 prose max-w-full dark:prose-invert">
        <h1 className="mb-1">{post.title}</h1>
        <div className="mb-2.5 text-gray-500 dark:text-gray-400">
          {post.author ? post.author + " - " : ""}
          {post.date ? dateToString(post.date) : ""}
        </div>
        {post.description && (
          <p className="text-xl mt-0 text-slate-700 dark:text-slate-200">
            {post.description}
          </p>
        )}
        <hr className="my-4" />
        <Mdx code={post.body.code} />
      </article>
    </>
  );
}
