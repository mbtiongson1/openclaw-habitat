import React, { useEffect, useState } from 'react';
import AgentSVG from '../../svg/AgentSVG';
import { BoostMeter } from '../kitchen/BoostMeter';
import { type Agent } from '../../hooks/useAgents';
import './AgentPage.css';

interface AgentPageProps {
  agent: Agent;
  onClose: () => void;
  onChat: (agentId: string, text: string) => void;
}

export function AgentPage({ agent, onClose, onChat }: AgentPageProps) {
  const [feedingLog, setFeedingLog] = useState<string>('');
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: string, text: string }[]>([
    { sender: 'agent', text: 'Hello! I am ready for tasks.' }
  ]);

  // Fetch feeding history
  useEffect(() => {
    fetch(`/api/agents/${agent.config.id}/feeding-log`)
      .then(res => res.text())
      .then(text => setFeedingLog(text))
      .catch(console.error);
  }, [agent.config.id]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatLog(prev => [...prev, { sender: 'user', text: chatInput }]);
    onChat(agent.config.id, chatInput);
    
    // Simulate immediate mock response since our mock WS just echoes back
    setTimeout(() => {
      setChatLog(prev => [...prev, { sender: 'agent', text: `[Mock] I received: "${chatInput}"` }]);
    }, 500);

    setChatInput('');
  };

  // Simple markdown parser for the feeding history stub
  const parseMarkdownRow = (line: string, i: number) => {
    if (line.startsWith('## ')) return <h4 key={i}>{line.replace('## ', '')}</h4>;
    if (line.startsWith('# ')) return <h3 key={i}>{line.replace('# ', '')}</h3>;
    if (line.startsWith('- **')) {
      const parts = line.replace('- **', '').split('**');
      return (
        <div key={i} className="feeding-log-item">
          <strong>{parts[0]}</strong>{parts[1]}
        </div>
      );
    }
    if (line.trim() === '') return <br key={i} />;
    return <p key={i}>{line}</p>;
  };

  const tasksPercentage = Math.min((agent.stats.tasksCompleted / 100) * 100, 100);

  return (
    <div className="agent-page-modal fade-in">
      <div className="agent-page">
        <header className="agent-page__header">
          <div className="agent-page__avatar">
            <AgentSVG 
              size={120} 
              head={agent.config.svgParts.head} 
              body={agent.config.svgParts.body} 
              hands={agent.config.svgParts.hands} 
              feet={agent.config.svgParts.feet} 
              state="idle" 
            />
          </div>
          <div className="agent-page__title-area">
            <h2 className="agent-page__name">{agent.config.name}</h2>
            <div className="agent-page__badges">
              <span className="badge badge--zone">Zone: {agent.zone}</span>
              <span className="badge badge--state">State: {agent.state}</span>
            </div>
          </div>
          <button className="agent-page__close" onClick={onClose}>&times;</button>
        </header>

        <div className="agent-page__content">
          <section className="agent-page__stats">
            <h3>System Status</h3>
            <BoostMeter label="CPU Usage" value={agent.stats.cpu} />
            <BoostMeter label="Memory" value={agent.stats.memory} />
            <BoostMeter label="Tasks Completed" value={tasksPercentage} />

            {agent.activeBoosts.length > 0 && (
              <div className="agent-page__boosts">
                <h4 style={{marginTop: 'var(--space-md)', color: 'var(--primary)'}}>Active Boosts</h4>
                {agent.activeBoosts.map((b, i) => (
                  <div key={i} className="active-boost p-sm" style={{ border: '1px solid var(--outline-variant)', marginBottom: '4px' }}>
                    ✨ +{b.value}% {b.type} (expires in {Math.round((b.expiresAt - Date.now()) / 60000)}m)
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="agent-page__history">
            <h3>Feeding History</h3>
            <div className="agent-page__log-container">
              {feedingLog ? (
                feedingLog.split('\n').map(parseMarkdownRow)
              ) : (
                <p className="text-secondary">No feeding history yet. Feed this agent from the Kitchen!</p>
              )}
            </div>
          </section>

          <section className="agent-page__chat">
            <h3>Comm-Link</h3>
            <div className="chat-window">
              <div className="chat-log">
                {chatLog.map((msg, i) => (
                  <div key={i} className={`chat-message chat-message--${msg.sender}`}>
                    {msg.text}
                  </div>
                ))}
              </div>
              <form className="chat-input-row" onSubmit={handleSendChat}>
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  placeholder="Send instructions..." 
                  className="chat-input"
                />
                <button type="submit" className="btn btn--primary">Send</button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
