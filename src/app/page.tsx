import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { Showcase } from "@/components/Showcase";
import { getArticles } from "@/lib/articles";
import { getProjectsInDisplayOrder } from "@/lib/projects";

export default function Home() {
  const articles = getArticles();
  const projects = getProjectsInDisplayOrder();

  return (
    <main>
      <Hero />
      <Showcase articles={articles} projects={projects} />
      <About />
      <Contact />
    </main>
  );
}
