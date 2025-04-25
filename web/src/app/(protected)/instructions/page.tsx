"use client";
import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NextStepsHorizontal } from "@/app/(protected)/instructions/next-steps-horizontal";
import {
  Download,
  Archive,
  FolderPlus,
  MessageCircle,
  Rocket,
  Globe,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

// Instruction step data
const instructionSteps = [
  {
    number: 1,
    title: "Download Assets",
    description:
      "Download all the generated files and resources for your project.",
    icon: Download,
    iconBackground: "bg-blue-100 dark:bg-blue-900",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    number: 2,
    title: "Unzip Files",
    description:
      "Extract all the downloaded files to a local directory on your computer.",
    icon: Archive,
    iconBackground: "bg-purple-100 dark:bg-purple-900",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    number: 3,
    title: "Add Files to Cursor",
    description: "Import the extracted files into your Cursor IDE workspace.",
    icon: FolderPlus,
    iconBackground: "bg-green-100 dark:bg-green-900",
    iconColor: "text-green-600 dark:text-green-400",
  },
  {
    number: 4,
    title: "Prompt Cursor",
    description:
      "Use the generated files with Cursor to instruct the AI on your project.",
    icon: MessageCircle,
    iconBackground: "bg-amber-100 dark:bg-amber-900",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    number: 5,
    title: "Generate Your Product",
    description:
      "Create your product using Cursor's AI capabilities and the provided files.",
    icon: Rocket,
    iconBackground: "bg-red-100 dark:bg-red-900",
    iconColor: "text-red-600 dark:text-red-400",
  },
  {
    number: 6,
    title: "Deploy Your Product",
    description:
      "Deploy your finished product to your preferred hosting platform.",
    icon: Globe,
    iconBackground: "bg-indigo-100 dark:bg-indigo-900",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
];

export default function Instructions() {
  return (
    <Main>
      <div className="mb-8">
        <div className="flex-1">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/dashboard" },
              { label: "Products", href: "/dashboard" },
              { label: "Product", href: "/product" },
              {
                label: "Instructions",
                href: "/instructions",
                isCurrentPage: true,
              },
            ]}
          />
          <div className="flex justify-between items-center mt-4">
            <h2 className="text-3xl font-bold tracking-tight">
              Setup Instructions
            </h2>
          </div>
          <p className="text-muted-foreground text-lg mt-2">
            Follow these steps to set up and use your downloaded assets
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 relative">
        {instructionSteps.map((step) => (
          <Card
            key={step.number}
            className="hover:shadow-md transition-all duration-300 border-t-4 min-h-[200px] relative"
            style={{
              borderTopColor: step.iconColor.includes("blue")
                ? "#3b82f6"
                : step.iconColor.includes("purple")
                  ? "#9333ea"
                  : step.iconColor.includes("green")
                    ? "#10b981"
                    : step.iconColor.includes("amber")
                      ? "#f59e0b"
                      : step.iconColor.includes("red")
                        ? "#ef4444"
                        : "#6366f1",
            }}
          >
            <div className="absolute top-3 right-3 z-10">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                {step.number}
              </span>
            </div>
            <CardHeader className="pt-8 pb-0">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${step.iconBackground} shadow-sm`}
                >
                  <step.icon className={`h-7 w-7 ${step.iconColor}`} />
                </div>
                <div className="pr-8">
                  <CardTitle className="text-xl leading-tight">
                    {step.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2">
                    {step.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-6"></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex-1 overflow-auto px-1 py-1 lg:space-y-0">
        {/* Horizontal Next Steps Navigation at bottom */}
        <NextStepsHorizontal />
      </div>
    </Main>
  );
}
