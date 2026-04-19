import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import { SNACK_TIERS, type SnackReward, type FeedingLogEntry } from '@habitat/shared';
import { AgentStateManager } from './AgentStateManager.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

function scoreTier(score: number): 'bronze' | 'silver' | 'gold' {
  if (score >= 9) return 'gold';
  if (score >= 6) return 'silver';
  return 'bronze';
}

function boostForTier(tier: 'bronze' | 'silver' | 'gold') {
  switch (tier) {
    case 'gold': return { type: 'processing speed', value: 15, durationMinutes: 30 };
    case 'silver': return { type: 'focus', value: 10, durationMinutes: 20 };
    case 'bronze': return { type: 'focus', value: 5, durationMinutes: 15 };
  }
}

const TIER_EMOJI = { bronze: '🥉', silver: '🥈', gold: '🏆' };

export class FeedingEngine extends EventEmitter {
  private stateManager: AgentStateManager;
  private logDir: string;

  constructor(stateManager: AgentStateManager) {
    super();
    this.stateManager = stateManager;
    this.logDir = path.join(os.homedir(), '.openclaw-habitat', 'logs');
  }

  /** Grant a snack for a completed task (critique pattern: scored 0-10) */
  grantSnack(agentId: string, taskDescription: string, score: number, nodeType?: string): SnackReward {
    const tier = scoreTier(score);
    const boost = boostForTier(tier);

    const snack: SnackReward = {
      id: uuid(),
      taskId: uuid(),
      taskDescription,
      score,
      tier,
      boostType: boost.type,
      boostValue: boost.value,
      boostDurationMinutes: boost.durationMinutes,
      timestamp: Date.now(),
      nodeType,
    };

    const agent = this.stateManager.getAgent(agentId);
    if (agent) {
      agent.pendingSnacks.push(snack);
    }

    this.emit('snack_granted', { agentId, snack });
    return snack;
  }

  /** Feed an agent a specific snack (apply the boost) */
  feedAgent(agentId: string, snackId: string): boolean {
    const agent = this.stateManager.getAgent(agentId);
    if (!agent) return false;

    const snackIndex = agent.pendingSnacks.findIndex(s => s.id === snackId);
    if (snackIndex === -1) return false;

    const snack = agent.pendingSnacks.splice(snackIndex, 1)[0];

    // Apply boost
    agent.activeBoosts.push({
      type: snack.boostType,
      value: snack.boostValue,
      expiresAt: Date.now() + snack.boostDurationMinutes * 60 * 1000,
    });

    // Log to markdown
    this.writeMarkdownLog(agentId, agent.config.name, snack);

    this.emit('boost_applied', { agentId, snack, boosts: agent.activeBoosts });
    return true;
  }

  /** Write feeding event to agent-specific markdown log */
  private writeMarkdownLog(agentId: string, agentName: string, snack: SnackReward): void {
    const agentLogDir = path.join(this.logDir, agentId);
    const logFile = path.join(agentLogDir, 'feeding.md');

    try {
      fs.mkdirSync(agentLogDir, { recursive: true });

      const date = new Date(snack.timestamp);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().slice(0, 5);
      const emoji = TIER_EMOJI[snack.tier];

      let existing = '';
      if (fs.existsSync(logFile)) {
        existing = fs.readFileSync(logFile, 'utf-8');
      } else {
        existing = `# Agent: ${agentName} — Feeding History\n\n`;
      }

      const entry = `## ${dateStr} ${timeStr} — ${snack.tier.charAt(0).toUpperCase() + snack.tier.slice(1)} Snack ${emoji}
- **Task:** ${snack.taskDescription}
- **Score:** ${snack.score}/10
- **Boost:** +${snack.boostValue}% ${snack.boostType} (${snack.boostDurationMinutes}min)

`;

      fs.writeFileSync(logFile, existing + entry, 'utf-8');
    } catch (err) {
      console.error(`Failed to write feeding log for ${agentId}:`, err);
    }
  }

  /** Get feeding history markdown for an agent */
  getFeedingLog(agentId: string): string | null {
    const logFile = path.join(this.logDir, agentId, 'feeding.md');
    try {
      return fs.readFileSync(logFile, 'utf-8');
    } catch {
      return null;
    }
  }

  /** Decay expired boosts (called on interval) */
  decayBoosts(): void {
    const now = Date.now();
    for (const agent of this.stateManager.getAll()) {
      const before = agent.activeBoosts.length;
      agent.activeBoosts = agent.activeBoosts.filter(b => b.expiresAt > now);
      if (agent.activeBoosts.length !== before) {
        this.emit('boost_applied', { agentId: agent.config.id, boosts: agent.activeBoosts });
      }
    }
  }
}
