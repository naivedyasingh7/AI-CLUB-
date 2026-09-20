import React, { useState } from 'react';
import CyberCanvas from '../components/Canvases/CyberCanvas';

export default function ContactsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    consent: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill out all required fields.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="contacts min-h-screen">
      <div className="contacts-video hidden md:flex">
        <CyberCanvas type="shield" />
        <div className="contacts-access absolute text-center z-10">
          <b className="font-mono text-xs uppercase text-cyan-300">Secure Channel</b>
          <p className="font-mono text-[10px] uppercase opacity-70 mt-2">End-to-End Encrypted Advisory Request</p>
        </div>
      </div>

      <div className="contacts-main flex-1 p-12 flex flex-col justify-between">
        <div className="contacts-head">
          <div className="back mb-4">
            <a href="/" className="hover-effect">Back to Home</a>
          </div>
          <h1 className="contacts-title font-normal text-6xl">Get in Touch</h1>
          <p className="contacts-desc text-base opacity-70 font-light mt-2">
            Schedule a confidential cyberattack simulation assessment with our lead white-hat team.
          </p>
        </div>

        {submitted ? (
          <div className="my-12 p-8 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-center">
            <h3 className="text-2xl font-normal text-cyan-300 mb-2">Request Received</h3>
            <p className="text-sm font-mono text-cyan-100/80">Our senior red-team lead will contact you via PGP / encrypted email within 24 hours.</p>
          </div>
        ) : (
          <form className="contacts-form my-8 flex flex-col gap-8" onSubmit={handleSubmit}>
            <div className="label">
              <span>Name *</span>
              <input 
                type="text" 
                placeholder="John Doe" 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <div className="label-line"></div>
            </div>

            <div className="contacts-form__row flex gap-6">
              <div className="label flex-1">
                <span>Email *</span>
                <input 
                  type="email" 
                  placeholder="john@company.com" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <div className="label-line"></div>
              </div>

              <div className="label flex-1">
                <span>Company</span>
                <input 
                  type="text" 
                  placeholder="Enterprise Inc." 
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
                <div className="label-line"></div>
              </div>
            </div>

            <div className="label">
              <span>Message *</span>
              <textarea 
                placeholder="Describe your infrastructure and assessment requirements..." 
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              ></textarea>
              <div className="label-line"></div>
            </div>

            <div className="contacts-checkbox flex items-center gap-3">
              <input 
                type="checkbox" 
                id="consent" 
                required
                checked={formData.consent}
                onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
              />
              <label htmlFor="consent" className="text-xs font-mono opacity-80 cursor-pointer">
                I agree to the confidential processing of this inquiry under standard non-disclosure terms.
              </label>
            </div>

            <button type="submit" className="contacts-button mt-4">
              Submit Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
