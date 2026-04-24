import { Feature } from "@/types";
import * as Icons from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface FeatureCardProps {
  feature: Feature;
  className?: string;
}

export const FeatureCard = ({ feature, className }: FeatureCardProps) => {
  const Icon = (Icons[feature.icon as keyof typeof Icons] || Icons.CheckCircle) as React.ElementType;

  return (
    <div
      className={twMerge(
        "group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/50 p-8 transition-all hover:border-amber-500/50 hover:bg-white hover:shadow-2xl hover:shadow-amber-500/10 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-amber-500/30 dark:hover:bg-zinc-900",
        className
      )}
    >
      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-amber-500/5 blur-2xl transition-all group-hover:bg-amber-500/10" />
      
      <div className="relative mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-colors group-hover:bg-amber-500 group-hover:text-white dark:bg-amber-500/20 dark:text-amber-400">
        <Icon size={24} />
      </div>

      <h3 className="relative mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        {feature.title}
      </h3>
      
      <p className="relative text-zinc-600 dark:text-zinc-400">
        {feature.description}
      </p>
    </div>
  );
};
