import React from 'react';

export function AnalyticsView() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div>
          <h2 className="text-5xl font-headline font-black tracking-tighter text-on-background mb-2">System Analytics</h2>
          <p className="text-on-surface-variant max-w-xl">Real-time monitoring of sanctuary operational metrics, agent stability, and resource throughput (Karpathy-Node Engine).</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex bg-surface-container border border-outline-variant/30 w-full sm:w-auto">
            <button className="px-4 py-2 text-xs font-headline uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-colors">1H</button>
            <div className="w-[1px] bg-outline-variant/30"></div>
            <button className="px-4 py-2 text-xs font-headline uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-colors">6H</button>
            <div className="w-[1px] bg-outline-variant/30"></div>
            <button className="px-4 py-2 text-xs font-headline uppercase tracking-widest bg-primary text-on-primary font-bold">24H</button>
            <div className="w-[1px] bg-outline-variant/30"></div>
            <button className="px-4 py-2 text-xs font-headline uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-colors">7D</button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest border border-outline-variant/20 p-6 flex flex-col gap-4 relative group hover:bg-surface-container-low transition-colors duration-200">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-headline uppercase tracking-widest text-on-surface-variant">Active Agents</h3>
            <span className="material-symbols-outlined text-primary text-opacity-80">smart_toy</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-headline font-bold text-on-background tracking-tighter">1,024</span>
            <span className="text-sm text-primary font-bold flex items-center"><span className="material-symbols-outlined text-[14px]">arrow_upward</span> 12%</span>
          </div>
          <div className="w-full h-1 bg-surface-container mt-auto">
            <div className="h-full bg-primary w-[75%]"></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/20 p-6 flex flex-col gap-4 relative group hover:bg-surface-container-low transition-colors duration-200">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-headline uppercase tracking-widest text-on-surface-variant">Avg Critique Stability</h3>
            <span className="material-symbols-outlined text-primary text-opacity-80">monitoring</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-headline font-bold text-on-background tracking-tighter">98.4%</span>
            <span className="text-sm text-outline font-bold flex items-center"><span className="material-symbols-outlined text-[14px]">horizontal_rule</span> 0%</span>
          </div>
          <div className="w-full h-1 bg-surface-container mt-auto">
            <div className="h-full bg-primary w-[98%]"></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/20 p-6 flex flex-col gap-4 relative group hover:bg-surface-container-low transition-colors duration-200">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-headline uppercase tracking-widest text-on-surface-variant">Inference Throughput</h3>
            <span className="material-symbols-outlined text-primary text-opacity-80">speed</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-headline font-bold text-on-background tracking-tighter">4.2<span className="text-2xl text-on-surface-variant">k/s</span></span>
            <span className="text-sm text-tertiary font-bold flex items-center"><span className="material-symbols-outlined text-[14px]">arrow_downward</span> 3%</span>
          </div>
          <div className="w-full h-1 bg-surface-container mt-auto">
            <div className="h-full bg-tertiary-container w-[45%]"></div>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/20 p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
            <h3 className="text-lg font-headline font-bold text-on-background">AetherLang Stability Trend</h3>
            <button className="text-xs font-headline uppercase text-primary hover:underline">View Log</button>
          </div>
          <div className="w-full h-64 bg-surface-container relative overflow-hidden flex items-end">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="lineGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#124438" />
                  <stop offset="100%" stopColor="#8c3b0f" />
                </linearGradient>
                <linearGradient id="areaGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#2d5c4f" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#2d5c4f" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,80 Q10,75 20,80 T40,60 T60,70 T80,30 T100,50 L100,100 L0,100 Z" fill="url(#areaGrad)" />
              <path d="M0,80 Q10,75 20,80 T40,60 T60,70 T80,30 T100,50" fill="none" stroke="url(#lineGrad)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <circle className="animate-pulse" cx="80" cy="30" fill="#8c3b0f" r="2" />
            </svg>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/20 p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
            <h3 className="text-lg font-headline font-bold text-on-background">Node Utilization</h3>
          </div>
          <div className="w-full flex-grow flex flex-col gap-3 mt-2">
            {[
              { label: 'PLAN', val: 80 },
              { label: 'CODE', val: 60 },
              { label: 'TOOL', val: 90 },
              { label: 'LOOP', val: 40 },
            ].map((node) => (
              <div key={node.label} className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-headline font-bold text-outline">
                  <span>{node.label}</span>
                  <span>{node.val}%</span>
                </div>
                <div className="h-2 bg-surface-container overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${node.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* alerts Section */}
      <section className="mb-8">
        <h3 className="text-lg font-headline font-bold text-on-background mb-4 uppercase tracking-wider border-b border-outline-variant/20 pb-2">Active Alerts</h3>
        <div className="flex flex-col gap-2">
          <div className="bg-surface-container-lowest border-l-4 border-tertiary-container p-4 flex items-center justify-between group hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-tertiary-container">warning</span>
              <div>
                <h4 className="text-sm font-headline font-bold text-on-background">Critique Node Threshold Alert</h4>
                <p className="text-xs text-on-surface-variant">Batch 902 failed to meet stability threshold of 8.0 after 3 retries.</p>
              </div>
            </div>
            <button className="text-xs font-headline font-bold uppercase text-tertiary-container hover:underline">Investigate</button>
          </div>
        </div>
      </section>
    </div>
  );
}
