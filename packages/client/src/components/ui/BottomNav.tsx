import React from 'react';

export type TabId = 'hub' | 'zones' | 'agents' | 'analytics';

interface BottomNavProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const tabs = [
    { id: 'hub', label: 'Sanctuary', icon: 'home_pin' },
    { id: 'zones', label: 'Zones', icon: 'grid_guides' },
    { id: 'agents', label: 'Agents', icon: 'smart_toy' },
    { id: 'analytics', label: 'Analytics', icon: 'monitoring' },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20 pb-safe bg-[#FAF8F3]/80 dark:bg-[#1B1C19]/80 backdrop-blur-md border-t border-outline-variant/10">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-label={tab.label}
            onClick={() => onChange(tab.id as TabId)}
            className={`flex flex-col items-center justify-center relative w-16 h-full transition-all duration-200 ${
              isActive 
                ? 'text-primary dark:text-[#4A8C7B]' 
                : 'text-[#707975] dark:text-[#8B928E] opacity-60 hover:opacity-100'
            }`}
          >
            <span 
              aria-hidden="true"
              className="material-symbols-outlined mb-1 text-[24px]"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {tab.icon}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.05em] font-headline">
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute bottom-0 w-full h-[3px] bg-primary rounded-t-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
