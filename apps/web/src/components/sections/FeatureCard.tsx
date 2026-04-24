import { Feature } from "@types";

interface FeatureCardProps {
  feature: Feature;
}

export const FeatureCard = ({ feature }: FeatureCardProps) => {
  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-semibold">{feature.title}</h3>
      <p className="mt-2 text-zinc-600">{feature.description}</p>
    </div>
  );
};
