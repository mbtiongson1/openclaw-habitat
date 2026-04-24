import { type LocalModelSearchResult, type ModelDescriptor } from '@habitat/shared';
import { ModelUsabilityService } from './ModelUsabilityService.js';

const usabilityService = new ModelUsabilityService();

export interface ProviderAdapter {
  id: string;
  label: string;
  listModels(): Promise<ModelDescriptor[]>;
}

interface StaticCloudModelConfig {
  id: string;
  displayName: string;
  family: string;
  contextWindowTokens: number;
  usageUrl?: string;
}

export class StaticCloudProviderAdapter implements ProviderAdapter {
  constructor(
    public readonly id: string,
    public readonly label: string,
    private readonly models: StaticCloudModelConfig[]
  ) {}

  async listModels(): Promise<ModelDescriptor[]> {
    return this.models.map(model => ({
      id: model.id,
      displayName: model.displayName,
      origin: 'cloud',
      providerId: this.id,
      providerLabel: this.label,
      family: model.family,
      contextWindowTokens: model.contextWindowTokens,
      supportsStreaming: true,
      availability: {
        installed: true,
        reachable: true,
      },
      usability: usabilityService.evaluate({
        origin: 'cloud',
        installed: true,
        reachable: true,
      }),
      links: model.usageUrl ? { usageUrl: model.usageUrl } : undefined,
    }));
  }
}

interface OllamaLibraryModel {
  id: string;
  displayName: string;
  family: string;
  contextWindowTokens: number;
  sizeLabel: string;
}

const DEFAULT_LIBRARY: OllamaLibraryModel[] = [
  { id: 'mistral-nemo:12b', displayName: 'Mistral Nemo 12B', family: 'Mistral', contextWindowTokens: 128_000, sizeLabel: '12B' },
  { id: 'llama3.1:8b', displayName: 'Llama 3.1 8B', family: 'Llama', contextWindowTokens: 128_000, sizeLabel: '8B' },
  { id: 'phi3:mini', displayName: 'Phi 3 Mini', family: 'Phi', contextWindowTokens: 128_000, sizeLabel: 'Mini' },
  { id: 'qwen2.5:7b', displayName: 'Qwen 2.5 7B', family: 'Qwen', contextWindowTokens: 128_000, sizeLabel: '7B' },
];

export class OllamaAdapter {
  private installed = new Set<string>(['mistral-nemo:12b', 'llama3.1:8b']);

  constructor(
    private readonly baseUrl = 'http://127.0.0.1:11434',
    private readonly library: OllamaLibraryModel[] = DEFAULT_LIBRARY
  ) {}

  private mapLibraryModel(
    model: OllamaLibraryModel,
    reachable: boolean,
    installed = this.installed.has(model.id)
  ): ModelDescriptor {
    return {
      id: model.id,
      displayName: model.displayName,
      origin: 'local',
      providerId: 'ollama',
      providerLabel: 'Ollama',
      family: model.family,
      contextWindowTokens: model.contextWindowTokens,
      supportsStreaming: true,
      availability: {
        installed,
        reachable,
        reason: reachable ? undefined : 'Ollama runtime not reachable',
      },
      usability: usabilityService.evaluate({
        origin: 'local',
        installed,
        reachable,
      }),
      links: {
        managementUrl: 'http://127.0.0.1:11434',
      },
    };
  }

  private findLibraryEntry(id: string): OllamaLibraryModel {
    return this.library.find(model => model.id === id) ?? {
      id,
      displayName: id,
      family: 'Custom',
      contextWindowTokens: 128_000,
      sizeLabel: 'Unknown',
    };
  }

  async getReachability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listInstalledModels(): Promise<ModelDescriptor[]> {
    const reachable = await this.getReachability();

    if (reachable) {
      try {
        const response = await fetch(`${this.baseUrl}/api/tags`, { method: 'GET' });
        if (response.ok) {
          const payload = await response.json() as { models?: Array<{ name: string }> };
          const names = payload.models?.map(model => model.name) ?? [];
          if (names.length > 0) {
            this.installed = new Set(names);
          }
        }
      } catch {
        // Ignore and fall back to mock-installed models below.
      }
    }

    return Array.from(this.installed).map(id => this.mapLibraryModel(this.findLibraryEntry(id), reachable, true));
  }

  async searchModels(query: string): Promise<LocalModelSearchResult[]> {
    const normalized = query.trim().toLowerCase();
    const results = this.library.filter(model =>
      normalized.length === 0 ||
      model.id.toLowerCase().includes(normalized) ||
      model.displayName.toLowerCase().includes(normalized) ||
      model.family.toLowerCase().includes(normalized)
    );

    return results.map(model => ({
      id: model.id,
      displayName: model.displayName,
      sizeLabel: model.sizeLabel,
      providerId: 'ollama',
      installed: this.installed.has(model.id),
      pullable: true,
    }));
  }

  markInstalled(modelId: string): void {
    this.installed.add(modelId);
  }
}
