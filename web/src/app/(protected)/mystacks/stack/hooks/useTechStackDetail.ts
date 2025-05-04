import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { TechStack, TechStackAsset } from "@/lib/firebase/schema";
import { getTechStack } from "@/lib/firebase/techstacks";
import { getTechStackAssets } from "@/lib/firebase/techstack-assets";
import {
  selectedTechStackAtom,
  selectedTechStackIdAtom,
} from "@/lib/store/techstack-store";

export function useTechStackDetail() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTechStack, setSelectedTechStack] = useAtom(
    selectedTechStackAtom
  );
  const [selectedTechStackId] = useAtom(selectedTechStackIdAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Assets state
  const [assets, setAssets] = useState<TechStackAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<TechStackAsset | null>(
    null
  );
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatingAssets, setGeneratingAssets] = useState<
    Record<string, boolean>
  >({});

  // Fetch tech stack if not in state
  useEffect(() => {
    const fetchTechStack = async () => {
      if (!selectedTechStack && selectedTechStackId) {
        setIsLoading(true);
        try {
          const result = await getTechStack(selectedTechStackId);
          if (result.success && result.techStack) {
            setSelectedTechStack(result.techStack);
          } else {
            setError(result.error || "Failed to fetch tech stack");
          }
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "An unexpected error occurred"
          );
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchTechStack();
  }, [selectedTechStack, selectedTechStackId, setSelectedTechStack]);

  // Fetch assets when tech stack is loaded
  useEffect(() => {
    const fetchAssets = async () => {
      if (selectedTechStack?.id) {
        try {
          const result = await getTechStackAssets(selectedTechStack.id);
          if (result.success && result.assets) {
            setAssets(result.assets);

            // Track which assets are still generating
            const generatingMap: Record<string, boolean> = {};
            result.assets.forEach((asset) => {
              if (asset.id && asset.isGenerating) {
                generatingMap[asset.id] = true;
              }
            });
            setGeneratingAssets(generatingMap);
          } else {
            toast({
              title: "Warning",
              description: result.error || "Failed to fetch assets",
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({
            title: "Error",
            description:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred",
            variant: "destructive",
          });
        }
      }
    };

    fetchAssets();
  }, [selectedTechStack, toast]);

  // Redirect if no tech stack is selected
  useEffect(() => {
    if (!selectedTechStack && !selectedTechStackId && !isLoading) {
      router.push("/mystacks");
    }
  }, [selectedTechStack, selectedTechStackId, isLoading, router]);

  return {
    router,
    toast,
    selectedTechStack,
    setSelectedTechStack,
    isLoading,
    setIsLoading,
    error,
    setError,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    activeTab,
    setActiveTab,
    assets,
    setAssets,
    selectedAsset,
    setSelectedAsset,
    isAssetDialogOpen,
    setIsAssetDialogOpen,
    isGeneratingContent,
    setIsGeneratingContent,
    isDownloading,
    setIsDownloading,
    generatingAssets,
    setGeneratingAssets,
  };
}
