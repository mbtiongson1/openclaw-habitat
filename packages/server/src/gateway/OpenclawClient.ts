/**
 * OpenclawClient — Stub for future live Openclaw Gateway connection.
 *
 * The real implementation would:
 * 1. Connect to ws://127.0.0.1:18789
 * 2. Handle connect.challenge auth handshake with token
 * 3. Subscribe to agent, presence, health, chat.delta events
 * 4. Normalize raw events via the transform pattern (events.ts)
 *
 * For now, this is a placeholder. The MockGateway covers development needs.
 */
export class OpenclawClient {
  connect(): never {
    throw new Error(
      'OpenclawClient is not yet implemented. Use MockGateway for development. ' +
      'Live gateway connection is planned for v0.7.0.'
    );
  }
}
