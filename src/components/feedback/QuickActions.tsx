// ============================================================
// QuickActions — Floating Action Button (FAB) with radial menu
// Provides one-tap access to common actions from any screen
// ============================================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { SvgIcon, IconName } from '../SvgIcon';

export interface QuickAction {
  id: string;
  label: string;
  icon: string;     // emoji or single char
  color?: string;
  onPress: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
  position?: 'bottom-right' | 'bottom-left';
}

export function QuickActions({ actions, position = 'bottom-right' }: QuickActionsProps) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.spring(anim, { toValue, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(spin, { toValue, duration: 200, useNativeDriver: true }),
    ]).start();
    setOpen(!open);
  };

  const close = () => {
    Animated.parallel([
      Animated.spring(anim, { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(spin, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    setOpen(false);
  };

  const rotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  const posStyle = position === 'bottom-left' ? { left: Spacing.xl } : { right: Spacing.xl };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <Modal transparent visible animationType="none" onRequestClose={close}>
          <Pressable style={st.backdrop} onPress={close}>
            <View style={[st.menuContainer, posStyle]}>
              {actions.map((action, index) => {
                const translateY = anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -(60 * (index + 1))],
                });
                const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.3, 1] });
                const opacity = anim;
                return (
                  <Animated.View
                    key={action.id}
                    style={[st.menuItem, { transform: [{ translateY }, { scale }], opacity }]}
                  >
                    <TouchableOpacity
                      style={st.menuLabel}
                      onPress={() => { close(); action.onPress(); }}
                      activeOpacity={0.7}
                    >
                      <Text style={st.menuLabelText}>{action.label}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[st.menuBtn, { backgroundColor: action.color ?? Colors.surfaceElevated }]}
                      onPress={() => { close(); action.onPress(); }}
                      activeOpacity={0.7}
                    >
                      <SvgIcon name={action.icon as IconName} size={20} color="#fff" />
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </Pressable>
          {/* FAB on top of modal */}
          <View style={[st.fabPosition, posStyle]}>
            <TouchableOpacity style={st.fab} onPress={close} activeOpacity={0.8}>
              <Animated.Text style={[st.fabIcon, { transform: [{ rotate: '45deg' }] }]}>+</Animated.Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* FAB main button (always visible) */}
      {!open && (
        <View style={[st.fabPosition, posStyle]}>
          <TouchableOpacity style={st.fab} onPress={toggle} activeOpacity={0.8}>
            <Animated.Text style={[st.fabIcon, { transform: [{ rotate: rotation }] }]}>+</Animated.Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const FAB_SIZE = 54;

const st = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  fabPosition: {
    position: 'absolute',
    bottom: 80,
    zIndex: 50,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: Colors.accentTeal,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  fabIcon: {
    fontSize: 28,
    color: Colors.textInverse,
    fontWeight: '300',
    marginTop: -2,
  },
  menuContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'flex-end',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    position: 'absolute',
    right: 0,
  },
  menuLabel: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuLabelText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  menuIcon: {
    fontSize: 20,
  },
});
