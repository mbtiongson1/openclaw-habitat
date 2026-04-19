import React from 'react';

interface BottomNavProps {
  activeTab: 'hub' | 'kitchen' | 'nursery' | 'garden';
  onChange: (tab: 'hub' | 'kitchen' | 'nursery' | 'garden') => void;
}

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const tabs = [
    { id: 'hub', label: 'HUB', icon: 'home_storage' },
    { id: 'kitchen', label: 'KITCHEN', icon: 'countertops' },
    { id: 'nursery', label: 'NURSERY', icon: 'bedtime' },
    { id: 'garden', label: 'GARDEN', icon: 'nature' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-end px-4 pb-6 pt-2 bg-background border-t-2 border-on-background/5 z-50 rounded-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id as any)}
            className={`flex flex-col items-center justify-center pb-1 transition-all duration-100 ${
              isActive 
                ? 'text-primary border-b-4 border-secondary scale-95' 
                : 'text-on-background/40 hover:text-primary'
            }`}
          >
            <span 
              className="material-symbols-outlined mb-1"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {tab.icon}
            </span>
            <span className="font-headline text-[10px] font-bold tracking-tighter uppercase">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
