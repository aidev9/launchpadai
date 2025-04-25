"use client";

// import { useEffect } from "react"; // Remove unused import
import { Toaster } from "@/components/ui/toaster";
// import { toast } from "@/hooks/use-toast"; // Remove unused import

/**
 * Wraps the shadcn/ui Toaster in a Client Component boundary.
 * This prevents issues when rendering the Toaster within Server Components like the root layout.
 */
export function ToasterProvider() {
  // Remove the test useEffect block
  /*
  useEffect(() => {
    // Attempt to show a toast as soon as the provider mounts
    console.log("ToasterProvider mounted, attempting test toast...");
    toast({
      title: "Toaster Test",
      description: "If you see this, the toaster is rendering.",
      duration: 10000, // Keep it visible for a while
    });
  }, []); // Empty dependency array ensures this runs only once on mount
  */

  return <Toaster />;
  // Render a simple div for testing
  // return <div id="toaster-provider-test">Toaster Provider Rendered</div>;
}
