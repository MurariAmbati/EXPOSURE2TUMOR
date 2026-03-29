// ============================================================
// Exposure2Tumor — Onboarding Welcome Flow
// First-time setup: choose cancer site, location, quick tour
// ============================================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  TextInput,
  Platform,
} from 'react-native';
import Svg, { Circle, Path, G, Rect, Line } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Colors, BorderRadius } from '../src/theme';
import { useAppStore } from '../src/store';
import { CANCER_SITES, ALL_SITES } from '../src/config/cancerSites';
import { SvgIcon, IconName } from '../src/components/SvgIcon';
import type { CancerSite } from '../src/types';

const _dim = Dimensions.get('window');
const SW = Platform.OS === 'web' ? Math.min(_dim.width, 430) : _dim.width;

interface OnboardingStep {
  key: string;
  title: string;
  subtitle: string;
}

const STEPS: OnboardingStep[] = [
  { key: 'welcome', title: 'Welcome to Exposure2Tumor', subtitle: 'Cancer exposure intelligence at your fingertips' },
  { key: 'site', title: 'Choose Your Focus', subtitle: 'Select the cancer site you want to investigate' },
  { key: 'tour', title: 'Your Toolkit', subtitle: 'Here\'s what you can do with this platform' },
  { key: 'ready', title: 'You\'re All Set', subtitle: 'Start exploring cancer-exposure intelligence' },
];

const TOUR_ITEMS = [
  { icon: 'map', title: 'Command Map', desc: 'Interactive map with exposure overlays and risk states' },
  { icon: 'chart', title: 'Analytics', desc: 'Trends, correlations, anomaly detection, and forecasting' },
  { icon: 'flask', title: 'Scenarios', desc: 'What-if modeling to simulate intervention impacts' },
  { icon: 'document', title: 'Reports', desc: 'Community reports with benchmarks and disparities' },
  { icon: 'bell', title: 'Alerts', desc: 'Watchlists to monitor thresholds and environmental events' },
  { icon: 'scale', title: 'Compare', desc: 'Side-by-side multi-geography comparison' },
];

function WelcomeIllustration() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={80} fill={Colors.surfaceHighlight} stroke={Colors.border} strokeWidth={1.5} />
      <Circle cx={100} cy={100} r={60} fill="none" stroke={Colors.accentTeal} strokeWidth={1} strokeDasharray="4 4" opacity={0.4} />
      <G>
        <Circle cx={75} cy={85} r={12} fill={Colors.accentTeal} opacity={0.3} />
        <Circle cx={120} cy={75} r={8} fill={Colors.warning} opacity={0.3} />
        <Circle cx={110} cy={115} r={15} fill={Colors.highAlert} opacity={0.2} />
        <Circle cx={85} cy={120} r={6} fill={Colors.info} opacity={0.3} />
      </G>
      <Path d="M60 90 Q80 60 100 80 Q120 100 140 75" fill="none" stroke={Colors.accentTeal} strokeWidth={2} strokeLinecap="round" />
      <Path d="M65 110 Q85 95 105 105 Q125 115 145 100" fill="none" stroke={Colors.warning} strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
      <Rect x={90} y={130} width={20} height={25} rx={3} fill="none" stroke={Colors.textMuted} strokeWidth={1.2} />
      <Line x1={94} y1={138} x2={106} y2={138} stroke={Colors.textMuted} strokeWidth={1} />
      <Line x1={94} y1={143} x2={103} y2={143} stroke={Colors.textMuted} strokeWidth={1} />
      <Line x1={94} y1={148} x2={100} y2={148} stroke={Colors.textMuted} strokeWidth={1} />
    </Svg>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { setActiveSite, completeOnboarding, activeSite } = useAppStore();
  const [step, setStep] = useState(0);
  const [selectedSite, setSelectedSite] = useState<CancerSite>(activeSite);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goNext = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        setActiveSite(selectedSite);
        completeOnboarding();
        router.replace('/' as any);
      }
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const goBack = () => {
    if (step > 0) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setStep(step - 1);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }
  };

  const skip = () => {
    completeOnboarding();
    router.replace('/' as any);
  };

  const current = STEPS[step];

  return (
    <SafeAreaView style={st.safeArea}>
      {/* Skip button */}
      <View style={st.topBar}>
        <View style={st.stepIndicator}>
          {STEPS.map((_, i) => (
            <View key={i} style={[st.stepDot, i === step && st.stepDotActive, i < step && st.stepDotDone]} />
          ))}
        </View>
        <TouchableOpacity onPress={skip}>
          <Text style={st.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[st.content, { opacity: fadeAnim }]}>
        {/* WELCOME */}
        {current.key === 'welcome' && (
          <View style={st.centeredContent}>
            <WelcomeIllustration />
            <Text style={st.bigTitle}>{current.title}</Text>
            <Text style={st.bigSubtitle}>{current.subtitle}</Text>
            <Text style={st.desc}>
              Exposure2Tumor connects 12 federal data sources to help you understand how environmental,
              behavioral, and structural exposures relate to cancer risk at any US geography.
            </Text>
          </View>
        )}

        {/* SITE SELECTION */}
        {current.key === 'site' && (
          <View style={st.siteContent}>
            <Text style={st.stepTitle}>{current.title}</Text>
            <Text style={st.stepSubtitle}>{current.subtitle}</Text>
            <FlatList
              data={ALL_SITES}
              numColumns={2}
              keyExtractor={(item) => item}
              contentContainerStyle={st.siteGrid}
              columnWrapperStyle={{ gap: 8 }}
              renderItem={({ item: siteId }) => {
                const site = CANCER_SITES[siteId];
                const isSelected = siteId === selectedSite;
                return (
                  <TouchableOpacity
                    style={[st.siteCard, isSelected && { borderColor: site.color, backgroundColor: site.color + '10' }]}
                    onPress={() => setSelectedSite(siteId)}
                    activeOpacity={0.7}
                  >
                    <View style={[st.siteDot, { backgroundColor: site.color }]} />
                    <Text style={[st.siteLabel, isSelected && { color: Colors.textPrimary }]}>{site.label}</Text>
                    <Text style={st.siteFamilies}>{site.exposureFamilies.length} families</Text>
                    {isSelected && <SvgIcon name="check" size={16} color={site.color} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* TOUR */}
        {current.key === 'tour' && (
          <View style={st.tourContent}>
            <Text style={st.stepTitle}>{current.title}</Text>
            <Text style={st.stepSubtitle}>{current.subtitle}</Text>
            {TOUR_ITEMS.map((item, i) => (
              <View key={i} style={st.tourRow}>
                <SvgIcon name={item.icon as IconName} size={24} color={Colors.accentTeal} />
                <View style={st.tourInfo}>
                  <Text style={st.tourTitle}>{item.title}</Text>
                  <Text style={st.tourDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* READY */}
        {current.key === 'ready' && (
          <View style={st.centeredContent}>
            <View style={st.readyIcon}>
              <SvgIcon name="rocket" size={48} color={Colors.accentTeal} />
            </View>
            <Text style={st.bigTitle}>{current.title}</Text>
            <Text style={st.bigSubtitle}>{current.subtitle}</Text>
            <View style={st.readySummary}>
              <Text style={st.readyLabel}>Your focus:</Text>
              <View style={st.readySiteRow}>
                <View style={[st.siteDot, { backgroundColor: CANCER_SITES[selectedSite].color }]} />
                <Text style={st.readySiteText}>{CANCER_SITES[selectedSite].label}</Text>
              </View>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Bottom navigation */}
      <View style={st.bottomBar}>
        {step > 0 ? (
          <TouchableOpacity style={st.backBtn} onPress={goBack}>
            <Text style={st.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
        <TouchableOpacity style={st.nextBtn} onPress={goNext} activeOpacity={0.8}>
          <Text style={st.nextText}>{step === STEPS.length - 1 ? 'Get Started' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  stepIndicator: { flexDirection: 'row', gap: 4 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  stepDotActive: { backgroundColor: Colors.accentTeal, width: 24 },
  stepDotDone: { backgroundColor: Colors.accentTeal },
  skip: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted },
  content: { flex: 1 },
  centeredContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  bigTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 28, color: Colors.textPrimary, textAlign: 'center', marginTop: 24 },
  bigSubtitle: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.accentTeal, textAlign: 'center', marginTop: 4 },
  desc: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginTop: 16, maxWidth: 320 },
  siteContent: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
  stepTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  stepSubtitle: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textMuted, marginTop: 4, marginBottom: 16 },
  siteGrid: { gap: 8, paddingBottom: 24 },
  siteCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
  },
  siteDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  siteLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textSecondary },
  siteFamilies: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  siteCheck: { position: 'absolute', top: 8, right: 8, fontSize: 16, fontWeight: '700' },
  tourContent: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
  tourRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  tourIcon: { fontSize: 24, width: 36, textAlign: 'center' },
  tourInfo: { flex: 1 },
  tourTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  tourDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  readyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surfaceHighlight, justifyContent: 'center', alignItems: 'center' },
  readyEmoji: { fontSize: 40 },
  readySummary: { marginTop: 24, alignItems: 'center' },
  readyLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textMuted },
  readySiteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  readySiteText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  backText: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textMuted },
  nextBtn: { backgroundColor: Colors.accentTeal, paddingVertical: 12, paddingHorizontal: 32, borderRadius: BorderRadius.sm, height: 40, justifyContent: 'center' },
  nextText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textInverse },
});
