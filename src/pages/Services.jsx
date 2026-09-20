import React from 'react';
import CyberCanvas from '../components/Canvases/CyberCanvas';

export default function Services() {
  const serviceItems = [
    {
      title: 'Vulnerability Assessment & Pentesting (VAPT)',
      text: 'In-depth automated and manual vulnerability assessment designed to uncover missing patches, misconfigurations, and software flaws.',
      type: 'shield'
    },
    {
      title: 'Full Spectrum Red Teaming',
      text: 'Realistic adversary emulation simulating persistent attack campaigns, social engineering, lateral movement, and data exfiltration.',
      type: 'tornado'
    },
    {
      title: 'Smart Contract & Web3 Audit',
      text: 'Comprehensive line-by-line smart contract security audits, reentrancy analysis, and protocol logic verification for DeFi platforms.',
      type: 'radar'
    },
    {
      title: 'Cloud Security Architecture',
      text: 'Evaluation of AWS, GCP, and Azure cloud infrastructure security posture, IAM permissions, and container orchestration safety.',
      type: 'grid'
    },
    {
      title: 'Incident Response & Advisory',
      text: 'Rapid incident triage, forensic analysis, post-breach mitigation, and threat modeling strategy consulting.',
      type: 'defeat'
    },
    {
      title: 'AI Security & LLM Red Teaming',
      text: 'Testing machine learning models against prompt injection, model inversion, data poisoning, and unauthorized access vector exploitation.',
      type: 'shield'
    }
  ];

  return (
    <div className="services">
      <div className="back mb-8">
        <a href="/" className="hover-effect">Back to Home</a>
      </div>

      <h1 className="services-title font-normal tracking-tight">Services</h1>

      <div className="services-grid">
        {serviceItems.map((item, idx) => (
          <div key={item.title} className="services-item">
            <div className="services-item__poster relative rounded-xl border border-white/10 overflow-hidden">
              <CyberCanvas type={item.type} />
            </div>
            <h3 className="services-item__title font-normal text-2xl">{item.title}</h3>
            <p className="services-item__text">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
