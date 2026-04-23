import { EventEmitter } from 'events';
import { type ModelQuickSwitchState } from '@habitat/shared';
import { ConfigStore } from '../config/ConfigStore.js';

type StoredQuickSwitch = Record<string, ModelQuickSwitchState>;

const DEFAULT_STATE: ModelQuickSwitchState = {
  favorites: [],
  lastUsed: [],
  mostUsed: [],
};

export class ModelQuickSwitchService extends EventEmitter {
  private readonly preferenceKey = 'agentModelQuickSwitch';
  private state: StoredQuickSwitch;

  constructor(private readonly configStore: ConfigStore) {
    super();
    this.state = this.configStore.getPreference<StoredQuickSwitch>(this.preferenceKey, {});
  }

  private persist(): void {
    this.configStore.setPreference(this.preferenceKey, this.state);
  }

  getState(agentId: string): ModelQuickSwitchState {
    if (!this.state[agentId]) {
      this.state[agentId] = { ...DEFAULT_STATE };
      this.persist();
    }

    return {
      favorites: [...this.state[agentId].favorites],
      lastUsed: [...this.state[agentId].lastUsed],
      mostUsed: this.state[agentId].mostUsed.map(item => ({ ...item })),
    };
  }

  addFavorite(agentId: string, modelId: string): ModelQuickSwitchState {
    const current = this.getState(agentId);
    if (!current.favorites.includes(modelId)) {
      current.favorites = [modelId, ...current.favorites];
    }
    this.state[agentId] = current;
    this.persist();
    this.emit('quick_switch_updated', { agentId, quickSwitch: this.getState(agentId) });
    return this.getState(agentId);
  }

  removeFavorite(agentId: string, modelId: string): ModelQuickSwitchState {
    const current = this.getState(agentId);
    current.favorites = current.favorites.filter(id => id !== modelId);
    this.state[agentId] = current;
    this.persist();
    this.emit('quick_switch_updated', { agentId, quickSwitch: this.getState(agentId) });
    return this.getState(agentId);
  }

  markUsed(agentId: string, modelId: string): ModelQuickSwitchState {
    const current = this.getState(agentId);
    current.lastUsed = [modelId, ...current.lastUsed.filter(id => id !== modelId)].slice(0, 5);

    const counts = new Map(current.mostUsed.map(item => [item.modelId, item.count]));
    counts.set(modelId, (counts.get(modelId) ?? 0) + 1);
    current.mostUsed = Array.from(counts.entries())
      .map(([id, count]) => ({ modelId: id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    this.state[agentId] = current;
    this.persist();
    this.emit('quick_switch_updated', { agentId, quickSwitch: this.getState(agentId) });
    return this.getState(agentId);
  }
}
