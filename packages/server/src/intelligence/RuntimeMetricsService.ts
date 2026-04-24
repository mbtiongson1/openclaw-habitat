import os from 'os';
import { type RuntimeMetricsSnapshot } from '@habitat/shared';

export class RuntimeMetricsService {
  getSnapshot(): RuntimeMetricsSnapshot {
    const cpuCount = os.cpus().length || 1;
    const cpuPct = Math.min(100, Math.round((os.loadavg()[0] / cpuCount) * 100));
    const ramBytes = process.memoryUsage().rss;
    const totalRamBytes = os.totalmem();

    return {
      cpuPct,
      ramBytes,
      totalRamBytes,
      source: 'host',
      label: 'Host runtime',
      updatedAt: Date.now(),
    };
  }
}
