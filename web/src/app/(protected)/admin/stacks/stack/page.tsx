"use client";

import { useAtom } from "jotai";
import { currentStackAtom } from "../stacks-store";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Eye,
  Heart,
  Layers,
  User,
  Calendar,
  Tag,
  Globe,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StackDetailPage() {
  const [currentStack] = useAtom(currentStackAtom);
  const router = useRouter();

  // Redirect if no stack is selected
  useEffect(() => {
    if (!currentStack) {
      router.push("/admin");
    }
  }, [currentStack, router]);

  if (!currentStack) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No stack selected</p>
          <Button
            variant="outline"
            onClick={() => router.push("/admin")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin")}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Stack Details</h1>
          </div>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Admin", href: "/admin" },
              { label: "Stacks", href: "/admin" },
              { label: currentStack.title || "Untitled Stack", href: "#" },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Stack Information */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    {currentStack.title || "Untitled Stack"}
                  </CardTitle>
                  {currentStack.description && (
                    <CardDescription className="text-base">
                      {currentStack.description}
                    </CardDescription>
                  )}
                </div>
                <Badge variant={currentStack.isPublic ? "default" : "outline"}>
                  {currentStack.isPublic ? (
                    <>
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {currentStack.views || 0} views
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {currentStack.likes || 0} likes
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Components */}
          <Card>
            <CardHeader>
              <CardTitle>
                Components ({(currentStack.components || []).length})
              </CardTitle>
              <CardDescription>
                Technologies and tools used in this stack
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentStack.components && currentStack.components.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentStack.components.map((component, index) => (
                    <Badge key={index} variant="secondary">
                      {typeof component === "string" ? component : "Component"}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No components specified</p>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {currentStack.tags && currentStack.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {currentStack.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stack Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Owner:</span>
                </div>
                <p className="font-mono text-sm pl-6">{currentStack.userId}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                </div>
                <p className="text-sm pl-6">
                  {currentStack.createdAt
                    ? formatDate(currentStack.createdAt)
                    : "N/A"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Updated:</span>
                </div>
                <p className="text-sm pl-6">
                  {currentStack.updatedAt
                    ? formatDate(currentStack.updatedAt)
                    : "N/A"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Stack ID:</span>
                </div>
                <p className="font-mono text-xs pl-6 break-all">
                  {currentStack.id}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="h-4 w-4 mr-2" />
                View Public Page
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                View Owner Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
