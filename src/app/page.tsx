import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { Showcase } from "@/components/Showcase";
import { getArticles } from "@/lib/articles";

export default function Home() {
  const articles = getArticles();

  return (
    <main>
      <Hero />
      <Showcase articles={articles} />
      <About />
      <Contact />
    </main>
  );
}
