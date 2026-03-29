// ============================================================
// Exposure2Tumor — Lollipop Chart (Ranked Drivers)
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';

interface LollipopItem {
  label: string;
  value: number;
  color: string;
  maxValue?: number;
}

interface Props {
  items: LollipopItem[];
  title?: string;
  height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function LollipopChart({ items, title, height: itemHeight = 28 }: Props) {
  const chartWidth = SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md * 2 - 100;
  const maxVal = Math.max(...items.map((i) => i.maxValue ?? i.value), 1);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {items.map((item, index) => {
        const barLen = (item.value / maxVal) * chartWidth;
        return (
          <View key={index} style={[styles.row, { height: itemHeight }]}>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <View style={styles.chartArea}>
              <Svg width={chartWidth + 10} height={itemHeight}>
                <Line
                  x1={0}
                  y1={itemHeight / 2}
                  x2={barLen}
                  y2={itemHeight / 2}
                  stroke={item.color}
                  strokeWidth={2}
                />
                <Circle
                  cx={barLen}
                  cy={itemHeight / 2}
                  r={5}
                  fill={item.color}
                />
              </Svg>
            </View>
            <Text style={[styles.value, { color: item.color }]}>
              {item.value.toFixed(0)}
            </Text>
          </View>
        );
      })}
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
  title: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxs,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    width: 80,
    textTransform: 'capitalize',
  },
  chartArea: {
    flex: 1,
  },
  value: {
    ...Typography.monoSmall,
    width: 28,
    textAlign: 'right',
  },
});
