"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Main } from "@/components/layout/main";
import {
  ChevronLeft,
  Copy,
  FileText,
  Download,
  Edit,
  Trash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getPhaseColor } from "@/components/prompts/phase-filter";
import { useAtom } from "jotai";
import { selectedPromptAtom } from "@/lib/store/prompt-store";
import { Breadcrumbs } from "@/components/breadcrumbs";
import Playground from "./playground";

export default function UserPromptDetail() {
  const router = useRouter();
  const { toast } = useToast();
  const [prompt] = useAtom(selectedPromptAtom);

  const handleBack = () => {
    router.back();
  };

  const handleCopyToClipboard = () => {
    if (!prompt) return;

    navigator.clipboard.writeText(prompt.body);
    toast({
      title: "Copied",
      description: "Prompt content copied to clipboard",
    });
  };

  const handleDownload = () => {
    if (!prompt) return;

    // Create markdown content
    const markdown = `# ${prompt.title}\n\n${prompt.body}`;

    // Create a blob and download link
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prompt.title.replace(/\s+/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Prompt downloaded as markdown",
    });
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    toast({
      title: "Edit",
      description: "Edit functionality will be implemented in the next phase",
    });
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    toast({
      title: "Delete",
      description: "Delete functionality will be implemented in the next phase",
    });
  };

  // Render no prompt selected state
  if (!prompt) {
    return (
      <Main>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">No prompt selected</h2>
          <p className="text-muted-foreground mt-2">
            Please select a prompt from the prompts list
          </p>
          <Button
            onClick={() => router.push("/myprompts")}
            variant="outline"
            className="mt-4"
          >
            Go back
          </Button>
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/dashboard" },
            { label: "My Prompts", href: "/myprompts" },
            { label: prompt.title, isCurrentPage: true },
          ]}
        />

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{prompt.title}</h1>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCopyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="text-red-500"
              onClick={handleDelete}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {prompt.phaseTags.map((tag) => (
            <Badge key={tag} variant="secondary" className={getPhaseColor(tag)}>
              {tag}
            </Badge>
          ))}
          {prompt.productTags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
          {prompt.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="bg-muted">
              {tag}
            </Badge>
          ))}
        </div>

        {/* <div className="prose max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap">{prompt.body}</p>
        </div> */}

        {/* Start Playground */}
        <Playground prompt={prompt} />
        {/* End Playground */}
      </div>
    </Main>
  );
}
