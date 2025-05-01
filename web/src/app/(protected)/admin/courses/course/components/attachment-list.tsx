import { Button } from "@/components/ui/button";
import { FileIcon, Trash2 } from "lucide-react";

interface AttachmentsListProps {
  attachments: string[];
  onRemove: (url: string) => void;
}

export const AttachmentsList = ({
  attachments,
  onRemove,
}: AttachmentsListProps) => {
  if (!attachments || attachments.length === 0) {
    return <p className="text-muted-foreground">No attachments added yet.</p>;
  }

  return (
    <div className="space-y-2">
      {attachments.map((url, index) => {
        // Extract filename from URL
        const fileName = url.split("/").pop() || `Attachment ${index + 1}`;

        return (
          <div
            key={url}
            className="flex items-center justify-between p-2 border rounded-md"
          >
            <div className="flex items-center">
              <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:underline"
              >
                {fileName}
              </a>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onRemove(url)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};
