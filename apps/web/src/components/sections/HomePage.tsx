import { Features } from "./Features";
import { Hero } from "./Hero";

export const HomePage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-amber-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-24 h-96 w-96 -translate-y-1/2 rounded-full bg-orange-600/20 blur-[120px]" />

      <Hero />
      <Features />
    </div>
  );
};
