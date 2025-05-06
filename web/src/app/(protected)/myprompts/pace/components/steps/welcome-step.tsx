"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import ReactPlayer from "react-player";

export function WelcomeStep() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* <h3 className="text-xl font-semibold">Welcome to the PACE Framework</h3> */}
        <p className="text-sm text-muted-foreground">
          The PACE framework is a structured method for creating and improving
          prompts for AI tools. It helps you get better results by focusing on
          four key elements:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-l-4 border-l-blue-500">
              <h4 className="font-bold text-lg">P - Problem</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Clearly define the problem you're trying to solve. What are you
                trying to achieve? What context is important?
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-green-500">
              <h4 className="font-bold text-lg">A - Ask Precisely</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Craft a precise prompt that clearly communicates your intent. Be
                specific about what you want and how you want it.
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-amber-500">
              <h4 className="font-bold text-lg">C - Chain Outputs</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Use the output of one prompt as input for another to refine
                results through sequential prompting.
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-purple-500">
              <h4 className="font-bold text-lg">E - Evaluate & Iterate</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Test your prompt, evaluate the results, and refine as needed to
                ensure it produces the desired output.
              </p>
            </Card>
          </div>
          <div className="space-y-2">
            <div className="aspect-video w-full rounded-lg overflow-hidden">
              {/* Using ReactPlayer for better video embedding */}

              <ReactPlayer
                url="https://www.youtube.com/watch?v=ba1ZegB0imQ"
                width="100%"
                height="100%"
                controls={true}
                light={true}
                playing={false}
                className="react-player"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Watch this short video to learn more about how to use the PACE
              framework effectively.
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold">Estimated Time: 5-10 minutes</h4>
          <p className="text-sm mt-2">
            This wizard will guide you through each step of the PACE framework.
            You can navigate between steps using the buttons below or the step
            indicators above.
          </p>
        </div>
      </div>
    </div>
  );
}
