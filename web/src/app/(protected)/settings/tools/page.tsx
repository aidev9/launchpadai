import { Separator } from "@/components/ui/separator";
import { ToolsGrid } from "./components/tools-grid";

export default function ToolsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Tools Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure API keys and settings for agent tools. Test connections to
          ensure tools work properly.
        </p>
      </div>
      <Separator />
      <ToolsGrid />
    </div>
  );
}
