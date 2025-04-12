"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import AnimatedElement from "@/components/ui/animated-element";

// Real photo from Pexels
const startupFoundersImage =
  "https://images.pexels.com/photos/6592700/pexels-photo-6592700.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

export default function Hero() {
  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="gradient-bg hero-pattern">
      <div className="container mx-auto px-6 py-16 md:py-24 text-center relative z-10">
        <AnimatedElement threshold={0.01}>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Launch Your AI Enterprise
            <br />
            In Record Time
          </h1>
        </AnimatedElement>

        <AnimatedElement delay={200} threshold={0.01}>
          <p className="mt-6 text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto">
            Get early access to the platform that transforms how businesses
            deploy enterprise-grade AI solutions.
          </p>
        </AnimatedElement>

        <AnimatedElement delay={400} threshold={0.01}>
          <div className="mt-10">
            <Button
              variant="outline"
              size="lg"
              className="bg-white text-indigo-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300 ease-in-out text-lg"
              onClick={() => scrollToElement("waitlist")}
            >
              Reserve Your Spot
            </Button>
          </div>
        </AnimatedElement>

        <AnimatedElement delay={600} threshold={0.01}>
          <div className="mt-16">
            <Image
              src={startupFoundersImage}
              alt="Collaborative team meeting with sticky notes"
              width={1000}
              height={600}
              className="mx-auto rounded-xl shadow-2xl max-w-4xl w-full object-cover"
              priority
            />
          </div>
        </AnimatedElement>
      </div>
    </div>
  );
}
