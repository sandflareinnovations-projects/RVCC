import { Button } from "@ui/Button";

export const Hero = async () => {
  return (
    <section className="bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-20 text-center">
      <div className="relative z-10 container">
        <p className="slogan animate-fade-in text-brand-blue mb-4 text-sm tracking-[0.3em]">
          WHERE IDEAS ARE SHAPED TO REALITY
        </p>
        <h1 className="animate-slide-up text-display leading-[1.1] font-black md:text-7xl lg:text-8xl">
          Engineering <span className="text-brand-blue">Excellence</span>.
        </h1>
        <p className="animate-fade-in text-muted mx-auto mt-8 max-w-2xl text-lg md:text-xl">
          A forward-thinking brand focused on precision engineering, innovative design, and
          high-quality manufacturing.
        </p>
        <div className="animate-fade-in mt-12 flex justify-center space-x-6">
          <Button
            href="#projects"
            className="bg-brand-blue shadow-brand-blue/20 text-white shadow-xl transition-transform hover:scale-105"
          >
            Our Portfolio
          </Button>
          <Button
            href="#about"
            className="border-brand-grey text-foreground hover:bg-foreground hover:text-background transition-all"
          >
            Learn More
          </Button>
        </div>
      </div>

      {/* Subtle Background Element */}
      <div className="bg-brand-blue/5 absolute -bottom-24 -left-24 h-96 w-96 rounded-full blur-3xl" />
      <div className="bg-brand-blue/5 absolute top-24 -right-24 h-96 w-96 rounded-full blur-3xl" />
    </section>
  );
};
