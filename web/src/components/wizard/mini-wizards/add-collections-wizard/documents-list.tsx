import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { WizardDocument } from "./types";

interface DocumentsListProps {
  documents: WizardDocument[];
  onEditDocument: (document: WizardDocument) => void;
  onDeleteDocument: (document: WizardDocument) => void;
}

export function DocumentsList({
  documents,
  onEditDocument,
  onDeleteDocument,
}: DocumentsListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-md">
        <p className="text-gray-500">
          No documents in this collection yet. Add your first document above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((document, index) => (
        <Card key={index} className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h5 className="font-medium">{document.title}</h5>
                {/* Status indicator */}
                {document.status && (
                  <div className="flex items-center gap-1">
                    {document.status === "uploading" && (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                        <span className="text-xs text-blue-600">
                          Uploading...
                        </span>
                      </>
                    )}
                    {document.status === "uploaded" && (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">Uploaded</span>
                      </>
                    )}
                    {document.status === "indexing" && (
                      <>
                        <Clock className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-yellow-600">
                          Indexing...
                        </span>
                      </>
                    )}
                    {document.status === "indexed" && (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">Ready</span>
                      </>
                    )}
                    {document.status === "reindexing" && (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
                        <span className="text-xs text-orange-600">
                          Reindexing...
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {document.description}
              </p>
              {/* Upload progress bar */}
              {document.status === "uploading" &&
                document.uploadProgress !== undefined && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Upload Progress</span>
                      <span>{document.uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${document.uploadProgress}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>Chunk Size: {document.chunkSize}</span>
                <span>Overlap: {document.overlap}</span>
                {document.file && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {document.file.name}
                  </span>
                )}
              </div>
              {document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {document.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditDocument(document)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteDocument(document)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
