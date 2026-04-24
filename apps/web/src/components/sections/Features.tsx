import { Feature } from "@types";

import { FeatureCard } from "./FeatureCard";

const MOCK_FEATURES: Feature[] = [
  {
    _id: "1",
    title: "Feature One",
    description: "A brief description of what this feature or service provides to the user.",
    icon: "Activity",
  },
  {
    _id: "2",
    title: "Feature Two",
    description: "Another brief description highlighting a key benefit or functionality.",
    icon: "Leaf",
  },
  {
    _id: "3",
    title: "Feature Three",
    description: "Third description to round out the features section of the landing page.",
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
