"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { X, Plus } from "lucide-react";

export function DocumentationLinksStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [newLink, setNewLink] = useState("");
  const [error, setError] = useState("");

  const handleAddLink = () => {
    // Basic URL validation
    if (!newLink) {
      setError("Please enter a URL");
      return;
    }

    try {
      // Check if it's a valid URL
      new URL(newLink);

      // Add the link if it's not already in the list
      if (!wizardState.documentationLinks?.includes(newLink)) {
        setWizardState({
          ...wizardState,
          documentationLinks: [
            ...(wizardState.documentationLinks || []),
            newLink,
          ],
        });
        setNewLink("");
        setError("");
      } else {
        setError("This link has already been added");
      }
    } catch (e) {
      setError("Please enter a valid URL (including http:// or https://)");
    }
  };

  const handleRemoveLink = (linkToRemove: string) => {
    setWizardState({
      ...wizardState,
      documentationLinks: (wizardState.documentationLinks || []).filter(
        (link) => link !== linkToRemove
      ),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddLink();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="documentation-links">
          Documentation Links (Optional)
        </Label>
        <div className="flex gap-2">
          <Input
            id="documentation-links"
            placeholder="https://example.com/docs"
            value={newLink}
            onChange={(e) => {
              setNewLink(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
          />
          <Button type="button" onClick={handleAddLink} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <p className="text-sm text-muted-foreground">
          Add links to online documentation related to your project. These will
          be passed to AI for additional context.
        </p>
      </div>

      {/* Display added links */}
      {wizardState.documentationLinks &&
        wizardState.documentationLinks.length > 0 && (
          <div className="space-y-2">
            <Label>Added Links</Label>
            <div className="space-y-2">
              {wizardState.documentationLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-muted p-2 rounded-md"
                >
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate max-w-[90%]"
                  >
                    {link}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLink(link)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
