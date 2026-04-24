// import { client } from "@/lib/sanity/client";
// import { GET_FEATURES_QUERY } from "@/lib/sanity/queries";
import { Feature } from "@/types";
import { FeatureCard } from "./FeatureCard";

// Mock data for when CMS is not yet connected
const MOCK_FEATURES: Feature[] = [
  {
    _id: "1",
    title: "Precision Engineering",
    description: "Every detail matters. We build with exact specifications to ensure structural integrity.",
    icon: "Activity",
  },
  {
    _id: "2",
    title: "Sustainable Design",
    description: "Eco-friendly materials and energy-efficient practices for a greener tomorrow.",
    icon: "Leaf",
  },
  {
    _id: "3",
    title: "Massive Scale",
    description: "From complex high-rises to sprawling commercial complexes, we handle it all.",
    icon: "Layers",
  },
];

export const Features = async () => {
  // In a real scenario with a configured Sanity project:
  // const features = await client.fetch<Feature[]>(GET_FEATURES_QUERY);
  
  // Using mock data for demonstration
  const features = MOCK_FEATURES;

  return (
    <section className="container mx-auto px-6 py-24 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
          Built for <span className="text-amber-600">Excellence</span>
        </h2>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          We combine cutting-edge technology with traditional craftsmanship.
        </p>
      </div>

      <div className="grid w-full max-w-6xl mx-auto gap-8 md:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard key={feature._id} feature={feature} />
        ))}
      </div>
    </section>
  );
};
