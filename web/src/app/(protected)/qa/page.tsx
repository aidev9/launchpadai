"use client";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Provider } from "jotai";
import { columns } from "./components/qa-columns";
import { QADialogs } from "./components/qa-dialogs";
import { QAPrimaryButtons } from "./components/qa-primary-buttons";
import { QATable } from "./components/qa-table";
import { Question, questionListSchema } from "./data/schema";
import { useEffect, useState, useCallback } from "react";
import { useAtom } from "jotai";
import { selectedProductIdAtom, productsAtom } from "@/lib/store/product-store";
import { getOrderedProductQuestions } from "@/lib/firebase/actions/questions";
import { toast } from "@/components/ui/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { allQuestionsAtom } from "./components/qa-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default function QA() {
  const [selectedProductId, setSelectedProductId] = useAtom(
    selectedProductIdAtom
  );
  const [products] = useAtom(productsAtom);
  const [allQuestions, setAllQuestions] = useAtom(allQuestionsAtom);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchProducts, isLoading: productsLoading } = useProducts();

  // Load products if not already loaded
  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, products.length]);

  // Function to load questions that can be called when needed
  const loadQuestions = useCallback(
    async (skipLoadingState = false) => {
      if (!selectedProductId) {
        console.log("No product ID selected, waiting for selection");
        setIsLoading(false);
        return;
      }

      // Only set loading if not skipping loading state
      if (!skipLoadingState) {
        setIsLoading(true);
      }

      try {
        console.log(
          "QA Page: Fetching questions for product",
          selectedProductId
        );
        const response = await getOrderedProductQuestions(selectedProductId);

        if (response.success && response.questions) {
          console.log(
            "QA Page: Fetch success, questions count:",
            response.questions.length
          );
          setAllQuestions(response.questions);
        } else {
          console.error("QA Page: Fetch error:", response.error);
          toast({
            title: "Error loading questions",
            description: response.error || "Failed to load questions",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("QA Page: Failed to fetch questions:", error);
        toast({
          title: "Error loading questions",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        // Only update loading state if we were showing loading
        if (!skipLoadingState) {
          setIsLoading(false);
        }
      }
    },
    [selectedProductId, setAllQuestions]
  );

  // Load questions on product ID change
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Parse question list
  const questionList = questionListSchema.parse(allQuestions);

  // Handle product selection
  const handleProductChange = (productId: string) => {
    console.log("Selected product:", productId);
    setSelectedProductId(productId);
  };

  // Render product selector if no product is selected
  const renderProductSelector = () => {
    return (
      <Card className="w-full max-w-xl mx-auto mt-10">
        <CardHeader>
          <CardTitle>Select a Product</CardTitle>
          <CardDescription>
            Please select a product to view and manage its questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <p>Loading products...</p>
          ) : products.length > 0 ? (
            <Select
              value={selectedProductId || ""}
              onValueChange={handleProductChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No products found</AlertTitle>
              <AlertDescription>
                No products were found in your account. Please create a product
                first.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const breadcrumbItems = [{ label: "Q&A" }];

  return (
    <Provider>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown user={null} />
        </div>
      </Header>

      <Main className="container mx-auto py-6 mt-14">
        <Breadcrumbs items={breadcrumbItems} className="mb-4" />
        {!selectedProductId ? (
          renderProductSelector()
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Questions & Answers
                </h2>
                <p className="text-muted-foreground">
                  Manage your questions and answers here.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Select
                  value={selectedProductId}
                  onValueChange={handleProductChange}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <QAPrimaryButtons onRefresh={() => loadQuestions(true)} />
              </div>
            </div>
            <div className="flex-1">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <p>Loading questions...</p>
                </div>
              ) : (
                <QATable data={questionList} columns={columns} />
              )}
            </div>
          </>
        )}
      </Main>

      <QADialogs onSuccess={() => loadQuestions(true)} />
    </Provider>
  );
}
