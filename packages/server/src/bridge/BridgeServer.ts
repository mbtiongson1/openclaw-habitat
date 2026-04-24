import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { type WSMessageEnvelope } from '@habitat/shared';
import { AgentStateManager } from './AgentStateManager.js';
import { FeedingEngine } from './FeedingEngine.js';
import { AgentIntelligenceService } from '../intelligence/AgentIntelligenceService.js';

export class BridgeServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(
    server: http.Server,
    private stateManager: AgentStateManager,
    private feedingEngine: FeedingEngine,
    private intelligenceService: AgentIntelligenceService
  ) {
    this.wss = new WebSocketServer({ server });
    this.wss.on('connection', (ws) => this.handleConnection(ws));
  }

  private handleConnection(ws: WebSocket): void {
    this.clients.add(ws);
    console.log(`🔌 Client connected (total: ${this.clients.size})`);

    // Send initial state
    const initMsg: WSMessageEnvelope = {
      type: 'init_state',
      payload: { agents: this.stateManager.getAll() },
    };
    ws.send(JSON.stringify(initMsg));

    ws.send(JSON.stringify({
      type: 'model_catalog_update',
      payload: { catalog: this.intelligenceService.getCatalog() },
    }));
    ws.send(JSON.stringify({
      type: 'agent_intelligence_init',
      payload: { snapshots: this.intelligenceService.getAllSnapshots() },
    }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        this.handleClientMessage(ws, msg);
      } catch (err) {
        console.error('Invalid WS message:', err);
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      console.log(`🔌 Client disconnected (total: ${this.clients.size})`);
    });
  }

  private handleClientMessage(ws: WebSocket, msg: any): void {
    switch (msg.type) {
      case 'create_agent':
        const agent = this.stateManager.createAgent(msg.payload);
        ws.send(JSON.stringify({ type: 'agent_update', payload: agent }));
        break;
      case 'feed_agent':
        const success = this.feedingEngine.feedAgent(msg.payload.agentId, msg.payload.snackId);
        ws.send(JSON.stringify({ type: 'feed_result', payload: { success } }));
        break;
      case 'send_chat':
        // Stub — echo back for now
        ws.send(JSON.stringify({
          type: 'chat_response',
          payload: {
            agentId: msg.payload.agentId,
            response: `[Mock] I received: "${msg.payload.text}"`,
            timestamp: Date.now()
          }
        }));
        break;
    }
  }

  broadcast(message: WSMessageEnvelope): void {
    const json = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    }
  }
}
