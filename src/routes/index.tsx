import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/masmer/Navbar";
import { Hero } from "@/components/masmer/Hero";
import { Problem } from "@/components/masmer/Problem";
import { Features } from "@/components/masmer/Features";
import { EstimatingBot } from "@/components/masmer/EstimatingBot";
import { HowItWorks } from "@/components/masmer/HowItWorks";
import { SocialProof } from "@/components/masmer/SocialProof";
import { Waitlist } from "@/components/masmer/Waitlist";
import { Footer } from "@/components/masmer/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Masmer AI — The AI Brain Behind Your Business" },
      {
        name: "description",
        content:
          "Masmer answers calls, books estimates, follows up on leads, schedules jobs, and builds estimates 24/7 for contractors.",
      },
      { property: "og:title", content: "Masmer AI — The AI Brain Behind Your Business" },
      {
        property: "og:description",
        content:
          "Built for contractors: receptionist, Eliko, lead follow-up, scheduler.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Features />
        <EstimatingBot />
        <HowItWorks />
        <SocialProof />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
}
