// ============================================================
// Exposure2Tumor — Watchlist Card
// Alert threshold monitoring status card
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { SvgIcon } from '../SvgIcon';
import type { WatchlistItem } from '../../types';

interface Props {
  item: WatchlistItem;
  onPress?: () => void;
  onRemove?: () => void;
}

export function WatchlistCard({ item, onPress, onRemove }: Props) {
  const statusColor = item.status === 'triggered' ? Colors.highAlert
    : item.status === 'warning' ? Colors.warning
    : item.status === 'resolved' ? Colors.success
    : Colors.textMuted;

  const statusLabel = item.status === 'triggered' ? 'TRIGGERED'
    : item.status === 'warning' ? 'WARNING'
    : item.status === 'resolved' ? 'RESOLVED'
    : 'NORMAL';

  const triggeredCount = item.thresholds.filter(t => t.triggered).length;

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, { borderLeftColor: statusColor }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.geoName}>{item.geoName}</Text>
          <Text style={styles.cancerSite}>{item.cancerSite}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {item.status === 'triggered' && <SvgIcon name="warning" size={12} color={statusColor} />}
            {item.status === 'resolved' && <SvgIcon name="check" size={12} color={statusColor} />}
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.thresholds}>
        {item.thresholds.map((t, i) => (
          <View key={i} style={[styles.thresholdRow, t.triggered && styles.thresholdTriggered]}>
            <View style={[styles.thresholdDot, { backgroundColor: t.triggered ? Colors.highAlert : Colors.textMuted }]} />
            <Text style={styles.thresholdName} numberOfLines={1}>{t.measureName}</Text>
            <Text style={[styles.thresholdOp, { color: t.triggered ? Colors.highAlert : Colors.textMuted }]}>
              {t.operator === 'above' ? '>' : t.operator === 'below' ? '<' : '∆>'} {t.value.toFixed(1)}
            </Text>
            <Text style={[styles.thresholdCurrent, { color: t.triggered ? Colors.highAlert : Colors.accentTeal }]}>
              {t.currentValue.toFixed(1)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {triggeredCount}/{item.thresholds.length} thresholds triggered
        </Text>
        <Text style={styles.footerText}>
          Checked {new Date(item.lastChecked).toLocaleDateString()}
        </Text>
      </View>

      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>Remove</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  headerLeft: { flex: 1 },
  geoName: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  cancerSite: { ...Typography.bodySmall, color: Colors.textMuted, textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  statusText: { ...Typography.monoSmall, fontWeight: '700', letterSpacing: 0.5 },
  thresholds: { marginBottom: Spacing.sm },
  thresholdRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: Spacing.sm },
  thresholdTriggered: { backgroundColor: Colors.highAlert + '08', borderRadius: 4, paddingHorizontal: 4 },
  thresholdDot: { width: 6, height: 6, borderRadius: 3 },
  thresholdName: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1, textTransform: 'capitalize' },
  thresholdOp: { ...Typography.monoSmall, width: 50, textAlign: 'right' },
  thresholdCurrent: { ...Typography.monoSmall, fontWeight: '700', width: 40, textAlign: 'right' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border },
  footerText: { ...Typography.monoSmall, color: Colors.textMuted },
  removeBtn: { marginTop: Spacing.sm, alignSelf: 'flex-end' },
  removeBtnText: { ...Typography.bodySmall, color: Colors.highAlert },
});
