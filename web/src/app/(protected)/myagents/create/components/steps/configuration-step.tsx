"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { agentWizardStateAtom } from "@/lib/store/agent-store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ConfigurationStep() {
  const [wizardState, setWizardState] = useAtom(agentWizardStateAtom);

  // Initialize configuration state from wizard state or with defaults
  const [url, setUrl] = useState(wizardState?.configuration?.url || "");
  const [apiKey, setApiKey] = useState(
    wizardState?.configuration?.apiKey || ""
  );
  const [rateLimit, setRateLimit] = useState(
    wizardState?.configuration?.rateLimitPerMinute || 60
  );
  const [allowedIps, setAllowedIps] = useState<string[]>(
    wizardState?.configuration?.allowedIps || []
  );
  const [isEnabled, setIsEnabled] = useState(
    wizardState?.configuration?.isEnabled || false
  );

  // For IP input
  const [currentIp, setCurrentIp] = useState("");
  const [ipError, setIpError] = useState("");

  // Update the wizard state when configuration changes
  useEffect(() => {
    if (wizardState) {
      // Only update if values have changed to prevent unnecessary renders
      const currentConfig = wizardState.configuration || {};
      if (
        currentConfig.url !== url ||
        currentConfig.apiKey !== apiKey ||
        currentConfig.rateLimitPerMinute !== rateLimit ||
        JSON.stringify(currentConfig.allowedIps) !==
          JSON.stringify(allowedIps) ||
        currentConfig.isEnabled !== isEnabled
      ) {
        setWizardState({
          ...wizardState,
          configuration: {
            url,
            apiKey,
            rateLimitPerMinute: rateLimit,
            allowedIps,
            isEnabled,
          },
        });
      }
    }
  }, [url, apiKey, rateLimit, allowedIps, isEnabled, setWizardState]);

  // Validate IP address format
  const validateIp = (ip: string): boolean => {
    // Simple IPv4 validation regex
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

    // Simple IPv6 validation regex (not comprehensive but catches obvious errors)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    // Allow CIDR notation
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip) || cidrRegex.test(ip);
  };

  // Add IP to allowed IPs list
  const addIp = () => {
    if (!currentIp.trim()) {
      setIpError("IP address cannot be empty");
      return;
    }

    if (!validateIp(currentIp)) {
      setIpError("Invalid IP address format");
      return;
    }

    if (allowedIps.includes(currentIp)) {
      setIpError("IP address already added");
      return;
    }

    setAllowedIps([...allowedIps, currentIp]);
    setCurrentIp("");
    setIpError("");
  };

  // Remove IP from allowed IPs list
  const removeIp = (ipToRemove: string) => {
    setAllowedIps(allowedIps.filter((ip) => ip !== ipToRemove));
  };

  // Handle IP input key press
  const handleIpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addIp();
    }
  };

  // Generate a random API key
  const generateApiKey = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const length = 32;
    let result = "";

    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    setApiKey(result);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Agent Configuration</Label>
        <p className="text-sm text-muted-foreground">
          Configure access settings for your agent.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled" className="font-medium">
              Enable Agent
            </Label>
            <Switch
              id="enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            When enabled, your agent will be accessible via the API.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="url">Agent URL Path</Label>
        <Input
          id="url"
          placeholder="e.g., my-custom-agent"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          This will be used in the URL path for accessing your agent:
          <code className="ml-1 bg-muted px-1 py-0.5 rounded">
            {url ? `/api/agents/${url}` : "/api/agents/[your-agent-path]"}
          </code>
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="apiKey">API Key</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={generateApiKey}
            className="text-xs"
          >
            Generate
          </Button>
        </div>
        <Input
          id="apiKey"
          placeholder="API Key for authentication"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          type="password"
        />
        <p className="text-xs text-muted-foreground">
          This key will be required to authenticate requests to your agent.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Rate Limit (requests per minute)</Label>
        <div className="flex items-center gap-4">
          <Slider
            value={[rateLimit]}
            min={1}
            max={1000}
            step={1}
            onValueChange={(value) => setRateLimit(value[0])}
            className="flex-grow"
          />
          <span className="w-12 text-center">{rateLimit}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Limit the number of requests your agent can receive per minute.
        </p>
      </div>

      <div className="space-y-2">
        <Label>IP Restrictions</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter IP address or CIDR range"
            value={currentIp}
            onChange={(e) => {
              setCurrentIp(e.target.value);
              setIpError("");
            }}
            onKeyDown={handleIpKeyDown}
            className={ipError ? "border-red-500" : ""}
          />
          <Button variant="outline" onClick={addIp}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {ipError && <p className="text-xs text-red-500">{ipError}</p>}
        <p className="text-xs text-muted-foreground">
          Leave empty to allow access from any IP address.
        </p>

        <div className="flex flex-wrap gap-2 mt-2">
          {allowedIps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No IP restrictions (open to all)
            </p>
          ) : (
            allowedIps.map((ip, index) => (
              <Badge
                key={`config-ip-${index}-${ip}`}
                variant="secondary"
                className="flex items-center"
              >
                {ip}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => removeIp(ip)}
                />
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="p-4 border border-yellow-200 bg-yellow-50 text-yellow-800 rounded-md">
        <p className="text-sm">
          <strong>Security Note:</strong> Be careful when configuring your
          agent's access settings. Consider using IP restrictions and a strong
          API key to secure your agent.
        </p>
      </div>
    </div>
  );
}
