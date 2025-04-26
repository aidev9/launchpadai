"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { clientAuth } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  Wrench,
  MessageSquareText,
  PackageOpen,
  Search,
  Edit,
  Bot,
  FileText,
  Image,
  Video,
  CalendarClock,
  CreditCard,
  BarChart3,
  Mail,
  Database,
  Repeat,
  PlusCircle,
  LayoutTemplate,
  FileStack,
  CheckCircle2,
  Circle,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useXp } from "@/xp/useXp";
import { Main } from "@/components/layout/main";

export default function FTUXPage() {
  const [user, setUser] = useState<{
    displayName?: string | null;
    photoURL?: string | null;
  } | null>(null);
  const router = useRouter();
  const { xp, error: _xpError } = useXp();
  const [tasks, setTasks] = useState<
    Array<{ id: string; text: string; completed: boolean }>
  >([
    { id: "signup", text: "Sign Up", completed: true },
    { id: "watchvideo", text: "Watch video", completed: false },
    { id: "brainstorm", text: "Brainstorm ideas", completed: false },
    { id: "createproduct", text: "Create a product", completed: false },
    { id: "settings", text: "Customize settings", completed: false },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, (user) => {
      if (user) {
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load tasks from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTasks = localStorage.getItem("ftux_tasks");
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks);
          // Make sure signup is always completed
          const updatedTasks = parsedTasks.map(
            (task: { id: string; text: string; completed: boolean }) =>
              task.id === "signup" ? { ...task, completed: true } : task
          );
          setTasks(updatedTasks);
        } catch (e) {
          console.error("Error parsing tasks from localStorage:", e);
        }
      }
    }
  }, []);

  // Save tasks to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ftux_tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Extract first name
  const firstName = user?.displayName?.split(" ")[0] || "there";

  // Define card data with explicit color mapping
  const cards = [
    {
      id: "explore",
      title: "Brainstorm Ideas",
      icon: <Lightbulb className="size-6" />,
      color: "bg-blue-100 dark:bg-blue-900",
      hoverColor: "group-hover:bg-blue-200 dark:group-hover:bg-blue-800",
      borderColor: "border-blue-200 dark:border-blue-800",
      textColor: "text-blue-700 dark:text-blue-300",
      mainCardColor: "bg-sidebar border-blue-500 dark:border-blue-400",
      subCardBgColor: "bg-blue-50/50 dark:bg-blue-900/20",
      subCardHoverColor: "hover:bg-blue-50 dark:hover:bg-blue-900/30",
      subCardBorderColor: "border-blue-200 dark:border-blue-800",
      viewAllBorderColor: "border-blue-300 dark:border-blue-700",
      viewAllBgColor: "bg-blue-50/30 dark:bg-blue-900/10",
      subcards: [
        {
          id: "product-ideas",
          title: "Product Ideas",
          icon: <PackageOpen size={16} />,
          link: "/ideas/products",
        },
        {
          id: "name-ideas",
          title: "Name Ideas",
          icon: <Edit size={16} />,
          link: "/tools/naming-assistant",
        },
        {
          id: "competitive-research",
          title: "Competitive Research",
          icon: <Search size={16} />,
          link: "/research/competition",
        },
      ],
    },
    {
      id: "tools",
      title: "Use Tools",
      icon: <Wrench className="size-6" />,
      color: "bg-purple-100 dark:bg-purple-900",
      hoverColor: "group-hover:bg-purple-200 dark:group-hover:bg-purple-800",
      borderColor: "border-purple-200 dark:border-purple-800",
      textColor: "text-purple-700 dark:text-purple-300",
      mainCardColor: "bg-sidebar border-purple-500 dark:border-purple-400",
      subCardBgColor: "bg-purple-50/50 dark:bg-purple-900/20",
      subCardHoverColor: "hover:bg-purple-50 dark:hover:bg-purple-900/30",
      subCardBorderColor: "border-purple-200 dark:border-purple-800",
      viewAllBorderColor: "border-purple-300 dark:border-purple-700",
      viewAllBgColor: "bg-purple-50/30 dark:bg-purple-900/10",
      subcards: [
        {
          id: "ai-assistant",
          title: "AI Assistant",
          icon: <Bot size={16} />,
          link: "/tools/assistant",
        },
        {
          id: "content-generator",
          title: "Content Generator",
          icon: <FileText size={16} />,
          link: "/tools/content",
        },
        {
          id: "image-creator",
          title: "Image Creator",
          icon: <Image size={16} aria-label="Image icon" />,
          link: "/tools/images",
        },
        {
          id: "video-editor",
          title: "Video Editor",
          icon: <Video size={16} />,
          link: "/tools/video",
        },
        {
          id: "calendar",
          title: "Calendar",
          icon: <CalendarClock size={16} />,
          link: "/tools/calendar",
        },
        {
          id: "payment-processor",
          title: "Payment Processor",
          icon: <CreditCard size={16} />,
          link: "/tools/payments",
        },
        {
          id: "analytics",
          title: "Analytics",
          icon: <BarChart3 size={16} />,
          link: "/tools/analytics",
        },
        {
          id: "email-marketing",
          title: "Email Marketing",
          icon: <Mail size={16} />,
          link: "/tools/email",
        },
        {
          id: "database",
          title: "Database",
          icon: <Database size={16} />,
          link: "/tools/database",
        },
        {
          id: "automation",
          title: "Automation",
          icon: <Repeat size={16} />,
          link: "/tools/automation",
        },
      ],
    },
    {
      id: "prompts",
      title: "Explore Prompts",
      icon: <MessageSquareText className="size-6" />,
      color: "bg-green-100 dark:bg-green-900",
      hoverColor: "group-hover:bg-green-200 dark:group-hover:bg-green-800",
      borderColor: "border-green-200 dark:border-green-800",
      textColor: "text-green-700 dark:text-green-300",
      mainCardColor: "bg-sidebar border-green-500 dark:border-green-400",
      subCardBgColor: "bg-green-50/50 dark:bg-green-900/20",
      subCardHoverColor: "hover:bg-green-50 dark:hover:bg-green-900/30",
      subCardBorderColor: "border-green-200 dark:border-green-800",
      viewAllBorderColor: "border-green-300 dark:border-green-700",
      viewAllBgColor: "bg-green-50/30 dark:bg-green-900/10",
      subcards: Array.from({ length: 20 }, (_, i) => ({
        id: `prompt-${i + 1}`,
        title: `Prompt ${i + 1}`,
        icon: <MessageSquareText size={16} />,
        link: `/prompts/template/${i + 1}`,
      })),
      showViewAll: true,
      viewAllLink: "/prompts/all",
    },
    {
      id: "product",
      title: "Create a Product",
      icon: <PackageOpen className="size-6" />,
      color: "bg-amber-100 dark:bg-amber-900",
      hoverColor: "group-hover:bg-amber-200 dark:group-hover:bg-amber-800",
      borderColor: "border-amber-200 dark:border-amber-800",
      textColor: "text-amber-700 dark:text-amber-300",
      mainCardColor: "bg-sidebar border-amber-500 dark:border-amber-400",
      subCardBgColor: "bg-amber-50/50 dark:bg-amber-900/20",
      subCardHoverColor: "hover:bg-amber-50 dark:hover:bg-amber-900/30",
      subCardBorderColor: "border-amber-200 dark:border-amber-800",
      viewAllBorderColor: "border-amber-300 dark:border-amber-700",
      viewAllBgColor: "bg-amber-50/30 dark:bg-amber-900/10",
      subcards: [
        {
          id: "from-template",
          title: "From Template",
          icon: <LayoutTemplate size={16} />,
          link: "/welcome",
        },
        {
          id: "start-blank",
          title: "Start Blank",
          icon: <FileStack size={16} />,
          link: "/welcome/wizard?template=blank&type=blank",
        },
      ],
    },
  ];

  return (
    <Main>
      <div className="grid md:grid-cols-2 gap-8 relative">
        {/* Left side - Greeting */}
        <div className="flex flex-col justify-top mt-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarImage
                src={user?.photoURL || ""}
                alt={user?.displayName || "User profile"}
              />
              <AvatarFallback>{firstName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">👋 Welcome, {firstName}!</h1>
              <p className="text-muted-foreground">
                We're excited to have you here.
              </p>
            </div>
          </div>
          <p className="text-lg mb-2 max-w-[85%]">
            Watch this quick intro video to get started with LaunchpadAI.
          </p>

          {/* Your First Tasks */}
          <div className="mt-0 mb-8">
            <h2 className="text-xl font-semibold mb-3">Your First Tasks</h2>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => toggleTask(task.id)}
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-300 flex-shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-base",
                      task.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Video placeholder */}
        <div className="relative rounded-xl overflow-hidden shadow-lg aspect-video bg-black">
          {/* Placeholder for video */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16 rounded-full bg-black/50 text-white backdrop-blur-sm border-white hover:bg-white hover:text-black"
            >
              <Play className="h-6 w-6" />
            </Button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
            <h3 className="font-semibold">Getting Started with LaunchpadAI</h3>
            <p className="text-sm text-gray-300">
              Learn how to use our platform to build your startup
            </p>
          </div>
        </div>
      </div>
      {/* Gamification Block */}
      <Card className="mb-8 border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20 shadow-md w-full">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-100 dark:bg-amber-800 rounded-full p-2">
              <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-300" />
            </div>
            <CardTitle className="text-lg">
              Earn 50 XP and Unlock Premium Features
            </CardTitle>
          </div>
          <CardDescription className="text-base mb-4">
            Create your first startup or product now and earn 50 XP. You
            currently have {xp} XP.
          </CardDescription>
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() =>
              router.push("/welcome/wizard?template=blank&type=blank")
            }
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Create Your First Product
          </Button>
        </CardContent>
      </Card>

      <h1 className="text-2xl font-bold">🚀 Select your journey:</h1>

      {/* Feature Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 mt-8">
        {cards.map((card) => (
          <div
            key={card.id}
            className="flex flex-col group relative z-0 hover:z-20"
          >
            <motion.div
              whileHover={{
                scale: 1.2,
                zIndex: 30,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                mass: 0.8,
              }}
            >
              <Card
                className={cn(
                  "cursor-pointer border-2 border-transparent will-change-transform",
                  "group-hover:shadow-xl",
                  card.mainCardColor
                )}
              >
                <CardContent className="p-6">
                  <div
                    className={cn(
                      "rounded-full w-12 h-12 flex items-center justify-center mb-4 transition-colors",
                      card.color,
                      card.hoverColor
                    )}
                  >
                    <div className={card.textColor}>{card.icon}</div>
                  </div>
                  <CardTitle className="mb-2">{card.title}</CardTitle>
                  <CardDescription>
                    Hover to see available options
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            {/* Subcards */}
            <div className="h-0 overflow-hidden group-hover:h-auto opacity-0 group-hover:opacity-100 transition-all duration-300 mt-8">
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
              >
                {card.subcards
                  .slice(0, card.id === "prompts" ? 8 : undefined)
                  .map((subcard, index) => (
                    <motion.div
                      key={subcard.id}
                      initial={{ opacity: 0, y: -5 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false }}
                      transition={{
                        duration: 0.4,
                        delay: 0.1 * index,
                        ease: "easeOut",
                      }}
                    >
                      <Card
                        className={cn(
                          "cursor-pointer transition-colors border",
                          card.subCardHoverColor,
                          card.subCardBorderColor,
                          card.subCardBgColor
                        )}
                        onClick={() => router.push(subcard.link)}
                      >
                        <CardContent className="p-3 flex items-center gap-2">
                          <div className={cn("rounded-full p-1.5", card.color)}>
                            {subcard.icon}
                          </div>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              card.textColor
                            )}
                          >
                            {subcard.title}
                          </span>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}

                {card.showViewAll && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
                    transition={{
                      duration: 0.2,
                      delay:
                        0.05 *
                        (card.subcards.length > 8 ? 8 : card.subcards.length),
                      ease: "easeOut",
                    }}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer transition-colors border-dashed",
                        card.subCardHoverColor,
                        card.viewAllBorderColor,
                        card.viewAllBgColor
                      )}
                      onClick={() =>
                        router.push(card.viewAllLink || "/prompts/all")
                      }
                    >
                      <CardContent className="p-3 flex items-center justify-center">
                        <PlusCircle
                          size={16}
                          className={cn("mr-2", card.textColor)}
                        />
                        <span
                          className={cn("text-sm font-medium", card.textColor)}
                        >
                          View All
                        </span>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        ))}
      </div>
      {/* Add empty space */}
      <div className="h-96" />
    </Main>
  );
}

// Play icon component
function Play(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
