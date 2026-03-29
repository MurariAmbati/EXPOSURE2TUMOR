// ============================================================
// Exposure2Tumor — Data Quality Badge
// Compact data quality indicator with completeness/recency
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import type { DataQualityReport } from '../../types';

interface Props {
  report: DataQualityReport;
  compact?: boolean;
  onPress?: () => void;
}

export function DataQualityBadge({ report, compact = false, onPress }: Props) {
  const color = report.overallScore >= 80 ? Colors.success
    : report.overallScore >= 50 ? Colors.warning
    : Colors.highAlert;

  const label = report.overallScore >= 80 ? 'High Quality'
    : report.overallScore >= 50 ? 'Moderate Quality'
    : 'Low Quality';

  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.compactBadge, { borderColor: color + '40' }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.compactText, { color }]}>{report.overallScore}%</Text>
      </TouchableOpacity>
    );
  }

  const issueCount = report.measures.reduce((sum, m) => sum + m.issues.length, 0);
  const suppressedCount = report.measures.filter(m => m.suppressed).length;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.scoreRow}>
          <View style={[styles.scoreBadge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
            <Text style={[styles.scoreText, { color }]}>{report.overallScore}%</Text>
          </View>
          <View>
            <Text style={[styles.label, { color }]}>{label}</Text>
            <Text style={styles.sublabel}>{report.measures.length} measures assessed</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{report.measures.filter(m => m.confidence === 'high').length}</Text>
          <Text style={styles.metricLabel}>High conf.</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{suppressedCount}</Text>
          <Text style={styles.metricLabel}>Suppressed</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{issueCount}</Text>
          <Text style={styles.metricLabel}>Issues</Text>
        </View>
      </View>

      {issueCount > 0 && (
        <View style={styles.issuesList}>
          {report.measures
            .flatMap(m => m.issues.map(issue => ({ measureId: m.measureId, issue })))
            .slice(0, 3)
            .map((item, i) => (
              <Text key={i} style={styles.issueText}>
                • {item.measureId.replace(/_/g, ' ')}: {item.issue}
              </Text>
            ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  compactText: { ...Typography.monoSmall, fontWeight: '600' },
  header: { marginBottom: Spacing.sm },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  scoreBadge: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2,
  },
  scoreText: { ...Typography.mono, fontWeight: '800', fontSize: 14 },
  label: { ...Typography.body, fontWeight: '600' },
  sublabel: { ...Typography.bodySmall, color: Colors.textMuted },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  metric: { alignItems: 'center' },
  metricValue: { ...Typography.mono, color: Colors.textPrimary, fontWeight: '700' },
  metricLabel: { ...Typography.monoSmall, color: Colors.textMuted },
  issuesList: { marginTop: Spacing.sm, paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border },
  issueText: { ...Typography.bodySmall, color: Colors.warning, marginBottom: 2 },
});
