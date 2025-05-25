"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import {
  ArrowLeft,
  Globe,
  Lock,
  Calendar,
  User,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { currentProductAtom } from "../products-store";

export default function ProductDetailPage() {
  const router = useRouter();
  const currentProduct = useAtomValue(currentProductAtom);

  // Redirect if no product is selected
  useEffect(() => {
    if (!currentProduct) {
      router.push("/admin?tab=products");
    }
  }, [currentProduct, router]);

  if (!currentProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">No product selected</p>
          <Button
            variant="outline"
            onClick={() => router.push("/admin?tab=products")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A";
    const ts = timestamp > 1e10 ? timestamp : timestamp * 1000;
    const date = new Date(ts);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTimeAgo = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A";
    const ts = timestamp > 1e10 ? timestamp : timestamp * 1000;
    const now = Date.now();
    const diffInSeconds = Math.floor((now - ts) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return formatDate(timestamp);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin?tab=products")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Admin / Products
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{currentProduct.title}</span>
        </div>
      </div>

      {/* Product Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {currentProduct.title}
            </h1>
            {currentProduct.description && (
              <p className="text-lg text-muted-foreground">
                {currentProduct.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={currentProduct.isPublic ? "default" : "outline"}>
              {currentProduct.isPublic ? (
                <>
                  <Globe className="mr-1 h-3 w-3" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="mr-1 h-3 w-3" />
                  Private
                </>
              )}
            </Badge>
            <Badge variant="outline">
              {currentProduct.phases?.[0] || "Discover"}
            </Badge>
          </div>
        </div>

        {currentProduct.website && (
          <div>
            <a
              href={currentProduct.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {currentProduct.website}
            </a>
          </div>
        )}
      </div>

      <Separator />

      {/* Product Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core product details and metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">User ID:</span>
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {currentProduct.userId}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Country:</span>
              <span className="text-sm">
                {currentProduct.country || "Not specified"}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Development Phase:</span>
              <div className="flex flex-wrap gap-1">
                {currentProduct.phases?.map((phase, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {phase}
                  </Badge>
                )) || (
                  <Badge variant="outline" className="text-xs">
                    Discover
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Status:</span>
              <div className="flex items-center space-x-2">
                {currentProduct.isPublic ? (
                  <>
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      Public - Visible to everyone
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      Private - Only visible to owner
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Information */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Creation and modification history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-sm font-medium">Created:</span>
                <div className="text-sm text-muted-foreground">
                  {formatDate(currentProduct.createdAt)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeAgo(currentProduct.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-sm font-medium">Last Updated:</span>
                <div className="text-sm text-muted-foreground">
                  {formatDate(currentProduct.updatedAt)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeAgo(currentProduct.updatedAt)}
                </div>
              </div>
            </div>

            {currentProduct.website && (
              <div className="pt-2">
                <span className="text-sm font-medium">Website:</span>
                <div className="mt-1">
                  <a
                    href={currentProduct.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Visit Website
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Details */}
      {(currentProduct.views !== undefined ||
        currentProduct.likes !== undefined) && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>
                Product performance and user interaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {currentProduct.views !== undefined && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {currentProduct.views}
                    </div>
                    <div className="text-sm text-muted-foreground">Views</div>
                  </div>
                )}
                {currentProduct.likes !== undefined && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {currentProduct.likes}
                    </div>
                    <div className="text-sm text-muted-foreground">Likes</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Back Button */}
      <div className="flex justify-start">
        <Button
          variant="outline"
          onClick={() => router.push("/admin?tab=products")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>
    </div>
  );
}
