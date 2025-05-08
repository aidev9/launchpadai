"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { useEffect, useState } from "react";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 1 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const headlineTexts = [
  "Become a Master Vibe Coder with AI",
  "Rule the Code Generation with AI",
  "Transform Your Prompts into Code with AI",
  "Build Detailed Prompts with a Single Click",
  "Launch Your Startup Faster with AI Superpowers",
  "Build Products 10x Faster with AI Assistance",
  "Learn Continuously with AI-Powered Resources",
  "Build, Learn, and Connect with AI",
  "Shorten Your Time to Market with AI",
  "Save Time and Money with AI-Driven Solutions",
];

// Startup images for carousel
const startupImages = [
  "https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/7793103/pexels-photo-7793103.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/3153201/pexels-photo-3153201.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/3277808/pexels-photo-3277808.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/3756681/pexels-photo-3756681.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/7097/people-coffee-tea-meeting.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/1595391/pexels-photo-1595391.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/7414273/pexels-photo-7414273.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/7552326/pexels-photo-7552326.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/1181243/pexels-photo-1181243.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/1181472/pexels-photo-1181472.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
];

export function HeroSection() {
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const [isHovered, setIsHovered] = useState(false);

  // Initialize transforms with default values
  const rotateX = useTransform(mouseY, [0, windowSize.height], [1, -1]);
  const rotateY = useTransform(mouseX, [0, windowSize.width], [-1, 1]);

  // Update window size on client side only
  useEffect(() => {
    // Only run on client-side
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle mouse movement for parallax effect
  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  // Cycle through headline texts
  useEffect(() => {
    const headlineInterval = setInterval(() => {
      setHeadlineIndex((prevIndex) => (prevIndex + 1) % headlineTexts.length);
    }, 10000);
    return () => clearInterval(headlineInterval);
  }, []);

  // Cycle through carousel images
  useEffect(() => {
    const imageInterval = setInterval(() => {
      setImageIndex((prevIndex) => (prevIndex + 1) % startupImages.length);
    }, 20000);
    return () => clearInterval(imageInterval);
  }, []);

  return (
    <section
      id="hero"
      className="w-full relative overflow-hidden bg-gray-50 pb-20"
      onMouseMove={handleMouseMove}
    >
      {/* Subtle background pattern */}
      {/* <div className="absolute inset-0 z-10 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-gray-100" />
      </div> */}

      {/* Animated Subtle Background Shapes */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Shape 1 */}
        <motion.div
          className="absolute"
          style={{
            width: "clamp(300px, 30vw, 500px)",
            height: "clamp(300px, 30vw, 500px)",
            borderRadius: "30%",
            backgroundColor: "rgba(59, 130, 246, 0.08)", // Increased opacity
            filter: "blur(32px)", // Add blur for visibility
          }}
          initial={{ opacity: 0, x: "10%", y: "20%", rotate: 0, scale: 0.9 }}
          animate={{
            opacity: [0, 0.7, 0.7, 0],
            x: ["10%", "15%", "5%", "10%"],
            y: ["20%", "30%", "10%", "20%"],
            rotate: [0, 8, -6, 0],
            scale: [0.9, 1, 1, 0.9],
          }}
          transition={{
            duration: 90,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
        {/* Shape 2 */}
        <motion.div
          className="absolute"
          style={{
            width: "clamp(250px, 25vw, 450px)",
            height: "clamp(250px, 25vw, 450px)",
            borderRadius: "40%",
            backgroundColor: "rgba(168, 85, 247, 0.06)", // Increased opacity
            filter: "blur(32px)",
          }}
          initial={{ opacity: 0, x: "70%", y: "60%", rotate: 0, scale: 1 }}
          animate={{
            opacity: [0, 0.5, 0.5, 0],
            x: ["70%", "60%", "80%", "70%"],
            y: ["60%", "50%", "70%", "60%"],
            rotate: [0, -7, 5, 0],
            scale: [1, 1.05, 1.05, 1],
          }}
          transition={{
            duration: 110,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 15,
          }}
        />
        {/* Shape 3 */}
        <motion.div
          className="absolute"
          style={{
            width: "clamp(320px, 33vw, 520px)",
            height: "clamp(320px, 33vw, 520px)",
            borderRadius: "35%",
            backgroundColor: "rgba(236, 72, 153, 0.07)", // Increased opacity
            filter: "blur(32px)",
          }}
          initial={{ opacity: 0, x: "40%", y: "45%", rotate: 0, scale: 0.95 }}
          animate={{
            opacity: [0, 0.6, 0.6, 0],
            x: ["40%", "50%", "30%", "40%"],
            y: ["45%", "55%", "35%", "45%"],
            rotate: [0, 5, -5, 0],
            scale: [0.95, 1.02, 1.02, 0.95],
          }}
          transition={{
            duration: 130,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 30,
          }}
        />
        {/* Adjusted Animated Shapes */}
        <motion.svg
          className="absolute z-10"
          style={{
            width: "clamp(200px, 20vw, 400px)",
            height: "clamp(200px, 20vw, 400px)",
            top: "10%",
            left: "15%",
          }}
          initial={{ opacity: 0.2, x: -50, y: -50, rotate: 0 }}
          animate={{
            opacity: [0.2, 0.5, 0.5, 0.2],
            x: [-50, 0, 50, -50],
            y: [-50, 50, -50, -50],
            rotate: [0, 360],
          }}
          transition={{ duration: 120, ease: "linear", repeat: Infinity }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
        >
          <polygon points="50,15 90,85 10,85" fill="rgba(59, 130, 246, 0.2)" />
        </motion.svg>

        <motion.svg
          className="absolute z-10"
          style={{
            width: "clamp(150px, 15vw, 300px)",
            height: "clamp(150px, 15vw, 300px)",
            bottom: "20%",
            right: "10%",
          }}
          initial={{ opacity: 0.2, x: 50, y: 50, rotate: 0 }}
          animate={{
            opacity: [0.2, 0.6, 0.6, 0.2],
            x: [50, -50, 50, 50],
            y: [50, -50, 50, 50],
            rotate: [0, -360],
          }}
          transition={{ duration: 150, ease: "linear", repeat: Infinity }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
        >
          <rect
            x="25"
            y="25"
            width="50"
            height="50"
            fill="rgba(236, 72, 153, 0.2)"
          />
        </motion.svg>
      </div>

      {/* Container for content */}
      <div className="container mx-auto pt-16 md:pt-18 relative">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-30"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeIn}
            className="space-y-6"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
          >
            <Badge className="text-sm" variant="default">
              AI-Powered Founder Platform
            </Badge>
            <motion.h1
              className="text-4xl md:text-6xl font-bold tracking-tight"
              key={headlineIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 2 }}
            >
              {headlineTexts[headlineIndex]}
            </motion.h1>
            <p className="text-xl text-muted-foreground">
              LaunchpadAI helps founders build, learn, and connect—transforming
              ideas into market-ready products in record time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="text-lg px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary group relative overflow-hidden"
                onClick={() => {
                  const pricingSection = document.getElementById("pricing");
                  if (pricingSection) {
                    pricingSection.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
              >
                <span className="relative z-10 flex items-center">
                  Start Building Today
                  <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.span
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  animate={{ x: isHovered ? "100%" : "-100%" }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg group"
                onClick={() => {
                  const howItWorksSection =
                    document.getElementById("how-it-works");
                  if (howItWorksSection) {
                    howItWorksSection.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
              >
                See How It Works
                <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Trusted by 1,000+ founders from YCombinator, Techstars, and 500
              Startups
            </p>
          </motion.div>

          {/* Image carousel */}
          <motion.div
            variants={fadeIn}
            className="relative h-[400px] lg:h-[500px] rounded-lg overflow-hidden"
            style={{
              perspective: 1000,
              rotateX,
              rotateY,
            }}
          >
            {/* 3D layered effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-lg z-10" />

            {/* Carousel images */}
            {startupImages.map((src, index) => (
              <motion.div
                key={index}
                className="absolute inset-0 h-full w-full"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: index === imageIndex ? 1 : 0,
                  transition: { duration: 1 },
                  scale: index === imageIndex ? 1 : 1.2,
                }}
                style={{
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                }}
              >
                <Image
                  src={src}
                  alt={`Startup team ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: "cover" }}
                  className="rounded-lg shadow-2xl"
                  priority={index === 0}
                />
              </motion.div>
            ))}

            {/* Overlay with AI elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 rounded-lg" />
            <div className="absolute bottom-8 left-8 right-8 p-4 bg-background/80 backdrop-blur-sm rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-sm font-mono animate-pulse">
                  LaunchpadAI agent active
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
