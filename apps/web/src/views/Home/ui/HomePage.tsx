import { Hero } from "@/widgets/Hero/ui/Hero";
import { Features } from "@/widgets/Features/ui/Features";

export const HomePage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-amber-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-24 h-96 w-96 -translate-y-1/2 rounded-full bg-orange-600/20 blur-[120px]" />

      <Hero />
      <Features />

      <footer className="absolute bottom-8 w-full text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} RVCC Construction Company. All rights reserved.
      </footer>
    </div>
  );
};
