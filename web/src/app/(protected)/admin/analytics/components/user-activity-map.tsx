"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export function UserActivityMap() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const regions = [
    {
      name: "North America",
      users: 12842,
      percentage: 42,
      color: "bg-blue-500",
    },
    { name: "Europe", users: 8730, percentage: 28, color: "bg-green-500" },
    {
      name: "Asia Pacific",
      users: 5125,
      percentage: 16,
      color: "bg-yellow-500",
    },
    {
      name: "Latin America",
      users: 2374,
      percentage: 8,
      color: "bg-orange-500",
    },
    { name: "Africa", users: 1132, percentage: 4, color: "bg-red-500" },
    { name: "Middle East", users: 629, percentage: 2, color: "bg-purple-500" },
  ];

  return (
    <div className="h-[300px] w-full">
      {!isMounted ? (
        <div className="h-full w-full flex items-center justify-center">
          Loading map...
        </div>
      ) : (
        <div className="space-y-5">
          <div className="relative h-[200px] w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
            {/* Simplified world map visualization - in a real app, use a proper mapping library */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTA5LDk3YzAsMCw4OSwtNDcgMTQxLC00NGMwLDAgNTgsLTIgOTQsMzBjMCwwIDQ1LC0yMCA2NSwtMjBjMCwwIDUsMjcgMjMsNDhjMCwwIDUsLTIwIDI1LC0xOWMwLDAgNCwxOSAxNSwyM2MwLDAgLTksOSAxLDE4YzAsMCAxMSwtNCAxNywtMTVjMCwwIC0xLDEwIC05LDE5YzAsMCAxNywtNCAxNCwxNGMwLDAgLTEyLDExIC0xNywxMWMwLDAgLTEwLC01IC0xNCw2YzAsMCAxMSwxIDIyLDBsMCwwYzAsMCAyLDggLTksMTRjMCwwIDEzLC01IDI2LC0xN2MwLDAgMSwxMSAtNiwxOGMwLDAgMTMsLTggMjEsLTE2YzAsMCAxMCw1IDMsMTdjMCwwIDExLC0zIDEzLC0xMmMwLDAgMTEsLTEgMywxMWMwLDAgOCw4IDEsOWMwLDAgLTE3LDIgLTEsMTZjMCwwIDMsMTEgLTgsMjdjMCwwIC0xMSw4IC0xMiwxOWMwLDAgLTksMTAgLTIyLDEzYzAsMCAtNiwtMTAgLTE5LC01YzAsMCAtMTIsLTE3IC0yMiwtN2MwLDAgMywyMSAtMTEsMjhjMCwwIC0xNCwxIC0yNiw1YzAsMCAtNiw5IC0xNyw2YzAsMCAtMTEsLTIgLTE2LDVjMCwwIC0xNCw1IC0xOCwwYzAsMCAtMTEsLTEyIC04LC0yMGMwLDAgMTIsLTcgMywtMThjMCwwIC03LC03IC02LC0xNWMwLDAgLTIsLTEyIC03LC0xM2MwLDAgLTUsMSAtMTAsLTEyYzAsMCAtOCw0IC0xMyw0YzAsMCAtMTcsLTQgLTI0LDJjMCwwIC0xMCwtOCAtMTQsLThjMCwwIC0yMiwtNCAtMjUsMWMwLDAgLTE5LC02IC0zMSw5YzAsMCAtMTgsLTQgLTI0LDNjMCwwIC0xNSw5IC0zMiw5YzAsMCAtOCwtNSAtMTQsMWMwLDAgLTI0LC0xIC0yMywxMmMwLDAgLTgsNCAtMTEsLTRjMCwwIDAsMTAgLTksMTBjMCwwIC0xMywtNiAtMTMsMmMwLDAgLTE2LC0xMCAtMjMsMWMwLDAgLTEwLC02IC0xNSwwYzAsMCAtMTcsLTEyIC0zMiwtMWMwLDAgLTEwLC0xMCAtMTYsLTExYzAsMCAtMTIsLTIgLTE2LC0xMWwwLDBjMCwwIC0yLC0xMyAtMTYsLTEwYzAsMCAtOCwxIC0xMywtNWMwLDAgLTksLTEgLTE2LC0xMGMwLDAgLTUsLTQgLTcsLTEzYzAsMCAtNiwzIC0xMCwtOGMwLDAgLTEwLC0xMSAtNywtMTljMCwwIC01LC05IC0xLC0xNmMwLDAgNSwtMTkgMjAsLTE0YzAsMCAxOSwtMTUgMjgsLTEwYzAsMCAyOCwxIDM2LC0xMmMwLDAgMjAsLTggMjksMWMwLDAgMTYsLTE0IDI0LC0xM2MwLDAgMjAsLTE0IDM2LDBsMCwwYzAsMCAxMCwtNSAyMSwwWiIgc3Ryb2tlPSJncmF5IiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] bg-contain bg-center bg-no-repeat opacity-30" />

            {/* Dots representing major user clusters */}
            <div
              className="absolute top-[30%] left-[15%] h-5 w-5 rounded-full bg-blue-500 animate-pulse"
              title="North America"
            ></div>
            <div
              className="absolute top-[25%] left-[45%] h-4 w-4 rounded-full bg-green-500 animate-pulse"
              title="Europe"
            ></div>
            <div
              className="absolute top-[35%] left-[70%] h-4 w-4 rounded-full bg-yellow-500 animate-pulse"
              title="Asia Pacific"
            ></div>
            <div
              className="absolute top-[55%] left-[25%] h-3 w-3 rounded-full bg-orange-500 animate-pulse"
              title="Latin America"
            ></div>
            <div
              className="absolute top-[45%] left-[50%] h-3 w-3 rounded-full bg-purple-500 animate-pulse"
              title="Middle East"
            ></div>
            <div
              className="absolute top-[55%] left-[50%] h-3 w-3 rounded-full bg-red-500 animate-pulse"
              title="Africa"
            ></div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {regions.map((region) => (
              <div key={region.name} className="flex items-center text-sm">
                <div className={`h-3 w-3 rounded-full ${region.color} mr-2`} />
                <span className="mr-1">{region.name}:</span>
                <span className="font-medium">{region.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
