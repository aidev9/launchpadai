"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TechStackAsset } from "@/lib/firebase/schema";

interface AssetsListProps {
  assets: TechStackAsset[];
  selectedAsset: TechStackAsset | null;
  onSelectAsset: (asset: TechStackAsset) => void;
}

export function AssetsList({
  assets,
  selectedAsset,
  onSelectAsset,
}: AssetsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Assets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assets.length === 0 ? (
          <p className="text-muted-foreground">No assets available</p>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.id}
              className={`p-3 border rounded-md cursor-pointer hover:bg-accent/50 ${
                selectedAsset?.id === asset.id ? "bg-accent" : ""
              }`}
              onClick={() => onSelectAsset(asset)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {asset.isGenerating && (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  )}
                  <h3 className="font-medium">{asset.title}</h3>
                </div>
                <Badge>{asset.assetType}</Badge>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {asset.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
