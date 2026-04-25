"use client";

import { ReactNode } from "react";

import { Icons } from "@repo/ui";

import { cn } from "@lib/utils";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}

export const Button = ({
  children,
  className,
  href,
  onClick,
  transparent,
}: ButtonProps & { transparent?: boolean }) => {
  const Component = href ? "a" : "button";

  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn(
        "group bg-brand-blue text-foreground border-background relative inline-flex h-12 w-[180px] items-center overflow-hidden rounded-full border-2 p-0.5 transition-transform"
      )}
    >
      {/* Dynamic Section */}
      <div
        className={cn(
          "bg-background flex h-full w-80 items-center justify-center rounded-full px-6 transition-all duration-500 ease-in-out group-hover:w-full"
        )}
      >
        <span
          className={cn(
            "font-primary text-brand-blue text-sm font-black tracking-tight",
            "whitespace-nowrap"
          )}
        >
          {children}
        </span>
      </div>

      {/* Icon Section */}
      <div
        className={cn(
          "text-background flex h-full w-20 items-center justify-center overflow-hidden transition-all duration-300 ease-in-out group-hover:w-0 group-hover:opacity-0"
        )}
      >
        <Icons.ChevronRight className="h-5 w-5 flex-shrink-0" />
      </div>
    </Component>
  );
};
