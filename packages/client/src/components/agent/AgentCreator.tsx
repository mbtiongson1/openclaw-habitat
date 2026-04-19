import React, { useState } from 'react';
import AgentSVG from '../../svg/AgentSVG';
import './AgentCreator.css';

const HEADS = ['round', 'square', 'triangle', 'blob', 'star'];
const BODIES = ['standard', 'chunky', 'slim', 'robed'];
const HANDS = ['mitten', 'claw', 'circle', 'pointed'];
const FEET = ['boot', 'round', 'spike', 'flipper'];
const ZONES = ['lounge', 'kitchen', 'nursery', 'garden'];

interface AgentCreatorProps {
  onClose: () => void;
  onCreate: (config: any) => void;
}

export function AgentCreator({ onClose, onCreate }: AgentCreatorProps) {
  const [step, setStep] = useState(1);
  
  // Form State
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('Helpful and diligent');
  const [zone, setZone] = useState('lounge');
  const [head, setHead] = useState(HEADS[0]);
  const [body, setBody] = useState(BODIES[0]);
  const [hands, setHands] = useState(HANDS[0]);
  const [feet, setFeet] = useState(FEET[0]);

  const handleRandomize = () => {
    setHead(HEADS[Math.floor(Math.random() * HEADS.length)]);
    setBody(BODIES[Math.floor(Math.random() * BODIES.length)]);
    setHands(HANDS[Math.floor(Math.random() * HANDS.length)]);
    setFeet(FEET[Math.floor(Math.random() * FEET.length)]);
  };

  const handleSubmit = () => {
    onCreate({
      name,
      personality,
      zone,
      svgParts: { head, body, hands, feet }
    });
    onClose();
  };

  return (
    <div className="agent-creator-overlay fade-in">
      <div className="agent-creator">
        <header className="agent-creator__header">
          <h2>Create New Agent</h2>
          <button className="icon-btn" onClick={onClose}>×</button>
        </header>

        <div className="agent-creator__content">
          <div className="agent-creator__preview">
            <AgentSVG size={140} head={head} body={body} hands={hands} feet={feet} state="idle" />
            <div className="agent-creator__step-indicator">Step {step} of 3</div>
          </div>

          <div className="agent-creator__form">
            {step === 1 && (
              <div className="form-step fade-in">
                <h3>Identity</h3>
                <label>
                  Name
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BMO" autoFocus />
                </label>
                <label>
                  Personality
                  <input type="text" value={personality} onChange={e => setPersonality(e.target.value)} placeholder="e.g. Cheerful" />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="form-step fade-in">
                <h3>Appearance</h3>
                <div className="controls-grid">
                  <label>
                    Head
                    <select value={head} onChange={e => setHead(e.target.value)}>
                      {HEADS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </label>
                  <label>
                    Body
                    <select value={body} onChange={e => setBody(e.target.value)}>
                      {BODIES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </label>
                  <label>
                    Hands
                    <select value={hands} onChange={e => setHands(e.target.value)}>
                      {HANDS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </label>
                  <label>
                    Feet
                    <select value={feet} onChange={e => setFeet(e.target.value)}>
                      {FEET.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </label>
                </div>
                <button className="btn btn--outline mt-4" onClick={handleRandomize}>🎲 Randomize All</button>
              </div>
            )}

            {step === 3 && (
              <div className="form-step fade-in">
                <h3>Placement</h3>
                <label>
                  Initial Zone
                  <select value={zone} onChange={e => setZone(e.target.value)}>
                    {ZONES.map(z => <option key={z} value={z}>{z.charAt(0).toUpperCase() + z.slice(1)}</option>)}
                  </select>
                </label>
                <div className="summary-box mt-4">
                  <p><strong>Agent:</strong> {name || 'Unnamed'}</p>
                  <p><strong>Personality:</strong> {personality}</p>
                  <p><strong>Parts:</strong> {head}/{body}/{hands}/{feet}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="agent-creator__footer">
          {step > 1 ? (
            <button className="btn btn--outline" onClick={() => setStep(step - 1)}>Back</button>
          ) : (
            <div /> // spacer
          )}
          
          {step < 3 ? (
            <button className="btn btn--primary" onClick={() => setStep(step + 1)} disabled={step === 1 && !name.trim()}>
              Next
            </button>
          ) : (
            <button className="btn btn--primary" onClick={handleSubmit}>
              Spawn Agent
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
