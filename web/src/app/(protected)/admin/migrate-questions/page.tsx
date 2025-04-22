"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function MigrateQuestionsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    migrated?: number;
    failedProducts?: string[];
    error?: string;
  } | null>(null);

  const handleMigrate = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/migrate-questions", {
        method: "POST",
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown user={null} />
        </div>
      </Header>

      <Main className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Migrate Product Questions</h1>
        <p className="text-muted-foreground mb-8">
          This page allows you to migrate product questions from the old
          subcollection structure to the new collection structure.
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Migration Tool</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This will migrate all product questions from the old structure:
              <code className="block px-4 py-2 my-2 bg-muted rounded-md">
                products/{"{userId}"}/products/{"{productId}"}/questions
              </code>
              to the new structure:
              <code className="block px-4 py-2 my-2 bg-muted rounded-md">
                questions/{"{userId}"}/products/{"{productId}"}/questions
              </code>
            </p>

            <Button
              onClick={handleMigrate}
              disabled={isLoading}
              className="mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                "Start Migration"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Alert
            variant={result.success ? "default" : "destructive"}
            className="mt-6"
          >
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {result.success ? "Migration Successful" : "Migration Failed"}
            </AlertTitle>
            <AlertDescription>
              {result.message || result.error || "No details available"}

              {result.migrated !== undefined && (
                <p className="mt-2">
                  Total questions migrated: {result.migrated}
                </p>
              )}

              {result.failedProducts && result.failedProducts.length > 0 && (
                <div className="mt-2">
                  <p>Failed to migrate questions for these products:</p>
                  <ul className="list-disc pl-5 mt-1">
                    {result.failedProducts.map((id) => (
                      <li key={id}>{id}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </Main>
    </>
  );
}
