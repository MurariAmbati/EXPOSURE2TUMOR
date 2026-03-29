// ============================================================
// Exposure2Tumor — Benchmark Gauge
// Single-metric gauge with local/state/national/HP2030 benchmarks
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../../theme';
import { SvgIcon } from '../SvgIcon';
import type { BenchmarkComparison } from '../../types';

interface Props {
  benchmark: BenchmarkComparison;
  size?: number;
}

export function BenchmarkGauge({ benchmark, size = 140 }: Props) {
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size / 2 - 20;
  const startAngle = -210;
  const endAngle = 30;
  const totalAngle = endAngle - startAngle;

  // Normalize values to 0-100 range for positioning
  const allVals = [benchmark.localValue, benchmark.stateValue, benchmark.nationalValue];
  if (benchmark.hp2030Target != null) allVals.push(benchmark.hp2030Target);
  const minV = Math.min(...allVals) * 0.8;
  const maxV = Math.max(...allVals) * 1.2;
  const range = maxV - minV || 1;

  const valueToAngle = (v: number) => {
    const pct = (v - minV) / range;
    return startAngle + pct * totalAngle;
  };

  const angleToCoord = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const localAngle = valueToAngle(benchmark.localValue);
  const statePos = angleToCoord(valueToAngle(benchmark.stateValue), r - 2);
  const nationalPos = angleToCoord(valueToAngle(benchmark.nationalValue), r - 2);
  const localPos = angleToCoord(localAngle, r - 2);

  const gaugeColor = benchmark.metTarget ? Colors.success : benchmark.localPercentile > 70 ? Colors.highAlert : Colors.warning;

  return (
    <View style={styles.container}>
      <Text style={styles.metric}>{benchmark.metric}</Text>
      <Svg width={size} height={size}>
        {/* Background arc */}
        <Circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={Colors.border}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${(totalAngle / 360) * 2 * Math.PI * r} ${2 * Math.PI * r}`}
          strokeDashoffset={0}
          rotation={startAngle}
          origin={`${cx}, ${cy}`}
        />

        {/* Value arc */}
        <Circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${((localAngle - startAngle) / 360) * 2 * Math.PI * r} ${2 * Math.PI * r}`}
          strokeDashoffset={0}
          rotation={startAngle}
          origin={`${cx}, ${cy}`}
          opacity={0.8}
        />

        {/* State marker */}
        <Circle cx={statePos.x} cy={statePos.y} r={4} fill={Colors.info} opacity={0.7} />
        <SvgText x={statePos.x} y={statePos.y - 8} textAnchor="middle" fill={Colors.info} fontSize={7}>ST</SvgText>

        {/* National marker */}
        <Circle cx={nationalPos.x} cy={nationalPos.y} r={4} fill={Colors.warning} opacity={0.7} />
        <SvgText x={nationalPos.x} y={nationalPos.y - 8} textAnchor="middle" fill={Colors.warning} fontSize={7}>US</SvgText>

        {/* HP2030 target line */}
        {benchmark.hp2030Target != null && (() => {
          const targetAngle = valueToAngle(benchmark.hp2030Target);
          const inner = angleToCoord(targetAngle, r - 10);
          const outer = angleToCoord(targetAngle, r + 6);
          return (
            <G>
              <Line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={Colors.success} strokeWidth={2} />
              <SvgText x={outer.x} y={outer.y - 6} textAnchor="middle" fill={Colors.success} fontSize={7}>HP</SvgText>
            </G>
          );
        })()}

        {/* Local value needle */}
        <Circle cx={localPos.x} cy={localPos.y} r={6} fill={gaugeColor} stroke={Colors.surface} strokeWidth={2} />

        {/* Center value */}
        <SvgText x={cx} y={cy + 4} textAnchor="middle" fill={Colors.textPrimary} fontSize={16} fontWeight="bold">
          {benchmark.localValue.toFixed(1)}
        </SvgText>
        <SvgText x={cx} y={cy + 16} textAnchor="middle" fill={Colors.textMuted} fontSize={8}>
          {benchmark.localPercentile}th pctl
        </SvgText>
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: gaugeColor }]} />
          <Text style={styles.legendText}>Local</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: Colors.info }]} />
          <Text style={styles.legendText}>State</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: Colors.warning }]} />
          <Text style={styles.legendText}>National</Text>
        </View>
        {benchmark.hp2030Target != null && (
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>HP2030</Text>
          </View>
        )}
      </View>

      {benchmark.metTarget && (
        <View style={styles.targetBadge}>
          <Text style={styles.targetBadgeText}><SvgIcon name="check" size={12} color={Colors.success} /> Meets HP2030 Target</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: Spacing.sm },
  metric: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.xs, textTransform: 'capitalize' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginTop: Spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { ...Typography.monoSmall, color: Colors.textMuted },
  dot: { width: 6, height: 6, borderRadius: 3 },
  targetBadge: { marginTop: Spacing.xs, backgroundColor: Colors.success + '20', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 4 },
  targetBadgeText: { ...Typography.monoSmall, color: Colors.success, fontWeight: '600' },
});
