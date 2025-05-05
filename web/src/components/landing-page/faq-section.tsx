"use client";

import { FAQItem } from "./faq-item";

const faqData = [
  {
    question: "What is your return policy?",
    answer:
      "You can return unused items in their original packaging within 30 days for a refund or exchange. Contact support for assistance.",
    isDefaultOpen: true,
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, PayPal, Apple Pay, and Google Pay. All transactions are secure and encrypted.",
  },
  {
    question: "What if I receive a damaged item?",
    answer:
      "Please contact our customer service team immediately with photos of the damaged item, and we'll arrange a replacement or refund.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "Our customer support team is available 24/7 via live chat on our website, email at support@launchpadai.com, or by phone at 1-800-555-0123.",
  },
  {
    question: "How do I track my order?",
    answer:
      "Once your order ships, you'll receive a confirmation email with tracking information. You can also view your order status in your account dashboard.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Yes, we ship to over 50 countries worldwide. International shipping times vary by location, typically taking 7-14 business days.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-16">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Quick answers to common questions about our products and services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqData.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isDefaultOpen={faq.isDefaultOpen}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
