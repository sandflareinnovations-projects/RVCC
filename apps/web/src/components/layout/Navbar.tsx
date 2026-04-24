import Link from "next/link";

import { Button } from "@ui/Button";

export const Navbar = () => {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex justify-center p-6">
      <nav className="flex w-full max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/40 px-8 py-3 backdrop-blur-xl transition-all hover:bg-zinc-900/60 dark:border-white/5">
        <Link href="/" className="group flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 transition-transform group-hover:scale-110" />
          <span className="text-xl font-bold tracking-tight text-white">RVCC</span>
        </Link>

        <div className="hidden items-center space-x-8 md:flex">
          {["Services", "Projects", "Safety", "About"].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <Button href="#contact" variant="glass" className="rounded-xl px-5 py-2 text-sm">
            Get a Quote
          </Button>
        </div>
      </nav>
    </header>
  );
};
