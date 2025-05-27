import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, RefreshCw } from "lucide-react";
// Using unified store system
import {
  selectedProductAtom,
  selectedBusinessStackAtom,
  selectedTechStackAtom,
  selectedRulesAtom,
  featuresAtom,
  notesAtom,
  collectionsAtom,
} from "@/lib/store/product-store";
import { globalWizardStepAtom } from "@/lib/atoms/wizard";
import MDEditor from "@uiw/react-md-editor";
import { generatePlaygroundContent } from "@/app/actions/playground-generate-action";
import { PLAYGROUND_CATEGORIES } from "./data";
import { firebaseQA } from "@/lib/firebase/client/FirebaseQA";
import { useCollectionData } from "react-firebase-hooks/firestore";

type CategoryBadge = {
  id: string;
  name: string;
  subBadges: SubBadge[];
};

type SubBadge = {
  id: string;
  name: string;
  prompt: string;
};

// Flatten helper available everywhere in this file
function flatten(obj: any, prefix = ""): Record<string, string> {
  if (!obj) return {};
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      const flatKey = prefix ? `${prefix}_${key}` : key;
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(acc, flatten(value, flatKey));
      } else if (Array.isArray(value)) {
        acc[flatKey] = value.join(", ");
      } else {
        acc[flatKey] =
          value !== undefined && value !== null ? String(value) : "";
      }
      return acc;
    },
    {} as Record<string, string>
  );
}

export default function PlaygroundCard() {
  // Initialize with first category and subcategory
  const firstCategory =
    PLAYGROUND_CATEGORIES.length > 0 ? PLAYGROUND_CATEGORIES[0] : null;
  const firstSubCategory =
    firstCategory &&
    firstCategory.subcategories &&
    firstCategory.subcategories.length > 0
      ? firstCategory.subcategories[0]
      : null;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    firstCategory?.id || null
  );
  const [selectedSubBadge, setSelectedSubBadge] = useState<string | null>(
    firstSubCategory?.id || null
  );
  const [instructions, setInstructions] = useState<string>("");
  const [injectedPrompt, setInjectedPrompt] = useState<string>(""); // The template with variables injected
  const [resultsContent, setResultsContent] = useState<string>(""); // Final LLM output
  const [activeTab, setActiveTab] = useState<"prompt" | "results">("results"); // Start with results tab
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Retrieve all wizard step values from atoms
  const [selectedProduct] = useAtom(selectedProductAtom);
  const [selectedBusinessStack] = useAtom(selectedBusinessStackAtom);
  const [selectedTechStack] = useAtom(selectedTechStackAtom);
  const [selectedRules] = useAtom(selectedRulesAtom);
  const [features] = useAtom(featuresAtom);
  const [notes] = useAtom(notesAtom);
  const [collections] = useAtom(collectionsAtom);
  const [globalStep] = useAtom(globalWizardStepAtom);

  // For 360 questions
  // Use react-firebase-hooks to get questions for the current product
  const [questionData, isQuestionsLoading] = useCollectionData(
    selectedProduct?.id
      ? firebaseQA.getQuestionsByProduct(selectedProduct.id)
      : null,
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  // Format the questions data when it loads
  const questionsData = React.useMemo(() => {
    if (!questionData) return [];

    return questionData.map((doc: any) => ({
      id: doc.id,
      question: doc.question || "",
      answer: doc.answer || "",
      // Include other properties as needed
      ...doc,
    }));
  }, [questionData]);

  // Initialize selected product from storage
  // const [, setInitialize] = useAtom(initializeSelectedProductAtom);

  // Real-time prompt update - inject variables into template
  useEffect(() => {
    if (!selectedCategory || !selectedSubBadge) return;

    const category = PLAYGROUND_CATEGORIES.find(
      (cat) => cat.id === selectedCategory
    );
    const sub = category?.subcategories.find((s) => s.id === selectedSubBadge);
    if (!sub) return;

    // Debug logging to see what data we actually have
    console.log("[PlaygroundCard] Debug - selectedProduct:", selectedProduct);
    console.log(
      "[PlaygroundCard] Debug - selectedBusinessStack:",
      selectedBusinessStack
    );
    console.log(
      "[PlaygroundCard] Debug - selectedTechStack:",
      selectedTechStack
    );
    console.log("[PlaygroundCard] Debug - features:", features);
    console.log("[PlaygroundCard] Debug - notes:", notes);
    console.log("[PlaygroundCard] Debug - collections:", collections);
    console.log("[PlaygroundCard] Debug - 360 questions:", questionsData);

    // Helper function to check if an object has meaningful data
    const hasData = (obj: any): boolean => {
      if (!obj) return false;
      if (typeof obj === "string") return obj.trim().length > 0;
      if (Array.isArray(obj)) return obj.length > 0;
      if (typeof obj === "object") {
        const keys = Object.keys(obj).filter(
          (key) =>
            key !== "id" &&
            key !== "userId" &&
            key !== "productId" &&
            key !== "createdAt" &&
            key !== "updatedAt"
        );
        return keys.some((key) => {
          const value = obj[key];
          if (typeof value === "string") return value.trim().length > 0;
          if (Array.isArray(value)) return value.length > 0;
          return value != null;
        });
      }
      return obj != null;
    };

    // Create context variables from wizard state with comprehensive product details
    const contextVars: Record<string, string> = {
      // Enhanced Product variables - include all available details
      productName: selectedProduct?.name || "Your Product",
      productDescription:
        selectedProduct?.description ||
        selectedProduct?.problem ||
        "A comprehensive product description will be generated based on your wizard inputs.",
      productPhases: selectedProduct?.phases?.length
        ? selectedProduct.phases.join(", ")
        : "Discover, Validate, Design, Build, Secure, Launch, Grow",

      // Include 360 questions and business rules with product description for wider template compatibility
      productDetailedDescription: `${
        selectedProduct?.description ||
        selectedProduct?.problem ||
        "Product Description"
      }\n\nBusiness Rules:\n${
        hasData(selectedRules)
          ? Object.entries(selectedRules || {})
              .filter(
                ([key, value]) =>
                  value &&
                  key !== "id" &&
                  key !== "productId" &&
                  key !== "userId" &&
                  key !== "createdAt" &&
                  key !== "updatedAt"
              )
              .map(([key, value]) => {
                // Format the key to be more readable (e.g., "designPrinciples" -> "Design Principles")
                const formattedKey = key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase());
                return `${formattedKey}: ${value}`;
              })
              .join("\n") || ""
          : ""
      }`,

      // Additional product details
      productProblem:
        selectedProduct?.problem || "Problem statement to be defined",
      productTeam: selectedProduct?.team || "Team composition to be defined",
      productWebsite: selectedProduct?.website || "Website URL to be added",
      productCountry: selectedProduct?.country || "Target market location",

      // Business stack variables with improved detection
      businessStack: hasData(selectedBusinessStack)
        ? [
            selectedBusinessStack?.marketSize &&
              `Market Size: ${selectedBusinessStack.marketSize}`,
            selectedBusinessStack?.revenueModel &&
              `Revenue Model: ${selectedBusinessStack.revenueModel}`,
            selectedBusinessStack?.distributionChannels?.length &&
              `Distribution Channels: ${selectedBusinessStack.distributionChannels.join(", ")}`,
            selectedBusinessStack?.customerAcquisition &&
              `Customer Acquisition: ${selectedBusinessStack.customerAcquisition}`,
            selectedBusinessStack?.valueProposition &&
              `Value Proposition: ${selectedBusinessStack.valueProposition}`,
            selectedBusinessStack?.costStructure &&
              `Cost Structure: ${selectedBusinessStack.costStructure}`,
            selectedBusinessStack?.partnerships?.length &&
              `Partnerships: ${selectedBusinessStack.partnerships.join(", ")}`,
          ]
            .filter(Boolean)
            .join("\n") ||
          "Business strategy details available but not fully configured"
        : "Business strategy to be defined in the Business Stack wizard step",

      // Tech stack variables with improved detection
      techStack: hasData(selectedTechStack)
        ? [
            selectedTechStack?.appType &&
              `App Type: ${selectedTechStack.appType}`,
            selectedTechStack?.frontEndStack &&
              `Frontend: ${selectedTechStack.frontEndStack}`,
            selectedTechStack?.backEndStack &&
              `Backend: ${selectedTechStack.backEndStack}`,
            selectedTechStack?.databaseStack &&
              `Database: ${selectedTechStack.databaseStack}`,
            selectedTechStack?.aiAgentStack?.length &&
              `AI Agents: ${selectedTechStack.aiAgentStack.join(", ")}`,
            selectedTechStack?.integrations?.length &&
              `Integrations: ${selectedTechStack.integrations.join(", ")}`,
            selectedTechStack?.deploymentStack &&
              `Deployment: ${selectedTechStack.deploymentStack}`,
          ]
            .filter(Boolean)
            .join("\n") ||
          "Technical architecture details available but not fully configured"
        : "Technical architecture to be defined in the Tech Stack wizard step",

      // Target audience - enhanced with multiple fallbacks
      targetAudience:
        selectedBusinessStack?.valueProposition ||
        selectedProduct?.description ||
        "Target audience will be defined based on business strategy and market analysis",

      // Enhanced feature context
      features: features?.length
        ? features
            .map((f) => `${f.name}: ${f.description || "Feature details"}`)
            .join("; ")
        : "Product features to be defined",

      // Enhanced notes context
      notes: notes?.length
        ? notes.map((n) => `${n.title || "Note"}: ${n.content}`).join("; ")
        : "Additional notes and insights to be added",

      // Enhanced collections context
      collections: collections?.length
        ? collections
            .map((c) => `${c.title}: ${c.description || "Collection details"}`)
            .join("; ")
        : "Document collections to be created",

      // Rules context - formatted in a structured way
      rules: hasData(selectedRules)
        ? Object.entries(selectedRules || {})
            .filter(
              ([key, value]) =>
                value &&
                key !== "id" &&
                key !== "productId" &&
                key !== "userId" &&
                key !== "createdAt" &&
                key !== "updatedAt"
            )
            .map(([key, value]) => {
              // Format the key to be more readable (e.g., "designPrinciples" -> "Design Principles")
              const formattedKey = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase());
              return `${formattedKey}: ${value}`;
            })
            .join("\n")
        : "Business rules and constraints to be defined",

      // Structured formatted business rules
      productRules: hasData(selectedRules)
        ? Object.entries(selectedRules || {})
            .filter(
              ([key, value]) =>
                value &&
                key !== "id" &&
                key !== "productId" &&
                key !== "userId" &&
                key !== "createdAt" &&
                key !== "updatedAt"
            )
            .map(([key, value]) => {
              // Format the key to be more readable (e.g., "designPrinciples" -> "Design Principles")
              const formattedKey = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase());
              return `${formattedKey}: ${value}`;
            })
            .join("\n")
        : "No business rules defined.",

      // 360 Questions and Answers - include only answered questions
      questions360: questionsData?.length
        ? questionsData
            .filter((q) => q.answer && q.answer.trim().length > 0)
            .map((q) => `Q: ${q.question}\nA: ${q.answer}`)
            .join("\n\n") || "No answered 360° questions yet for this product"
        : "360° product questions to be answered in the Questions wizard step",
    };

    // Inject variables into the prompt template
    let injected = sub.promptTemplate;
    injected = injected.replace(/{{(.*?)}}/g, (_, key) => {
      const cleanKey = key.trim();
      const value = contextVars[cleanKey];

      // Use the contextVars value directly - they already have good fallbacks
      return value || `[${cleanKey} - not found in context]`;
    });

    setInjectedPrompt(injected);
    setResultsContent(""); // Clear results when template changes

    console.log("[PlaygroundCard] Variables injected:", contextVars);
    console.log("[PlaygroundCard] Injected prompt:", injected);
  }, [
    selectedCategory,
    selectedSubBadge,
    selectedProduct,
    selectedBusinessStack,
    selectedTechStack,
    selectedRules,
    features,
    notes,
    collections,
    questionsData,
  ]);

  // Initialize with first category and subcategory on component mount
  useEffect(() => {
    if (PLAYGROUND_CATEGORIES.length > 0) {
      const firstCategory = PLAYGROUND_CATEGORIES[0];
      setSelectedCategory(firstCategory.id);

      if (firstCategory.subcategories?.length > 0) {
        const firstSubcategory = firstCategory.subcategories[0];
        setSelectedSubBadge(firstSubcategory.id);

        // Auto-start enhancement after a brief delay to ensure state is updated
        setTimeout(() => {
          handleEnhance();
        }, 300);
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Auto-generate content on initial mount if category and subcategory are set
  useEffect(() => {
    if (selectedCategory && selectedSubBadge && !resultsContent) {
      // Set a small delay to ensure all data is loaded
      const timer = setTimeout(() => {
        handleEnhance();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [selectedCategory, selectedSubBadge, resultsContent]);

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setSelectedSubBadge(null);
    setInjectedPrompt("");
    setResultsContent("");
  };

  // Handle subcategory selection
  const handleSubBadgeSelect = async (subBadgeId: string) => {
    setSelectedSubBadge(subBadgeId);
    setActiveTab("results"); // Start with results tab and auto-generate

    // Auto-start enhancement after a brief delay to ensure state is updated
    setTimeout(() => {
      handleEnhance();
    }, 100);
  };

  // Generate the final results using AI
  const handleEnhance = async () => {
    if (isEnhancing || !injectedPrompt) return;

    setIsEnhancing(true);
    setActiveTab("results"); // Switch to results tab to show final output
    setResultsContent(""); // Clear previous results

    try {
      console.log(
        "[PlaygroundCard] Generating results from prompt:",
        injectedPrompt
      );
      console.log("[PlaygroundCard] User instructions:", instructions);

      // Generate final results using the new playground-specific action
      const stream = await generatePlaygroundContent({
        promptTemplate: injectedPrompt,
        userInstructions: instructions,
        modelId: "gpt-4o-mini", // Use the more capable model
        temperature: 0.8, // Higher creativity for better results
        maxTokens: 4096, // More tokens for comprehensive output
        topP: 0.95, // Higher diversity
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let resultText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const content = JSON.parse(line.substring(6));
              resultText += content;
              setResultsContent(resultText);
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }

      console.log("[PlaygroundCard] Generated result:", resultText);
    } catch (error) {
      setResultsContent("Error generating results. Please try again.");
      console.error("[PlaygroundCard] Error generating results:", error);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          Prompt Playground{" "}
          <span className="text-sm text-muted-foreground font-normal">
            (Select a category to begin)
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-0"
        // style={{ minHeight: 0, maxHeight: "calc(90vh - 200px)" }}
      >
        {/* Main Categories - robust horizontal scroll, 80% width */}
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent mx-auto">
          <div className="flex gap-2 whitespace-nowrap px-1 pb-2 min-w-fit">
            {PLAYGROUND_CATEGORIES.map((category) => (
              <Badge
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                className="cursor-pointer px-3 py-1 text-sm flex items-center gap-1"
                onClick={() => handleCategorySelect(category.id)}
              >
                {selectedCategory === category.id && <CheckIcon size={12} />}
                {category.name}
              </Badge>
            ))}
          </div>
        </div>
        {/* Subcategories - robust horizontal scroll, 80% width */}
        {selectedCategory && (
          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent mx-auto">
            <div className="flex gap-2 whitespace-nowrap px-1 pb-2 min-w-fit mt-2">
              {PLAYGROUND_CATEGORIES.find(
                (c) => c.id === selectedCategory
              )?.subcategories.map((sub) => (
                <Badge
                  key={sub.id}
                  variant={
                    selectedSubBadge === sub.id ? "default" : "secondary"
                  }
                  className="cursor-pointer px-3 py-1 text-sm flex items-center gap-1"
                  onClick={() => {
                    handleSubBadgeSelect(sub.id);
                    handleEnhance();
                  }}
                  style={{ minWidth: 140 }}
                >
                  {selectedSubBadge === sub.id && <CheckIcon size={12} />}
                  {sub.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Prompt/Results Tabs */}
        {selectedSubBadge && (
          <div className="mt-2 flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex border-b border-muted mb-2 flex-shrink-0">
              <button
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === "prompt" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                onClick={() => setActiveTab("prompt")}
                type="button"
              >
                Prompt Template
              </button>
              <button
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === "results" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                onClick={() => setActiveTab("results")}
                type="button"
              >
                Results
              </button>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              {activeTab === "prompt" ? (
                // Show the injected prompt template (read-only)
                <div
                  className="flex-1 flex flex-col min-h-0"
                  data-color-mode="light"
                >
                  <MDEditor
                    value={injectedPrompt}
                    onChange={() => {}} // Read-only
                    height={320}
                    // style={{ maxHeight: "400px" }}
                    preview="edit"
                  />
                </div>
              ) : (
                // Show the final results from LLM
                <div
                  className="flex-1 flex flex-col min-h-0"
                  data-color-mode="light"
                >
                  {isEnhancing ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating Results...
                    </div>
                  ) : (
                    <MDEditor
                      value={
                        resultsContent ||
                        "Click 'Enhance Results' to generate contextual context for your product."
                      }
                      onChange={() => {}} // Read-only
                      height={320}
                      // style={{ maxHeight: "400px" }}
                      preview="edit"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {selectedSubBadge && (
        <CardFooter className="flex flex-col gap-2 pt-0">
          <Textarea
            placeholder="Add specific instructions (e.g., 'Add 20 widgets to the dashboard with charts and number cards', 'Focus on mobile-first design', 'Include code examples')..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full resize-none"
            rows={2}
          />

          <Button
            className="w-full"
            onClick={handleEnhance}
            disabled={isEnhancing || !injectedPrompt}
          >
            {isEnhancing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating Content...
              </>
            ) : (
              "Generate Content"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
