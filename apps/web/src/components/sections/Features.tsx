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
    <section className="bg-background py-section" id="services">
      <div className="container">
        <div className="mb-20 text-center">
          <p className="slogan text-brand-blue mb-4 text-xs tracking-[0.4em]">Core Capabilities</p>
          <h2 className="text-h2 font-black md:text-5xl">
            Shaping Your <span className="text-brand-blue">Vision</span>.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_FEATURES.map((feature) => (
            <FeatureCard key={feature._id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
};
