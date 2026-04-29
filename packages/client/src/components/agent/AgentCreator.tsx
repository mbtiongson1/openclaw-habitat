import React, { useState } from 'react';
import AgentSVG from '../../svg/AgentSVG';
import './AgentCreator.css';

const HEADS = ['round', 'square', 'triangle', 'blob', 'star'];
const BODIES = ['standard', 'chunky', 'slim', 'robed'];
const HANDS = ['mitten', 'claw', 'circle', 'pointed'];
const FEET = ['boot', 'round', 'spike', 'flipper'];
const FACES = ['calm', 'focused', 'bright'];
const TOOLS = ['none', 'scanner', 'clipboard', 'watering can'];
const ZONES = ['lounge', 'kitchen', 'nursery', 'garden'];

interface AgentCreatorProps {
  onClose: () => void;
  onCreate: (config: any) => void;
}

export function AgentCreator({ onClose, onCreate }: AgentCreatorProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('Helpful and diligent');
  const [zone, setZone] = useState('lounge');
  const [head, setHead] = useState(HEADS[0]);
  const [body, setBody] = useState(BODIES[0]);
  const [hands, setHands] = useState(HANDS[0]);
  const [feet, setFeet] = useState(FEET[0]);
  const [face, setFace] = useState(FACES[0]);
  const [tool, setTool] = useState(TOOLS[0]);

  const handleSubmit = () => {
    onCreate({
      name,
      personality,
      zone,
      svgParts: { head, body, hands, feet },
      spriteStyle: { face, tool },
    });
    onClose();
  };

  return (
    <div className="agent-creator-overlay fade-in">
      <div className="agent-creator">
        <header className="agent-creator__header">
          <h2>Create New Agent</h2>
          <button className="icon-btn" aria-label="Close agent creator" onClick={onClose}>x</button>
        </header>

        <div className="agent-creator__content">
          <div className="agent-creator__preview">
            <div role="img" aria-label="Agent sprite preview" className="agent-creator__sprite-stage">
              <AgentSVG size={150} head={head} body={body} hands={hands} feet={feet} state="idle" />
              {tool !== 'none' && <span className="agent-creator__tool">{tool}</span>}
            </div>
            <div className="agent-creator__step-indicator">Step {step} of 3</div>
            <div className="agent-creator__selected-parts">
              <span>Head: {head}</span>
              <span>Body: {body}</span>
              <span>Face: {face}</span>
              <span>Tool: {tool}</span>
            </div>
          </div>

          <div className="agent-creator__form">
            {step === 1 && (
              <div className="form-step fade-in">
                <h3>Sprite Identity</h3>
                <VariantGroup label="Head" values={HEADS} selected={head} onSelect={setHead} />
                <VariantGroup label="Body" values={BODIES} selected={body} onSelect={setBody} />
                <VariantGroup label="Hands" values={HANDS} selected={hands} onSelect={setHands} />
                <VariantGroup label="Feet" values={FEET} selected={feet} onSelect={setFeet} />
                <VariantGroup label="Face" values={FACES} selected={face} onSelect={setFace} />
                <VariantGroup label="Tool" values={TOOLS} selected={tool} onSelect={setTool} />
              </div>
            )}

            {step === 2 && (
              <div className="form-step fade-in">
                <h3>Identity</h3>
                <label>
                  Name
                  <input type="text" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. BMO" autoFocus />
                </label>
                <label>
                  Personality
                  <input type="text" value={personality} onChange={event => setPersonality(event.target.value)} placeholder="e.g. Cheerful" />
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="form-step fade-in">
                <h3>Placement</h3>
                <label>
                  Initial Zone
                  <select value={zone} onChange={event => setZone(event.target.value)}>
                    {ZONES.map(candidate => <option key={candidate} value={candidate}>{candidate.charAt(0).toUpperCase() + candidate.slice(1)}</option>)}
                  </select>
                </label>
                <div className="summary-box mt-4">
                  <p><strong>Agent:</strong> {name || 'Unnamed'}</p>
                  <p><strong>Personality:</strong> {personality}</p>
                  <p><strong>Sprite:</strong> {head}/{body}/{hands}/{feet}/{face}/{tool}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="agent-creator__footer">
          {step > 1 ? (
            <button className="btn btn--outline" onClick={() => setStep(step - 1)}>Back</button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button className="btn btn--primary" onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <button className="btn btn--primary" onClick={handleSubmit} disabled={!name.trim()}>
              Spawn Agent
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function VariantGroup({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <section className="agent-creator__variant-group" aria-label={`${label} variants`}>
      <div className="agent-creator__variant-label">{label}</div>
      <div className="agent-creator__variant-options">
        {values.map(value => (
          <button
            key={value}
            type="button"
            aria-label={`Choose ${label.toLowerCase()} ${value}`}
            aria-pressed={selected === value}
            className={selected === value ? 'is-selected' : ''}
            onClick={() => onSelect(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </section>
  );
}
