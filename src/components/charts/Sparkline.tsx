// ============================================================
// Exposure2Tumor — Sparkline Chart
// Compact trend visualization for inline use
// ============================================================

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { Colors } from '../../theme';

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDot?: boolean;
  showBaseline?: boolean;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = Colors.info,
  showDot = true,
  showBaseline = false,
}: Props) {
  if (data.length < 2) return null;

  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * w;
      const y = padding + h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  const lastX = padding + ((data.length - 1) / (data.length - 1)) * w;
  const lastY = padding + h - ((data[data.length - 1] - min) / range) * h;
  const baseY = padding + h - ((0 - min) / range) * h;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {showBaseline && (
          <Line
            x1={padding}
            y1={baseY}
            x2={width - padding}
            y2={baseY}
            stroke={Colors.border}
            strokeWidth={0.5}
            strokeDasharray="2,2"
          />
        )}
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {showDot && (
          <Circle cx={lastX} cy={lastY} r={2.5} fill={color} />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
