"use client";

import { useAtom } from "jotai";
import {
  techStackWizardStateAtom,
  isEditModeAtom,
} from "@/lib/store/techstack-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReviewStepProps {
  onSubmit: () => void;
}

export function ReviewStep({ onSubmit }: ReviewStepProps) {
  const [wizardState] = useAtom(techStackWizardStateAtom);
  const [isEditMode] = useAtom(isEditModeAtom);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Review Changes" : "Tech Stack Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* App Type */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">
              App Type
            </h3>
            <p className="text-lg">{wizardState.appType}</p>
          </div>

          {/* Front End Stack */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">
              Front End Stack
            </h3>
            <p className="text-lg">{wizardState.frontEndStack}</p>
          </div>

          {/* Backend Stack */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">
              Backend Stack
            </h3>
            <p className="text-lg">{wizardState.backendStack}</p>
          </div>

          {/* Database */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">
              Database
            </h3>
            <p className="text-lg">{wizardState.database}</p>
          </div>

          {/* AI Agent Stack */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">
              AI Agent Stack
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {wizardState.aiAgentStack.length > 0 ? (
                wizardState.aiAgentStack.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground">None selected</p>
              )}
            </div>
          </div>

          {/* Integrations */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">
              Integrations
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {wizardState.integrations.length > 0 ? (
                wizardState.integrations.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground">None selected</p>
              )}
            </div>
          </div>

          {/* Deployment Stack */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">
              Deployment Stack
            </h3>
            <p className="text-lg">{wizardState.deploymentStack}</p>
          </div>

          {/* App Details */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">
              App Name
            </h3>
            <p className="text-lg">{wizardState.name}</p>
          </div>

          {/* Description */}
          {wizardState.description && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">
                Description
              </h3>
              <p className="text-base">{wizardState.description}</p>
            </div>
          )}

          {/* Tags */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Tags</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {wizardState.tags.length > 0 ? (
                wizardState.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground">No tags</p>
              )}
            </div>
          </div>

          {/* Phase */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Phase</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {wizardState.phase.map((phase) => (
                <Badge key={phase} variant="default">
                  {phase}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The Create Tech Stack button is now only in the footer */}
    </div>
  );
}
