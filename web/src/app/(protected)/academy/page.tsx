import HeroSection from "./components/HeroSection";
import CourseCards from "./components/CourseCards";
import SeedCoursesButton from "./components/SeedCoursesButton";

const badge = "✨ Start Learning Today";
const heading = "Sharpen Your Skills With Professional AI Courses";
const description =
  "Join our academy to access a wide range of courses designed to enhance your skills and knowledge. Whether you're a beginner or an experienced professional, we have something for everyone.";
const buttons = {
  primary: {
    text: "Discover all courses",
    url: "/academy/courses",
  },
  secondary: {
    text: "Continue Learning",
    url: "/academy/courses",
  },
};
const image = {
  src: "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  alt: "Learning",
};

export default function AcademyPage() {
  return (
    <div className="space-y-8">
      <HeroSection
        heading={heading}
        badge={badge}
        buttons={buttons}
        description={description}
        image={image}
      />
      <CourseCards />

      <div className="container py-8">
        <div className="border-t pt-8">
          <h3 className="mb-4 text-lg font-medium">Admin Controls</h3>
          <SeedCoursesButton />
        </div>
      </div>
    </div>
  );
}
