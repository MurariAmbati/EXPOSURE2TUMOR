// ============================================================
// InfoPopover — Contextual tooltip / help bubble
// Press any (i) icon to get a plain-language explanation
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

interface InfoPopoverProps {
  title: string;
  body: string;
  learnMoreUrl?: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function InfoPopover({
  title,
  body,
  size = 18,
  color = Colors.textMuted,
  style,
}: InfoPopoverProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={[st.trigger, style]}
        activeOpacity={0.6}
      >
        <View style={[st.iconCircle, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
          <Text style={[st.iconText, { fontSize: size * 0.55, color }]}>i</Text>
        </View>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={st.backdrop} onPress={() => setVisible(false)}>
          <View style={st.popover}>
            <View style={st.popoverHeader}>
              <Text style={st.popoverTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={st.closeBtn}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={st.popoverBody}>{body}</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/** Inline glossary term: renders text with a dotted underline; press opens explanation */
export function GlossaryTerm({
  term,
  definition,
  children,
}: {
  term: string;
  definition: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Text
        onPress={() => setVisible(true)}
        style={st.glossaryText}
      >
        {children}
      </Text>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={st.backdrop} onPress={() => setVisible(false)}>
          <View style={st.popover}>
            <View style={st.popoverHeader}>
              <Text style={st.popoverTitle}>{term}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={st.closeBtn}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={st.popoverBody}>{definition}</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const { width: SCREEN_W } = Dimensions.get('window');

const st = StyleSheet.create({
  trigger: {},
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  iconText: {
    fontFamily: 'Inter_600SemiBold',
    fontStyle: 'italic',
  },
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  popover: {
    width: Math.min(SCREEN_W - 48, 360),
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.lg,
  },
  popoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  popoverTitle: {
    ...Typography.heading3,
    color: Colors.accentTeal,
    flex: 1,
  },
  closeBtn: {
    ...Typography.body,
    color: Colors.textMuted,
    paddingLeft: Spacing.md,
  },
  popoverBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  glossaryText: {
    ...Typography.body,
    color: Colors.accentTeal,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
});
