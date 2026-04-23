import {
  type AgentModelStrategy,
  type ModelDescriptor,
  type ModelQuickSwitchState,
  type ModelRecommendation,
  type ModelRecommendationReason,
} from '@habitat/shared';

type StrategyIntent = 'planning' | 'quick_task' | 'fallback';

const REASON_LABELS: Record<ModelRecommendationReason, string> = {
  most_used: 'Most Used',
  available_now: 'Available',
  favorite: 'Favorite',
  last_used: 'Last Used',
  strategy_slot_match: 'Best Match',
};

export class ModelRecommendationService {
  recommend(
    catalog: ModelDescriptor[],
    quickSwitch: ModelQuickSwitchState,
    strategy: AgentModelStrategy,
    intent: StrategyIntent = 'planning'
  ): ModelRecommendation[] {
    const slotId = intent === 'planning'
      ? strategy.planningModelId
      : intent === 'quick_task'
        ? strategy.quickTaskModelId
        : strategy.fallbackModelId;

    return catalog
      .map((model): ModelRecommendation => {
        let score = model.availability.installed && model.availability.reachable ? 100 : 10;
        let reason: ModelRecommendationReason = 'available_now';

        if (quickSwitch.favorites.includes(model.id)) {
          score += 50;
          reason = 'favorite';
        }

        const mostUsed = quickSwitch.mostUsed.find(item => item.modelId === model.id);
        if (mostUsed) {
          score += mostUsed.count * 6;
          if (reason !== 'favorite') reason = 'most_used';
        }

        const lastUsedIndex = quickSwitch.lastUsed.findIndex(id => id === model.id);
        if (lastUsedIndex !== -1) {
          score += Math.max(0, 25 - lastUsedIndex * 4);
          if (!mostUsed && reason !== 'favorite') reason = 'last_used';
        }

        if (model.id === slotId) {
          score += 20;
          if (reason === 'available_now') reason = 'strategy_slot_match';
        }

        if (!model.availability.reachable) {
          score -= 80;
        }

        return {
          modelId: model.id,
          reason,
          score,
          label: REASON_LABELS[reason],
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }
}
