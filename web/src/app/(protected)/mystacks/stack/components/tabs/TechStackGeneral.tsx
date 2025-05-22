import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TechStack } from "@/lib/firebase/schema";

interface TechStackGeneralProps {
  selectedTechStack: TechStack;
}

export function TechStackGeneral({ selectedTechStack }: TechStackGeneralProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="text-sm">{selectedTechStack.name}</div>
              <div className="text-sm text-muted-foreground">App Type</div>
              <div className="text-sm">{selectedTechStack.appType}</div>
              <div className="text-sm text-muted-foreground">Description</div>
              <div className="text-sm">{selectedTechStack.description}</div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Phase</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTechStack.phases.map((phase) => (
                <Badge key={phase} variant="outline">
                  {phase}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Tags</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTechStack.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Tech Stack</h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="text-sm text-muted-foreground">Frontend</div>
              <div className="text-sm">{selectedTechStack.frontEndStack}</div>
              <div className="text-sm text-muted-foreground">Backend</div>
              <div className="text-sm">{selectedTechStack.backEndStack}</div>
              <div className="text-sm text-muted-foreground">Database</div>
              <div className="text-sm">{selectedTechStack.databaseStack}</div>
              <div className="text-sm text-muted-foreground">Deployment</div>
              <div className="text-sm">{selectedTechStack.deploymentStack}</div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">AI Agent Stack</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTechStack.aiAgentStack &&
                selectedTechStack.aiAgentStack.map((item) => (
                  <Badge key={item} variant="outline">
                    {item}
                  </Badge>
                ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Integrations</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTechStack.integrations &&
                selectedTechStack.integrations.map((item) => (
                  <Badge key={item} variant="outline">
                    {item}
                  </Badge>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
