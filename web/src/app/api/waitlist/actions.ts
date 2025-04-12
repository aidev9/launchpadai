"use server";

import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { Resend } from "resend";
import { createConfirmationEmail } from "@/lib/emails/confirmation";

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schema for phone numbers
const phoneRegex = /^(\+?1)?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/;

// Define input schema with Zod
const waitlistSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  company: z
    .string()
    // .min(1, { message: "Company name is required" })
    .optional(),
  role: z
    .string()
    // .min(1, { message: "Please select your role" })
    .optional(),
  interest: z
    .string()
    // .min(1, { message: "Please select your primary interest" })
    .optional(),
  phone: z
    .string()
    .regex(phoneRegex, {
      message: "Please enter a valid US or Canadian phone number",
    })
    .optional()
    .or(z.literal("")),
});

export type WaitlistFormData = z.infer<typeof waitlistSchema>;

export type SubmitResult = {
  success: boolean;
  message: string;
};

export async function submitToWaitlist(
  formData: WaitlistFormData
): Promise<SubmitResult> {
  try {
    // Validate form data
    const validatedData = waitlistSchema.parse(formData);

    // Format phone number if present
    let formattedPhone = "";
    if (validatedData.phone) {
      const match = validatedData.phone.match(phoneRegex);
      if (match) {
        // Format as (XXX) XXX-XXXX
        formattedPhone = `(${match[2]}) ${match[3]}-${match[4]}`;
      }
    }

    // Add to Firestore using Admin SDK
    const waitlistCollection = adminDb.collection("waitlist");
    await waitlistCollection.add({
      ...validatedData,
      phone: formattedPhone || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Send confirmation email
    try {
      const { subject, html, text } = createConfirmationEmail({
        customer: validatedData,
      });

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "waitlist@launchpadai.com",
        to: validatedData.email,
        subject: subject,
        html: html,
        text: text,
      });

      console.log(`Confirmation email sent to ${validatedData.email}`);
    } catch (emailError) {
      // Log email error but don't fail the submission
      console.error("Error sending confirmation email:", emailError);
    }

    return {
      success: true,
      message: "Thank you for joining our waitlist! We'll be in touch soon.",
    };
  } catch (error) {
    console.error("Error submitting to waitlist:", error);

    // Handle zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path}: ${err.message}`)
        .join(", ");
      return {
        success: false,
        message: `Validation error: ${errorMessages}`,
      };
    }

    return {
      success: false,
      message:
        "An error occurred while submitting your information. Please try again.",
    };
  }
}
