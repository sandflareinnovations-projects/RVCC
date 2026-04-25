"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { useTheme } from "next-themes";

import { Icons } from "@repo/ui";

import { AnimatedThemeToggler } from "@ui/AnimatedThemeToggler";
import { Button } from "@ui/Button";

import { cn } from "@lib/utils";

export const Navbar = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Handle background and styling change
      setIsScrolled(currentScrollY > 100);

      // Handle hide/show logic based on scroll direction
      if (currentScrollY > lastScrollY.current && currentScrollY > 150) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up or at top
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuLinks = ["ABOUT US", "SERVICES", "PROJECTS", "GALLERY", "CAREERS", "CONTACTS"];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 left-0 z-[100] transition-all duration-500 ease-in-out",
          isScrolled ? "bg-background py-2 shadow-sm" : "bg-transparent py-4",
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="relative container flex items-center justify-between">
          {/* Nav Box - Left */}
          <button
            onClick={() => setIsOpen(true)}
            className="group bg-background hover:bg-foreground hover:text-background border-border text-brand-blue relative z-50 flex items-center space-x-3 rounded-full border px-6 py-2 transition-all"
          >
            <Icons.Menu className="h-4 w-4" />
            <span className="text-xs font-bold tracking-widest uppercase">Menu</span>
          </button>

          {/* Logo - Center */}
          <Link href="/" className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2">
            <Image
              src="/images/logo/logo.png"
              alt="Logo"
              width={200}
              height={200}
              className={cn("w-25")}
            />
          </Link>

          {/* Actions - Right */}
          <div className="relative z-50 flex items-center space-x-4">
            <Button href="#contact" className="h-8 w-[120px] bg-white text-sm text-[#0073bc]">
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Centered Menu Modal */}
      <div
        className={cn(
          "bg-background fixed top-1/2 left-1/2 z-[200] flex h-[95vh] w-[calc(100%-2rem)] max-w-[500px] -translate-x-1/2 flex-col rounded-[3rem] p-6 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.85,0,0.15,1)]",
          isOpen ? "-translate-y-1/2 opacity-100" : "translate-y-[100vh] opacity-0"
        )}
      >
        {/* Subtle Background Pattern (SVG Curves) */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M100 0 C 80 20, 90 80, 50 100"
              stroke="currentColor"
              fill="none"
              strokeWidth="0.1"
            />
            <path
              d="M100 20 C 70 40, 80 90, 40 100"
              stroke="currentColor"
              fill="none"
              strokeWidth="0.1"
            />
          </svg>
        </div>

        {/* Menu Header */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Image src="/images/logo/logo.png" alt="Logo" width={120} height={40} className="w-32" />
          <button
            onClick={() => setIsOpen(false)}
            className="border-brand-blue bg-background text-brand-blue hover:bg-brand-blue flex h-12 w-12 items-center justify-center rounded-full border transition-all hover:text-white"
          >
            <Icons.Close className="h-6 w-6" />
          </button>
        </div>

        {/* Menu Links */}
        <nav className="relative z-10 flex flex-1 flex-col items-center justify-center space-y-4">
          {menuLinks.map((link) => (
            <Link
              key={link}
              href={`#${link.toLowerCase().replace(" ", "-")}`}
              onClick={() => setIsOpen(false)}
              className="font-heading text-brand-blue text-4xl transition-transform hover:scale-105 md:text-5xl"
            >
              {link}
            </Link>
          ))}
        </nav>

        {/* Menu Footer (Socials & Theme) */}
        <div className="relative z-10 flex items-center justify-center space-x-6 py-10">
          {[
            { icon: <Icons.Linkedin className="h-5 w-5" />, href: "#" },
            { icon: <Icons.Instagram className="h-5 w-5" />, href: "#" },
            { icon: <Icons.Facebook className="h-5 w-5" />, href: "#" },
          ].map((social, i) => (
            <a
              key={i}
              href={social.href}
              className="border-brand-blue text-brand-blue bg-background hover:bg-brand-blue flex h-12 w-12 items-center justify-center rounded-full border transition-all hover:text-white"
            >
              {social.icon}
            </a>
          ))}
          <AnimatedThemeToggler />
          <button className="border-brand-blue text-brand-blue bg-background hover:bg-brand-blue flex h-12 w-12 items-center justify-center rounded-full border text-xs font-bold transition-all hover:text-white">
            AR
          </button>
        </div>
      </div>
    </>
  );
};
