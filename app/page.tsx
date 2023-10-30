import { allPosts } from "@/.contentlayer/generated";
import { dateToString } from "@/utils/dateToString";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mt-4 space-y-2">
      {allPosts.sort((p1, p2) => (new Date(p2.date)).getTime() - (new Date(p1.date)).getTime()).map((post) => (
        <article key={post._id}>
          <div className="min-w-full">
            <Link href={post.slug} className="group flex min-w-full justify-between hover:bg-gray-200 hover:dark:bg-gray-700 rounded-md px-1.5 py-2">
              <h4 className="font-medium text-base decoration-1 underline group-hover:no-underline">{post.title.length > 45 ? post.title.slice(0, 45-3) + "..." : post.title}</h4>
              {post.date && <h4 className="my-auto">{dateToString(post.date)}</h4>}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
