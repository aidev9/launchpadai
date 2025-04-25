"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProduct } from "@/lib/firebase/products";
import { getProductQuestionsNew } from "@/lib/firebase/questions";
import { TimelineQuestion } from "../components/timeline-question";

export default function ProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timelineQuestion, setTimelineQuestion] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Load product data
        const productData = await getProduct(productId);
        if (productData.success) {
          setProduct(productData.product as Product | null);
        }

        // Load questions to find timeline question
        const questionsData = await getProductQuestionsNew(productId);
        if (questionsData.success && questionsData.questions) {
          // Find the timeline question
          const timeline = (questionsData.questions as Question[]).find(
            (q: Question) => q.question?.toLowerCase().includes("timeline")
          );

          if (timeline) {
            setTimelineQuestion(timeline as Question | null);
          }
        }
      } catch (error) {
        console.error("Error loading product data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (productId) {
      loadData();
    }
  }, [productId]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">Loading product details...</div>
    );
  }

  if (!product) {
    return <div className="container mx-auto p-6">Product not found</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
      <div className="mb-8">
        <p className="text-muted-foreground">{product.description}</p>
      </div>

      {/* Timeline Question Section */}
      {timelineQuestion && (
        <div className="mt-8 mb-8">
          <TimelineQuestion
            productId={productId}
            questionId={timelineQuestion.id}
            question={timelineQuestion.question}
            answer={timelineQuestion.answer}
          />
        </div>
      )}

      {/* Product details will be rendered here */}
    </div>
  );
}
