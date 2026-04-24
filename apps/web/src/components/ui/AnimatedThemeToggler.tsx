"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";

import { cn } from "@lib/utils";

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
}

export const AnimatedThemeToggler = ({
  className,
  duration = 500,
  ...props
}: AnimatedThemeTogglerProps) => {
  const { setTheme, resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  const toggleTheme = useCallback(async () => {
    const currentTheme = resolvedTheme || theme;
    const isDark = currentTheme === "dark";
    const nextTheme = isDark ? "light" : "dark";

    // Check if the browser supports View Transitions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!buttonRef.current || !(document as any).startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (document as any).startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme);
      });
    }).ready;

    const isEnteringDark = nextTheme === "dark";

    document.documentElement.animate(
      {
        clipPath: isEnteringDark
          ? ["inset(100% 0 0 0)", "inset(0 0 0 0)"]
          : ["inset(0 0 100% 0)", "inset(0 0 0 0)"],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }, [resolvedTheme, setTheme, duration]);

  // Prevent hydration mismatch by returning placeholder on server
  if (!mounted) {
    return <div className={cn("h-10 w-10", className)} />;
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      // FIX: Handle async promise safely to avoid @typescript-eslint/no-misused-promises
      onClick={() => {
        void toggleTheme();
      }}
      className={cn("hover:bg-muted relative rounded-full p-2 transition-colors", className)}
      {...props}
    >
      {resolvedTheme === "dark" ? (
        <SunIcon className="text-foreground h-5 w-5" />
      ) : (
        <MoonIcon className="text-foreground h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
