import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface StreamingSwitchProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function StreamingSwitch({ isEnabled, onToggle }: StreamingSwitchProps) {
  return (
    <div className="grid gap-2 pt-2">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="flex items-center justify-between">
            <Label
              htmlFor="streaming-mode"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Streaming
            </Label>
            <Switch
              id="streaming-mode"
              checked={isEnabled}
              onCheckedChange={onToggle}
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-[320px] text-sm" side="left">
          Toggle streaming mode. When enabled, content updates will stream in
          real-time. When disabled, you&apos;ll see a loading indicator until
          generation completes.
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
