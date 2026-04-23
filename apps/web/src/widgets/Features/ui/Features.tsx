const features = [
  {
    title: "Precision Engineering",
    desc: "Every detail matters. We build with exact specifications to ensure structural integrity.",
  },
  {
    title: "Sustainable Design",
    desc: "Eco-friendly materials and energy-efficient practices for a greener tomorrow.",
  },
  {
    title: "Massive Scale",
    desc: "From complex high-rises to sprawling commercial complexes, we handle it all.",
  },
];

export const Features = () => {
  return (
    <section className="container mx-auto px-6 py-24">
      <div className="grid w-full max-w-5xl mx-auto gap-6 sm:grid-cols-3">
        {features.map((feature, i) => (
          <div key={i} className="glass rounded-3xl p-8 text-left transition-all hover:border-white/20">
            <h3 className="mb-2 text-lg font-bold text-white">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-zinc-500">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
