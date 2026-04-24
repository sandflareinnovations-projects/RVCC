"use client";

import Link from "next/link";

import { useTheme } from "next-themes";

import { AnimatedThemeToggler } from "@ui/AnimatedThemeToggler";
import { Button } from "@ui/Button";

export const Navbar = () => {
  const { resolvedTheme } = useTheme();
  return (
    <header className="bg-background/80 fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-md">
      <nav className="container flex h-20 items-center justify-between">
        <Link href="/" className="text-brand-blue text-2xl font-black tracking-tighter">
          RVCC
        </Link>

        <div className="flex items-center space-x-8">
          <Link
            href="#services"
            className="hover:text-brand-blue text-sm font-medium transition-colors"
          >
            Services
          </Link>
          <Link
            href="#projects"
            className="hover:text-brand-blue text-sm font-medium transition-colors"
          >
            Projects
          </Link>
          <div className="border-border flex items-center space-x-4 border-l pl-8">
            <AnimatedThemeToggler />
            <Button href="#contact" className="bg-brand-blue hover:bg-brand-blue/90 text-white">
              Get Started
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
};
