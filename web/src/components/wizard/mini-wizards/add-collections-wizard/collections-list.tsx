import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, FolderPlus, FileText } from "lucide-react";
import { WizardCollection } from "./types";

interface CollectionsListProps {
  collections: WizardCollection[];
  selectedCollection: WizardCollection | null;
  onSelectCollection: (collection: WizardCollection) => void;
  onEditCollection: (collection: WizardCollection) => void;
  onDeleteCollection: (collection: WizardCollection) => void;
  onCreateCollection: () => void;
}

export function CollectionsList({
  collections,
  selectedCollection,
  onSelectCollection,
  onEditCollection,
  onDeleteCollection,
  onCreateCollection,
}: CollectionsListProps) {
  if (collections.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Your Collections</h3>
        <div className="text-center p-6 bg-gray-50 rounded-md">
          <FolderPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">
            No collections created yet. Create your first collection to get
            started.
          </p>
          <Button onClick={onCreateCollection} className="mx-auto">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Collection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Your Collections</h3>
      <div className="grid grid-cols-1 gap-4">
        {collections.map((collection, index) => (
          <Card
            key={index}
            className={`shadow-sm cursor-pointer transition-colors ${
              selectedCollection === collection ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => onSelectCollection(collection)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-md">{collection.title}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditCollection(collection);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCollection(collection);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {collection.phaseTags.map((tag, tagIndex) => (
                  <Badge key={tagIndex} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {collection.tags.map((tag, tagIndex) => (
                  <Badge key={tagIndex} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600">{collection.description}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <FileText className="h-4 w-4" />
                {collection.documents.length} document
                {collection.documents.length !== 1 ? "s" : ""}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
