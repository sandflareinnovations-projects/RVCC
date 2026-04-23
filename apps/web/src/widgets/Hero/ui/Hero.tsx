import { Button } from "@/shared/ui/Button";

export const Hero = () => {
  return (
    <section className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-8 flex items-center justify-center space-x-2">
        <div className="h-8 w-8 rounded-lg bg-accent" />
        <span className="text-xl font-bold tracking-tight text-white">RVCC</span>
      </div>

      <h1 className="gradient-text mb-6 text-5xl font-extrabold tracking-tighter sm:text-7xl lg:text-8xl">
        Building the Future <br /> Together
      </h1>

      <p className="mb-12 max-w-2xl text-lg text-zinc-400 sm:text-xl">
        Delivering premium commercial and residential construction services.
        Built with precision, engineered for durability, and scaled for modern demands.
      </p>

      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <Button href="#projects">Our Projects</Button>
        <Button href="#contact" variant="glass">Contact Us</Button>
      </div>
    </section>
  );
};
