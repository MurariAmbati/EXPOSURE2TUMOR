// ============================================================
// Exposure2Tumor — Alert Banner
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { SvgIcon, IconName } from '../SvgIcon';
import type { Alert } from '../../types';

interface Props {
  alert: Alert;
  onDismiss?: () => void;
  onPress?: () => void;
}

const SEVERITY_COLORS = {
  info: Colors.info,
  warning: Colors.warning,
  critical: Colors.highAlert,
};

const SEVERITY_ICONS = {
  info: 'info',
  warning: 'warning',
  critical: 'siren',
};

export function AlertBanner({ alert, onDismiss, onPress }: Props) {
  const color = SEVERITY_COLORS[alert.severity];
  const icon = SEVERITY_ICONS[alert.severity];

  return (
    <Pressable style={[styles.container, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.iconContainer}>
        <SvgIcon name={icon as IconName} size={16} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{alert.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {alert.description}
        </Text>
        {alert.geoContext && (
          <Text style={styles.context}>
             {alert.geoContext.name}
          </Text>
        )}
      </View>
      {onDismiss && (
        <Pressable style={styles.dismissBtn} onPress={onDismiss}>
          <Text style={styles.dismissText}>×</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    marginRight: Spacing.sm,
    paddingTop: 2,
  },
  icon: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  context: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  dismissBtn: {
    paddingLeft: Spacing.sm,
  },
  dismissText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
});
