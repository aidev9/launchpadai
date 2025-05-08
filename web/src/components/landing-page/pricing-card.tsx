"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "@radix-ui/react-icons";

interface PricingFeature {
  text: string;
}

interface PricingCardProps {
  title: string;
  price: number;
  billingPeriod?: string;
  description: string;
  features: PricingFeature[];
  buttonText: string;
  buttonVariant?: "default" | "outline";
  isPopular?: boolean;
  onClick?: () => void;
}

export function PricingCard({
  title,
  price,
  billingPeriod = "mo",
  description,
  features,
  buttonText,
  buttonVariant = "outline",
  isPopular = false,
  onClick,
}: PricingCardProps) {
  // Convert title to lowercase for test IDs
  const planId = title.toLowerCase().replace(/\s+/g, "-");

  return (
    <Card
      data-testid={`pricing-card-${planId}`}
      className={`${isPopular ? "border-primary" : "border-muted-foreground/20"} relative flex flex-col h-full`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <Badge className="px-4 py-1">Recommended</Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle data-testid={`plan-title-${planId}`}>{title}</CardTitle>
        <div
          className="mt-4 flex items-baseline text-5xl font-bold"
          data-testid={`plan-price-${planId}`}
        >
          ${price}
          <span className="ml-1 text-xl text-muted-foreground">
            /{billingPeriod}
          </span>
        </div>
        <CardDescription
          className="mt-4"
          data-testid={`plan-description-${planId}`}
        >
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <ul className="space-y-2" data-testid={`plan-features-${planId}`}>
          {features.map((feature, index) => (
            <li
              key={index}
              className="flex items-center"
              data-testid={`plan-feature-${planId}-${index}`}
            >
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="mt-auto pt-4">
        <Button
          className="w-full"
          variant={buttonVariant}
          onClick={onClick}
          data-testid={`plan-button-${planId}`}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
}
