// ============================================================
// Exposure2Tumor — Root Layout (Expo Router)
// Mobile-first layout: phone-frame on web, 5-tab navigation
// ============================================================

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors, Shadows } from '../src/theme';
import { SvgIcon, IconName } from '../src/components/SvgIcon';

const { width: WINDOW_W, height: WINDOW_H } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';
const PHONE_W = 430;
const PHONE_H = 932;

// Inject Roboto font + global CSS on web
function useWebBootstrap() {
  useEffect(() => {
    if (!IS_WEB) return;
    // Load Roboto from Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
    // Global CSS reset for app-like feel
    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      html, body, #root { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #1a1a2e; font-family: Roboto, 'Helvetica Neue', Arial, sans-serif; }
      ::-webkit-scrollbar { width: 0; background: transparent; }
      input, textarea { font-family: inherit; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);
}

function TabIcon({ icon, color }: { icon: IconName; color: string }) {
  return (
    <View style={styles.tabIcon}>
      <SvgIcon name={icon} size={20} color={color} />
    </View>
  );
}

export default function RootLayout() {
  useWebBootstrap();
  const phoneFrame = IS_WEB ? styles.phoneFrame : undefined;
  const phoneInner = IS_WEB ? styles.phoneInner : styles.nativeRoot;

  return (
    <View style={styles.webBg}>
      {IS_WEB && <Text style={styles.brandBadge}>Exposure2Tumor</Text>}
      <View style={phoneFrame}>
        <View style={phoneInner}>
          <StatusBar style="dark" backgroundColor={Colors.surface} />
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                backgroundColor: Colors.surface,
                borderTopColor: Colors.border,
                borderTopWidth: StyleSheet.hairlineWidth,
                height: 56,
                paddingBottom: 4,
                paddingTop: 2,
              },
              tabBarActiveTintColor: Colors.accentTeal,
              tabBarInactiveTintColor: Colors.textMuted,
              tabBarLabelStyle: {
                fontSize: 11,
                fontFamily: 'Roboto, sans-serif',
                fontWeight: '500' as const,
                letterSpacing: 0.1,
              },
            }}
          >
            {/* ───── 5 Primary Tabs ───── */}
            <Tabs.Screen
              name="index"
              options={{
                title: 'Dashboard',
                tabBarIcon: ({ color }) => <TabIcon icon="grid" color={color} />,
              }}
            />
            <Tabs.Screen
              name="sites"
              options={{
                title: 'Sites',
                tabBarIcon: ({ color }) => <TabIcon icon="hexagon" color={color} />,
              }}
            />
            <Tabs.Screen
              name="trends"
              options={{
                title: 'Analytics',
                tabBarIcon: ({ color }) => <TabIcon icon="chart" color={color} />,
              }}
            />
            <Tabs.Screen
              name="alerts"
              options={{
                title: 'Alerts',
                tabBarIcon: ({ color }) => <TabIcon icon="bell" color={color} />,
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'More',
                tabBarIcon: ({ color }) => <TabIcon icon="menu" color={color} />,
              }}
            />

            {/* ───── Secondary screens (hidden from tab bar) ───── */}
            <Tabs.Screen name="reports" options={{ href: null }} />
            <Tabs.Screen name="search" options={{ href: null }} />
            <Tabs.Screen name="compare" options={{ href: null }} />
            <Tabs.Screen name="community" options={{ href: null }} />
            <Tabs.Screen name="scenarios" options={{ href: null }} />
            <Tabs.Screen name="evidence" options={{ href: null }} />
            <Tabs.Screen name="predictions" options={{ href: null }} />
            <Tabs.Screen name="messages" options={{ href: null }} />
            <Tabs.Screen name="camera" options={{ href: null }} />
            <Tabs.Screen name="journal" options={{ href: null }} />
            <Tabs.Screen name="collector" options={{ href: null }} />
            <Tabs.Screen name="survey" options={{ href: null }} />
            <Tabs.Screen name="onboarding" options={{ href: null }} />
          </Tabs>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Outer web background — fills the whole browser
  webBg: {
    flex: 1,
    backgroundColor: IS_WEB ? '#1a1a2e' : Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBadge: {
    position: 'absolute',
    top: 18,
    fontFamily: 'Roboto, sans-serif',
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  // Phone-shaped frame on web
  phoneFrame: {
    width: PHONE_W,
    height: Math.min(PHONE_H, WINDOW_H - 40),
    maxWidth: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  phoneInner: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  nativeRoot: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabIcon: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
