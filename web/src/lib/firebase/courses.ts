"use server";

import { adminDb } from "./admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Interface for Course data
export interface Course {
  id: string;
  title: string;
  summary: string;
  description?: string;
  level: "beginner" | "intermediate" | "advanced";
  imageUrl: string;
  url: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Schema for course validation
const courseInputSchema = z.object({
  title: z.string().min(3).max(100),
  summary: z.string().min(10).max(200),
  description: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  imageUrl: z.string().url(),
  url: z.string(),
  tags: z.array(z.string()),
});

type CourseInput = z.infer<typeof courseInputSchema>;

/**
 * Get all courses from the courses collection
 */
export async function getAllCourses() {
  try {
    const coursesRef = adminDb.collection("courses");
    const snapshot = await coursesRef.orderBy("createdAt", "desc").get();

    if (snapshot.empty) {
      return {
        success: true,
        courses: [],
      };
    }

    const courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];

    return {
      success: true,
      courses,
    };
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get a course by ID
 */
export async function getCourse(id: string) {
  try {
    const courseRef = adminDb.collection("courses").doc(id);
    const doc = await courseRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    return {
      success: true,
      course: {
        id: doc.id,
        ...doc.data(),
      } as Course,
    };
  } catch (error) {
    console.error(`Failed to fetch course ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Create a new course
 */
export async function createCourse(data: CourseInput) {
  try {
    // Validate input data
    const validatedData = courseInputSchema.parse(data);

    // Create a reference to the courses collection
    const coursesRef = adminDb.collection("courses");

    // Generate a unique ID for the course
    const courseId = uuidv4();

    // Add timestamps
    const now = new Date().toISOString();

    const courseData = {
      ...validatedData,
      id: courseId,
      createdAt: now,
      updatedAt: now,
    };

    // Add to Firestore
    await coursesRef.doc(courseId).set(courseData);

    // Revalidate the academy page
    revalidatePath("/academy");

    return {
      success: true,
      id: courseId,
      data: courseData,
    };
  } catch (error) {
    console.error("Failed to create course:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Update a course
 */
export async function updateCourse(id: string, data: Partial<CourseInput>) {
  try {
    const courseRef = adminDb.collection("courses").doc(id);
    const doc = await courseRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    // Update timestamp
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
    };

    await courseRef.update(updateData);

    // Revalidate the academy page
    revalidatePath("/academy");

    return {
      success: true,
      id,
    };
  } catch (error) {
    console.error(`Failed to update course ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a course
 */
export async function deleteCourse(id: string) {
  try {
    const courseRef = adminDb.collection("courses").doc(id);
    const doc = await courseRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    await courseRef.delete();

    // Revalidate the academy page
    revalidatePath("/academy");

    return {
      success: true,
      id,
    };
  } catch (error) {
    console.error(`Failed to delete course ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Add sample courses to the database
 */
export async function addSampleCourses() {
  try {
    const coursesRef = adminDb.collection("courses");

    // Check if courses already exist
    const existingCourses = await coursesRef.limit(1).get();
    if (!existingCourses.empty) {
      return {
        success: false,
        error: "Courses already exist in the database",
      };
    }

    // Create a batch to add all courses at once
    const batch = adminDb.batch();
    const now = new Date().toISOString();

    // Create sample courses data
    const sampleCourses = [
      {
        title: "Introduction to Artificial Intelligence",
        summary:
          "Learn the fundamentals of AI and how it's changing the world of technology.",
        description:
          "This course introduces you to the basics of artificial intelligence, machine learning, and neural networks. You'll learn key concepts and applications of AI in various industries.",
        level: "beginner",
        imageUrl:
          "https://images.unsplash.com/photo-1677442135132-6ca59297b63b?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/intro-to-ai",
        tags: ["AI", "Machine Learning", "Technology"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Machine Learning Fundamentals",
        summary:
          "Master the core concepts and algorithms that power machine learning applications.",
        description:
          "Dive into the world of machine learning algorithms, data preprocessing, and model evaluation. This course is perfect for those looking to build practical ML models.",
        level: "intermediate",
        imageUrl:
          "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/ml-fundamentals",
        tags: ["Machine Learning", "Algorithms", "Data Science"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Deep Learning with Neural Networks",
        summary:
          "Build advanced neural network architectures to solve complex problems in computer vision and NLP.",
        description:
          "This advanced course covers deep learning architectures, optimization techniques, and implementations using modern frameworks. You'll work on real-world projects in computer vision and natural language processing.",
        level: "advanced",
        imageUrl:
          "https://images.unsplash.com/photo-1589254065878-42c9da997008?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/deep-learning",
        tags: ["Deep Learning", "Neural Networks", "AI"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Data Science for Beginners",
        summary:
          "Start your journey into the world of data science with practical examples and hands-on projects.",
        description:
          "Learn how to collect, clean, analyze, and visualize data. This course provides a solid foundation in statistics, Python programming, and data visualization techniques.",
        level: "beginner",
        imageUrl:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/data-science-beginners",
        tags: ["Data Science", "Python", "Statistics"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Natural Language Processing",
        summary:
          "Discover how to process, analyze, and understand human language using AI techniques.",
        description:
          "This course explores techniques for working with text data, building language models, sentiment analysis, and creating chatbots and other NLP applications.",
        level: "intermediate",
        imageUrl:
          "https://images.unsplash.com/photo-1546652013-eb09219f7b56?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/nlp",
        tags: ["NLP", "Language Processing", "Text Mining"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Computer Vision Applications",
        summary:
          "Learn to build applications that can understand and interpret visual information from images and videos.",
        description:
          "Dive into image recognition, object detection, face recognition, and other computer vision tasks using deep learning models and popular libraries.",
        level: "advanced",
        imageUrl:
          "https://images.unsplash.com/photo-1617791160505-6f00504e3519?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/computer-vision",
        tags: ["Computer Vision", "Image Processing", "AI"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Reinforcement Learning",
        summary:
          "Master the techniques that allow AI systems to learn through trial and error in complex environments.",
        description:
          "This advanced course covers the theory and practice of reinforcement learning, from basic algorithms to deep reinforcement learning approaches used in gaming and robotics.",
        level: "advanced",
        imageUrl:
          "https://images.unsplash.com/photo-1596567068320-12aa0eb4af9?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/reinforcement-learning",
        tags: ["Reinforcement Learning", "AI", "Game Theory"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Python for Data Analysis",
        summary:
          "Learn how to use Python and its powerful libraries for data manipulation, visualization, and analysis.",
        description:
          "This course covers essential Python libraries like Pandas, NumPy, and Matplotlib for data analysis and visualization. You'll work with real-world datasets to solve practical problems.",
        level: "beginner",
        imageUrl:
          "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/python-data-analysis",
        tags: ["Python", "Data Analysis", "Programming"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Generative AI and Creative Applications",
        summary:
          "Explore the cutting-edge world of generative AI for creating images, text, music, and more.",
        description:
          "This course introduces you to generative models like GANs, VAEs, and transformers, with applications in creative domains like art generation, music composition, and creative writing.",
        level: "intermediate",
        imageUrl:
          "https://images.unsplash.com/photo-1675271591211-728362961835?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/generative-ai",
        tags: ["Generative AI", "Creative AI", "GANs"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "AI Ethics and Responsible Innovation",
        summary:
          "Understand the ethical implications of AI and how to build systems that are fair, transparent, and accountable.",
        description:
          "This course explores the ethical, social, and policy implications of artificial intelligence. You'll learn about bias in AI, privacy concerns, transparency, and governance frameworks.",
        level: "intermediate",
        imageUrl:
          "https://images.unsplash.com/photo-1633613286991-611fe299c4be?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/ai-ethics",
        tags: ["AI Ethics", "Responsible AI", "Policy"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Big Data Processing with Spark",
        summary:
          "Learn how to process and analyze massive datasets using distributed computing frameworks.",
        description:
          "This course covers Apache Spark for large-scale data processing, including batch and stream processing, machine learning with MLlib, and integration with other big data tools.",
        level: "intermediate",
        imageUrl:
          "https://images.unsplash.com/photo-1502810190503-8303352d8291?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/big-data-spark",
        tags: ["Big Data", "Spark", "Data Processing"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Time Series Analysis and Forecasting",
        summary:
          "Master techniques for analyzing time-dependent data and making accurate predictions.",
        description:
          "This course explores statistical and machine learning approaches for time series analysis, including ARIMA models, exponential smoothing, and deep learning approaches for forecasting.",
        level: "advanced",
        imageUrl:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/time-series",
        tags: ["Time Series", "Forecasting", "Data Science"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Introduction to Blockchain Technology",
        summary:
          "Learn the fundamentals of blockchain and its applications beyond cryptocurrencies.",
        description:
          "This course covers the core concepts of blockchain technology, including distributed ledgers, consensus mechanisms, smart contracts, and applications in various industries.",
        level: "beginner",
        imageUrl:
          "https://images.unsplash.com/photo-1644143379190-8b1347c5fc27?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/blockchain-intro",
        tags: ["Blockchain", "Cryptocurrency", "Web3"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Cloud Computing for AI Applications",
        summary:
          "Learn how to deploy and scale AI models in cloud environments for production use.",
        description:
          "This course teaches you how to leverage cloud platforms for AI model development, deployment, and scaling. You'll learn about containerization, serverless computing, and MLOps practices.",
        level: "intermediate",
        imageUrl:
          "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/cloud-ai",
        tags: ["Cloud Computing", "AI Deployment", "MLOps"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Recommendation Systems",
        summary:
          "Build personalized recommendation engines like those used by Netflix, Amazon, and Spotify.",
        description:
          "This course explores collaborative filtering, content-based filtering, and hybrid approaches for building recommendation systems, with practical implementations using popular frameworks.",
        level: "intermediate",
        imageUrl:
          "https://images.unsplash.com/photo-1493723843671-1d655e66ac1c?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/recommendation-systems",
        tags: ["Recommendations", "Personalization", "Machine Learning"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Edge AI and IoT",
        summary:
          "Discover how to deploy AI on resource-constrained devices at the network edge.",
        description:
          "This course covers the techniques for optimizing and deploying machine learning models on edge devices, including mobile phones, IoT sensors, and embedded systems.",
        level: "advanced",
        imageUrl:
          "https://images.unsplash.com/photo-1558346490-d2631a34e43c?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/edge-ai-iot",
        tags: ["Edge AI", "IoT", "Embedded Systems"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Conversational AI Assistants",
        summary:
          "Build intelligent chatbots and voice assistants that can understand and respond to natural language.",
        description:
          "This course teaches you how to design, build, and deploy conversational AI systems using modern NLP techniques, dialog management, and integration with messaging platforms.",
        level: "intermediate",
        imageUrl:
          "https://images.unsplash.com/photo-1581092921461-7312848b94fe?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/conversational-ai",
        tags: ["Chatbots", "Voice Assistants", "NLP"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Data Visualization Mastery",
        summary:
          "Learn to create compelling visual stories with data using modern visualization techniques and tools.",
        description:
          "This course covers principles of effective data visualization, visualization design, and how to use tools like D3.js, Tableau, and Python libraries to create interactive and informative visualizations.",
        level: "beginner",
        imageUrl:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/data-visualization",
        tags: ["Data Visualization", "Dashboards", "Design"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Quantum Computing Fundamentals",
        summary:
          "Explore the principles of quantum computing and its potential impact on AI and cryptography.",
        description:
          "This introductory course covers quantum mechanics principles relevant to computing, quantum algorithms, quantum machine learning, and the implications for existing technologies.",
        level: "advanced",
        imageUrl:
          "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/quantum-computing",
        tags: ["Quantum Computing", "Quantum ML", "Future Tech"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Cybersecurity in the Age of AI",
        summary:
          "Learn how AI is transforming cybersecurity and how to protect systems against AI-powered threats.",
        description:
          "This course explores the intersection of AI and cybersecurity, including threat detection, anomaly detection, and defensive and offensive applications of AI in security contexts.",
        level: "intermediate",
        imageUrl:
          "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=500&auto=format&fit=crop",
        url: "/academy/courses/ai-cybersecurity",
        tags: ["Cybersecurity", "AI", "Security"],
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Add each sample course to the batch
    for (const courseData of sampleCourses) {
      const courseId = uuidv4();
      const courseRef = coursesRef.doc(courseId);

      batch.set(courseRef, {
        ...courseData,
        id: courseId,
      });
    }

    // Commit the batch
    await batch.commit();

    // Revalidate the academy page
    revalidatePath("/academy");

    return {
      success: true,
      message: `Added ${sampleCourses.length} sample courses to the database`,
    };
  } catch (error) {
    console.error("Failed to add sample courses:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get all unique tags from all courses in the database
 * This function is case-insensitive and returns normalized tags
 */
export async function getAllUniqueTags() {
  try {
    const coursesRef = adminDb.collection("courses");
    const snapshot = await coursesRef.get();

    if (snapshot.empty) {
      return {
        success: true,
        tags: [],
      };
    }

    // Collect all tags and normalize them (lowercase for case-insensitive comparison)
    const tagMap = new Map<string, string>(); // Maps lowercase tag to original case tag
    snapshot.docs.forEach((doc) => {
      const course = doc.data() as Course;
      if (course.tags && Array.isArray(course.tags)) {
        course.tags.forEach((tag) => {
          // Store with lowercase as key for uniqueness, but preserve original case for display
          tagMap.set(tag.toLowerCase(), tag);
        });
      }
    });

    // Get array of original-case tags, sorted alphabetically
    const uniqueTags = Array.from(tagMap.values()).sort();

    return {
      success: true,
      tags: uniqueTags,
    };
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
