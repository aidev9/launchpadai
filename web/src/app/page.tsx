import Image from "next/image";
import CounterClient from "@/components/counter-client";
import { Button } from "@/components/ui/button";
import ServerComponent from "./server-component";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen p-8">
      <header className="mb-12 text-center">
        <Image
          className="mx-auto mb-6 dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <h1 className="text-3xl font-bold">
          Next.js + Shadcn + TailwindCSS + Jotai
        </h1>
      </header>

      <main className="w-full max-w-3xl mx-auto flex flex-col gap-8">
        <section className="bg-card p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Jotai Counter Example</h2>
          <p className="mb-4 text-muted-foreground">
            This counter state is managed with Jotai and persists across page
            navigations.
          </p>
          <CounterClient />
        </section>

        {/* Server Component using Firebase Admin SDK */}
        <ServerComponent />

        <section className="bg-card p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Shadcn Button Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </section>

        <section className="bg-card p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Button Sizes</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Button>
          </div>
        </section>
      </main>

      <footer className="mt-auto pt-12 pb-6 text-center text-sm text-muted-foreground">
        <p>Built with Next.js 15, Shadcn, TailwindCSS, and Jotai</p>
      </footer>
    </div>
  );
}
