// ============================================================
// Exposure2Tumor — Correlation Heatmap
// Matrix visualization of measure-to-measure correlations
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../../theme';
import type { CorrelationMatrix } from '../../types';

interface Props {
  matrix: CorrelationMatrix;
  cellSize?: number;
  labels?: string[];
}

function corrColor(value: number): string {
  if (value >= 0.6) return '#22C55E';    // strong positive
  if (value >= 0.3) return '#86EFAC';    // moderate positive
  if (value > -0.3) return Colors.surface; // weak
  if (value > -0.6) return '#FCA5A5';    // moderate negative
  return '#EF4444';                       // strong negative
}

export function CorrelationHeatmap({ matrix, cellSize = 36, labels }: Props) {
  const n = matrix.measures.length;
  if (n === 0) return null;

  const displayLabels = labels ?? matrix.measures.map(m => m.replace(/_/g, ' ').slice(0, 12));
  const labelWidth = 90;
  const svgW = labelWidth + n * cellSize + 10;
  const svgH = 20 + n * cellSize + 10;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Correlation Matrix ({matrix.method})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={svgW} height={svgH}>
          {/* Column headers */}
          {displayLabels.map((label, i) => (
            <SvgText
              key={`col-${i}`}
              x={labelWidth + i * cellSize + cellSize / 2}
              y={14}
              textAnchor="middle"
              fill={Colors.textMuted}
              fontSize={7}
              transform={`rotate(-45, ${labelWidth + i * cellSize + cellSize / 2}, 14)`}
            >
              {label}
            </SvgText>
          ))}

          {/* Rows */}
          {matrix.matrix.map((row, i) => (
            <React.Fragment key={`row-${i}`}>
              {/* Row label */}
              <SvgText
                x={labelWidth - 4}
                y={20 + i * cellSize + cellSize / 2 + 3}
                textAnchor="end"
                fill={Colors.textSecondary}
                fontSize={8}
              >
                {displayLabels[i]}
              </SvgText>

              {/* Cells */}
              {row.map((val, j) => (
                <React.Fragment key={`cell-${i}-${j}`}>
                  <Rect
                    x={labelWidth + j * cellSize + 1}
                    y={20 + i * cellSize + 1}
                    width={cellSize - 2}
                    height={cellSize - 2}
                    fill={corrColor(val)}
                    opacity={Math.abs(val) * 0.7 + 0.15}
                    rx={3}
                  />
                  <SvgText
                    x={labelWidth + j * cellSize + cellSize / 2}
                    y={20 + i * cellSize + cellSize / 2 + 3}
                    textAnchor="middle"
                    fill={Math.abs(val) > 0.5 ? Colors.textPrimary : Colors.textMuted}
                    fontSize={8}
                    fontWeight={Math.abs(val) > 0.5 ? 'bold' : 'normal'}
                  >
                    {i === j ? '—' : val.toFixed(2)}
                  </SvgText>
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </Svg>
      </ScrollView>

      {matrix.significantPairs.length > 0 && (
        <View style={styles.pairsSection}>
          <Text style={styles.pairsTitle}>Significant Correlations</Text>
          {matrix.significantPairs.slice(0, 5).map((pair, i) => (
            <View key={i} style={styles.pairRow}>
              <View style={[styles.badge, { backgroundColor: pair.direction === 'positive' ? Colors.success + '20' : Colors.highAlert + '20' }]}>
                <Text style={[styles.badgeText, { color: pair.direction === 'positive' ? Colors.success : Colors.highAlert }]}>
                  {pair.direction === 'positive' ? '+' : '−'}{Math.abs(pair.coefficient).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.pairText} numberOfLines={1}>
                {pair.measureA.replace(/_/g, ' ')} ↔ {pair.measureB.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.pairStrength}>{pair.strength}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: Spacing.md },
  title: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm },
  pairsSection: { marginTop: Spacing.md, padding: Spacing.sm, backgroundColor: Colors.surface, borderRadius: 8 },
  pairsTitle: { ...Typography.label, color: Colors.accentTeal, marginBottom: Spacing.xs },
  pairRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: Spacing.sm },
  badgeText: { ...Typography.monoSmall, fontWeight: '700' },
  pairText: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },
  pairStrength: { ...Typography.monoSmall, color: Colors.textMuted },
});
