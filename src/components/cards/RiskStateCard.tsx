// ============================================================
// Exposure2Tumor — Risk State Card
// Shows one risk state category with percentile, tier, drivers
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { SvgIcon, IconName } from '../SvgIcon';
import type { RiskState } from '../../types';

interface Props {
  riskState: RiskState;
  onPress?: () => void;
  compact?: boolean;
}

const TIER_COLORS: Record<string, string> = {
  very_high: Colors.highAlert,
  high: Colors.warning,
  moderate: Colors.textSecondary,
  low: Colors.success,
  very_low: Colors.preventionOpportunity,
};

const CATEGORY_LABELS: Record<string, string> = {
  environmental_burden: 'Environmental Burden',
  behavioral_burden: 'Behavioral Burden',
  preventive_access: 'Preventive Access',
  structural_vulnerability: 'Structural Vulnerability',
  cumulative_cancer_pressure: 'Cumulative Cancer Pressure',
  prevention_opportunity: 'Prevention Opportunity',
};

const CATEGORY_ICONS: Record<string, string> = {
  environmental_burden: 'factory',
  behavioral_burden: 'smoking',
  preventive_access: 'hospital',
  structural_vulnerability: 'neighborhood',
  cumulative_cancer_pressure: 'warning',
  prevention_opportunity: 'lightbulb',
};

export function RiskStateCard({ riskState, onPress, compact }: Props) {
  const tierColor = TIER_COLORS[riskState.tier] ?? Colors.textMuted;
  const label = CATEGORY_LABELS[riskState.category] ?? riskState.category;
  const icon = CATEGORY_ICONS[riskState.category] ?? 'chart';

  return (
    <Pressable
      style={[styles.card, compact && styles.cardCompact]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <SvgIcon name={icon as IconName} size={20} color={tierColor} />
        <View style={styles.headerText}>
          <Text style={styles.categoryLabel} numberOfLines={1}>{label}</Text>
          <Text style={[styles.tier, { color: tierColor }]}>
            {riskState.tier.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <View style={[styles.scoreBadge, { borderColor: tierColor }]}>
          <Text style={[styles.scoreValue, { color: tierColor }]}>
            {riskState.score.toFixed(0)}
          </Text>
          <Text style={styles.scoreLabel}>P{riskState.percentile}</Text>
        </View>
      </View>

      {!compact && (
        <>
          {/* Confidence bar */}
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                {
                  left: `${riskState.confidence[0]}%`,
                  width: `${riskState.confidence[1] - riskState.confidence[0]}%`,
                  backgroundColor: tierColor + '40',
                },
              ]}
            />
            <View
              style={[
                styles.confidenceMarker,
                { left: `${riskState.score}%`, backgroundColor: tierColor },
              ]}
            />
          </View>

          {/* Top drivers */}
          {riskState.topDrivers.length > 0 && (
            <View style={styles.driversSection}>
              <Text style={styles.driversTitle}>Top Drivers</Text>
              {riskState.topDrivers.slice(0, 3).map((driver) => (
                <View key={driver.measureId} style={styles.driverRow}>
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName} numberOfLines={1}>
                      {driver.name}
                    </Text>
                    <Text
                      style={[
                        styles.driverDirection,
                        {
                          color:
                            driver.direction === 'increasing_risk'
                              ? Colors.highAlert
                              : driver.direction === 'decreasing_risk'
                              ? Colors.success
                              : Colors.textMuted,
                        },
                      ]}
                    >
                      {driver.direction === 'increasing_risk'
                        ? '▲'
                        : driver.direction === 'decreasing_risk'
                        ? '▼'
                        : '—'}
                    </Text>
                  </View>
                  <View style={styles.driverBar}>
                    <View
                      style={[
                        styles.driverBarFill,
                        {
                          width: `${driver.percentile}%`,
                          backgroundColor:
                            driver.direction === 'increasing_risk'
                              ? Colors.highAlert + '50'
                              : Colors.success + '50',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.driverValue}>P{driver.percentile}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Trend */}
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Trend:</Text>
            <Text
              style={[
                styles.trendValue,
                {
                  color:
                    riskState.trend === 'improving'
                      ? Colors.success
                      : riskState.trend === 'worsening'
                      ? Colors.highAlert
                      : Colors.textMuted,
                },
              ]}
            >
              {riskState.trend.replace('_', ' ')}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  cardCompact: {
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  categoryLabel: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  tier: {
    ...Typography.label,
    marginTop: 2,
  },
  scoreBadge: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    alignItems: 'center',
    minWidth: 48,
  },
  scoreValue: {
    ...Typography.monoLarge,
  },
  scoreLabel: {
    ...Typography.monoSmall,
    color: Colors.textMuted,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 3,
    marginTop: Spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  confidenceFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  confidenceMarker: {
    position: 'absolute',
    top: -1,
    width: 3,
    height: 8,
    borderRadius: 1.5,
    marginLeft: -1.5,
  },
  driversSection: {
    marginTop: Spacing.md,
  },
  driversTitle: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '35%',
  },
  driverName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    textTransform: 'capitalize',
  },
  driverDirection: {
    fontSize: 10,
    marginLeft: 4,
  },
  driverBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 2,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  driverBarFill: {
    height: 4,
    borderRadius: 2,
  },
  driverValue: {
    ...Typography.monoSmall,
    color: Colors.textMuted,
    width: 30,
    textAlign: 'right',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  trendLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginRight: Spacing.xs,
  },
  trendValue: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
