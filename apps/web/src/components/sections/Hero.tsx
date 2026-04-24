import { Button } from "@ui/Button";

export const Hero = async () => {
  return (
    <section className="container py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">Headline Goes Here</h1>
      <p className="mx-auto mt-6 max-w-2xl text-xl text-zinc-600">
        This is a placeholder for your subheadline. Describe your main value proposition here in a
        few sentences.
      </p>
      <div className="mt-10 flex justify-center space-x-4">
        <Button href="#" className="bg-black text-white hover:bg-zinc-800">
          Primary CTA
        </Button>
        <Button href="#">Secondary CTA</Button>
      </div>
    </section>
  );
};
