"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Copy, Edit, Trash2, PlayCircle } from "lucide-react";
import { McpEndpointConfig } from "@/lib/firebase/schema/mcp-endpoints";
import { useToast } from "@/hooks/use-toast";
import {
  updateMcpEndpointConfig,
  deleteMcpEndpointConfig,
} from "@/lib/firebase/client/mcp-endpoints";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { tr } from "@faker-js/faker";

interface McpEndpointCardProps {
  endpoint: McpEndpointConfig;
  onEdit: () => void;
  onDelete: (endpointId: string) => void;
  onSelect: () => void;
  isSelected: boolean;
}

export function McpEndpointCard({
  endpoint,
  onEdit,
  onDelete,
  onSelect,
  isSelected,
}: McpEndpointCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Generate endpoint URL
  const endpointUrl = `${window.location.origin}/api/mcp/${endpoint.id}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(endpointUrl);
    toast({
      title: "Copied!",
      description: "Endpoint URL copied to clipboard",
    });
  };

  const handleToggleEnabled = async () => {
    setIsUpdating(true);
    try {
      const result = await updateMcpEndpointConfig(endpoint.id, {
        ...endpoint,
        isEnabled: !endpoint.isEnabled,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: `Endpoint ${
            !endpoint.isEnabled ? "enabled" : "disabled"
          } successfully`,
        });
        // Update the endpoint in the parent component
        if (result.endpointConfig) {
          onDelete(endpoint.id); // Remove old version
          onEdit(); // Trigger refetch
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update endpoint status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      const result = await deleteMcpEndpointConfig(endpoint.id);

      if (result.success) {
        toast({
          title: "Success",
          description: "Endpoint deleted successfully",
        });
        onDelete(endpoint.id);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete endpoint",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Card className={isSelected ? "border-primary" : ""}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{endpoint.name}</CardTitle>
            <Badge variant={endpoint.isEnabled ? "default" : "secondary"}>
              {endpoint.isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {endpoint.description}
          </p>

          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground">
              ENDPOINT URL
            </p>
            <div className="flex items-center mt-1">
              <code className="text-xs bg-muted p-1 rounded flex-1 truncate">
                {endpointUrl}
              </code>
              <Button variant="ghost" size="sm" onClick={handleCopyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-2">
            <p className="text-xs font-medium text-muted-foreground">
              AUTH TYPE
            </p>
            <p className="text-sm">
              {endpoint.authType === "api_key" ? "API Key" : "Bearer Token"}
            </p>
          </div>

          <div className="mt-2">
            <p className="text-xs font-medium text-muted-foreground">
              RATE LIMIT
            </p>
            <p className="text-sm">
              {endpoint.accessControl.rateLimitPerMinute} requests/minute
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              checked={endpoint.isEnabled}
              // onCheckedChange={handleToggleEnabled}
              onClick={onEdit}
              disabled={isUpdating}
            />
            <span className="text-sm">
              {isUpdating
                ? "Updating..."
                : endpoint.isEnabled
                  ? "Enabled"
                  : "Disabled"}
            </span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelect}
              title="Test Endpoint"
            >
              <PlayCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              title="Edit Endpoint"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              title="Delete Endpoint"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete MCP Endpoint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this endpoint? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
