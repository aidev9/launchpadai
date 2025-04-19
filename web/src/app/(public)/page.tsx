import Link from "next/link";
import { Button } from "@/components/ui/button";
import ChatWidget from "@/components/ui/chat-widget";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "LaunchpadAI - AI Solutions for Enterprises",
  description: "Deploy and manage AI solutions with ease.",
};

export default function LandingPage() {
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
            href="/signin"
            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            Sign Up
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

        {/* Additional sections */}
        <section id="features" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Key Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to deploy and manage AI solutions in one
              platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg bg-white shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-indigo-600"
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
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Deployment</h3>
              <p className="text-gray-600">
                Deploy AI models with just a few clicks, no complex setup
                required.
              </p>
            </div>

            <div className="p-6 border rounded-lg bg-white shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Performance Monitoring
              </h3>
              <p className="text-gray-600">
                Monitor model performance and usage in real-time with detailed
                analytics.
              </p>
            </div>

            <div className="p-6 border rounded-lg bg-white shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Customization</h3>
              <p className="text-gray-600">
                Tailor AI solutions to your specific business needs and
                workflows.
              </p>
            </div>
          </div>
        </section>

        <section id="about" className="py-16 bg-gray-50 -mx-8 px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">About LaunchpadAI</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We're building the future of enterprise AI deployment, making
                powerful technology accessible to all businesses.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="w-full md:w-1/2">
                <h3 className="text-2xl font-semibold mb-4">Our Mission</h3>
                <p className="text-gray-600 mb-4">
                  To democratize access to advanced AI technology by creating
                  tools that make deployment, management, and scaling simple for
                  businesses of all sizes.
                </p>
                <p className="text-gray-600">
                  We believe that by removing the technical barriers to AI
                  adoption, we can help organizations across industries innovate
                  faster and deliver more value to their customers.
                </p>
              </div>
              <div className="w-full md:w-1/2 bg-indigo-50 p-8 rounded-xl">
                <h3 className="text-2xl font-semibold mb-4">Join the Beta</h3>
                <p className="text-gray-600 mb-6">
                  We're currently in private beta with select enterprise
                  partners. Join our waitlist to be among the first to
                  experience LaunchpadAI when we open up access.
                </p>
                <Link href="/waitlist">
                  <Button className="w-full md:w-auto">Join Waitlist</Button>
                </Link>
              </div>
            </div>
          </div>
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
