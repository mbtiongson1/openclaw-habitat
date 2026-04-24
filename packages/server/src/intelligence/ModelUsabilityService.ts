import { type ModelUsability, type ModelUsabilityStatus } from '@habitat/shared';

export class ModelUsabilityService {
  evaluate(input: {
    origin: 'cloud' | 'local';
    installed: boolean;
    reachable: boolean;
    quotaExhausted?: boolean;
  }): ModelUsability {
    if (!input.installed) {
      return this.failure('not_installed', 'Model is known but not installed locally');
    }
    if (!input.reachable) {
      return this.failure('runtime_unreachable', 'Model runtime is unreachable');
    }
    if (input.quotaExhausted) {
      return this.failure('quota_exhausted', 'Cloud quota is exhausted for this model');
    }
    return this.success();
  }

  private success(): ModelUsability {
    return {
      status: 'usable',
      reasonCode: 'ok',
      message: 'Model is ready to use',
      checkedAt: Date.now(),
    };
  }

  private failure(status: ModelUsabilityStatus, message: ModelUsabilityStatus | string): ModelUsability {
    return {
      status,
      reasonCode: status,
      message,
      checkedAt: Date.now(),
    };
  }
}
