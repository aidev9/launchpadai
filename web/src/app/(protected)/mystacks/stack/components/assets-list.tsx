"use client";

import { useAtom } from "jotai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TechStackAsset } from "@/lib/firebase/schema";
import {
  techStackAssetsAtom,
  selectedAssetAtom,
  generatingAssetsAtom,
} from "@/lib/store/techstack-store";

export function AssetsList() {
  // Use jotai atoms directly instead of props
  const [assets] = useAtom(techStackAssetsAtom);
  const [selectedAsset, setSelectedAsset] = useAtom(selectedAssetAtom);
  const [generatingAssets] = useAtom(generatingAssetsAtom);
  return (
    <Card>
      <CardContent className="space-y-4 mt-4">
        {assets.length === 0 ? (
          <p className="text-muted-foreground">No assets available</p>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.id}
              className={`p-3 border rounded-md cursor-pointer hover:bg-accent/50 ${
                selectedAsset?.id === asset.id ? "bg-accent" : ""
              }`}
              onClick={() => setSelectedAsset(asset)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {/* Use generatingAssets to determine if an asset is generating */}
                  {asset.id && generatingAssets[asset.id] && (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  )}
                  {asset.recentlyCompleted &&
                    !(asset.id && generatingAssets[asset.id]) && (
                      <div className="relative">
                        <div className="animate-ping absolute h-4 w-4 rounded-full bg-green-400 opacity-75"></div>
                        <div className="relative h-4 w-4 rounded-full bg-green-500"></div>
                      </div>
                    )}
                  {asset.needsGeneration &&
                    !(asset.id && generatingAssets[asset.id]) &&
                    !asset.recentlyCompleted && (
                      <div className="h-4 w-4 rounded-full border-2 border-amber-400"></div>
                    )}
                  <h3 className="font-medium">{asset.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {asset.needsGeneration &&
                    !(asset.id && generatingAssets[asset.id]) && (
                      <Badge
                        variant="outline"
                        className="text-amber-500 border-amber-500"
                      >
                        Draft
                      </Badge>
                    )}
                  <Badge>{asset.assetType}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2 justify-between items-center">
                <div className="flex flex-wrap gap-1">
                  {asset.tags &&
                    asset.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                </div>
                {/* Show green dot for generated assets */}
                {asset.body &&
                  !asset.needsGeneration &&
                  !(asset.id && generatingAssets[asset.id]) && (
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
