import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-24 h-96 w-96 -translate-y-1/2 rounded-full bg-purple-600/20 blur-[120px]" />

      <main className="container mx-auto flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-8 flex items-center justify-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-accent" />
          <span className="text-xl font-bold tracking-tight">RVCC</span>
        </div>

        <h1 className="gradient-text mb-6 text-5xl font-extrabold tracking-tighter sm:text-7xl lg:text-8xl">
          Future of Web <br /> Development
        </h1>

        <p className="mb-12 max-w-2xl text-lg text-zinc-400 sm:text-xl">
          Crafting premium digital experiences with Next.js, Tailwind CSS, and
          cutting-edge design patterns. Built for speed, scaled for performance.
        </p>

        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <a
            href="#"
            className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-black transition-all hover:scale-105"
          >
            Get Started
          </a>
          <a
            href="#"
            className="glass inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-semibold text-white transition-all hover:bg-white/10"
          >
            Documentation
          </a>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 grid w-full max-w-5xl gap-6 sm:grid-cols-3">
          {[
            {
              title: "Performance",
              desc: "Optimized for the next generation of web applications.",
            },
            {
              title: "Design",
              desc: "Pixel-perfect aesthetics with modern glassmorphism.",
            },
            {
              title: "Scale",
              desc: "Built to handle massive traffic with ease.",
            },
          ].map((feature, i) => (
            <div key={i} className="glass rounded-3xl p-8 text-left transition-all hover:border-white/20">
              <h3 className="mb-2 text-lg font-bold text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="absolute bottom-8 w-full text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} RVCC Innovations. All rights reserved.
      </footer>
    </div>
  );
}
