import fs from 'fs';
import path from 'path';
import os from 'os';
import { type ConfigSnapshot, type AgentConfig } from '@habitat/shared';

const CONFIG_DIR = path.join(os.homedir(), '.openclaw-habitat');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const SNAPSHOTS_DIR = path.join(CONFIG_DIR, 'snapshots');

interface HabitatConfig {
  version: string;
  gateway: {
    host: string;
    port: number;
    token: string;
  };
  bridge: {
    port: number;
  };
  tunnel: {
    provider: 'tailscale' | 'cloudflare' | 'none';
  };
  agents: AgentConfig[];
  preferences: Record<string, any>;
}

const DEFAULT_CONFIG: HabitatConfig = {
  version: '0.1.0',
  gateway: {
    host: '127.0.0.1',
    port: 18789,
    token: '',
  },
  bridge: {
    port: 3001,
  },
  tunnel: {
    provider: 'none',
  },
  agents: [],
  preferences: {},
};

/**
 * ConfigStore — memory node pattern.
 * Namespace-scoped persistent state with snapshot/restore.
 */
export class ConfigStore {
  private config: HabitatConfig;

  constructor() {
    this.config = this.load();
  }

  private load(): HabitatConfig {
    try {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
      fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });

      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error('Failed to load config, using defaults:', err);
    }
    return { ...DEFAULT_CONFIG };
  }

  private save(): void {
    try {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  }

  get<K extends keyof HabitatConfig>(key: K): HabitatConfig[K] {
    return this.config[key];
  }

  set<K extends keyof HabitatConfig>(key: K, value: HabitatConfig[K]): void {
    this.config[key] = value;
    this.save();
  }

  getAll(): HabitatConfig {
    return { ...this.config };
  }

  getPreference<T>(key: string, fallback: T): T {
    const value = this.config.preferences[key];
    return value === undefined ? fallback : value;
  }

  setPreference<T>(key: string, value: T): void {
    this.config.preferences[key] = value;
    this.save();
  }

  // --- Snapshot System ---

  saveSnapshot(): ConfigSnapshot {
    const snapshot: ConfigSnapshot = {
      version: this.config.version,
      timestamp: Date.now(),
      agents: this.config.agents,
      globalPreferences: this.config.preferences,
    };

    const filename = `${this.config.version}_${snapshot.timestamp}.json`;
    const filepath = path.join(SNAPSHOTS_DIR, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save snapshot:', err);
    }

    return snapshot;
  }

  listSnapshots(): ConfigSnapshot[] {
    try {
      const files = fs.readdirSync(SNAPSHOTS_DIR).filter(f => f.endsWith('.json'));
      return files.map(f => {
        const raw = fs.readFileSync(path.join(SNAPSHOTS_DIR, f), 'utf-8');
        return JSON.parse(raw);
      }).sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }

  restoreSnapshot(timestamp: number): boolean {
    try {
      const files = fs.readdirSync(SNAPSHOTS_DIR);
      const match = files.find(f => f.includes(`_${timestamp}.json`));
      if (!match) return false;

      const raw = fs.readFileSync(path.join(SNAPSHOTS_DIR, match), 'utf-8');
      const snapshot: ConfigSnapshot = JSON.parse(raw);

      this.config.agents = snapshot.agents;
      this.config.preferences = snapshot.globalPreferences;
      this.save();
      return true;
    } catch {
      return false;
    }
  }
}
