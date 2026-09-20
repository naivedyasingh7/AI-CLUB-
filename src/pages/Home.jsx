import React from 'react';
import Hero from '../components/Hero';
import Introduction from '../components/Introduction';
import Solution from '../components/Solution';
import IssueCards from '../components/IssueCards';
import Defeat from '../components/Defeat';
import HackFirstBrand from '../components/HackFirstBrand';
import AboutSection from '../components/AboutSection';
import TechnologiesSection from '../components/TechnologiesSection';
import AwardsSection from '../components/AwardsSection';
import StartedCTA from '../components/StartedCTA';

export default function Home() {
  return (
    <main>
      <Hero />
      <Introduction />
      <Solution />
      <IssueCards />
      <Defeat />
      <HackFirstBrand />
      <AboutSection />
      <TechnologiesSection />
      <AwardsSection />
      <StartedCTA />
    </main>
  );
}
