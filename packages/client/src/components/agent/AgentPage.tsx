import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  AGENT_PERSONALITIES,
  SVG_BODY_TYPES,
  SVG_FOOT_TYPES,
  SVG_HAND_TYPES,
  SVG_HEAD_TYPES,
  type AgentConfigPatch,
  type AgentIntelligenceSnapshot,
  type AgentModelStrategy,
  type ModelDescriptor,
  type ModelRecommendation,
} from '@habitat/shared';
import AgentSVG from '../../svg/AgentSVG';
import { type Agent } from '../../hooks/useAgents';
import { useAgentIntelligence } from '../../hooks/useAgentIntelligence';
import { useWebSocket } from '../../hooks/useWebSocket';
import { ModelRecoveryPrompt } from './ModelRecoveryPrompt';
import { AgentEventLog } from './AgentEventLog';
import './AgentPage.css';

interface AgentPageProps {
  agent: Agent;
  ws: ReturnType<typeof useWebSocket>;
  onClose: () => void;
  onChat: (agentId: string, text: string) => void;
}

type PanelTab = 'intelligence' | 'chat' | 'history';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

function formatTokenRate(value: number): string {
  return `${value.toFixed(1)} t/s`;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function iconForModel(model: ModelDescriptor | undefined): string {
  return model?.origin === 'local' ? 'memory' : 'cloud';
}

function labelForAvailability(model: ModelDescriptor, activeModelId: string): string {
  if (model.id === activeModelId) return 'Active';
  if (!model.availability.installed) return 'Not Installed';
  if (!model.availability.reachable) return 'Offline';
  return 'Available';
}

function recommendationChips(
  recommendation: ModelRecommendation,
  snapshot: AgentIntelligenceSnapshot,
  model: ModelDescriptor
): string[] {
  const chips = [recommendation.label];
  if (snapshot.quickSwitch.favorites.includes(model.id)) chips.push('Favorite');
  if (snapshot.quickSwitch.lastUsed.includes(model.id)) chips.push('Last Used');
  if (snapshot.quickSwitch.mostUsed.find(item => item.modelId === model.id)) chips.push('Most Used');
  if (snapshot.strategy.planningModelId === model.id) chips.push('Planning');
  return Array.from(new Set(chips)).slice(0, 3);
}

function LoadingBlock({ className = '' }: { className?: string }) {
  return <div className={`agent-page__loading ${className}`.trim()} />;
}

function QuickSwitchRow({
  title,
  modelIds,
  snapshot,
  onSwitch,
  pendingModelId,
}: {
  title: string;
  modelIds: string[];
  snapshot: AgentIntelligenceSnapshot;
  onSwitch: (modelId: string) => void;
  pendingModelId: string | null;
}) {
  const models = modelIds
    .map(id => snapshot.catalog.find(model => model.id === id))
    .filter((model): model is ModelDescriptor => !!model);

  return (
    <div className="agent-page__row-group">
      <div className="agent-page__section-head">
        <h4>{title}</h4>
      </div>
      <div className="agent-page__chip-row">
        {models.length === 0 && <span className="agent-page__muted">No models yet.</span>}
        {models.map(model => (
          <button
            key={`${title}-${model.id}`}
            className={`agent-page__quick-pill ${snapshot.telemetry.activeModelId === model.id ? 'is-active' : ''}`}
            onClick={() => onSwitch(model.id)}
            disabled={pendingModelId === model.id}
          >
            <span className="material-symbols-outlined">{iconForModel(model)}</span>
            <span>{model.displayName}</span>
            {pendingModelId === model.id && <span className="agent-page__mini-spinner" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function StrategySelect({
  label,
  value,
  catalog,
  onChange,
}: {
  label: string;
  value: string;
  catalog: ModelDescriptor[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="agent-page__strategy-field">
      <span>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)}>
        {catalog.map(model => (
          <option key={`${label}-${model.id}`} value={model.id}>
            {model.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AgentPage({ agent, ws, onClose, onChat }: AgentPageProps) {
  const [feedingLog, setFeedingLog] = useState<string>('');
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<PanelTab>('intelligence');
  const [chatLog, setChatLog] = useState<{ sender: string; text: string }[]>([
    { sender: 'agent', text: 'Telemetry online. Ready for tasking.' },
  ]);
  const [characteristicsDraft, setCharacteristicsDraft] = useState({
    name: agent.config.name,
    personality: agent.config.personality,
    svgParts: agent.config.svgParts,
  });
  const [savingCharacteristics, setSavingCharacteristics] = useState(false);
  const [characteristicsStatus, setCharacteristicsStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const {
    snapshot,
    loading,
    searching,
    searchResults,
    switchingModelId,
    updatingStrategy,
    favoritePendingId,
    pullJobs,
    recoveryState,
    setActiveModel,
    updateStrategy,
    toggleFavorite,
    searchLocalModels,
    pullLocalModel,
    clearRecovery,
  } = useAgentIntelligence(agent.config.id, ws);

  useEffect(() => {
    fetch(`/api/agents/${agent.config.id}/feeding-log`)
      .then(res => res.text())
      .then(text => setFeedingLog(text))
      .catch(console.error);
  }, [agent.config.id]);

  useEffect(() => {
    setCharacteristicsDraft({
      name: agent.config.name,
      personality: agent.config.personality,
      svgParts: agent.config.svgParts,
    });
    setCharacteristicsStatus(null);
  }, [agent.config.id, agent.config.name, agent.config.personality, agent.config.svgParts]);

  useEffect(() => {
    const handle = setTimeout(() => {
      searchLocalModels(deferredSearchQuery).catch(console.error);
    }, 250);
    return () => clearTimeout(handle);
  }, [deferredSearchQuery, searchLocalModels]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatLog(prev => [...prev, { sender: 'user', text: chatInput }]);
    onChat(agent.config.id, chatInput);
    setTimeout(() => {
      setChatLog(prev => [...prev, { sender: 'agent', text: `[Mock] I received: "${chatInput}"` }]);
    }, 500);
    setChatInput('');
  };

  const parseMarkdownRow = (line: string, i: number) => {
    if (line.startsWith('## ')) return <h4 key={i}>{line.replace('## ', '')}</h4>;
    if (line.startsWith('# ')) return <h3 key={i}>{line.replace('# ', '')}</h3>;
    if (line.startsWith('- **')) {
      const parts = line.replace('- **', '').split('**');
      return (
        <div key={i} className="feeding-log-item">
          <strong>{parts[0]}</strong>
          {parts[1]}
        </div>
      );
    }
    if (line.trim() === '') return <br key={i} />;
    return <p key={i}>{line}</p>;
  };

  const currentModel = snapshot?.catalog.find(model => model.id === snapshot.telemetry.activeModelId);
  const mostUsedIds = useMemo(
    () => snapshot?.quickSwitch.mostUsed.map(item => item.modelId) ?? [],
    [snapshot]
  );

  const patchStrategy = async (patch: Partial<AgentModelStrategy>) => {
    if (!snapshot) return;
    const nextStrategy: AgentModelStrategy = {
      ...snapshot.strategy,
      ...patch,
      switchRules: {
        ...snapshot.strategy.switchRules,
        ...patch.switchRules,
      },
    };
    await updateStrategy(nextStrategy);
  };

  const patchCharacteristic = <K extends keyof typeof characteristicsDraft>(
    key: K,
    value: (typeof characteristicsDraft)[K]
  ) => {
    setCharacteristicsDraft(prev => ({ ...prev, [key]: value }));
    setCharacteristicsStatus(null);
  };

  const patchSvgPart = (part: keyof typeof characteristicsDraft.svgParts, value: string) => {
    setCharacteristicsDraft(prev => ({
      ...prev,
      svgParts: {
        ...prev.svgParts,
        [part]: value,
      },
    }));
    setCharacteristicsStatus(null);
  };

  const saveCharacteristics = async (event: React.FormEvent) => {
    event.preventDefault();
    const patch: AgentConfigPatch = {
      name: characteristicsDraft.name.trim(),
      personality: characteristicsDraft.personality,
      svgParts: characteristicsDraft.svgParts,
    };

    setSavingCharacteristics(true);
    setCharacteristicsStatus(null);
    try {
      const response = await fetch(`/api/agents/${agent.config.id}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        throw new Error('Failed to save characteristics');
      }
      setCharacteristicsStatus('Saved');
    } catch (error) {
      setCharacteristicsStatus(error instanceof Error ? error.message : 'Failed to save characteristics');
    } finally {
      setSavingCharacteristics(false);
    }
  };

  return (
    <div className="agent-page-modal fade-in">
      <div className="agent-page agent-page--intelligence">
        <header className="agent-page__header agent-page__header--intelligence">
          <div className="agent-page__avatar agent-page__avatar--intelligence">
            <AgentSVG
              size={110}
              head={agent.config.svgParts.head}
              body={agent.config.svgParts.body}
              hands={agent.config.svgParts.hands}
              feet={agent.config.svgParts.feet}
              state="idle"
            />
          </div>
          <div className="agent-page__title-area">
            <p className="agent-page__eyebrow">Per-Agent Intelligence</p>
            <h2 className="agent-page__name">{agent.config.name}</h2>
            <div className="agent-page__badges">
              <span className="badge badge--zone">Zone: {agent.zone}</span>
              <span className="badge badge--state">State: {agent.state}</span>
              <span className="badge badge--model">
                <span className="material-symbols-outlined">{iconForModel(currentModel)}</span>
                {currentModel?.displayName ?? 'Loading model'}
              </span>
            </div>
          </div>
          <button className="agent-page__close" onClick={onClose} aria-label="Close agent intelligence">
            &times;
          </button>
        </header>

        <nav className="agent-page__tabbar">
          {(['intelligence', 'chat', 'history'] as PanelTab[]).map(tab => (
            <button
              key={tab}
              className={activeTab === tab ? 'is-active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="agent-page__content agent-page__content--intelligence">
          {(activeTab === 'intelligence') && (
            <>
              {recoveryState && (
                <ModelRecoveryPrompt
                  recoveryState={recoveryState}
                  onUseFallback={(id) => setActiveModel(id).catch(console.error)}
                  onRetry={() => setActiveModel(recoveryState.requestedModelId).catch(console.error)}
                  onDownload={(id) => pullLocalModel(id).catch(console.error)}
                />
              )}

              <section className="agent-page__panel">
                <div className="agent-page__section-head">
                  <h3>Editable Characteristics</h3>
                  <span className="agent-page__muted">
                    {characteristicsStatus ?? 'Name, personality, and editable sprite parts.'}
                  </span>
                </div>
                <form className="agent-page__character-form" onSubmit={saveCharacteristics}>
                  <label className="agent-page__strategy-field">
                    <span>Agent name</span>
                    <input
                      aria-label="Agent name"
                      value={characteristicsDraft.name}
                      onChange={event => patchCharacteristic('name', event.target.value)}
                    />
                  </label>
                  <label className="agent-page__strategy-field">
                    <span>Personality</span>
                    <select
                      aria-label="Personality"
                      value={characteristicsDraft.personality}
                      onChange={event => patchCharacteristic('personality', event.target.value)}
                    >
                      {AGENT_PERSONALITIES.map(personality => (
                        <option key={personality.id} value={personality.id}>{personality.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="agent-page__strategy-field">
                    <span>Head shape</span>
                    <select
                      aria-label="Head shape"
                      value={characteristicsDraft.svgParts.head}
                      onChange={event => patchSvgPart('head', event.target.value)}
                    >
                      {SVG_HEAD_TYPES.map(part => <option key={part} value={part}>{part}</option>)}
                    </select>
                  </label>
                  <label className="agent-page__strategy-field">
                    <span>Body shape</span>
                    <select
                      aria-label="Body shape"
                      value={characteristicsDraft.svgParts.body}
                      onChange={event => patchSvgPart('body', event.target.value)}
                    >
                      {SVG_BODY_TYPES.map(part => <option key={part} value={part}>{part}</option>)}
                    </select>
                  </label>
                  <label className="agent-page__strategy-field">
                    <span>Hands</span>
                    <select
                      aria-label="Hands"
                      value={characteristicsDraft.svgParts.hands}
                      onChange={event => patchSvgPart('hands', event.target.value)}
                    >
                      {SVG_HAND_TYPES.map(part => <option key={part} value={part}>{part}</option>)}
                    </select>
                  </label>
                  <label className="agent-page__strategy-field">
                    <span>Feet</span>
                    <select
                      aria-label="Feet"
                      value={characteristicsDraft.svgParts.feet}
                      onChange={event => patchSvgPart('feet', event.target.value)}
                    >
                      {SVG_FOOT_TYPES.map(part => <option key={part} value={part}>{part}</option>)}
                    </select>
                  </label>
                  <div className="agent-page__form-actions">
                    <button className="btn btn--primary" type="submit" disabled={savingCharacteristics}>
                      {savingCharacteristics ? 'Saving...' : 'Save Characteristics'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="agent-page__panel agent-page__panel--telemetry">
                <div className="agent-page__section-head">
                  <h3>Real-time Telemetry</h3>
                  {currentModel?.links?.usageUrl && (
                    <a href={currentModel.links.usageUrl} target="_blank" rel="noreferrer">
                      View API Usage
                    </a>
                  )}
                </div>
                {!snapshot || loading ? (
                  <div className="agent-page__metric-grid">
                    <LoadingBlock className="agent-page__metric-card" />
                    <LoadingBlock className="agent-page__metric-card" />
                    <LoadingBlock className="agent-page__metric-card" />
                    <LoadingBlock className="agent-page__metric-card agent-page__metric-card--wide" />
                  </div>
                ) : (
                  <div className="agent-page__metric-grid">
                    <div className="agent-page__metric-card">
                      <span>Tokens</span>
                      <strong>{formatNumber(snapshot.telemetry.tokensTotal)}</strong>
                      <small>{currentModel?.displayName ?? 'Model pending'}</small>
                    </div>
                    <div className="agent-page__metric-card">
                      <span>Speed</span>
                      <strong>{formatTokenRate(snapshot.telemetry.tokensPerSecond)}</strong>
                      <small>Near real-time rate</small>
                    </div>
                    <div className="agent-page__metric-card">
                      <span>Work Time</span>
                      <strong>{formatDuration(snapshot.telemetry.workTimeMs)}</strong>
                      <small>Accumulative</small>
                    </div>
                    <div className="agent-page__metric-card agent-page__metric-card--wide">
                      <div className="agent-page__metric-head">
                        <span>Context Window</span>
                        <small>
                          {formatNumber(snapshot.telemetry.contextUsedTokens)} / {formatNumber(snapshot.telemetry.contextWindowTokens)}
                        </small>
                      </div>
                      <div className="agent-page__meter">
                        <div
                          className="agent-page__meter-fill"
                          style={{ width: `${Math.min(100, snapshot.telemetry.contextUsedPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className="agent-page__panel">
                <div className="agent-page__section-head">
                  <h3>Recommended Models</h3>
                  <span className="agent-page__muted">Ranked by availability, favorites, recents, and slot fit.</span>
                </div>
                {!snapshot || loading ? (
                  <div className="agent-page__stack">
                    <LoadingBlock className="agent-page__recommendation-card" />
                    <LoadingBlock className="agent-page__recommendation-card" />
                    <LoadingBlock className="agent-page__recommendation-card" />
                  </div>
                ) : (
                  <div className="agent-page__stack">
                    {snapshot.recommendations.map(recommendation => {
                      const model = snapshot.catalog.find(candidate => candidate.id === recommendation.modelId);
                      if (!model) return null;
                      const chips = recommendationChips(recommendation, snapshot, model);
                      return (
                        <div key={recommendation.modelId} className="agent-page__recommendation-card">
                          <div>
                            <div className="agent-page__recommendation-title">
                              <span className="material-symbols-outlined">{iconForModel(model)}</span>
                              <strong>{model.displayName}</strong>
                            </div>
                            <div className="agent-page__chip-row">
                              {chips.map(chip => <span key={`${model.id}-${chip}`} className="agent-page__chip">{chip}</span>)}
                            </div>
                          </div>
                          <div className="agent-page__recommendation-actions">
                            <button
                              className="btn btn--secondary"
                              disabled={switchingModelId === model.id}
                              onClick={() => setActiveModel(model.id).catch(console.error)}
                            >
                              {switchingModelId === model.id ? 'Switching...' : 'Switch'}
                            </button>
                            <button
                              className={`agent-page__favorite ${snapshot.quickSwitch.favorites.includes(model.id) ? 'is-favorite' : ''}`}
                              disabled={favoritePendingId === model.id}
                              onClick={() => toggleFavorite(model.id, snapshot.quickSwitch.favorites.includes(model.id)).catch(console.error)}
                              aria-label="Toggle favorite"
                            >
                              <span className="material-symbols-outlined">
                                {snapshot.quickSwitch.favorites.includes(model.id) ? 'star' : 'star_outline'}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="agent-page__panel">
                <div className="agent-page__section-head">
                  <h3>Quick Switch</h3>
                  <span className="agent-page__muted">Favorites, recents, and most-used models for testing.</span>
                </div>
                {!snapshot || loading ? (
                  <div className="agent-page__stack">
                    <LoadingBlock className="agent-page__row-skeleton" />
                    <LoadingBlock className="agent-page__row-skeleton" />
                    <LoadingBlock className="agent-page__row-skeleton" />
                  </div>
                ) : (
                  <div className="agent-page__stack">
                    <QuickSwitchRow
                      title="Favorites"
                      modelIds={snapshot.quickSwitch.favorites}
                      snapshot={snapshot}
                      onSwitch={(modelId) => setActiveModel(modelId).catch(console.error)}
                      pendingModelId={switchingModelId}
                    />
                    <QuickSwitchRow
                      title="Last Used"
                      modelIds={snapshot.quickSwitch.lastUsed}
                      snapshot={snapshot}
                      onSwitch={(modelId) => setActiveModel(modelId).catch(console.error)}
                      pendingModelId={switchingModelId}
                    />
                    <QuickSwitchRow
                      title="Most Used"
                      modelIds={mostUsedIds}
                      snapshot={snapshot}
                      onSwitch={(modelId) => setActiveModel(modelId).catch(console.error)}
                      pendingModelId={switchingModelId}
                    />
                  </div>
                )}
              </section>

              <section className="agent-page__panel">
                <div className="agent-page__section-head">
                  <h3>Model Strategy</h3>
                  <span className="agent-page__muted">{updatingStrategy ? 'Saving strategy...' : '3-slot planning, quick task, fallback routing.'}</span>
                </div>
                {!snapshot || loading ? (
                  <div className="agent-page__stack">
                    <LoadingBlock className="agent-page__strategy-skeleton" />
                    <LoadingBlock className="agent-page__strategy-skeleton" />
                  </div>
                ) : (
                  <>
                    <div className="agent-page__strategy-grid">
                      <StrategySelect
                        label="Planning"
                        value={snapshot.strategy.planningModelId}
                        catalog={snapshot.catalog}
                        onChange={(value) => patchStrategy({ planningModelId: value }).catch(console.error)}
                      />
                      <StrategySelect
                        label="Quick Tasks"
                        value={snapshot.strategy.quickTaskModelId}
                        catalog={snapshot.catalog}
                        onChange={(value) => patchStrategy({ quickTaskModelId: value }).catch(console.error)}
                      />
                      <StrategySelect
                        label="Fallback"
                        value={snapshot.strategy.fallbackModelId}
                        catalog={snapshot.catalog}
                        onChange={(value) => patchStrategy({ fallbackModelId: value }).catch(console.error)}
                      />
                    </div>
                    <div className="agent-page__rule-grid">
                      <label>
                        <input
                          type="checkbox"
                          checked={snapshot.strategy.switchRules.useQuickTaskForShortTasks}
                          onChange={(event) => patchStrategy({
                            switchRules: {
                              useQuickTaskForShortTasks: event.target.checked,
                              fallbackOnQuota: snapshot.strategy.switchRules.fallbackOnQuota,
                              fallbackOnUnavailable: snapshot.strategy.switchRules.fallbackOnUnavailable,
                            },
                          }).catch(console.error)}
                        />
                        Use quick-task model for short tasks
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={snapshot.strategy.switchRules.fallbackOnQuota}
                          onChange={(event) => patchStrategy({
                            switchRules: {
                              useQuickTaskForShortTasks: snapshot.strategy.switchRules.useQuickTaskForShortTasks,
                              fallbackOnQuota: event.target.checked,
                              fallbackOnUnavailable: snapshot.strategy.switchRules.fallbackOnUnavailable,
                            },
                          }).catch(console.error)}
                        />
                        Fallback on quota reached
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={snapshot.strategy.switchRules.fallbackOnUnavailable}
                          onChange={(event) => patchStrategy({
                            switchRules: {
                              useQuickTaskForShortTasks: snapshot.strategy.switchRules.useQuickTaskForShortTasks,
                              fallbackOnQuota: snapshot.strategy.switchRules.fallbackOnQuota,
                              fallbackOnUnavailable: event.target.checked,
                            },
                          }).catch(console.error)}
                        />
                        Fallback on unavailable model
                      </label>
                    </div>
                  </>
                )}
              </section>

              <section className="agent-page__panel">
                <div className="agent-page__section-head">
                  <h3>Availability and Library</h3>
                  <span className="agent-page__muted">Installed models, local search, and pull progress.</span>
                </div>
                <div className="agent-page__search-row">
                  <span className="material-symbols-outlined">search</span>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search local models to add..."
                  />
                  {searching && <span className="agent-page__mini-spinner" />}
                </div>
                {!snapshot || loading ? (
                  <div className="agent-page__stack">
                    <LoadingBlock className="agent-page__library-skeleton" />
                    <LoadingBlock className="agent-page__library-skeleton" />
                  </div>
                ) : (
                  <>
                    <div className="agent-page__stack">
                      {snapshot.catalog.map(model => (
                        <div key={model.id} className="agent-page__library-item">
                          <div>
                            <div className="agent-page__recommendation-title">
                              <span className="material-symbols-outlined">{iconForModel(model)}</span>
                              <strong>{model.displayName}</strong>
                            </div>
                            <small>{labelForAvailability(model, snapshot.telemetry.activeModelId)}</small>
                          </div>
                          <div className="agent-page__recommendation-actions">
                            {model.origin === 'cloud' && model.links?.usageUrl && (
                              <a href={model.links.usageUrl} target="_blank" rel="noreferrer" className="agent-page__text-link">
                                Usage
                              </a>
                            )}
                            <button
                              className="btn btn--secondary"
                              disabled={switchingModelId === model.id}
                              onClick={() => setActiveModel(model.id).catch(console.error)}
                            >
                              {switchingModelId === model.id ? 'Switching...' : 'Use'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="agent-page__subsection">
                      <h4>Add Local Models</h4>
                      <div className="agent-page__stack">
                        {searchResults.map(result => {
                          const job = pullJobs[result.id];
                          return (
                            <div key={result.id} className="agent-page__library-item">
                              <div>
                                <strong>{result.displayName}</strong>
                                <small>{result.installed ? 'Installed' : `Ollama • ${result.sizeLabel}`}</small>
                              </div>
                              <div className="agent-page__recommendation-actions">
                                {job && job.status !== 'completed' ? (
                                  <div className="agent-page__pull-progress">
                                    <span>{job.progressPct}%</span>
                                    <div className="agent-page__meter">
                                      <div className="agent-page__meter-fill" style={{ width: `${job.progressPct}%` }} />
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    className="btn btn--secondary"
                                    disabled={result.installed}
                                    onClick={() => pullLocalModel(result.id).catch(console.error)}
                                  >
                                    {result.installed ? 'Installed' : 'Pull'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </section>

              <section className="agent-page__panel">
                <div className="agent-page__section-head">
                  <h3>Runtime Resources</h3>
                  <span className="agent-page__muted">{snapshot?.runtime.label ?? 'Loading runtime metrics'}</span>
                </div>
                {!snapshot || loading ? (
                  <LoadingBlock className="agent-page__runtime-skeleton" />
                ) : (
                  <div className="agent-page__resource-grid">
                    <div className="agent-page__resource-card">
                      <span>CPU</span>
                      <strong>{snapshot.telemetry.compute.cpuPct.toFixed(1)}%</strong>
                    </div>
                    <div className="agent-page__resource-card">
                      <span>RAM</span>
                      <strong>{formatBytes(snapshot.telemetry.compute.ramBytes)}</strong>
                    </div>
                    <div className="agent-page__resource-card">
                      <span>Host RAM</span>
                      <strong>{formatBytes(snapshot.runtime.ramBytes)} / {formatBytes(snapshot.runtime.totalRamBytes)}</strong>
                    </div>
                    <div className="agent-page__resource-card">
                      <span>GPU / VRAM</span>
                      <strong>
                        {snapshot.telemetry.compute.gpuPct !== undefined
                          ? `${snapshot.telemetry.compute.gpuPct}% • ${formatBytes(snapshot.telemetry.compute.vramBytes ?? 0)}`
                          : 'Cloud-side'}
                      </strong>
                    </div>
                  </div>
                )}
              </section>

              <section className="agent-page__panel">
                <AgentEventLog events={snapshot?.recentEvents ?? []} />
              </section>
            </>
          )}

          {activeTab === 'chat' && (
            <section className="agent-page__panel agent-page__panel--full">
              <div className="agent-page__section-head">
                <h3>Comm-Link</h3>
              </div>
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
          )}

          {activeTab === 'history' && (
            <section className="agent-page__panel agent-page__panel--full">
              <div className="agent-page__section-head">
                <h3>Feeding History</h3>
              </div>
              <div className="agent-page__log-container">
                {feedingLog
                  ? feedingLog.split('\n').map(parseMarkdownRow)
                  : <p className="agent-page__muted">No feeding history yet. Feed this agent from the Kitchen.</p>}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
