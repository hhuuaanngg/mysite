import { About } from "@/components/About";
import { Capabilities } from "@/components/Capabilities";
import { Contact } from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { WorkGrid } from "@/components/WorkGrid";

export default function Home() {
  return (
    <main>
      <Hero />
      <WorkGrid />
      <Capabilities />
      <About />
      <Contact />
    </main>
  );
}
