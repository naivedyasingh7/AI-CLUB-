import React from 'react';
import { GridReveal } from './GridReveal';

export default function Introduction() {
  return (
    <GridReveal blockSize={100} baseDelay={200}>
      <section className="relative px-6 py-24 lg:py-48 w-full bg-[#111111] text-white overflow-hidden min-h-screen flex items-center">
        {/* Background Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=2000')" }}
        ></div>
        
        <div className="max-w-7xl mx-auto flex flex-col justify-center relative z-10 w-full h-full">
          
          <div className="flex flex-col lg:flex-row justify-between items-end gap-16">
            
            <div className="flex-1 max-w-4xl space-y-8">
              <h1 className="text-5xl lg:text-[6rem] font-black tracking-tighter leading-[1] text-white uppercase">
                BUILDING INDIA'S<br />
                BIGGEST HACKER HOUSE,<br />
                HACKFIRST
              </h1>
              
              <div className="pt-8">
                <p className="text-xl lg:text-3xl text-gray-300 max-w-xl font-medium tracking-tight">
                  Hackfirst Brand Book
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-4">
              <div className="bg-[#FF7C1E] text-black font-bold px-8 py-4 text-lg hover:bg-orange-600 transition cursor-pointer">
                Fast-track My Access
              </div>
              <div className="flex space-x-6 text-2xl font-black font-mono text-white/50 tracking-widest pt-12">
                <span>0</span>
                <span>0</span>
                <span className="text-white">19</span>
                <span>-5</span>
              </div>
            </div>

          </div>
          
        </div>
      </section>
    </GridReveal>
  );
}
