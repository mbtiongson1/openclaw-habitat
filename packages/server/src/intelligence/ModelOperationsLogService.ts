import { EventEmitter } from 'events';
import fs from 'node:fs';
import path from 'node:path';
import { type ModelOperationEvent, type ModelOperationEventType } from '@habitat/shared';

interface LogState {
  agent: Record<string, ModelOperationEvent[]>;
  global: ModelOperationEvent[];
}

export class ModelOperationsLogService extends EventEmitter {
  private state: LogState = { agent: {}, global: [] };
  private readonly filePath: string;

  constructor(private readonly storageDir: string) {
    super();
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    this.filePath = path.join(storageDir, 'model-operations.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        this.state = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load model operations log:', error);
      this.state = { agent: {}, global: [] };
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('Failed to save model operations log:', error);
    }
  }

  append(event: ModelOperationEvent): void {
    if (event.agentId) {
      const agentEvents = this.state.agent[event.agentId] ?? [];
      this.state.agent[event.agentId] = [event, ...agentEvents].slice(0, 100);
    }
    
    this.state.global = [event, ...this.state.global].slice(0, 500);
    this.save();
    this.emit('event_logged', event);
  }

  listAgentEvents(agentId: string): ModelOperationEvent[] {
    return this.state.agent[agentId] ?? [];
  }

  listGlobalEvents(filters: { severity?: string, eventType?: string, agentId?: string, limit?: number } = {}): ModelOperationEvent[] {
    let events = this.state.global;

    if (filters.severity) {
      events = events.filter(e => e.severity === filters.severity);
    }
    if (filters.eventType) {
      events = events.filter(e => e.eventType === filters.eventType);
    }
    if (filters.agentId) {
      events = events.filter(e => e.agentId === filters.agentId);
    }

    if (filters.limit) {
      events = events.slice(0, filters.limit);
    }

    return events;
  }
}
