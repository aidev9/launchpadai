"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import mammoth from "mammoth";
import { useToast } from "@/hooks/use-toast";

interface WordViewerProps {
  url: string;
}

export default function WordViewer({ url }: WordViewerProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchAndConvertDocx() {
      try {
        setIsLoading(true);

        // Fetch the DOCX file
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.statusText}`);
        }

        // Convert the response to an ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();

        // Use mammoth to convert DOCX to HTML
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setContent(result.value);
      } catch (error) {
        console.log("Error converting Word document:", error);
        toast({
          title: "Error",
          description: "Failed to load Word document",
          variant: "destructive",
        });
        setContent(
          "<p>Failed to load document. Please try downloading the file instead.</p>"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchAndConvertDocx();
  }, [url, toast]);

  if (isLoading) {
    return <Skeleton className="w-full h-[600px]" />;
  }

  return (
    <div className="border rounded-md p-6 bg-white w-full overflow-auto">
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
