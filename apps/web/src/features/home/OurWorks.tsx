"use client";

import React, { useRef, useState } from "react";

import Image from "next/image";

import {
  AnimatePresence,
  Variants,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

import { Button } from "@/components/ui/Button";

const works = [
  {
    id: 1,
    title1: "Civil",
    title2: "Construction",
    description:
      "RVCC is unconditionally dedicated to achieving excellence in the marketplace by understanding and exceeding customer expectations through integrity, commitment and ethical conduct.",
    image: "/images/home-hero.png",
    number: "01 - 05",
    cta: "View more",
    iconId: "civil",
  },
  {
    id: 2,
    title1: "Urban",
    title2: "Landscaping",
    description:
      "RVCC Landscaping has been giving life to public and private outdoor spaces by providing landscaping architecture, construction, and maintenance services.",
    image: "/images/home-hero.png",
    number: "02 - 05",
    cta: "View more",
    iconId: "landscaping",
  },
  {
    id: 3,
    title1: "Heavy",
    title2: "Earth Works",
    description:
      "RVCC undertakes different types of earth works. In the petroleum industry, RVCC works with ARAMCO in sand removal services and access-related operations.",
    image: "/images/home-hero.png",
    number: "03 - 05",
    cta: "View more",
    iconId: "earthworks",
  },
  {
    id: 4,
    title1: "Premier",
    title2: "Artificial Grass",
    description:
      "Considering the great advantages in artificial grass, RVCC offers alternative solutions to natural grass installation with a near accurate match and long-term durability.",
    image: "/images/home-hero.png",
    number: "04 - 05",
    cta: "View more",
    iconId: "grass",
  },
  {
    id: 5,
    title1: "Precision",
    title2: "Land Survey",
    description:
      "RVCC uses the latest technologies in survey and topography, including advanced global positioning systems (GPS) for accurate and efficient results.",
    image: "/images/home-hero.png",
    number: "05 - 05",
    cta: "View more",
    iconId: "survey",
  },
];

const cardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
  }),
  center: {
    x: 0,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-1%" : "1%",
  }),
};

const OurWorksMask = () => (
  <svg width="0" height="0" className="absolute">
    <defs>
      <clipPath id="our-works-mask" clipPathUnits="objectBoundingBox">
        <path
          d="
            M 0 0 
            L 0.15 0 
            C 0.2 0, 0.22 0.05, 0.28 0.05 
            L 0.72 0.05 
            C 0.78 0.05, 0.8 0, 0.85 0 
            L 1 0 
            L 1 1 
            L 0.85 1 
            C 0.8 1, 0.78 0.95, 0.72 0.95 
            L 0.28 0.95 
            C 0.22 0.95, 0.2 1, 0.15 1 
            L 0 1 
            Z
          "
        />
      </clipPath>
    </defs>
  </svg>
);

export const OurWorks = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [[index, direction], setPage] = useState([0, 0]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "start 75px"],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const containerWidth = useTransform(smoothProgress, [0, 1], ["50%", "100%"]);

  const radius = useTransform(smoothProgress, [0, 1], ["400px", "0px"]);

  const next = () => setPage([(index + 1) % works.length, 1]);
  const prev = () => setPage([(index - 1 + works.length) % works.length, -1]);

  return (
    <div className="bg-background relative flex w-full flex-col items-center overflow-visible">
      <OurWorksMask />
      <motion.section
        id="works"
        ref={containerRef}
        style={{
          width: containerWidth,
          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,
          borderBottomLeftRadius: radius,
          borderBottomRightRadius: radius,
        }}
        className="bg-brand-blue relative z-20 mx-auto flex flex-col items-center overflow-hidden"
      >
        <div className="flex min-h-full w-screen flex-col items-center px-6 py-24 md:px-20 md:py-32">
          <div className="flex w-full max-w-7xl flex-col items-center space-y-16">
            <div className="mb-20 flex w-full flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="flex-1">
                <h2 className="text-background flex flex-col text-[4rem] leading-[0.6] tracking-tighter md:text-[5.5rem]">
                  <span className="font-medium">Our Works</span>
                </h2>
              </div>

              <div className="max-w-sm flex-1 pt-4">
                <p className="text-background text-center text-sm leading-relaxed font-medium">
                  After completing your year 12 education and earning the necessary scores, you may
                  apply for a bachelor&apos;s degree in architecture. To qualify, students can
                  complete one of three entrance exams:
                </p>
              </div>

              <div className="flex flex-1 justify-end pt-4">
                <Button href="#contact" className="bg-brand-blue h-12 w-[180px]">
                  View All
                </Button>
              </div>
            </div>

            {/* Main Display Card */}
            <div
              className="relative flex aspect-[16/8] w-full overflow-hidden rounded-3xl md:aspect-[21/9] lg:aspect-[8/3.5]"
              style={{ clipPath: "url(#our-works-mask)" }}
            >
              {/* Left: Animated Image Slide-over */}
              <div className="relative h-full w-3/5 overflow-hidden">
                <AnimatePresence initial={false} custom={direction}>
                  <motion.div
                    key={index}
                    custom={direction}
                    variants={cardVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 2, ease: [0.25, 1, 0.25, 1] }}
                    className="absolute inset-0 h-full w-full"
                  >
                    <Image
                      src={works[index].image}
                      alt={works[index].id.toString()}
                      fill
                      sizes="(max-width: 768px) 100vw, 60vw"
                      className="object-cover"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right: Content Box */}
              <div className="text-brand-blue bg-background relative z-10 flex h-full w-3/6 flex-col justify-between overflow-hidden p-8 md:p-12 lg:p-16">
                {/* DYNAMIC CONTEXTUAL SVG BACKGROUND */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={works[index].iconId}
                      initial={{ opacity: 0, scale: 1.2, rotate: -5 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="flex h-full w-full items-center justify-center p-12"
                    >
                      {works[index].iconId === "civil" && (
                        <svg
                          viewBox="0 0 200 200"
                          className="stroke-brand-blue h-full w-full fill-none stroke-[0.5]"
                        >
                          <path
                            d="M 0 160 L 200 160 M 100 160 L 100 0 L 140 40 L 100 40"
                            strokeWidth="1"
                          />
                          <circle cx="100" cy="160" r="10" />
                          <rect x="40" y="60" width="120" height="100" />
                          <path d="M 40 100 L 160 100 M 40 130 L 160 130 M 80 60 L 80 160 M 120 60 L 120 160" />
                        </svg>
                      )}
                      {works[index].iconId === "landscaping" && (
                        <svg
                          viewBox="0 0 200 200"
                          className="stroke-brand-blue h-full w-full fill-none stroke-[0.5]"
                        >
                          <path
                            d="M 100 200 C 100 150 150 100 100 0 C 50 100 100 150 100 200 Z"
                            strokeWidth="1"
                          />
                          <circle cx="100" cy="130" r="60" strokeDasharray="5 5" />
                          <path d="M 40 160 Q 100 120 160 160" />
                        </svg>
                      )}
                      {works[index].iconId === "earthworks" && (
                        <svg
                          viewBox="0 0 200 200"
                          className="stroke-brand-blue h-full w-full fill-none stroke-[0.5]"
                        >
                          <circle
                            cx="100"
                            cy="100"
                            r="80"
                            strokeWidth="2"
                            strokeDasharray="10 20"
                          />
                          <path d="M 40 100 L 160 100 M 100 40 L 100 160" strokeWidth="1" />
                          <rect x="70" y="70" width="60" height="60" rotate="45" />
                          <circle cx="100" cy="100" r="10" fill="currentColor" />
                        </svg>
                      )}
                      {works[index].iconId === "grass" && (
                        <svg
                          viewBox="0 0 200 200"
                          className="stroke-brand-blue h-full w-full fill-none stroke-[0.2]"
                        >
                          {Array.from({ length: 10 }).map((_, i) => (
                            <path key={i} d={`M ${i * 20} 0 L ${i * 20} 200`} />
                          ))}
                          {Array.from({ length: 10 }).map((_, i) => (
                            <path key={i} d={`M 0 ${i * 20} L 200 ${i * 20}`} />
                          ))}
                          <circle cx="100" cy="100" r="50" strokeWidth="1" />
                        </svg>
                      )}
                      {works[index].iconId === "survey" && (
                        <svg
                          viewBox="0 0 200 200"
                          className="stroke-brand-blue h-full w-full fill-none stroke-[0.5]"
                        >
                          <path
                            d="M 100 60 L 60 180 M 100 60 L 140 180 M 100 60 L 100 180"
                            strokeWidth="1"
                          />
                          <rect x="80" y="20" width="40" height="40" />
                          <circle cx="100" cy="40" r="15" />
                          <path d="M 20 180 L 180 180" strokeDasharray="5 5" />
                        </svg>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation & Counter */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.4em] opacity-60">
                    {works[index].number}
                  </span>
                  <div className="flex gap-4">
                    <button
                      onClick={prev}
                      className="group/btn border-brand-blue hover:bg-brand-blue text-brand-blue flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 transition-all hover:scale-110 hover:text-white active:scale-95"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </button>
                    <button
                      onClick={next}
                      className="group/btn border-brand-blue hover:bg-brand-blue text-brand-blue flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 transition-all hover:scale-110 hover:text-white active:scale-95"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Typography Section */}
                <div className="relative z-10 space-y-6">
                  <AnimatePresence>
                    <motion.div
                      key={index}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 2, ease: [0.25, 1, 0.25, 1] }}
                    >
                      <h2 className="text-3xl leading-tight font-black uppercase md:text-4xl lg:text-7xl">
                        <span className="font-brand-sec mb-2 block font-bold lowercase italic opacity-80"></span>
                        <span className="block leading-[0.8]">
                          {works[index].title1} <br /> {works[index].title2}
                        </span>
                      </h2>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Description & Footer */}
                <div className="relative z-10 space-y-8">
                  <motion.p
                    key={index}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 2, ease: [0.25, 1, 0.25, 1] }}
                    className="max-w-sm text-xs leading-relaxed font-medium text-gray-500 italic md:text-sm lg:text-base"
                  >
                    {works[index].description}
                  </motion.p>

                  <Button href="#contact" className="bg-brand-blue h-12 w-[160px] text-white">
                    {works[index].cta}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};
