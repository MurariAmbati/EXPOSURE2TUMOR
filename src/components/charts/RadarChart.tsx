// ============================================================
// Exposure2Tumor — Radar Chart
// Multi-axis risk profile visualization
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../../theme';

interface RadarAxis {
  label: string;
  value: number;  // 0-100
  color?: string;
}

interface Props {
  axes: RadarAxis[];
  size?: number;
  title?: string;
  fillColor?: string;
  compareAxes?: RadarAxis[];
}

export function RadarChart({
  axes,
  size = 220,
  title,
  fillColor = Colors.accentTeal,
  compareAxes,
}: Props) {
  if (axes.length < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 30;
  const n = axes.length;
  const angleStep = (2 * Math.PI) / n;

  const pointForAxis = (index: number, value: number) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const r = (value / 100) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const labelForAxis = (index: number) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const r = maxR + 16;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  // Grid rings
  const rings = [20, 40, 60, 80, 100];

  // Data polygon
  const dataPoints = axes.map((a, i) => pointForAxis(i, a.value));
  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Compare polygon
  const comparePoints = compareAxes?.map((a, i) => pointForAxis(i, a.value));
  const comparePolygon = comparePoints?.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={size} height={size}>
        {/* Grid rings */}
        {rings.map(ring => (
          <Circle
            key={`ring-${ring}`}
            cx={cx} cy={cy}
            r={(ring / 100) * maxR}
            fill="none"
            stroke={Colors.chartGrid}
            strokeWidth={0.5}
            opacity={ring === 100 ? 0.5 : 0.3}
          />
        ))}

        {/* Axis lines */}
        {axes.map((_, i) => {
          const end = pointForAxis(i, 100);
          return (
            <Line
              key={`axis-${i}`}
              x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke={Colors.chartGrid}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Compare data polygon */}
        {comparePolygon && (
          <Polygon
            points={comparePolygon}
            fill={Colors.warning}
            fillOpacity={0.08}
            stroke={Colors.warning}
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        )}

        {/* Data polygon */}
        <Polygon
          points={polygon}
          fill={fillColor}
          fillOpacity={0.15}
          stroke={fillColor}
          strokeWidth={2}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <G key={`dp-${i}`}>
            <Circle
              cx={p.x} cy={p.y} r={4}
              fill={axes[i].color ?? fillColor}
              stroke={Colors.surface}
              strokeWidth={1.5}
            />
          </G>
        ))}

        {/* Axis labels */}
        {axes.map((a, i) => {
          const pos = labelForAxis(i);
          return (
            <SvgText
              key={`label-${i}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              fill={Colors.textSecondary}
              fontSize={8}
            >
              {a.label.length > 14 ? a.label.slice(0, 12) + '…' : a.label}
            </SvgText>
          );
        })}

        {/* Center score label */}
        <SvgText x={cx} y={cy + 3} textAnchor="middle" fill={Colors.textMuted} fontSize={9}>
          {Math.round(axes.reduce((s, a) => s + a.value, 0) / n)}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: Spacing.sm },
  title: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs },
});
