"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AnimatedElement from "@/components/ui/animated-element";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitToWaitlist } from "@/app/api/waitlist/actions";
import type {
  WaitlistFormData,
  SubmitResult,
} from "@/app/api/waitlist/actions";

export default function WaitlistForm() {
  const [formData, setFormData] = useState<WaitlistFormData>({
    name: "",
    email: "",
    company: "",
    role: "",
    interest: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "name":
        return value.length < 2 ? "Name must be at least 2 characters" : "";
      case "email":
        return !/^\S+@\S+\.\S+$/.test(value)
          ? "Please enter a valid email address"
          : "";
      case "company":
        if (!value) return ""; // Optional
        return value.length < 1 ? "Company name is required" : "";
      case "role":
        if (!value) return ""; // Optional
        return value.length < 1 ? "Please select your role" : "";
      case "interest":
        if (!value) return ""; // Optional
        return value.length < 1 ? "Please select your primary interest" : "";
      case "phone":
        if (!value) return ""; // Optional
        const phoneRegex =
          /^(\+?1)?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/;
        return !phoneRegex.test(value)
          ? "Please enter a valid US or Canadian phone number"
          : "";
      default:
        return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev: WaitlistFormData) => ({ ...prev, [id]: value }));

    // Clear success message if user starts typing again
    if (submitResult?.success) {
      setSubmitResult(null);
    }

    // Validate on change
    const errorMessage = validateField(id, value);
    setErrors((prev: Record<string, string>) => ({
      ...prev,
      [id]: errorMessage,
    }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev: WaitlistFormData) => ({ ...prev, [id]: value }));

    // Clear success message if user changes selection
    if (submitResult?.success) {
      setSubmitResult(null);
    }

    // Validate on change
    const errorMessage = validateField(id, value);
    setErrors((prev: Record<string, string>) => ({
      ...prev,
      [id]: errorMessage,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate each field
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "phone" && !value) return; // Phone is optional
      const error = validateField(key, value as string);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitToWaitlist(formData);
      setSubmitResult(result);

      if (result.success) {
        // Reset form on success
        setFormData({
          name: "",
          email: "",
          company: "",
          role: "",
          interest: "",
          phone: "",
        });
        if (formRef.current) {
          formRef.current.reset();
        }
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: "An unexpected error occurred. Please try again.",
      });
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="waitlist" className="py-16 md:py-24 gradient-bg hero-pattern">
      <div className="container mx-auto px-6 relative z-10">
        {/* Floating AI Icon */}
        <div className="absolute top-10 left-[15%] md:block hidden">
          <Image
            src="/images/ai-icon.svg"
            alt="AI Icon"
            width={56}
            height={56}
            className="floating-icon"
            style={{ animationDelay: "1.5s" }}
          />
        </div>

        <div className="absolute bottom-20 right-[15%] md:block hidden">
          <Image
            src="/images/ai-icon.svg"
            alt="AI Icon"
            width={40}
            height={40}
            className="floating-icon"
            style={{ animationDelay: "3s" }}
          />
        </div>

        <AnimatedElement className="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-6">
            Join the Waitlist
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Be among the first to access LaunchpadAI when we launch. Early
            adopters will receive priority onboarding and special pricing.
          </p>

          {submitResult && (
            <div
              className={`p-4 mb-6 rounded-md ${
                submitResult.success
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {submitResult.message}
            </div>
          )}

          <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                type="text"
                id="name"
                placeholder="John Smith"
                value={formData.name}
                onChange={handleInputChange}
                className={`mt-1 ${errors.name ? "border-red-500" : ""}`}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Work Email</Label>
              <Input
                type="email"
                id="email"
                placeholder="john@yourcompany.com"
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 ${errors.email ? "border-red-500" : ""}`}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                type="tel"
                id="phone"
                placeholder="(123) 456-7890"
                value={formData.phone}
                onChange={handleInputChange}
                className={`mt-1 ${errors.phone ? "border-red-500" : ""}`}
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                US and Canadian formats only
              </p>
            </div>

            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                type="text"
                id="company"
                placeholder="Your Company, Inc."
                value={formData.company}
                onChange={handleInputChange}
                className={`mt-1 ${errors.company ? "border-red-500" : ""}`}
                disabled={isSubmitting}
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-500">{errors.company}</p>
              )}
            </div>

            <div>
              <Label htmlFor="role">Job Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleSelectChange("role", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  className={`mt-1 ${errors.role ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="c-suite">C-Suite Executive</SelectItem>
                  <SelectItem value="director">Director/VP</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="developer">Developer/Engineer</SelectItem>
                  <SelectItem value="data-scientist">Data Scientist</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-500">{errors.role}</p>
              )}
            </div>

            <div>
              <Label htmlFor="interest">Primary Interest</Label>
              <Select
                value={formData.interest}
                onValueChange={(value) => handleSelectChange("interest", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  className={`mt-1 ${errors.interest ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select your primary interest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document-processing">
                    Document Processing AI
                  </SelectItem>
                  <SelectItem value="customer-service">
                    Customer Service Automation
                  </SelectItem>
                  <SelectItem value="predictive-analytics">
                    Predictive Analytics
                  </SelectItem>
                  <SelectItem value="knowledge-management">
                    Knowledge Management
                  </SelectItem>
                  <SelectItem value="custom-solution">
                    Custom AI Solution
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.interest && (
                <p className="mt-1 text-sm text-red-500">{errors.interest}</p>
              )}
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Join the Waitlist"}
              </Button>
            </div>
          </form>
        </AnimatedElement>
      </div>
    </section>
  );
}
