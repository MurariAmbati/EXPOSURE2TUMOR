// ============================================================
// StatusPill — Animated status indicator chip
// AnimatedCounter — Smooth number counter animation
// Breadcrumb — Navigation context breadcrumb trail
// SectionHeader — Consistent section heading with info tooltip
// ============================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

// ---- StatusPill ----
type PillVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'live';

const PILL_COLORS: Record<PillVariant, { bg: string; text: string }> = {
  success: { bg: Colors.success + '20', text: Colors.success },
  warning: { bg: Colors.warning + '20', text: Colors.warning },
  error: { bg: Colors.highAlert + '20', text: Colors.highAlert },
  info: { bg: Colors.info + '20', text: Colors.info },
  neutral: { bg: Colors.border, text: Colors.textMuted },
  live: { bg: Colors.accentTeal + '20', text: Colors.accentTeal },
};

export function StatusPill({ label, variant = 'neutral', pulse = false, style }: {
  label: string;
  variant?: PillVariant;
  pulse?: boolean;
  style?: ViewStyle;
}) {
  const colors = PILL_COLORS[variant];
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, anim]);

  return (
    <Animated.View style={[st.pill, { backgroundColor: colors.bg, opacity: pulse ? anim : 1 }, style]}>
      {(variant === 'live' || pulse) && <View style={[st.pillDot, { backgroundColor: colors.text }]} />}
      <Text style={[st.pillText, { color: colors.text }]}>{label}</Text>
    </Animated.View>
  );
}

// ---- AnimatedCounter ----
export function AnimatedCounter({ value, duration = 600, style, prefix = '', suffix = '' }: {
  value: number;
  duration?: number;
  style?: any;
  prefix?: string;
  suffix?: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const displayRef = useRef(0);
  const [display, setDisplay] = React.useState('0');

  useEffect(() => {
    anim.setValue(displayRef.current);
    Animated.timing(anim, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    const listener = anim.addListener(({ value: v }) => {
      displayRef.current = v;
      setDisplay(
        Number.isInteger(value) ? Math.round(v).toString() : v.toFixed(1),
      );
    });
    return () => anim.removeListener(listener);
  }, [value, duration, anim]);

  return <Text style={style}>{prefix}{display}{suffix}</Text>;
}

// ---- Breadcrumb ----
export function Breadcrumb({ items, style }: {
  items: Array<{ label: string; onPress?: () => void }>;
  style?: ViewStyle;
}) {
  return (
    <View style={[st.breadcrumb, style]}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Text style={st.breadSep}>›</Text>}
          {item.onPress ? (
            <TouchableOpacity onPress={item.onPress} activeOpacity={0.6}>
              <Text style={[st.breadItem, st.breadLink]}>{item.label}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[st.breadItem, i === items.length - 1 && st.breadActive]}>{item.label}</Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ---- SectionHeader ----
export function SectionHeader({ title, subtitle, actionLabel, onAction, style }: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}) {
  return (
    <View style={[st.sectionHeader, style]}>
      <View style={st.sectionTitleRow}>
        <Text style={st.sectionTitle}>{title}</Text>
        {actionLabel && onAction && (
          <TouchableOpacity onPress={onAction} activeOpacity={0.6}>
            <Text style={st.sectionAction}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
      {subtitle && <Text style={st.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ---- Divider ----
export function Divider({ label, style }: { label?: string; style?: ViewStyle }) {
  return (
    <View style={[st.divider, style]}>
      <View style={st.dividerLine} />
      {label && <Text style={st.dividerLabel}>{label}</Text>}
      <View style={st.dividerLine} />
    </View>
  );
}

const st = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    gap: 5,
    alignSelf: 'flex-start',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    ...Typography.monoSmall,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  breadSep: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  breadItem: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  breadLink: {
    color: Colors.accentTeal,
  },
  breadActive: {
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.heading2,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionAction: {
    ...Typography.bodySmall,
    color: Colors.accentTeal,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.sm,
  },
});
