import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { TechStack } from "@/lib/firebase/schema";
import { deleteTechStack } from "@/lib/firebase/techstacks";

export function useTechStackHandlers(
  selectedTechStack: TechStack | null,
  setIsLoading: (loading: boolean) => void,
  setIsDeleteDialogOpen: (open: boolean) => void,
  setIsDownloading?: (downloading: boolean) => void
) {
  const router = useRouter();
  const { toast } = useToast();

  const handleBack = () => {
    router.push("/mystacks");
  };

  const handleEdit = () => {
    if (!selectedTechStack?.id) return;

    // Navigate to the tech stack wizard with the tech stack ID as a query parameter
    router.push(`/techstack?id=${selectedTechStack.id}`);
  };

  const handleDelete = async () => {
    if (!selectedTechStack?.id) return;

    setIsLoading(true);
    try {
      const result = await deleteTechStack(selectedTechStack.id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Tech stack deleted successfully",
        });
        router.push("/mystacks");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete tech stack",
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
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDownloadAssets = async () => {
    if (!selectedTechStack?.id) return;

    // Use isDownloading state instead of isLoading to avoid showing the spinner for the whole page
    if (setIsDownloading) {
      setIsDownloading(true);
    }

    try {
      // Import the download assets action
      const { downloadTechStackAssets } = await import(
        "../actions/download-assets"
      );

      // Call the server action to download assets
      const result = await downloadTechStackAssets(selectedTechStack.id);

      if (result.success && result.downloadUrl) {
        // Redirect to the download URL
        window.location.href = result.downloadUrl;

        toast({
          title: "Success",
          description: "Assets are being downloaded",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to download assets",
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
    } finally {
      if (setIsDownloading) {
        setIsDownloading(false);
      }
    }
  };

  return {
    handleBack,
    handleEdit,
    handleDelete,
    handleDownloadAssets,
  };
}
