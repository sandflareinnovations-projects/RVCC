import { Button } from "@ui/Button";

export const Hero = async () => {
  return (
    <section className="container py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">RVCC Construction</h1>
      <p className="mx-auto mt-6 max-w-2xl text-xl text-zinc-600">
        Building premium commercial and residential spaces with precision and engineering
        excellence.
      </p>
      <div className="mt-10 flex justify-center space-x-4">
        <Button href="#projects" className="bg-black text-white hover:bg-zinc-800">
          View Projects
        </Button>
        <Button href="#contact">Contact Us</Button>
      </div>
    </section>
  );
};
