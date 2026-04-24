import { Feature } from "@types";

interface FeatureCardProps {
  feature: Feature;
}

export const FeatureCard = ({ feature }: FeatureCardProps) => {
  return (
    <div className="group border-border bg-background hover:border-brand-blue hover:shadow-brand-blue/10 relative rounded-2xl border p-8 transition-all hover:shadow-2xl">
      <div className="bg-brand-blue/10 text-brand-blue group-hover:bg-brand-blue mb-6 flex h-12 w-12 items-center justify-center rounded-xl transition-colors group-hover:text-white">
        {/* Logic for icon could go here, for now using a placeholder div */}
        <div className="h-6 w-6 rounded-sm border-2 border-current" />
      </div>
      <h3 className="text-foreground group-hover:text-brand-blue text-xl font-bold tracking-tight transition-colors">
        {feature.title}
      </h3>
      <p className="text-muted mt-4 leading-relaxed">{feature.description}</p>
    </div>
  );
};
