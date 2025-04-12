"use client";

import Image from "next/image";
import AnimatedElement from "@/components/ui/animated-element";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "CTO, TechGrowth Inc.",
    content:
      "LaunchpadAI has transformed how we develop AI solutions. Their platform allowed us to go from concept to deployment in just 3 weeks, cutting our development time by 70%.",
    image:
      "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    name: "Michael Chen",
    role: "VP of Innovation, Enterprise Solutions",
    content:
      "What impressed us most was how seamlessly LaunchpadAI integrated with our existing systems. The security features also gave our compliance team peace of mind.",
    image:
      "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    name: "Emily Rodriguez",
    role: "Director of AI Strategy, FinanceForward",
    content:
      "The LaunchpadAI team truly understands enterprise needs. Their platform helped us navigate the complexities of AI implementation while maintaining governance and security.",
    image:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    name: "David Wilson",
    role: "Head of Digital Transformation, Healthcare Innovations",
    content:
      "In the healthcare sector, compliance is everything. LaunchpadAI's built-in HIPAA compliance features saved us months of regulatory work and allowed us to focus on patient outcomes.",
    image:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    name: "Jessica Taylor",
    role: "COO, Retail Analytics Group",
    content:
      "We've tried multiple AI platforms before LaunchpadAI, but none offered the same level of customization while maintaining ease of use. Our marketing team now deploys AI-driven campaigns without IT support.",
    image:
      "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    name: "Robert Kim",
    role: "CIO, Global Manufacturing Corp",
    content:
      "The predictive maintenance models we built with LaunchpadAI reduced our factory downtime by 35%. The platform's ability to handle real-time industrial IoT data exceeded our expectations.",
    image:
      "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <AnimatedElement>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            What Our Customers Say
          </h2>
        </AnimatedElement>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <AnimatedElement key={testimonial.name} delay={index * 200}>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="relative w-12 h-12 mr-4 rounded-full overflow-hidden">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700">{testimonial.content}</p>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
}
