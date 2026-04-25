import type { CSSProperties } from 'react';
import type { SanctuaryRoomKind } from './houseLayout';

type RoomTextureStyle = Pick<
  CSSProperties,
  'backgroundImage' | 'backgroundSize' | 'backgroundRepeat' | 'backgroundPosition' | 'backgroundBlendMode'
>;

function dataUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function tiledSvg(fill: string, accent: string, cell: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" fill="${fill}" />
      <path d="M0 0H160V160" fill="none" stroke="${accent}" stroke-width="1.2" stroke-opacity="0.4" />
      <path d="M0 40H160M0 80H160M0 120H160M40 0V160M80 0V160M120 0V160" fill="none" stroke="${cell}" stroke-width="1" stroke-opacity="0.7" />
    </svg>
  `;
}

function grainSvg(fill: string, stroke: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
      <rect width="180" height="180" fill="${fill}" />
      <path d="M0 18H180M0 54H180M0 90H180M0 126H180M0 162H180" fill="none" stroke="${stroke}" stroke-width="1" stroke-opacity="0.12" />
      <path d="M20 0C30 28 30 152 20 180M62 0C72 28 72 152 62 180M104 0C114 28 114 152 104 180M146 0C156 28 156 152 146 180" fill="none" stroke="${stroke}" stroke-width="1.2" stroke-opacity="0.1" />
    </svg>
  `;
}

function grassSvg(fill: string, blade: string, stone: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
      <rect width="180" height="180" fill="${fill}" />
      <path d="M0 28C18 20 24 20 38 26M44 38C58 30 68 30 84 38M94 24C110 18 122 18 138 24M18 96C36 88 46 88 60 96M78 112C92 104 106 104 124 112M124 54C138 48 150 48 166 56" fill="none" stroke="${blade}" stroke-width="2" stroke-linecap="round" stroke-opacity="0.35" />
      <circle cx="26" cy="122" r="4" fill="${stone}" fill-opacity="0.28" />
      <circle cx="70" cy="148" r="5" fill="${stone}" fill-opacity="0.18" />
      <circle cx="128" cy="132" r="4" fill="${stone}" fill-opacity="0.22" />
      <circle cx="154" cy="54" r="3" fill="${stone}" fill-opacity="0.18" />
    </svg>
  `;
}

const TEXTURES: Record<SanctuaryRoomKind, RoomTextureStyle> = {
  bedroom: {
    backgroundImage: [
      dataUri(tiledSvg('#f5efe4', '#cabaa2', '#d9cebc')),
      dataUri(grainSvg('#f1e8da', '#a6937a')),
      'linear-gradient(180deg, rgba(255,255,255,0.52), rgba(255,255,255,0.06))',
    ].join(', '),
    backgroundSize: '72px 72px, 180px 180px, cover',
    backgroundRepeat: 'repeat, repeat, no-repeat',
    backgroundPosition: '0 0, 0 0, 0 0',
    backgroundBlendMode: 'multiply, multiply, normal',
  },
  kitchen: {
    backgroundImage: [
      dataUri(tiledSvg('#f7efe3', '#b8ab95', '#e9dfd0')),
      dataUri(grainSvg('#efe4d3', '#c1b39d')),
      'linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0.04))',
    ].join(', '),
    backgroundSize: '28px 28px, 160px 160px, cover',
    backgroundRepeat: 'repeat, repeat, no-repeat',
    backgroundPosition: '0 0, 0 0, 0 0',
    backgroundBlendMode: 'screen, multiply, normal',
  },
  office: {
    backgroundImage: [
      dataUri(grainSvg('#eff3ec', '#92a395')),
      'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.02))',
    ].join(', '),
    backgroundSize: '180px 180px, cover',
    backgroundRepeat: 'repeat, no-repeat',
    backgroundPosition: '0 0, 0 0',
    backgroundBlendMode: 'multiply, normal',
  },
  'task-room': {
    backgroundImage: [
      dataUri(tiledSvg('#f3f0e7', '#c9c0ae', '#ddd6c8')),
      dataUri(grainSvg('#ece5d6', '#9b8c76')),
      'linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.02))',
    ].join(', '),
    backgroundSize: '40px 40px, 180px 180px, cover',
    backgroundRepeat: 'repeat, repeat, no-repeat',
    backgroundPosition: '0 0, 0 0, 0 0',
    backgroundBlendMode: 'multiply, multiply, normal',
  },
  garden: {
    backgroundImage: [
      dataUri(grassSvg('#d9e7c8', '#7ca05b', '#8f7d5c')),
      'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.26), transparent 18%)',
      'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02))',
    ].join(', '),
    backgroundSize: '180px 180px, cover, cover',
    backgroundRepeat: 'repeat, no-repeat, no-repeat',
    backgroundPosition: '0 0, 0 0, 0 0',
    backgroundBlendMode: 'multiply, screen, normal',
  },
};

export function roomTextureStyle(roomKind: SanctuaryRoomKind): RoomTextureStyle {
  return TEXTURES[roomKind];
}
