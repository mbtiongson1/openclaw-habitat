import React from 'react';
import './BoostMeter.css';

interface BoostMeterProps {
  label: string;
  value: number; // 0 to 100
  isActive?: boolean;
}

export function BoostMeter({ label, value, isActive = false }: BoostMeterProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="boost-meter-wrapper">
      <div className="boost-meter__label-container">
        <span>{label}</span>
        <span>{Math.round(clampedValue)}%</span>
      </div>
      <div className="boost-meter">
        <div 
          className={`boost-meter__fill ${isActive ? 'boost-meter__fill--active' : ''}`} 
          style={{ width: `${clampedValue}%` }} 
        />
        <div className="boost-meter__ticks">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="boost-meter__tick" />
          ))}
        </div>
      </div>
    </div>
  );
}
