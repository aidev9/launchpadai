import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { TechStack, TechStackAsset } from "@/lib/firebase/schema";
import { AssetsList } from "../assets-list";
import { AssetEditor } from "../asset-editor";

interface TechStackAssetsProps {
  assets: TechStackAsset[];
  selectedAsset: TechStackAsset | null;
  setSelectedAsset: React.Dispatch<React.SetStateAction<TechStackAsset | null>>;
  generatingAssets: Record<string, boolean>;
  isGeneratingContent: boolean;
  isDownloading: boolean;
  techStack: TechStack | null;
  handleCreateAsset: () => void;
  handleEditAsset: (asset: TechStackAsset) => void;
  handleDeleteAsset: (asset: TechStackAsset) => void;
  handleGenerateContent: (
    asset: TechStackAsset,
    userInstructions?: string
  ) => Promise<void>;
  handleCopyAsset: (asset: TechStackAsset) => void;
  handleDownloadAsset: (asset: TechStackAsset) => void;
  handleDownloadAssets: () => void;
}

export function TechStackAssets({
  assets,
  selectedAsset,
  setSelectedAsset,
  generatingAssets,
  isGeneratingContent,
  isDownloading,
  techStack,
  handleCreateAsset,
  handleEditAsset,
  handleDeleteAsset,
  handleGenerateContent,
  handleCopyAsset,
  handleDownloadAsset,
  handleDownloadAssets,
}: TechStackAssetsProps) {
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
          <AssetsList
            assets={assets}
            selectedAsset={selectedAsset}
            onSelectAsset={setSelectedAsset}
          />
        </div>

        <div className="lg:col-span-2">
          <AssetEditor
            selectedAsset={selectedAsset}
            isGeneratingContent={isGeneratingContent}
            techStack={techStack}
            onGenerateContent={handleGenerateContent}
            onCopyAsset={handleCopyAsset}
            onDownloadAsset={handleDownloadAsset}
            onEditAsset={handleEditAsset}
            onDeleteAsset={handleDeleteAsset}
          />
        </div>
      </div>
    </>
  );
}
