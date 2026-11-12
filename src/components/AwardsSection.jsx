import React from 'react';
import { ShieldCheck, Trophy } from 'lucide-react';

export default function AwardsSection() {
  const awards = [
    { rank: 'Ranked #1', label: 'Hall of Fame', winner: true },
    { rank: 'Ranked #1', label: 'Top Research Projects', winner: true },
    { rank: 'Ranked #1', label: 'Top Research Projects', winner: true },
    { rank: 'Ranked #1', label: 'Top Research Projects', winner: true },
    { rank: 'Ranked #1', label: 'Top Research Projects', winner: true },
    { rank: 'Ranked #2', label: 'Hall of Fame', winner: false },
    { rank: 'Ranked #1', label: 'Top Research Projects', winner: true },
    { rank: 'Ranked #2', label: 'Top Research Projects', winner: false },
    { rank: 'Ranked #1', label: 'Top Research Projects', winner: true }
  ];

  return (
    <section className="awards" data-layout="04">
      <div className="layout-head flex justify-between w-full font-mono text-xs uppercase opacity-70 mb-8">
        <span>Awards</span>
        <span>04</span>
      </div>

      <p className="awards-text text-xl font-light leading-relaxed max-w-lg mb-12">
        Our team leads are ranked #1 in major hackathons and research competitions worldwide
      </p>

      <div className="awards-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {awards.map((item, idx) => (
          <div 
            key={idx} 
            className="awards-item relative bg-white/[0.03] hover:bg-[#141717] transition-colors border border-white/5 rounded-xl h-80 p-6 flex flex-col items-center justify-between group"
          >
            {item.winner && (
              <div className="absolute top-4 right-4 text-cyan-400 opacity-90">
                <Trophy size={20} />
              </div>
            )}

            <div className="my-auto text-cyan-200/40 group-hover:text-cyan-400 transition-colors">
              <ShieldCheck size={48} strokeWidth={1.2} />
            </div>

            <div className="awards-item__text text-center flex flex-col gap-1">
              <span className="text-lg font-normal border-b border-transparent group-hover:border-cyan-200 transition-colors">
                {item.rank}
              </span>
              <p className="text-xs font-mono tracking-wider opacity-60 uppercase">
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="awards-separator mt-24">
        <span></span>
        <i></i>
        <span></span>
        <i></i>
        <span></span>
      </div>
    </section>
  );
}
