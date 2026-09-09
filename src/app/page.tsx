import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { Showcase } from "@/components/Showcase";

export default function Home() {
  return (
    <main>
      <Hero />
      <Showcase />
      <About />
      <Contact />
    </main>
  );
}
