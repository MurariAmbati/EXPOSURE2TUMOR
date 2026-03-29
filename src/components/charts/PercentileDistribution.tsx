// ============================================================
// Exposure2Tumor — Percentile Distribution Chart
// Map-linked histogram showing "where this place sits nationally"
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';

interface Props {
  distribution: number[]; // 10 buckets (deciles) with counts
  currentPercentile: number;
  label: string;
  color?: string;
  height?: number;
}

const BAR_COUNT = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PercentileDistribution({
  distribution,
  currentPercentile,
  label,
  color = Colors.info,
  height = 60,
}: Props) {
  const chartWidth = SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md * 2;
  const barWidth = (chartWidth - (BAR_COUNT - 1) * 2) / BAR_COUNT;
  const maxVal = Math.max(...distribution, 1);
  const currentDecile = Math.min(9, Math.floor(currentPercentile / 10));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.percentileValue, { color }]}>P{currentPercentile}</Text>
      </View>
      <View style={[styles.chartArea, { height }]}>
        <Svg width={chartWidth} height={height}>
          {distribution.map((val, i) => {
            const barHeight = (val / maxVal) * (height - 12);
            const x = i * (barWidth + 2);
            const y = height - barHeight - 6;
            const isHighlighted = i === currentDecile;

            return (
              <React.Fragment key={i}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={2}
                  fill={isHighlighted ? color : Colors.surfaceHighlight}
                  opacity={isHighlighted ? 1 : 0.6}
                />
                {isHighlighted && (
                  <Line
                    x1={x + barWidth / 2}
                    y1={0}
                    x2={x + barWidth / 2}
                    y2={y - 2}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                )}
              </React.Fragment>
            );
          })}
          {/* Axis labels */}
          <SvgText x={0} y={height} fill={Colors.textMuted} fontSize={8}>0</SvgText>
          <SvgText x={chartWidth - 12} y={height} fill={Colors.textMuted} fontSize={8}>100</SvgText>
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  percentileValue: {
    ...Typography.mono,
    fontWeight: '600',
  },
  chartArea: {
    overflow: 'hidden',
  },
});
