// ============================================================
// Exposure2Tumor — Exposure Ribbon (Signature Visualization)
// Horizontal ribbon showing exposure families as segments
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { SvgIcon, IconName } from '../SvgIcon';
import type { ExposureRibbonData, ExposureRibbonSegment, TrendDirection } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RIBBON_HEIGHT = 32;

interface Props {
  data: ExposureRibbonData | null;
  compact?: boolean;
  onSegmentPress?: (segment: ExposureRibbonSegment) => void;
}

function getTrendIcon(trend: TrendDirection): IconName {
  switch (trend) {
    case 'improving': return 'arrowDown';
    case 'worsening': return 'arrowUp';
    case 'stable': return 'arrowRight';
    default: return 'help';
  }
}

function getPercentileColor(percentile: number): string {
  if (percentile >= 80) return Colors.highAlert;
  if (percentile >= 60) return Colors.warning;
  if (percentile >= 40) return Colors.textSecondary;
  if (percentile >= 20) return Colors.success;
  return Colors.preventionOpportunity;
}

export function ExposureRibbon({ data, compact, onSegmentPress }: Props) {
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);

  if (!data) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Select a location to view exposure ribbon</Text>
        </View>
      </View>
    );
  }

  const totalWidth = SCREEN_WIDTH - Spacing.xl * 2;
  const segmentCount = data.segments.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{data.geoName}</Text>
        <View style={styles.overallBadge}>
          <Text style={[styles.overallScore, { color: getPercentileColor(data.overallPercentile) }]}>
            P{data.overallPercentile}
          </Text>
        </View>
      </View>

      {/* Ribbon */}
      <View style={styles.ribbonContainer}>
        <View style={styles.ribbon}>
          {data.segments.map((segment, index) => {
            const segWidth = totalWidth / segmentCount;
            const isExpanded = expandedSegment === segment.family;

            return (
              <Pressable
                key={segment.family}
                style={[
                  styles.segment,
                  {
                    width: segWidth - 2,
                    backgroundColor: segment.color + '30',
                    borderLeftWidth: index > 0 ? 1 : 0,
                    borderLeftColor: Colors.border,
                  },
                ]}
                onPress={() => {
                  setExpandedSegment(isExpanded ? null : segment.family);
                  onSegmentPress?.(segment);
                }}
              >
                {/* Percentile fill */}
                <View
                  style={[
                    styles.segmentFill,
                    {
                      width: `${segment.percentile}%`,
                      backgroundColor: segment.color + '60',
                    },
                  ]}
                />
                <Text style={styles.segmentLabel} numberOfLines={1}>
                  {compact ? segment.family.substring(0, 3).toUpperCase() : segment.label.split(' ')[0]}
                </Text>
                <Text style={[styles.segmentPercentile, { color: segment.color }]}>
                  {segment.percentile}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Uncertainty band */}
        <View style={styles.uncertaintyRow}>
          {data.segments.map((segment) => {
            const segWidth = totalWidth / segmentCount;
            return (
              <View key={`unc_${segment.family}`} style={[styles.uncertaintyCell, { width: segWidth - 2 }]}>
                <View
                  style={[
                    styles.uncertaintyBar,
                    {
                      left: `${segment.uncertainty[0]}%`,
                      width: `${segment.uncertainty[1] - segment.uncertainty[0]}%`,
                      backgroundColor: segment.color + '20',
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Expanded detail */}
      {expandedSegment && (
        <ScrollView style={styles.detailPanel} horizontal={false}>
          {data.segments
            .filter((s) => s.family === expandedSegment)
            .map((segment) => (
              <View key={`detail_${segment.family}`} style={styles.detailContent}>
                <View style={styles.detailHeader}>
                  <View style={[styles.detailDot, { backgroundColor: segment.color }]} />
                  <Text style={styles.detailTitle}>{segment.label}</Text>
                  <Text style={styles.detailTrend}><SvgIcon name={getTrendIcon(segment.direction)} size={12} color={Colors.textMuted} /> {segment.direction}</Text>
                </View>
                <Text style={styles.detailSubtitle}>
                  Percentile: {segment.percentile} | CI: [{segment.uncertainty[0]}–{segment.uncertainty[1]}] | Data year: {segment.recency}
                </Text>

                {/* Component measures */}
                {segment.measures.length > 0 && (
                  <View style={styles.measuresGrid}>
                    {segment.measures.slice(0, 6).map((m) => (
                      <View key={m.measureId} style={styles.measureItem}>
                        <Text style={styles.measureName}>
                          {m.measureId.replace(/_/g, ' ').replace(/^(environmental|behavioral|social structural|screening access|occupational|climate uv|food environment) /, '')}
                        </Text>
                        <Text style={[styles.measureValue, { color: getPercentileColor(m.percentile) }]}>
                          {m.value.toFixed(1)}
                        </Text>
                        <Text style={styles.measurePercentile}>P{m.percentile}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  placeholder: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    flex: 1,
  },
  overallBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.sm,
  },
  overallScore: {
    ...Typography.mono,
    fontWeight: '600',
  },
  ribbonContainer: {
    marginBottom: Spacing.xs,
  },
  ribbon: {
    flexDirection: 'row',
    height: RIBBON_HEIGHT,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  segment: {
    height: RIBBON_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  segmentFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  segmentLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginRight: 4,
    zIndex: 1,
  },
  segmentPercentile: {
    ...Typography.monoSmall,
    fontWeight: '600',
    zIndex: 1,
  },
  uncertaintyRow: {
    flexDirection: 'row',
    height: 4,
    marginTop: 2,
  },
  uncertaintyCell: {
    height: 4,
    position: 'relative',
  },
  uncertaintyBar: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
  },
  detailPanel: {
    marginTop: Spacing.sm,
    maxHeight: 200,
  },
  detailContent: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  detailTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    flex: 1,
  },
  detailTrend: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  detailSubtitle: {
    ...Typography.monoSmall,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  measuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  measureItem: {
    width: '48%',
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  measureName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  measureValue: {
    ...Typography.mono,
  },
  measurePercentile: {
    ...Typography.monoSmall,
    color: Colors.textMuted,
  },
});
