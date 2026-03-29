// ============================================================
// Exposure2Tumor — DataClipboard Component
// Copy-to-clipboard with auto-citation formatting
// ============================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { SvgIcon } from '../SvgIcon';

interface DataClipboardProps {
  value: string | number;
  label: string;
  source?: string;
  vintage?: string;
  unit?: string;
  format?: 'plain' | 'citation' | 'markdown' | 'csv';
}

export function DataClipboard({
  value,
  label,
  source,
  vintage,
  unit,
  format = 'citation',
}: DataClipboardProps) {
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const buildClipboardText = useCallback((): string => {
    const val = unit ? `${value} ${unit}` : String(value);
    switch (format) {
      case 'plain':
        return val;
      case 'markdown':
        return `**${label}**: ${val}${source ? ` _(Source: ${source}${vintage ? `, ${vintage}` : ''})_` : ''}`;
      case 'csv':
        return `"${label}","${value}","${unit || ''}","${source || ''}","${vintage || ''}"`;
      case 'citation':
      default:
        return `${label}: ${val}${source ? ` [${source}${vintage ? `, ${vintage}` : ''}]` : ''}`;
    }
  }, [value, label, source, vintage, unit, format]);

  const handleCopy = useCallback(async () => {
    const text = buildClipboardText();
    await Clipboard.setStringAsync(text);
    setCopied(true);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setCopied(false));
  }, [buildClipboardText, fadeAnim]);

  return (
    <Pressable style={styles.container} onPress={handleCopy}>
      <View style={styles.valueRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {value}{unit ? <Text style={styles.unit}> {unit}</Text> : null}
        </Text>
      </View>
      {source && (
        <Text style={styles.source}>{source}{vintage ? ` · ${vintage}` : ''}</Text>
      )}
      <View style={styles.copyHint}>
        <SvgIcon name={copied ? 'check' : 'copy'} size={14} color={copied ? Colors.success : Colors.textMuted} />
      </View>
      <Animated.View style={[styles.toast, { opacity: fadeAnim }]} pointerEvents="none">
        <Text style={styles.toastText}>Copied with citation!</Text>
      </Animated.View>
    </Pressable>
  );
}

// Bulk clipboard utility — copies multiple metrics at once
interface BulkClipboardProps {
  items: Array<{ label: string; value: string | number; unit?: string }>;
  source?: string;
  vintage?: string;
}

export function BulkClipboard({ items, source, vintage }: BulkClipboardProps) {
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleCopy = useCallback(async () => {
    const lines = items.map((item) => {
      const val = item.unit ? `${item.value} ${item.unit}` : String(item.value);
      return `${item.label}: ${val}`;
    });
    if (source) {
      lines.push(`\nSource: ${source}${vintage ? ` (${vintage})` : ''}`);
    }
    await Clipboard.setStringAsync(lines.join('\n'));
    setCopied(true);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setCopied(false));
  }, [items, source, vintage, fadeAnim]);

  return (
    <Pressable style={[styles.bulkBtn, { flexDirection: 'row', alignItems: 'center', gap: 6 }]} onPress={handleCopy}>
      <SvgIcon name={copied ? 'check' : 'copy'} size={14} color={copied ? Colors.success : Colors.textPrimary} />
      <Text style={styles.bulkBtnText}>
        {copied ? 'Copied!' : `Copy All (${items.length} metrics)`}
      </Text>
      <Animated.View style={[styles.toast, { opacity: fadeAnim }]} pointerEvents="none">
        <Text style={styles.toastText}>All metrics copied!</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },
  value: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  unit: { ...Typography.caption, color: Colors.textMuted, fontWeight: '400' },
  source: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  copyHint: {
    position: 'absolute',
    top: 4,
    right: 6,
  },
  copyIcon: { fontSize: 12, color: Colors.textMuted },
  toast: {
    position: 'absolute',
    bottom: -28,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  toastText: {
    ...Typography.caption,
    color: Colors.accentTeal,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.accentTeal + '40',
    overflow: 'hidden',
  },
  bulkBtn: {
    backgroundColor: Colors.accentTeal + '15',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accentTeal + '30',
    position: 'relative',
  },
  bulkBtnText: { ...Typography.bodySmall, color: Colors.accentTeal, fontWeight: '600' },
});
