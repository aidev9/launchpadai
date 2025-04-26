import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  badge?: string;
  heading: string;
  description: string;
  buttons?: {
    primary?: {
      text: string;
      url: string;
    };
    secondary?: {
      text: string;
      url: string;
    };
  };
  image: {
    src: string;
    alt: string;
  };
}

const HeroSection = (props: HeroSectionProps) => {
  return (
    <section className="py-8">
      <div className="container">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {props.badge && (
              <Badge variant="outline">
                {props.badge}
                <ArrowUpRight className="ml-2 size-4" />
              </Badge>
            )}
            <h1 className="my-6 text-4xl font-bold text-pretty lg:text-5xl">
              {props.heading}
            </h1>
            <p className="mb-8 max-w-xl text-muted-foreground lg:text-xl">
              {props.description}
            </p>
            <div className="flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start">
              {props.buttons?.primary && (
                <Button asChild className="w-full sm:w-auto">
                  <a href={props.buttons.primary.url}>
                    {props.buttons.primary.text}
                  </a>
                </Button>
              )}
              {props.buttons?.secondary && (
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <a href={props.buttons.secondary.url}>
                    {props.buttons.secondary.text}
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
          <img
            src={props.image.src}
            alt={props.image.alt}
            className="max-h-72 w-full rounded-lg object-cover"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
