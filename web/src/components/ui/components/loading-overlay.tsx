import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  visible: boolean;
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-black/80 z-10">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-2 text-sm font-medium">Generating content...</p>
    </div>
  );
}
