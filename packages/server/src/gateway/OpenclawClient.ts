import WebSocket from 'ws';
import { AgentStateManager } from '../bridge/AgentStateManager.js';
import { AgentIntelligenceService } from '../intelligence/AgentIntelligenceService.js';
import { mapOpenclawStatus } from './events.js';

export class OpenclawClient {
  private ws: WebSocket | null = null;
  private stateManager: AgentStateManager;
  private intelligenceService: AgentIntelligenceService;

  constructor(stateManager: AgentStateManager, intelligenceService: AgentIntelligenceService) {
    this.stateManager = stateManager;
    this.intelligenceService = intelligenceService;
  }

  connect(): void {
    console.log('🔗 Connecting to Openclaw Gateway...');
    this.ws = new WebSocket('ws://127.0.0.1:18789');

    this.ws.on('open', () => {
      console.log('✅ Connected to Openclaw Gateway');
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'connect.challenge') {
          console.log('🔐 Responding to connect.challenge');
          // Respond to challenge
          this.ws?.send(JSON.stringify({
            type: 'connect.response',
            payload: { token: '' } // Replace with config token if needed
          }));
        } else if (message.type === 'agent.status' || message.type === 'agent') {
           const payload = message.payload;
           if (payload && payload.id) {
               // Create agent if not exists
               let agent = this.stateManager.getAgent(payload.id);
               if (!agent) {
                   agent = this.stateManager.createAgent({ id: payload.id, name: payload.name });
               }
               // Update state
               if (payload.status) {
                   const state = mapOpenclawStatus(payload.status);
                   this.stateManager.updateState(payload.id, state);
               }
           }
        } else if (message.type === 'presence' || message.type === 'health') {
           // For simplicity just tracking basic events.
           const payload = message.payload;
           if (payload && payload.id) {
                // Update stats if we receive health
                if (payload.cpu !== undefined || payload.memory !== undefined) {
                    this.stateManager.updateStats(payload.id, {
                        cpu: payload.cpu,
                        memory: payload.memory
                    });
                }
           }
        } else if (message.type === 'chat.delta') {
            // Can be extended later
        }

      } catch (err) {
        console.error('❌ Error parsing gateway message:', err);
      }
    });

    this.ws.on('close', () => {
      console.log('❌ Disconnected from Openclaw Gateway');
      // Attempt reconnect after delay
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (err) => {
      console.error('❌ Openclaw Gateway WebSocket error:', err);
    });
  }

  stop(): void {
      if (this.ws) {
          this.ws.close();
          this.ws = null;
      }
  }
}
