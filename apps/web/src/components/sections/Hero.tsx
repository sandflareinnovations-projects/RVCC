import { Button } from "@/components/ui/Button";

// import { client } from "@/lib/sanity/client";
// import { GET_HERO_QUERY } from "@/lib/sanity/queries";

export const Hero = async () => {
  // In a real scenario:
  // const heroData = await client.fetch(GET_HERO_QUERY);

  const heroData = {
    title: "Building the Future Together",
    subtitle:
      "Delivering premium commercial and residential construction services. Built with precision, engineered for durability, and scaled for modern demands.",
    ctaText: "Our Projects",
    secondaryCtaText: "Contact Us",
  };

  return (
    <section className="relative z-10 container mx-auto flex min-h-[80vh] flex-col items-center justify-center px-6 py-24 text-center">
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
        <div className="mb-8 flex items-center justify-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-orange-500/20" />
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            RVCC
          </span>
        </div>

        <h1 className="mb-6 text-6xl font-extrabold tracking-tighter text-zinc-900 sm:text-7xl lg:text-8xl dark:text-white">
          {heroData.title.split(" ").map((word, i) =>
            word === "Future" ? (
              <span key={i} className="text-amber-600">
                {" "}
                {word}{" "}
              </span>
            ) : (
              word + " "
            )
          )}
        </h1>

        <p className="mx-auto mb-12 max-w-3xl text-lg leading-relaxed text-zinc-600 sm:text-xl dark:text-zinc-400">
          {heroData.subtitle}
        </p>

        <div className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
          <Button
            href="#projects"
            className="rounded-2xl bg-amber-600 px-10 py-6 text-lg shadow-xl shadow-amber-500/25 hover:bg-amber-700"
          >
            {heroData.ctaText}
          </Button>
          <Button
            href="#contact"
            variant="glass"
            className="rounded-2xl px-10 py-6 text-lg backdrop-blur-md"
          >
            {heroData.secondaryCtaText}
          </Button>
        </div>
      </div>
    </section>
  );
};
