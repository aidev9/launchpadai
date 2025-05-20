"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollectionStatus, DocumentStatus } from "@/lib/firebase/schema";
import { X } from "lucide-react";

interface StatusFilterProps {
  selectedStatuses: (CollectionStatus | DocumentStatus)[];
  onChange: (statuses: (CollectionStatus | DocumentStatus)[]) => void;
}

const statusOptions: {
  value: CollectionStatus;
  label: string;
  color: string;
}[] = [
  {
    value: "uploading",
    label: "Uploading",
    color: "bg-blue-500/20 text-blue-700 hover:bg-blue-500/30",
  },
  {
    value: "uploaded",
    label: "Uploaded",
    color: "bg-green-500/20 text-green-700 hover:bg-green-500/30",
  },
  {
    value: "indexing",
    label: "Indexing",
    color: "bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30",
  },
  {
    value: "indexed",
    label: "Indexed",
    color: "bg-green-500/20 text-green-700 hover:bg-green-500/30",
  },
  {
    value: "reindexing",
    label: "Reindexing",
    color: "bg-purple-500/20 text-purple-700 hover:bg-purple-500/30",
  },
];

export function StatusFilter({
  selectedStatuses,
  onChange,
}: StatusFilterProps) {
  const toggleStatus = (status: CollectionStatus | DocumentStatus) => {
    if (selectedStatuses.includes(status)) {
      onChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onChange([...selectedStatuses, status]);
    }
  };

  const clearFilters = () => {
    onChange([]);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm font-medium">Status:</span>
      {statusOptions.map((status) => (
        <Badge
          key={status.value}
          variant="outline"
          className={`cursor-pointer ${
            selectedStatuses.includes(status.value)
              ? status.color
              : "hover:bg-muted"
          }`}
          onClick={() => toggleStatus(status.value)}
        >
          {status.label}
          {selectedStatuses.includes(status.value) && (
            <X className="ml-1 h-3 w-3" />
          )}
        </Badge>
      ))}
      {selectedStatuses.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={clearFilters}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
