import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { TechStackAsset } from "@/lib/firebase/schema";
import { AssetsList } from "../assets-list";
import { AssetEditor } from "../asset-editor";
import { useEffect } from "react";

interface TechStackAssetsProps {
  assets: TechStackAsset[];
  selectedAsset: TechStackAsset | null;
  setSelectedAsset: React.Dispatch<React.SetStateAction<TechStackAsset | null>>;
  generatingAssets: Record<string, boolean>;
  isDownloading: boolean;
  handleCreateAsset: () => void;
  handleDownloadAssets: () => void;
}

export function TechStackAssets({
  assets,
  selectedAsset,
  setSelectedAsset,
  generatingAssets,
  isDownloading,
  handleCreateAsset,
  handleDownloadAssets,
}: TechStackAssetsProps) {
  // Add event listeners for edit and delete events from AssetEditor
  useEffect(() => {
    const handleEditAsset = (event: Event) => {
      const asset = (event as CustomEvent).detail;
      handleCreateAsset(); // This will open the edit dialog
    };

    const handleDeleteAsset = (event: Event) => {
      // The parent component will handle deletion through its own state
    };

    document.addEventListener("editAsset", handleEditAsset);
    document.addEventListener("deleteAsset", handleDeleteAsset);

    return () => {
      document.removeEventListener("editAsset", handleEditAsset);
      document.removeEventListener("deleteAsset", handleDeleteAsset);
    };
  }, [handleCreateAsset]);
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Assets</h3>
        <div className="flex gap-2">
          <Button onClick={handleCreateAsset}>
            <Plus className="mr-2 h-4 w-4" />
            Create Asset
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadAssets}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download All
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <AssetsList />
        </div>

        <div className="lg:col-span-2">
          <AssetEditor />
        </div>
      </div>
    </>
  );
}
