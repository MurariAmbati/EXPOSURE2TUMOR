// ============================================================
// Exposure2Tumor — SVG Icon Library
// Centralized monochrome SVG icons replacing all emoji usage
// ============================================================

import React from 'react';
import Svg, { Path, Circle, Rect, Line, G, Polygon } from 'react-native-svg';

export type IconName =
  | 'globe' | 'factory' | 'water' | 'haze' | 'rock' | 'microscope'
  | 'camera' | 'photo' | 'shield' | 'hospital' | 'chart' | 'dna'
  | 'map' | 'flask' | 'document' | 'bell' | 'scale' | 'target'
  | 'message' | 'warning' | 'eye' | 'upload' | 'star' | 'earth'
  | 'search' | 'bolt' | 'graduate' | 'smoking' | 'neighborhood'
  | 'lightbulb' | 'robot' | 'wind' | 'radiation' | 'fire' | 'air'
  | 'siren' | 'info' | 'stethoscope' | 'note' | 'clipboard' | 'pin'
  | 'location' | 'rocket' | 'runner' | 'construction' | 'handshake'
  | 'flag' | 'close' | 'send' | 'loading' | 'arrowUp' | 'arrowDown'
  | 'arrowRight' | 'share' | 'download' | 'check' | 'dash'
  | 'grid' | 'hexagon' | 'diagonal' | 'triangle' | 'menu'
  | 'searchAlt' | 'compare' | 'community' | 'evidence' | 'bullseye'
  | 'window' | 'capture' | 'heart' | 'plus' | 'diagnosis'
  | 'surgery' | 'treatment' | 'symptom' | 'lab' | 'medication'
  | 'lifestyle' | 'exposure' | 'vaccine' | 'chemical' | 'diet'
  | 'exercise' | 'alcohol' | 'work' | 'sun' | 'indoor' | 'noise'
  | 'food' | 'building' | 'resource' | 'health' | 'hazard'
  | 'screening' | 'custom' | 'bookmark'
  | 'help' | 'copy' | 'settings';

interface SvgIconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function SvgIcon({ name, size = 16, color = '#9CA3AF' }: SvgIconProps) {
  const s = size;
  const c = color;
  const sw = 1.5; // stroke width

  switch (name) {
    // ── Environment & Nature ──
    case 'globe':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9.5} stroke={c} strokeWidth={sw} />
          <Path d="M3.5 12h17M12 2.5c-2 3-3 6.5-3 9.5s1 6.5 3 9.5M12 2.5c2 3 3 6.5 3 9.5s-1 6.5-3 9.5" stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'earth':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9.5} stroke={c} strokeWidth={sw} />
          <Path d="M2.5 12h19M8 3c-1.5 3-2 6-2 9s.5 6 2 9M16 3c1.5 3 2 6 2 9s-.5 6-2 9" stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'wind':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M2 12h13a3 3 0 10-3-3M2 8h8a3 3 0 10-3-3M2 16h10a3 3 0 11-3 3" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'haze':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M3 8h18M3 12h14M3 16h18M3 20h10" stroke={c} strokeWidth={sw} strokeLinecap="round" opacity={0.7} />
          <Circle cx={16} cy={6} r={3} stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'water':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2.5C12 2.5 5 10 5 14.5a7 7 0 0014 0C19 10 12 2.5 12 2.5z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'rock':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Polygon points="12,3 20,10 18,20 6,20 4,10" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />
          <Line x1={4} y1={10} x2={18} y2={10} stroke={c} strokeWidth={1} opacity={0.5} />
          <Line x1={9} y1={10} x2={6} y2={20} stroke={c} strokeWidth={1} opacity={0.5} />
          <Line x1={15} y1={10} x2={18} y2={20} stroke={c} strokeWidth={1} opacity={0.5} />
        </Svg>
      );
    case 'fire':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2c0 4-5 6-5 11a6 6 0 0012 0c0-2-1.5-3.5-3-5-.5 2-2 3-3 3s-2-1.5-1-5V2z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'sun':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={4} stroke={c} strokeWidth={sw} />
          <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M16.9 16.9l2.1 2.1M4.9 19.1l2.1-2.1M16.9 7.1l2.1-2.1" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'air':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M3 8h10a2 2 0 100-4M3 12h14a2 2 0 100-4M3 16h8a2 2 0 110 4" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );

    // ── Facilities & Buildings ──
    case 'factory':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M3 21V11l5 3V8l5 3V5l5 3v13H3z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
          <Rect x={5} y={15} width={2} height={3} stroke={c} strokeWidth={1} />
          <Rect x={10} y={15} width={2} height={3} stroke={c} strokeWidth={1} />
        </Svg>
      );
    case 'hospital':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={5} width={18} height={16} rx={2} stroke={c} strokeWidth={sw} />
          <Path d="M12 9v6M9 12h6" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M8 5V3h8v2" stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'neighborhood':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M3 21h18M5 21V10l4-4 4 4v11M15 21V13l3-3 3 3v8" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
          <Rect x={8} y={13} width={2} height={2} stroke={c} strokeWidth={1} />
          <Rect x={17} y={15} width={2} height={2} stroke={c} strokeWidth={1} />
        </Svg>
      );
    case 'construction':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M2 20h20M6 20V10l4-3v13M14 20V7l4 3v10" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M6 6l14 2" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'building':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={4} y={3} width={16} height={18} rx={1} stroke={c} strokeWidth={sw} />
          <Rect x={7} y={6} width={3} height={3} stroke={c} strokeWidth={1} />
          <Rect x={14} y={6} width={3} height={3} stroke={c} strokeWidth={1} />
          <Rect x={7} y={12} width={3} height={3} stroke={c} strokeWidth={1} />
          <Rect x={14} y={12} width={3} height={3} stroke={c} strokeWidth={1} />
          <Rect x={10} y={17} width={4} height={4} stroke={c} strokeWidth={1} />
        </Svg>
      );

    // ── Medical & Science ──
    case 'microscope':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 4v8M9 4h6M9 12h6" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M14 12c3 1 5 3.5 5 6H5a7.5 7.5 0 014-5" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M5 21h14" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'dna':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M7 2c0 5 10 5 10 10s-10 5-10 10" stroke={c} strokeWidth={sw} />
          <Path d="M17 2c0 5-10 5-10 10s10 5 10 10" stroke={c} strokeWidth={sw} />
          <Line x1={8} y1={7} x2={16} y2={7} stroke={c} strokeWidth={1} opacity={0.5} />
          <Line x1={8} y1={17} x2={16} y2={17} stroke={c} strokeWidth={1} opacity={0.5} />
        </Svg>
      );
    case 'flask':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M9 3h6M10 3v7l-5 9a1 1 0 001 1h12a1 1 0 001-1l-5-9V3" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M7 16h10" stroke={c} strokeWidth={1} opacity={0.5} />
        </Svg>
      );
    case 'stethoscope':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M6 12V6a3 3 0 016 0v6a4 4 0 01-8 0" stroke={c} strokeWidth={sw} />
          <Circle cx={18} cy={12} r={2} stroke={c} strokeWidth={sw} />
          <Path d="M18 14v2a4 4 0 01-4 4h-2" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'radiation':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={2} stroke={c} strokeWidth={sw} />
          <Path d="M12 2a10 10 0 015 2l-5 8-5-8a10 10 0 015-2zM2 17a10 10 0 012-5l8 5H2zM22 17h-10l8-5a10 10 0 012 5z" stroke={c} strokeWidth={sw} fill="none" />
        </Svg>
      );
    case 'diagnosis':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={4} y={3} width={16} height={18} rx={2} stroke={c} strokeWidth={sw} />
          <Path d="M8 8h8M8 12h5M8 16h7" stroke={c} strokeWidth={1.2} strokeLinecap="round" />
          <Circle cx={17} cy={17} r={2} stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'screening':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={7} stroke={c} strokeWidth={sw} />
          <Path d="M16 16l5 5" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M11 8v6M8 11h6" stroke={c} strokeWidth={1.2} strokeLinecap="round" />
        </Svg>
      );
    case 'surgery':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M7.5 4.5l-3 3a1 1 0 000 1.4l10.6 10.6a1 1 0 001.4 0l3-3a1 1 0 000-1.4L8.9 4.5a1 1 0 00-1.4 0z" stroke={c} strokeWidth={sw} />
          <Path d="M10 2l2 2M2 10l2 2" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'treatment':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={6} y={2} width={12} height={20} rx={3} stroke={c} strokeWidth={sw} />
          <Path d="M12 8v8M8 12h8" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'symptom':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M4 12h2l3-7 4 14 3-7h4" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'lab':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M8 3h8M10 3v6L5 19a1 1 0 001 1h12a1 1 0 001-1L14 9V3" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={10} cy={15} r={1.5} fill={c} opacity={0.3} />
          <Circle cx={14} cy={17} r={1} fill={c} opacity={0.3} />
        </Svg>
      );
    case 'medication':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={4.5} y={9} width={15} height={6} rx={3} stroke={c} strokeWidth={sw} transform="rotate(-45 12 12)" />
          <Line x1={12} y1={8} x2={12} y2={16} stroke={c} strokeWidth={1} transform="rotate(-45 12 12)" opacity={0.5} />
        </Svg>
      );
    case 'vaccine':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M17 3l4 4M19 5l-8 8M7 17l-3 3" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M10 10l-4 4 5 5 4-4" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'health':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M4 12h3l2-4 3 8 2-4h6" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Rect x={3} y={6} width={18} height={12} rx={2} stroke={c} strokeWidth={sw} />
        </Svg>
      );

    // ── Actions & UI ──
    case 'camera':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={2} y={6} width={20} height={14} rx={2} stroke={c} strokeWidth={sw} />
          <Circle cx={12} cy={13} r={4} stroke={c} strokeWidth={sw} />
          <Path d="M8 6l1-2h6l1 2" stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'photo':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={2} y={6} width={20} height={14} rx={2} stroke={c} strokeWidth={sw} />
          <Circle cx={12} cy={13} r={3} stroke={c} strokeWidth={sw} />
          <Circle cx={12} cy={13} r={1} fill={c} />
          <Path d="M8 6l1-2h6l1 2" stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={7} stroke={c} strokeWidth={sw} />
          <Path d="M16.5 16.5L21 21" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'searchAlt':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={7} stroke={c} strokeWidth={sw} />
          <Path d="M16.5 16.5L20 20" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2l8 4v5c0 5.5-3.5 10-8 12-4.5-2-8-6.5-8-12V6l8-4z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M9 12l2 2 4-4" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'eye':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M2 12c2-4 5.5-7 10-7s8 3 10 7c-2 4-5.5 7-10 7s-8-3-10-7z" stroke={c} strokeWidth={sw} />
          <Circle cx={12} cy={12} r={3} stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'target':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={sw} />
          <Circle cx={12} cy={12} r={5} stroke={c} strokeWidth={sw} />
          <Circle cx={12} cy={12} r={1.5} fill={c} />
        </Svg>
      );
    case 'bullseye':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={10} stroke={c} strokeWidth={sw} />
          <Circle cx={12} cy={12} r={6} stroke={c} strokeWidth={sw} />
          <Circle cx={12} cy={12} r={2} fill={c} />
        </Svg>
      );
    case 'location':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={c} strokeWidth={sw} />
          <Circle cx={12} cy={9} r={2.5} stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'pin':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={c} strokeWidth={sw} />
          <Circle cx={12} cy={9} r={2} fill={c} opacity={0.4} />
        </Svg>
      );
    case 'bookmark':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M5 3h14a1 1 0 011 1v17l-8-4-8 4V4a1 1 0 011-1z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'star':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2l3 6.2 6.8 1-5 4.8 1.2 6.8L12 17.8l-6 3.2 1.2-6.8-5-4.8 6.8-1L12 2z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" stroke={c} strokeWidth={sw} />
          <Path d="M14 21a2 2 0 01-4 0" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'message':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M3 5h18a1 1 0 011 1v10a1 1 0 01-1 1H7l-4 4V6a1 1 0 011-1z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M7 10h10M7 13h6" stroke={c} strokeWidth={1} strokeLinecap="round" opacity={0.5} />
        </Svg>
      );
    case 'warning':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2L1 21h22L12 2z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
          <Line x1={12} y1={9} x2={12} y2={14} stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <Circle cx={12} cy={17} r={0.8} fill={c} />
        </Svg>
      );
    case 'info':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={sw} />
          <Line x1={12} y1={11} x2={12} y2={17} stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <Circle cx={12} cy={8} r={0.8} fill={c} />
        </Svg>
      );
    case 'siren':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M6 15V9a6 6 0 0112 0v6" stroke={c} strokeWidth={sw} />
          <Rect x={4} y={15} width={16} height={4} rx={1} stroke={c} strokeWidth={sw} />
          <Path d="M12 2v2M4 8l-2-1M20 8l2-1" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'close':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12l5 5L20 7" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'dash':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Line x1={6} y1={12} x2={18} y2={12} stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );

    // ── Arrows & Direction ──
    case 'arrowUp':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 19V5M5 12l7-7 7 7" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'arrowDown':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M19 12l-7 7-7-7" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'arrowRight':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12h14M13 5l7 7-7 7" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'send':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 19V5M5 12l7-7 7 7" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'share':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M7 17l10-10M17 7h-6M17 7v6" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'upload':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 15V3M5 8l7-5 7 5" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'download':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3v12M5 10l7 5 7-5" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" stroke={c} strokeWidth={sw} />
        </Svg>
      );

    // ── Data & Documents ──
    case 'chart':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={12} width={4} height={8} rx={1} stroke={c} strokeWidth={sw} />
          <Rect x={10} y={6} width={4} height={14} rx={1} stroke={c} strokeWidth={sw} />
          <Rect x={17} y={9} width={4} height={11} rx={1} stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'document':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M14 2v6h6" stroke={c} strokeWidth={sw} />
          <Path d="M8 13h8M8 17h5" stroke={c} strokeWidth={1} strokeLinecap="round" opacity={0.5} />
        </Svg>
      );
    case 'clipboard':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={4} y={4} width={16} height={18} rx={2} stroke={c} strokeWidth={sw} />
          <Path d="M9 2h6v3H9z" stroke={c} strokeWidth={sw} />
          <Path d="M8 10h8M8 14h5" stroke={c} strokeWidth={1} strokeLinecap="round" opacity={0.5} />
        </Svg>
      );
    case 'note':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={4} y={3} width={16} height={18} rx={2} stroke={c} strokeWidth={sw} />
          <Path d="M8 8h8M8 12h6M8 16h4" stroke={c} strokeWidth={1.2} strokeLinecap="round" />
        </Svg>
      );
    case 'map':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
          <Line x1={9} y1={3} x2={9} y2={18} stroke={c} strokeWidth={sw} />
          <Line x1={15} y1={6} x2={15} y2={21} stroke={c} strokeWidth={sw} />
        </Svg>
      );

    // ── People & Social ──
    case 'robot':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={4} y={8} width={16} height={12} rx={2} stroke={c} strokeWidth={sw} />
          <Circle cx={9} cy={13} r={1.5} fill={c} />
          <Circle cx={15} cy={13} r={1.5} fill={c} />
          <Path d="M10 17h4" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M12 4v4M9 6h6" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'handshake':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M2 11l5-5 4 2 4-2 5 5" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M7 15l3-3 4 4 3-3" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M2 11v5l5 4M22 11v5l-5 4" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'runner':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={14} cy={4} r={2} stroke={c} strokeWidth={sw} />
          <Path d="M6 20l3-7 4 2 4-6" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M13 15l2 5M9 13l-3-1" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'graduate':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M2 10l10-5 10 5-10 5-10-5z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M6 12v5c3 2 9 2 12 0v-5" stroke={c} strokeWidth={sw} />
          <Path d="M22 10v6" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );

    // ── Misc Objects ──
    case 'bolt':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Polygon points="13,2 3,14 12,14 11,22 21,10 12,10" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />
        </Svg>
      );
    case 'lightbulb':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M9 21h6M12 2a7 7 0 00-4 12.7V18h8v-3.3A7 7 0 0012 2z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'scale':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3v18M3 6l4 8h10l4-8" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M3 14c0 1 2 2 4 2s4-1 4-2M13 14c0 1 2 2 4 2s4-1 4-2" stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'smoking':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={2} y={14} width={16} height={4} rx={1} stroke={c} strokeWidth={sw} />
          <Line x1={20} y1={14} x2={20} y2={18} stroke={c} strokeWidth={sw} />
          <Line x1={22} y1={14} x2={22} y2={18} stroke={c} strokeWidth={sw} />
          <Path d="M20 10c0-2-2-3-2-5s2-3 2-3" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'rocket':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2c-2 4-3 8-3 12h6c0-4-1-8-3-12z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M9 14l-3 3v3l3-2M15 14l3 3v3l-3-2" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
          <Circle cx={12} cy={10} r={1.5} fill={c} opacity={0.4} />
        </Svg>
      );
    case 'flag':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M5 21V3" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M5 3h12l-3 4 3 4H5" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'loading':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={sw} opacity={0.3} />
          <Path d="M12 3a9 9 0 016.4 2.6" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'capture':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={8} stroke={c} strokeWidth={sw} />
          <Circle cx={12} cy={12} r={3} stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 21C12 21 3 14 3 8.5a5 5 0 019-3 5 5 0 019 3C21 14 12 21 12 21z" stroke={c} strokeWidth={sw} />
        </Svg>
      );

    // ── Lifestyle & Diary categories ──
    case 'chemical':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M9 3h6M10 3v7l-5 9a1 1 0 001 1h12a1 1 0 001-1l-5-9V3" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M8 16h8" stroke={c} strokeWidth={1} opacity={0.5} />
          <Circle cx={11} cy={17} r={1} fill={c} opacity={0.3} />
        </Svg>
      );
    case 'diet':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2c-3 2-5 5-5 8a5 5 0 0010 0c0-3-2-6-5-8z" stroke={c} strokeWidth={sw} />
          <Path d="M12 10v10M10 20h4" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'exercise':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={4} r={2} stroke={c} strokeWidth={sw} />
          <Path d="M7 12l3-4h4l3 4M10 8v10M14 8v10M8 22h3M13 22h3" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'alcohol':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M8 2h8l-1 8a5 5 0 01-3 4.5A5 5 0 019 10L8 2z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M12 14.5V20M9 20h6" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={8.5} y1={6} x2={15.5} y2={6} stroke={c} strokeWidth={1} opacity={0.5} />
        </Svg>
      );
    case 'work':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={2} y={7} width={20} height={14} rx={2} stroke={c} strokeWidth={sw} />
          <Path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke={c} strokeWidth={sw} />
          <Path d="M12 12v2" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'indoor':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M3 12l9-8 9 8" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M5 10v10h14V10" stroke={c} strokeWidth={sw} />
          <Rect x={9} y={14} width={6} height={6} stroke={c} strokeWidth={1} />
        </Svg>
      );
    case 'noise':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'lifestyle':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={5} r={3} stroke={c} strokeWidth={sw} />
          <Path d="M5 21v-4a7 7 0 0114 0v4" stroke={c} strokeWidth={sw} />
          <Path d="M9 14l3 3 3-3" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'exposure':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2L1 21h22L12 2z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M12 9v5M12 17v.5" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'food':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M3 12a9 9 0 0118 0" stroke={c} strokeWidth={sw} />
          <Line x1={2} y1={12} x2={22} y2={12} stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M4 15h16a2 2 0 01-2 2H6a2 2 0 01-2-2z" stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'resource':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={sw} />
          <Path d="M12 7v5l3 3" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'hazard':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2L1 21h22L12 2z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
          <Line x1={12} y1={9} x2={12} y2={15} stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <Circle cx={12} cy={18} r={0.8} fill={c} />
        </Svg>
      );
    case 'custom':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={sw} />
          <Path d="M8 12h8M12 8v8" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );

    // ── Tab & Nav icons ──
    case 'grid':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={4} fill={c} />
        </Svg>
      );
    case 'hexagon':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Polygon points="12,2 21,7 21,17 12,22 3,17 3,7" stroke={c} strokeWidth={sw} fill="none" />
        </Svg>
      );
    case 'diagonal':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Line x1={6} y1={18} x2={18} y2={6} stroke={c} strokeWidth={2} strokeLinecap="round" />
          <Path d="M6 6h12v12" stroke={c} strokeWidth={sw} fill="none" opacity={0.4} />
        </Svg>
      );
    case 'triangle':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Polygon points="12,4 21,20 3,20" stroke={c} strokeWidth={sw} fill="none" />
        </Svg>
      );
    case 'menu':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M4 6h16M4 12h16M4 18h16" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'compare':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'community':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Polygon points="12,2 21,7 21,17 12,22 3,17 3,7" stroke={c} strokeWidth={sw} fill={c} fillOpacity={0.15} />
        </Svg>
      );
    case 'evidence':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={3} width={8} height={8} rx={1} stroke={c} strokeWidth={sw} />
          <Rect x={13} y={3} width={8} height={8} rx={1} stroke={c} strokeWidth={sw} />
          <Rect x={3} y={13} width={8} height={8} rx={1} stroke={c} strokeWidth={sw} />
          <Rect x={13} y={13} width={8} height={8} rx={1} stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case 'window':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={3} width={18} height={18} rx={2} stroke={c} strokeWidth={sw} />
          <Line x1={12} y1={3} x2={12} y2={21} stroke={c} strokeWidth={sw} />
          <Line x1={3} y1={10} x2={21} y2={10} stroke={c} strokeWidth={sw} />
        </Svg>
      );

    case 'help':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={sw} />
          <Path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <Circle cx={12} cy={17} r={0.5} fill={c} />
        </Svg>
      );

    case 'copy':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x={8} y={8} width={12} height={12} rx={1} stroke={c} strokeWidth={sw} />
          <Path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke={c} strokeWidth={sw} />
        </Svg>
      );

    case 'settings':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={3} stroke={c} strokeWidth={sw} />
          <Path d="M12 1v3m0 16v3m-9-11h3m16 0h-3m-1.6-6.4l-2.1 2.1m-6.6 6.6l-2.1 2.1m0-10.8l2.1 2.1m6.6 6.6l2.1 2.1" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );

    default:
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={sw} />
        </Svg>
      );
  }
}

export default SvgIcon;
