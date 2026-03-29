// ============================================================
// EmptyState — Illustrated empty/zero-data placeholder with CTA
// Replaces blank screens with actionable guidance
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

type EmptyVariant = 'no_data' | 'no_results' | 'no_location' | 'first_time' | 'error' | 'offline';

interface EmptyStateProps {
  variant?: EmptyVariant;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  style?: ViewStyle;
}

const VARIANT_DEFAULTS: Record<EmptyVariant, { title: string; message: string; icon: EmptyVariant }> = {
  no_data: {
    title: 'No Data Available',
    message: 'Select a location and cancer site to load exposure and risk intelligence.',
    icon: 'no_data',
  },
  no_results: {
    title: 'No Results Found',
    message: 'Try adjusting your search terms or filters to find what you need.',
    icon: 'no_results',
  },
  no_location: {
    title: 'Location Required',
    message: 'Enable location services or search for a geographic area to begin analysis.',
    icon: 'no_location',
  },
  first_time: {
    title: 'Welcome to Exposure2Tumor',
    message: 'Start by selecting a cancer site and location to explore exposure-cancer intelligence.',
    icon: 'first_time',
  },
  error: {
    title: 'Something Went Wrong',
    message: 'An error occurred while loading data. Try again or check your connection.',
    icon: 'error',
  },
  offline: {
    title: 'You\'re Offline',
    message: 'Connect to the internet to fetch the latest exposure and cancer burden data.',
    icon: 'offline',
  },
};

function EmptyIcon({ variant, size = 80 }: { variant: EmptyVariant; size?: number }) {
  const cx = size / 2;
  const r = size * 0.38;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cx} r={r} fill={Colors.surfaceHighlight} stroke={Colors.border} strokeWidth={1.5} />
      {variant === 'no_data' && (
        <G>
          <Rect x={cx - 12} y={cx - 14} width={24} height={28} rx={3} fill="none" stroke={Colors.textMuted} strokeWidth={1.5} />
          <Path d={`M${cx - 7} ${cx - 4} h14 M${cx - 7} ${cx + 2} h10 M${cx - 7} ${cx + 8} h8`} stroke={Colors.textMuted} strokeWidth={1.2} strokeLinecap="round" />
        </G>
      )}
      {variant === 'no_results' && (
        <G>
          <Circle cx={cx - 4} cy={cx - 2} r={10} fill="none" stroke={Colors.textMuted} strokeWidth={1.5} />
          <Path d={`M${cx + 4} ${cx + 6} l8 8`} stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" />
        </G>
      )}
      {variant === 'no_location' && (
        <G>
          <Path d={`M${cx} ${cx - 16} c-8 0 -14 6 -14 14 c0 10 14 20 14 20 s14 -10 14 -20 c0 -8 -6 -14 -14 -14z`} fill="none" stroke={Colors.accentTeal} strokeWidth={1.5} />
          <Circle cx={cx} cy={cx - 2} r={4} fill={Colors.accentTeal} opacity={0.4} />
        </G>
      )}
      {variant === 'first_time' && (
        <G>
          <Path d={`M${cx - 10} ${cx + 6} l10 -20 l10 20 z`} fill="none" stroke={Colors.accentTeal} strokeWidth={1.5} />
          <Circle cx={cx} cy={cx - 2} r={2} fill={Colors.accentTeal} />
          <Path d={`M${cx} ${cx + 1} v5`} stroke={Colors.accentTeal} strokeWidth={1.5} strokeLinecap="round" />
        </G>
      )}
      {variant === 'error' && (
        <G>
          <Circle cx={cx} cy={cx} r={14} fill="none" stroke={Colors.highAlert} strokeWidth={1.5} />
          <Path d={`M${cx} ${cx - 6} v8`} stroke={Colors.highAlert} strokeWidth={2} strokeLinecap="round" />
          <Circle cx={cx} cy={cx + 6} r={1.5} fill={Colors.highAlert} />
        </G>
      )}
      {variant === 'offline' && (
        <G>
          <Path d={`M${cx - 14} ${cx - 6} q14 -14 28 0`} fill="none" stroke={Colors.textMuted} strokeWidth={1.5} strokeLinecap="round" />
          <Path d={`M${cx - 8} ${cx + 1} q8 -10 16 0`} fill="none" stroke={Colors.textMuted} strokeWidth={1.5} strokeLinecap="round" />
          <Circle cx={cx} cy={cx + 8} r={2.5} fill={Colors.textMuted} />
          <Path d={`M${cx - 16} ${cx + 16} L${cx + 16} ${cx - 16}`} stroke={Colors.highAlert} strokeWidth={2} strokeLinecap="round" />
        </G>
      )}
    </Svg>
  );
}

export function EmptyState({
  variant = 'no_data',
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  style,
}: EmptyStateProps) {
  const defaults = VARIANT_DEFAULTS[variant];
  const displayTitle = title ?? defaults.title;
  const displayMessage = message ?? defaults.message;

  return (
    <View style={[st.container, style]}>
      <EmptyIcon variant={variant} />
      <Text style={st.title}>{displayTitle}</Text>
      <Text style={st.message}>{displayMessage}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={st.primary} onPress={onAction} activeOpacity={0.7}>
          <Text style={st.primaryText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
      {secondaryLabel && onSecondary && (
        <TouchableOpacity onPress={onSecondary} activeOpacity={0.7}>
          <Text style={st.secondaryText}>{secondaryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  title: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  primary: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  primaryText: {
    ...Typography.body,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  secondaryText: {
    ...Typography.bodySmall,
    color: Colors.accentTeal,
    marginTop: Spacing.md,
  },
});
