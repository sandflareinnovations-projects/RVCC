"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import { MotionValue, motion, useScroll, useTransform } from "framer-motion";
import { useTheme } from "next-themes";

const WORDS = [
  "WE",
  "DEVELOP",
  "CONTEMPORARY",
  "RESIDENCES",
  "WHERE",
  "ARCHITECTURE,",
  "LIGHT",
  "AND",
  "[img1]",
  "LANDSCAPE",
  "EXIST",
  "IN",
  "PERFECT",
  "[img2]",
  "BALANCE",
  "OUR",
  "FOCUS",
  "IS",
  "NOT",
  "JUST",
  "TO",
  "BUILD",
  "HOUSES",
  "—",
  "BUT",
  "TO",
  "CREATE",
  "SPACES",
  "THAT",
  "ELEVATE",
  "[img3]",
  "LIVING",
];

const Word = ({
  children,
  progress,
  range,
  inactiveColor,
}: {
  children: React.ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
  inactiveColor: string;
}) => {
  const color = useTransform(progress, range, [inactiveColor, "#0073bc"]);

  return (
    <motion.span style={{ color }} className="mr-3 mb-3 inline-block">
      {children}
    </motion.span>
  );
};

export const AboutUs = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const inactiveColor = mounted && resolvedTheme === "dark" ? "#ffffff" : "#000000";

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 70%", "end 70%"],
  });

  return (
    <section className="bg-background py-section relative z-10" id="about">
      <div className="container">
        {/* Header */}
        <div className="mb-20 flex items-end justify-between">
          <div className="flex flex-col">
            <h2 className="text-brand-blue text-[14rem] leading-[0.8] tracking-tighter">
              about us
            </h2>
          </div>
        </div>

        {/* Scroll Reveal Text */}
        <div ref={containerRef} className="mx-auto my-10 max-w-5xl">
          <h3 className="font-primary flex flex-wrap justify-end text-right text-4xl leading-snug font-medium tracking-tight">
            {WORDS.map((word, i) => {
              const start = i / WORDS.length;
              const end = start + 1 / WORDS.length;

              if (word.startsWith("[img")) {
                return (
                  <span
                    key={i}
                    className="relative top-2 mx-3 mb-3 inline-block h-12 w-24 overflow-hidden rounded-full md:h-10 md:w-32"
                  >
                    <Image src="/images/home-hero.png" alt="Detail" fill className="object-cover" />
                  </span>
                );
              }

              return (
                <Word
                  key={i}
                  progress={scrollYProgress}
                  range={[start, end]}
                  inactiveColor={inactiveColor}
                >
                  {word}
                </Word>
              );
            })}
          </h3>
        </div>

        {/* Bottom Section */}
        <div className="mt-40 grid grid-cols-1 items-end gap-16 md:grid-cols-2">
          <div className="flex gap-6">
            <div className="relative h-40 w-64 overflow-hidden rounded-3xl">
              <Image src="/images/home-hero.png" alt="Architecture" fill className="object-cover" />
            </div>
            <div className="relative -mb-8 h-48 w-72 overflow-hidden rounded-3xl">
              <Image src="/images/hero-bg.png" alt="Interior" fill className="object-cover" />
            </div>
          </div>

          <div className="text-muted grid grid-cols-2 gap-12 pb-8 text-sm leading-relaxed">
            <p>
              By integrating innovative technologies and sustainable solutions, we ensure long-term
              value for both homeowners and investors.
            </p>
            <p>
              By uniting vision, precision and craftsmanship, we deliver exceptional residences that
              reflect confidence, quality and enduring distinction.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
