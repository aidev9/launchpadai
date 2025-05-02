"use client";

import { useEffect, useState } from "react";
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
import { Prompt } from "@/lib/firebase/schema";
import { getPhaseColor } from "@/components/prompts/phase-filter";
import { usePrompts } from "@/hooks/usePrompts";

export default function UserPromptDetail() {
  const router = useRouter();
  const { toast } = useToast();
  const { fetchPromptById } = usePrompts({ userPromptsOnly: true });
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Render loading state
  if (loading) {
    return (
      <Main>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-muted rounded"></div>
          <div className="h-24 bg-muted rounded"></div>
          <div className="h-4 w-1/4 bg-muted rounded"></div>
        </div>
      </Main>
    );
  }

  // Render not found state
  if (!prompt) {
    return (
      <Main>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Prompt not found</h2>
          <p className="text-muted-foreground mt-2">
            The prompt you're looking for could not be found
          </p>
          <Button onClick={handleBack} variant="outline" className="mt-4">
            Go back
          </Button>
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <div className="space-y-6">
        <Button variant="ghost" className="pl-0 mb-4" onClick={handleBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

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

        <div className="prose max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap">{prompt.body}</p>
        </div>
      </div>
    </Main>
  );
}
