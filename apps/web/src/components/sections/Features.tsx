import { Feature } from "@types";

import { FeatureCard } from "./FeatureCard";

const MOCK_FEATURES: Feature[] = [
  {
    _id: "1",
    title: "Engineering",
    description: "Structural integrity and precision engineering for every project.",
    icon: "Activity",
  },
  {
    _id: "2",
    title: "Sustainability",
    description: "Eco-friendly materials and energy-efficient building practices.",
    icon: "Leaf",
  },
  {
    _id: "3",
    title: "Scale",
    description: "Handling complex high-rises and large-scale commercial builds.",
    icon: "Layers",
  },
];

export const Features = async () => {
  return (
    <section className="container py-24">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {MOCK_FEATURES.map((feature) => (
          <FeatureCard key={feature._id} feature={feature} />
        ))}
      </div>
    </section>
  );
};
