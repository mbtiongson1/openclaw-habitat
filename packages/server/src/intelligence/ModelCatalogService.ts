import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import {
  type LocalModelPullJob,
  type LocalModelSearchResult,
  type ModelDescriptor,
} from '@habitat/shared';
import { OllamaAdapter, ProviderAdapter } from './adapters.js';

export class ModelCatalogService extends EventEmitter {
  private catalog: ModelDescriptor[] = [];
  private pullJobs: Map<string, LocalModelPullJob> = new Map();

  constructor(
    private readonly cloudProviders: ProviderAdapter[],
    private readonly ollamaAdapter: OllamaAdapter
  ) {
    super();
  }

  async refreshCatalog(): Promise<ModelDescriptor[]> {
    const cloudModels = (await Promise.all(this.cloudProviders.map(provider => provider.listModels()))).flat();
    const localModels = await this.ollamaAdapter.listInstalledModels();
    this.catalog = [...cloudModels, ...localModels].sort((a, b) => a.displayName.localeCompare(b.displayName));
    this.emit('catalog_updated', this.catalog);
    return this.catalog;
  }

  getCatalog(): ModelDescriptor[] {
    return [...this.catalog];
  }

  getModel(modelId: string): ModelDescriptor | undefined {
    return this.catalog.find(model => model.id === modelId);
  }

  async searchLocalModels(query: string): Promise<LocalModelSearchResult[]> {
    return this.ollamaAdapter.searchModels(query);
  }

  startLocalPull(modelId: string): LocalModelPullJob {
    const job: LocalModelPullJob = {
      jobId: randomUUID(),
      modelId,
      progressPct: 0,
      status: 'queued',
    };
    this.pullJobs.set(job.jobId, job);
    this.emit('pull_progress', { ...job });

    const interval = setInterval(async () => {
      const current = this.pullJobs.get(job.jobId);
      if (!current) {
        clearInterval(interval);
        return;
      }

      const nextProgress = Math.min(100, current.progressPct + 20);
      const nextJob: LocalModelPullJob = {
        ...current,
        progressPct: nextProgress,
        status: nextProgress >= 100 ? 'completed' : 'running',
      };
      this.pullJobs.set(job.jobId, nextJob);
      this.emit('pull_progress', { ...nextJob });

      if (nextProgress >= 100) {
        clearInterval(interval);
        this.ollamaAdapter.markInstalled(modelId);
        await this.refreshCatalog();
      }
    }, 500);

    return job;
  }
}
