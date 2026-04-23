import React from 'react';
import { type ModelOperationEvent } from '@habitat/shared';

interface Props {
  events: ModelOperationEvent[];
}

export function AgentEventLog({ events }: Props) {
  if (events.length === 0) {
    return <div className="agent-event-log-empty">No recent model events.</div>;
  }

  // Ensure they are sorted reverse chronological (newest first)
  const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="agent-event-log-container">
      <h4>Recent Model Events</h4>
      <ul className="agent-event-log">
        {sorted.map((event) => (
          <li key={event.id} className={`event-item severity-${event.severity}`}>
            <div className="event-meta">
              <span className="event-time">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              <span className={`event-badge type-${event.eventType}`}>
                {event.eventType.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="event-message">{event.message}</div>
            {event.fromModelId && event.toModelId && (
              <div className="event-transition">
                {event.fromModelId} → {event.toModelId}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
