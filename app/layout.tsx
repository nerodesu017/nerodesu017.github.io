import Link from "next/link";
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
// import { Analytics } from "@/components/analytics";
import { ModeToggle } from "@/components/mode-toggle";
import Script from "next/script";
import { Metadata } from "next";
// import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

const title = "Nero Deobfuscation Blog";
const description = "Hi, I'm nero! Join me in my adventure to tackle antibots (mainly), but also other stuff like the mathematics behind luck-based games, physics, and many more!";
export const metadata: Metadata = {
  title: title,
  description: description,
  keywords: ["deobfuscation", "reverse engineering", "antibot", "antibots", "programming"],
  openGraph: {
    images: ["https://nerodesu017.github.io/og.png"],
    type: "article",
    siteName: "Nerodesu017",
    description: description
  },
  twitter: {
    card: "summary_large_image",
    title: title,
    images: ["https://nerodesu017.github.io/og.png"],
    description: description,
  }
  };

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        {process.env.NODE_ENV === "development" ? (
          <></>
        ) : (
          <>
            <Script src="https://www.googletagmanager.com/gtag/js?id=G-KDM1FLGF1R"></Script>
            <Script id="google-analytics">
{`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-KDM1FLGF1R');
`}
            </Script>
          </>
        )}
      </head>
      <body
        className={`antialiased min-h-screen bg-white dark:bg-black text-black dark:text-slate-50 ${inter.className}`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto py-10 px-4">
            <header>
              <div className="flex items-center justify-between">
                <ModeToggle />
                <nav className="ml-auto text-sm font-medium space-x-6">
                  <Link href="/">Home</Link>
                  <Link href="/about">About</Link>
                  <Link href="https://github.com/nerodesu017">Github</Link>
                </nav>
              </div>
            </header>
            <main>{children}</main>

            {/* <div className="w-full h-0.5 my-8 bg-black dark:bg-white"></div> */}
            <hr className="mt-12 mb-12" />
            <footer>
              <div className="prose max-w-full dark:prose-invert mx-auto">
                Hi, I&apos;m nero and this is my blog! It is mainly for coding
                and reverse engineering.
                <br />You like what you see and wanna support me? Ask me about my crypto addresses, hmu with a
                business opportunity or just, spread the word, it helps a lot! You can find ways to contact me in my <Link href={"/public/Andrew_resume.pdf"}>Resume</Link>
              </div>
            </footer>
          </div>
          {/* <Analytics /> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
