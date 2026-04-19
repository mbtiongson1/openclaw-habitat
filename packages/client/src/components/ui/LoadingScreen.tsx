import React from 'react';
import './LoadingScreen.css';

export function LoadingScreen({ reconnecting }: { reconnecting: boolean }) {
  return (
    <div className="loading-screen bg-surface flex flex-col items-center justify-center h-screen color-on-surface">
      <h1 className="text-2xl font-display mb-4">Digital Sanctuary</h1>
      <p className="opacity-70">{reconnecting ? 'Reconnecting to Habitat...' : 'Connecting to Habitat...'}</p>
      <div className="loading-spinner mt-8"></div>
    </div>
  );
}
