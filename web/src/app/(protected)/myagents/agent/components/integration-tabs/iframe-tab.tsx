"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { Copy, Check, Code, Download } from "lucide-react";
import { Agent } from "@/lib/firebase/schema";
import { CardRadio } from "@/app/(protected)/mystacks/create/components/card-radio";

interface IFrameTabProps {
  agent: Agent;
}

interface SizePreset {
  value: string;
  label: string;
  subtitle: string;
  footer: string;
  width: number;
  height: number;
}

export function IFrameTab({ agent }: IFrameTabProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">("light");
  const [selectedSize, setSelectedSize] = useState<string>("medium");

  const sizePresets: SizePreset[] = [
    {
      value: "small",
      label: "Small",
      subtitle: "Compact chat widget",
      footer: "Perfect for sidebars",
      width: 300,
      height: 400,
    },
    {
      value: "medium",
      label: "Medium",
      subtitle: "Standard chat widget",
      footer: "Most popular choice",
      width: 400,
      height: 600,
    },
    {
      value: "large",
      label: "Large",
      subtitle: "Full-featured chat",
      footer: "Best for main content",
      width: 500,
      height: 700,
    },
  ];

  const getCurrentSize = () => {
    return (
      sizePresets.find((preset) => preset.value === selectedSize) ||
      sizePresets[1]
    );
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const generateIFrameCode = () => {
    const currentSize = getCurrentSize();
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    return `<iframe
  src="${baseUrl}/embed/agent/${agent.id}?theme=${selectedTheme}"
  width="${currentSize.width}"
  height="${currentSize.height}"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);"
  title="${agent.name} Chat">
</iframe>`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Code className="h-5 w-5" />
          IFrame Embed
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Embed a chat interface for your agent into any HTML page
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Layout: Options Left, Preview Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Customization Options */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-4">
                Customization Options
              </h3>

              {/* Theme Options */}
              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-sm">Theme</h4>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="theme-toggle"
                    checked={selectedTheme === "dark"}
                    onCheckedChange={(checked) =>
                      setSelectedTheme(checked ? "dark" : "light")
                    }
                  />
                  <Label htmlFor="theme-toggle" className="text-sm">
                    {selectedTheme === "dark" ? "Dark Theme" : "Light Theme"}
                  </Label>
                </div>
              </div>

              {/* Size Presets */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Size Presets</h4>
                <RadioGroup
                  value={selectedSize}
                  onValueChange={setSelectedSize}
                  className="grid grid-cols-1 gap-3"
                >
                  {sizePresets.map((preset) => (
                    <CardRadio
                      key={preset.value}
                      value={preset.value}
                      id={preset.value}
                      label={preset.label}
                      subtitle={preset.subtitle}
                      footer={preset.footer}
                      checked={selectedSize === preset.value}
                      onValueChange={setSelectedSize}
                    />
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Right Column: Live Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Live Preview</h3>
              {!agent.configuration.isEnabled && (
                <div className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  ⚠️ Agent must be enabled for embed to work
                </div>
              )}
            </div>
            <div className="border rounded-lg overflow-hidden bg-muted/30 p-4">
              <div className="flex justify-center">
                <div
                  className="border rounded-lg overflow-hidden bg-background shadow-lg"
                  style={{
                    width: `${getCurrentSize().width}px`,
                    height: `${getCurrentSize().height}px`,
                    maxWidth: "100%",
                  }}
                >
                  <iframe
                    src={`${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/embed/agent/${agent.id}?theme=${selectedTheme}&hideIcon=true`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    title={`${agent.name} Chat Preview`}
                    data-testid="agent-iframe-preview"
                    style={{ borderRadius: "8px" }}
                  />
                </div>
              </div>
              <div className="text-center mt-2 text-xs text-muted-foreground">
                {getCurrentSize().width} × {getCurrentSize().height} •{" "}
                {selectedTheme} theme
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Action Buttons and Code */}
        <div className="space-y-4 pt-4 border-t">
          {/* Prominent Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() =>
                copyToClipboard(generateIFrameCode(), "iframe-code")
              }
              size="sm"
            >
              {copiedStates["iframe-code"] ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiedStates["iframe-code"] ? "Copied!" : "Copy Embed Code"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(
                  `/api/agents/embed-html?agentId=${agent.id}&agentName=${encodeURIComponent(agent.name)}&theme=${selectedTheme}&width=${getCurrentSize().width}&height=${getCurrentSize().height}`,
                  "_blank"
                );
              }}
              data-testid="download-sample-html"
            >
              <Download className="h-4 w-4" />
              Download Sample HTML
            </Button>
          </div>

          {/* IFrame Code Snippet */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">IFrame Embed Code</h3>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                {generateIFrameCode()}
              </pre>
            </div>
            <p className="text-sm text-muted-foreground">
              Copy this code and paste it into your HTML page where you want the
              chat widget to appear.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
