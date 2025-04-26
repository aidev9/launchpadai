import { ReactNode } from "react";
import { CoursesProvider } from "./components/courses-provider";

interface CoursesLayoutProps {
  children: ReactNode;
}

export default function CoursesLayout({ children }: CoursesLayoutProps) {
  return (
    <section className="container pb-8 px-0 max-w-7xl">
      <CoursesProvider>{children}</CoursesProvider>
    </section>
  );
}
