import Link from "next/link";
import { Button } from "@/components/ui/button";
import ChatWidget from "@/components/ui/chat-widget";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen">
      <header className="w-full bg-white py-4 px-8 flex justify-between items-center border-b">
        <div className="flex items-center">
          <svg
            className="h-8 w-8 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="ml-2 text-xl font-bold text-gray-800">
            LaunchpadAI
          </span>
        </div>
        <nav className="fixed top-0 right-0 p-4 flex space-x-4">
          <Link
            href="/waitlist"
            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
          >
            Join the Waitlist
          </Link>
          <Link
            href="/ai-naming-assistant"
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            AI Naming Assistant
          </Link>
        </nav>
      </header>

      <main className="w-full max-w-6xl mx-auto flex flex-col gap-8 flex-1 p-8">
        {/* Hero Section */}
        <section className="py-16 md:py-24 flex flex-col items-center justify-center text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Join The Waitlist
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mb-8">
            LaunchpadAI helps enterprises deploy and manage AI solutions with
            ease. Our platform streamlines the development process, reduces time
            to market, and ensures your AI infrastructure scales with your
            business.
          </p>
          <div className="flex gap-4">
            <Link href="/waitlist">
              <Button size="lg" className="text-lg px-8 py-6">
                Join Waitlist
              </Button>
            </Link>
            <Link href="/ai-naming-assistant">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              >
                Try Naming Assistant
              </Button>
            </Link>
          </div>
        </section>

        {/* Additional sections can be added below */}
        <section id="features" className="py-16">
          {/* Your features content */}
        </section>

        <section id="about" className="py-16">
          {/* Your about content */}
        </section>
      </main>

      <footer className="w-full py-8 px-8 text-center text-sm text-muted-foreground border-t">
        <p>© 2025 LaunchpadAI. All rights reserved.</p>
      </footer>

      {/* Add chat widget */}
      <ChatWidget />
    </div>
  );
}
