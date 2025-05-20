"use client";

import { useState, useEffect } from "react";
import { Document as DocumentType } from "@/lib/firebase/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface DocumentViewerProps {
  document: DocumentType;
}

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>")
    .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*)\*/gim, "<em>$1</em>")
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" />')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
    .replace(/\n$/gim, "<br />")
    .replace(/^\s*\n/gim, "<br />")
    .replace(/^\s*(-|\*)\s(.*)/gim, "<ul><li>$2</li></ul>")
    .replace(/^\s*(\d+\.)\s(.*)/gim, "<ol><li>$2</li></ol>")
    .replace(/<\/ul>\s*<ul>/gim, "")
    .replace(/<\/ol>\s*<ol>/gim, "")
    .replace(/```([\s\S]*?)```/gim, "<pre><code>$1</code></pre>")
    .replace(/`([^`]+)`/gim, "<code>$1</code>");
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchContent = async () => {
      if (!document.url) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // For text-based files, try to fetch the content
        if (isTextFile(document.filePath)) {
          try {
            // Try direct fetch first - this will likely fail due to CORS
            const response = await fetch(document.url, {
              mode: "cors",
              credentials: "omit",
            });

            if (!response.ok) {
              throw new Error(
                `Failed to fetch document: ${response.statusText}`
              );
            }

            const text = await response.text();
            setContent(text);
          } catch (fetchError) {
            console.log("Direct fetch failed (expected for CORS):", fetchError);

            // Show a friendly message when fetch fails due to CORS
            setContent(`# Unable to display document content directly

This document cannot be displayed directly due to security restrictions.

Please use the "Download Original" link to view the document.`);
          }
        } else {
          // For non-text files, just set loading to false
          setIsLoading(false);
        }
      } catch (error) {
        console.log("Error fetching document content:", error);
        toast({
          title: "Error",
          description: "Failed to load document content",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [document, toast]);

  // Determine file type based on file extension
  const getFileType = (filePath: string): string => {
    const extension = filePath.split(".").pop()?.toLowerCase() || "";
    return extension;
  };

  // Check if file is a text file
  const isTextFile = (filePath: string): boolean => {
    const fileType = getFileType(filePath);
    return ["txt", "md", "markdown"].includes(fileType);
  };

  // Check if file is a PDF
  const isPDF = (filePath: string): boolean => {
    const fileType = getFileType(filePath);
    return fileType === "pdf";
  };

  // Check if file is a Word document
  const isWordDocument = (filePath: string): boolean => {
    const fileType = getFileType(filePath);
    return ["doc", "docx"].includes(fileType);
  };

  // Render appropriate viewer based on file type
  const renderViewer = () => {
    const fileType = getFileType(document.filePath);

    if (isLoading) {
      return <Skeleton className="w-full h-[600px]" />;
    }

    if (!document.url) {
      return <div className="text-center py-8">Document URL not available</div>;
    }

    if (isTextFile(document.filePath)) {
      if (fileType === "md" || fileType === "markdown") {
        // Markdown renderer with better error handling
        return (
          <div className="w-full p-4 border rounded-md bg-white prose max-w-none">
            {content ? (
              // Check if content is our error message (starts with # Unable to display)
              content.trim().startsWith("# Unable to display") ? (
                // Display the error message as markdown
                <div className="text-center py-8">
                  <div className="mb-6">
                    <svg
                      className="mx-auto h-12 w-12 text-muted-foreground"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    Unable to Display Content
                  </h3>
                  <p className="mb-6 text-muted-foreground max-w-md mx-auto">
                    This document cannot be displayed directly due to security
                    restrictions.
                  </p>
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Download Markdown File
                  </a>
                </div>
              ) : (
                // Display the actual markdown content
                <div
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
                />
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Loading content...
              </div>
            )}
          </div>
        );
      } else {
        // Plain text viewer
        return (
          <div className="w-full p-4 border rounded-md bg-muted/20 whitespace-pre-wrap font-mono text-sm">
            {content || (
              <div className="text-center py-8 text-muted-foreground">
                Unable to display content. Please use the "Download Original"
                link.
              </div>
            )}
          </div>
        );
      }
    }

    if (isPDF(document.filePath)) {
      return (
        <div className="text-center py-12 border rounded-md bg-muted/10">
          <div className="mb-6">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">PDF Document</h3>
          <p className="mb-6 text-muted-foreground max-w-md mx-auto">
            This PDF document can be viewed directly in your browser
          </p>
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Open PDF
          </a>
        </div>
      );
    }

    if (isWordDocument(document.filePath)) {
      return (
        <div className="text-center py-12 border rounded-md bg-muted/10">
          <div className="mb-6">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Word Document</h3>
          <p className="mb-6 text-muted-foreground max-w-md mx-auto">
            This Word document can be downloaded and viewed in Microsoft Word or
            similar applications
          </p>
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Download Document
          </a>
        </div>
      );
    }

    // Fallback for unsupported file types
    return (
      <div className="text-center py-12 border rounded-md bg-muted/10">
        <div className="mb-6">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">
          {fileType.toUpperCase()} File
        </h3>
        <p className="mb-6 text-muted-foreground max-w-md mx-auto">
          This file type cannot be previewed directly in the browser
        </p>
        <a
          href={document.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Download File
        </a>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            File Type: {getFileType(document.filePath).toUpperCase()}
          </span>
        </div>
        <a
          href={document.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Download Original
        </a>
      </div>
      <div className="min-h-[400px]">{renderViewer()}</div>
    </div>
  );
}
