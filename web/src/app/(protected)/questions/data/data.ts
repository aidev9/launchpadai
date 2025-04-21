import { CircleCheck, Clock, HelpCircle } from "lucide-react";

// Status types mapped to their corresponding colors for badges
export const statusTypes = new Map([
  ["answered", "bg-green-500/10 text-green-500 border-green-500/20"],
  ["pending", "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"],
  ["unanswered", "bg-red-500/10 text-red-500 border-red-500/20"],
]);

// Status options for filtering
export const statusOptions = [
  {
    value: "answered",
    label: "Answered",
    icon: CircleCheck,
  },
  {
    value: "pending",
    label: "Pending",
    icon: Clock,
  },
  {
    value: "unanswered",
    label: "Unanswered",
    icon: HelpCircle,
  },
];

// Generate tag options from all available tags
export const tagOptions = [
  {
    value: "discover",
    label: "Discover",
    description:
      "Find problems worth solving using AI tools, online data, and trends.",
  },
  {
    value: "validate",
    label: "Validate",
    description:
      "Validate your ideas and assumptions using AI tools, online data, and trends.",
  },
  {
    value: "design",
    label: "Design",
    description: "Design your product using AI tools, online data, and trends.",
  },
  {
    value: "build",
    label: "Build",
    description:
      "Create your MVP using no-code tools, AI agents, or automation.",
  },
  {
    value: "secure",
    label: "Secure",
    description:
      "Protect your startup with legal, data, infrastructure, and operational safeguards.",
  },
  {
    value: "launch",
    label: "Launch",
    description: "Release to early users, gather feedback, and refine.",
  },
  {
    value: "grow",
    label: "Grow",
    description: "Scale what’s working, automate, or prepare to raise funding.",
  },
];
