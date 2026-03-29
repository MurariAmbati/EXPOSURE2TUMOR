// ============================================================
// Exposure2Tumor — ActivityFeed Component
// Timeline of user actions for transparency and review
// ============================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { SvgIcon, IconName } from '../SvgIcon';
import type { ActivityLogEntry, ActivityAction } from '../../types';

const ACTION_CONFIG: Record<ActivityAction, { icon: string; color: string }> = {
  search: { icon: 'searchAlt', color: '#6366F1' },
  view_screen: { icon: 'grid', color: '#8B5CF6' },
  view_geo: { icon: 'location', color: '#14B8A6' },
  run_scenario: { icon: 'flask', color: '#F59E0B' },
  export_data: { icon: 'download', color: '#10B981' },
  capture_photo: { icon: 'photo', color: '#EC4899' },
  add_journal_entry: { icon: 'clipboard', color: '#06B6D4' },
  field_collection: { icon: 'note', color: '#F97316' },
  bookmark: { icon: 'pin', color: '#EF4444' },
  share: { icon: 'share', color: '#A855F7' },
  generate_report: { icon: 'grid', color: '#14B8A6' },
  set_watchlist: { icon: 'triangle', color: '#F59E0B' },
  change_setting: { icon: 'settings', color: '#78716C' },
};

interface ActivityFeedProps {
  entries: ActivityLogEntry[];
  maxItems?: number;
  onClear?: () => void;
  compact?: boolean;
}

export function ActivityFeed({
  entries,
  maxItems = 50,
  onClear,
  compact = false,
}: ActivityFeedProps) {
  const groupedByDay = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    ).slice(0, maxItems);

    const groups: Array<{ day: string; items: ActivityLogEntry[] }> = [];
    let currentDay = '';
    sorted.forEach((entry) => {
      const day = entry.timestamp.split('T')[0];
      if (day !== currentDay) {
        currentDay = day;
        groups.push({ day, items: [] });
      }
      groups[groups.length - 1].items.push(entry);
    });
    return groups;
  }, [entries, maxItems]);

  const formatTime = (ts: string): string => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDay = (day: string): string => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (day === today) return 'Today';
    if (day === yesterday) return 'Yesterday';
    return day;
  };

  if (entries.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <SvgIcon name="clipboard" size={32} color={Colors.textMuted} />
        <Text style={styles.emptyText}>No activity recorded yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Activity Feed</Text>
        <View style={styles.headerRight}>
          <Text style={styles.countBadge}>{entries.length}</Text>
          {onClear && (
            <Pressable onPress={onClear}>
              <Text style={styles.clearBtn}>Clear</Text>
            </Pressable>
          )}
        </View>
      </View>
      {groupedByDay.map((group) => (
        <View key={group.day}>
          <Text style={styles.dayLabel}>{formatDay(group.day)}</Text>
          {group.items.map((entry) => {
            const cfg = ACTION_CONFIG[entry.action];
            return compact ? (
              <View key={entry.id} style={styles.compactRow}>
                <SvgIcon name={cfg.icon as IconName} size={14} color={cfg.color} />
                <Text style={styles.compactLabel} numberOfLines={1}>{entry.label}</Text>
                <Text style={styles.compactTime}>{formatTime(entry.timestamp)}</Text>
              </View>
            ) : (
              <View key={entry.id} style={styles.feedItem}>
                <View style={[styles.feedIconBox, { backgroundColor: cfg.color + '20' }]}>
                  <SvgIcon name={cfg.icon as IconName} size={16} color={cfg.color} />
                </View>
                <View style={styles.feedContent}>
                  <Text style={styles.feedLabel}>{entry.label}</Text>
                  {entry.detail && (
                    <Text style={styles.feedDetail} numberOfLines={1}>{entry.detail}</Text>
                  )}
                  <View style={styles.feedMetaRow}>
                    <Text style={styles.feedTime}>{formatTime(entry.timestamp)}</Text>
                    {entry.screen && (
                      <Text style={styles.feedScreen}>{entry.screen}</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// Mini version for embedding in cards
interface ActivityMiniProps {
  entries: ActivityLogEntry[];
  max?: number;
}

export function ActivityMini({ entries, max = 5 }: ActivityMiniProps) {
  const recent = useMemo(
    () => [...entries]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, max),
    [entries, max],
  );

  if (recent.length === 0) return null;

  return (
    <View style={styles.miniContainer}>
      {recent.map((entry) => {
        const cfg = ACTION_CONFIG[entry.action];
        return (
          <View key={entry.id} style={styles.miniRow}>
            <SvgIcon name={cfg.icon as IconName} size={12} color={cfg.color} />
            <Text style={styles.miniLabel} numberOfLines={1}>{entry.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitle: { ...Typography.heading3, color: Colors.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  countBadge: {
    ...Typography.caption,
    color: Colors.accentTeal,
    backgroundColor: Colors.accentTeal + '15',
    borderRadius: BorderRadius.round,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  clearBtn: { ...Typography.caption, color: Colors.textMuted },

  dayLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },

  // Full feed item
  feedItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '40',
  },
  feedIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedIcon: { fontSize: 14 },
  feedContent: { flex: 1 },
  feedLabel: { ...Typography.body, color: Colors.textPrimary, fontSize: 13 },
  feedDetail: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  feedMetaRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: 2 },
  feedTime: { ...Typography.caption, color: Colors.textMuted },
  feedScreen: { ...Typography.caption, color: Colors.textMuted },

  // Compact item
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  compactIcon: { fontSize: 12, width: 16, textAlign: 'center' },
  compactLabel: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },
  compactTime: { ...Typography.caption, color: Colors.textMuted },

  // Mini
  miniContainer: { gap: 2 },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniIcon: { fontSize: 10, width: 14, textAlign: 'center' },
  miniLabel: { ...Typography.caption, color: Colors.textMuted, flex: 1 },

  // Empty
  emptyBox: { alignItems: 'center', padding: Spacing.md },
  emptyIcon: { fontSize: 28, marginBottom: 4 },
  emptyText: { ...Typography.caption, color: Colors.textMuted },
});
