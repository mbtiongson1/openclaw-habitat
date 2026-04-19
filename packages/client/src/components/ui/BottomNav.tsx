import React from 'react';
import './BottomNav.css';

interface BottomNavProps {
  activeTab: 'hub' | 'kitchen' | 'nursery' | 'garden';
  onChange: (tab: 'hub' | 'kitchen' | 'nursery' | 'garden') => void;
}

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const tabs = [
    { id: 'hub', label: 'Hub', icon: '🏠' },
    { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
    { id: 'nursery', label: 'Nursery', icon: '🛏️' },
    { id: 'garden', label: 'Garden', icon: '🌿' },
  ] as const;

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`bottom-nav__btn ${activeTab === tab.id ? 'bottom-nav__btn--active' : ''}`}
          onClick={() => onChange(tab.id as any)}
        >
          <span className="bottom-nav__icon">{tab.icon}</span>
          <span className="bottom-nav__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
