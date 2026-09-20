import React from 'react';
import PlasmaSphereCanvas from './Canvases/PlasmaSphereCanvas';

export default function TechnologiesSection() {
  const techItems = [
    {
      title: 'Realistic Project Simulations',
      desc: 'Experience building models based on real-world datasets, testing your skills against problems faced by top tech companies'
    },
    {
      title: 'Safe & Collaborative Learning',
      desc: 'Conduct research in an open environment, allowing you to focus on strengthening your understanding securely.'
    },
    {
      title: 'AI-Powered Research Tools',
      desc: 'Utilize advanced compute resources provided by AI Club to emulate sophisticated research strategies, uncovering insights others miss.'
    },
    {
      title: 'World-Class Student Mentors',
      desc: 'Collaborate with a team of elite student developers who think like industry leaders and use their skills to guide your journey.'
    }
  ];

  return (
    <section className="technologies" data-layout="03">
      <div className="technologies-separator">
        <span></span>
        <i></i>
        <span></span>
        <i></i>
        <span></span>
      </div>

      <div className="technologies-wrapper my-12">
        <div className="technologies-image relative h-[520px] w-full max-w-4xl mx-auto overflow-hidden rounded-3xl border border-blue-900/40 shadow-2xl bg-black">
          <PlasmaSphereCanvas scale={1.15} speed={1.1} />
        </div>
      </div>

      <div className="technologies-content max-w-5xl mx-auto flex flex-col gap-24 px-8 pb-24">
        {techItems.map((item) => (
          <div key={item.title} className="technologies-item flex flex-col md:flex-row justify-between gap-6 border-b border-cyan-950/20 pb-8" animate-blur-el="true">
            <h4 className="font-normal text-3xl max-w-md">{item.title}</h4>
            <p className="max-w-md text-base opacity-80 font-light leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="technologies-separator">
        <span></span>
        <i></i>
        <span></span>
        <i></i>
        <span></span>
      </div>
    </section>
  );
}
