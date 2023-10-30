"use client";
import Image from "next/image";
import { useMDXComponent } from "next-contentlayer/hooks";
import { inspect } from "util";
import { useState } from "react";
import Math from "./math";
// import {} from "@next/mdx"

const components = {
  Image,
};

const mdxComponents = {
  // @ts-ignore
  // pre: ({ children, ...props }) => {
  //   // console.log(inspect(args.children, false, 3));
  //   // console.log(args.children);
  //   // console.log(Object.getOwnPropertyNames(args));
  //   // return "wtf"

  //   const [copied, setCopied] = useState(false);

  //   const onClick = () => {
  //     // Copy to clipboard here
  //     setCopied(true);
  //   };

  //   return (
  //     <div className="relative">
  //       <div className="absolute flex items-center space-x-2 top-0 right-0 m-2">
  //         <button
  //           type="button"
  //           aria-label="Copy to Clipboard"
  //           className="hidden transition bg-transparent border rounded-md p-2 focus:outline-none fade-in group-hover:flex"
  //         >
  //           <svg
  //             xmlns="http://www.w3.org/2000/svg"
  //             className="h-4 w-4 pointer-events-none"
  //             fill="none"
  //             viewBox="0 0 24 24"
  //             stroke="currentColor"
  //           >
  //             <path
  //               strokeLinecap="round"
  //               strokeLinejoin="round"
  //               strokeWidth={2}
  //               d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
  //             />
  //           </svg>
  //         </button>
  //       </div>
  //     </div>
  //   );

  //   // const pre_tag = <pre {...props} onClick={(e) => {
  //   //   // @ts-ignore
  //   //   let innerText: string = e.target.innerText;
  //   //   navigator.clipboard.writeText(innerText);
  //   // }}>{children}</pre>;
  //   // // console.log(pre_tag.);
  //   // return pre_tag
  // },
  Math: Math
};

interface MdxProps {
  code: string;
}

export function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code);

  // @ts-ignore
  return <Component components={mdxComponents} />;
}
