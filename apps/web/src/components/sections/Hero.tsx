"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import { Button } from "@ui/Button";
import { HeroClipPath } from "@ui/LayoutMask";

import { cn } from "@lib/utils";

const HERO_IMAGES = [
  "/images/hero-bg.png",
  "/images/home-hero.png",
  "/images/hero-bg.png", // Reusing for demo
];

const SLIDE_DURATION = 5000;

export const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev: number) => (prev + 1) % HERO_IMAGES.length);
      setProgress(0);
    }, SLIDE_DURATION);

    const progressTimer = setInterval(() => {
      setProgress((prev: number) => Math.min(prev + 100 / (SLIDE_DURATION / 100), 100));
    }, 100);

    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, [currentIndex]);

  return (
    <section className="relative m-2 flex h-screen flex-col items-center justify-center overflow-hidden p-10">
      <div className="absolute -top-1 left-1/2 z-40 -translate-x-1/2">
        <HeroClipPath className="text-background" />
      </div>

      {/* Background Image Slider */}
      <div className="absolute inset-0 z-0 mb-4 overflow-hidden rounded-[2.5rem]">
        {HERO_IMAGES.map((img, idx) => {
          const isActive = idx === currentIndex;

          return (
            <div
              key={img + idx}
              className={cn(
                "absolute inset-0 transition-opacity duration-[2000ms] ease-in-out",
                isActive ? "z-10 opacity-100" : "z-0 opacity-0"
              )}
            >
              <Image
                src={img}
                alt={`Architecture Slide ${idx + 1}`}
                fill
                priority={idx === 0}
                className={cn(
                  "object-cover transition-transform duration-[5000ms] ease-linear",
                  isActive ? "scale-110" : "scale-100"
                )}
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="relative z-30 container flex h-full flex-col justify-end pb-40">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Left Side - Main Heading */}
          <div className="flex flex-col justify-end">
            <p className="mb-6 max-w-sm text-xl leading-relaxed font-medium text-white/90">
              According to Vitruvius, the architect should strive to fulfill each of these three
              attributes as well as possible.
            </p>
            <h1 className="flex flex-col leading-none">
              <span className="text-7xl !leading-[0.6] font-bold tracking-tight text-white md:text-[10rem]">
                Building <br /> Beyond
              </span>
            </h1>
            <div className="mt-8 flex items-center">
              <Button href="#contact" className="bg-brand-blue h-12 w-[180px]">
                Contact us
              </Button>
            </div>
          </div>

          {/* Right Side - Subtext */}
          <div className="mb-10 flex flex-col items-end justify-end text-right">
            <div className="max-w-xs">
              <h3 className="mb-4 text-5xl !leading-[0.8] font-bold text-white">
                Architecture <br /> can mean
              </h3>
              <p className="text-md leading-relaxed text-white/70">
                A general term to describe buildings and other physical structures.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination & Timer */}
      <div className="absolute bottom-0 left-1/2 z-50 flex w-full -translate-x-1/2 rotate-180 justify-center">
        <HeroClipPath className="text-background" />
        <div className="absolute top-8 left-1/2 flex -translate-x-1/2 rotate-180 items-center space-x-4">
          {HERO_IMAGES.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setProgress(0);
                }}
                className="group relative flex items-center"
              >
                {/* Progress Pill */}
                <div
                  className={cn(
                    "relative h-2 overflow-hidden rounded-full transition-all duration-500",
                    isActive
                      ? "bg-foreground/20 w-12"
                      : "bg-foreground/40 group-hover:bg-foreground w-2"
                  )}
                >
                  {isActive && (
                    <div
                      className="bg-brand-blue absolute inset-y-0 left-0 transition-all duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
