import { About } from "@/components/About";
import { ArticleList } from "@/components/ArticleList";
import { Contact } from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { WorkGrid } from "@/components/WorkGrid";

export default function Home() {
  return (
    <main>
      <Hero />
      <WorkGrid />
      <ArticleList />
      <About />
      <Contact />
    </main>
  );
}
