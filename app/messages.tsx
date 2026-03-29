// ============================================================
// Exposure2Tumor — AI Environmental Health Assistant
// Intelligent chatbot with context-aware risk Q&A, health tips,
// exposure explanations, and evidence-based recommendations
// ============================================================

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../src/theme';
import { useAppStore } from '../src/store';
import { CANCER_SITES } from '../src/config/cancerSites';
import { SvgIcon, IconName } from '../src/components/SvgIcon';

const _dim = Dimensions.get('window');
const SW = Platform.OS === 'web' ? Math.min(_dim.width, 430) : _dim.width;

type MsgRole = 'user' | 'assistant' | 'system';
interface ChatMessage { id: string; role: MsgRole; content: string; timestamp: string; context?: string; suggestions?: string[] }

const QUICK_PROMPTS = [
  { icon: 'microscope', label: 'Explain my risk score', prompt: 'Explain what my current risk score means and what factors contribute to it.' },
  { icon: 'shield', label: 'How to reduce exposure', prompt: 'What are practical steps I can take to reduce my environmental cancer risk based on my location?' },
  { icon: 'water', label: 'Is my water safe?', prompt: 'How can I assess whether my local water supply is safe from carcinogenic contaminants?' },
  { icon: 'wind', label: 'Air quality tips', prompt: 'What should I know about air quality in my area and its cancer risk implications?' },
  { icon: 'hospital', label: 'Screening schedule', prompt: 'What cancer screening schedule is recommended for me based on my risk profile?' },
  { icon: 'chart', label: 'Interpret my data', prompt: 'Help me interpret the exposure data I\'ve collected. What patterns should I be concerned about?' },
  { icon: 'factory', label: 'Nearby facilities', prompt: 'How do I find out about industrial facilities near me that might increase cancer risk?' },
  { icon: 'dna', label: 'Gene-environment', prompt: 'How do genetic factors interact with environmental exposures to affect cancer risk?' },
];

// ── AI Response Engine ──
function generateAIResponse(userMsg: string, ctx: {
  geo?: { name: string; state?: string; fips: string } | null;
  site: string; photoCount: number; alertCount: number;
  riskScore?: number;
}): { content: string; suggestions: string[] } {
  const lower = userMsg.toLowerCase();
  const loc = ctx.geo ? `${ctx.geo.name}, ${ctx.geo.state ?? ''}` : 'your current area';
  const site = CANCER_SITES[ctx.site as keyof typeof CANCER_SITES];
  const siteName = site?.label ?? 'cancer';

  // Risk score questions
  if (lower.includes('risk score') || lower.includes('risk level') || lower.includes('what does my')) {
    return {
      content: ` **Risk Score Analysis for ${loc}**\n\nYour composite risk score represents a multi-dimensional assessment across 6 exposure domains:\n\n• **Environmental Burden** — air quality, water contamination, toxic releases\n• **Behavioral Factors** — smoking, obesity, physical inactivity\n• **Screening Access** — mammography, colonoscopy rates\n• **Social Vulnerability** — poverty, insurance gaps, education\n• **Food Environment** — food desert index, nutrition access\n• **Climate/UV** — UV exposure, outdoor occupation rates\n\nFor ${siteName.toLowerCase()} cancer specifically, the key drivers in ${loc} include ${site?.keyMeasures.slice(0, 3).join(', ') ?? 'multiple factors'}.\n\n**How to interpret:**\n• Score 0-30: Lower than average risk profile\n• Score 31-60: Moderate — some factors elevated\n• Score 61-80: Elevated — active mitigation recommended\n• Score 81-100: High priority — immediate review advised\n\nWould you like me to break down specific exposure families?`,
      suggestions: ['Break down environmental burden', 'What are my top risk factors?', 'Compare with national average'],
    };
  }

  // Reduce exposure
  if (lower.includes('reduce') || lower.includes('protect') || lower.includes('prevent') || lower.includes('lower my risk')) {
    return {
      content: ` **Practical Risk Reduction for ${loc}**\n\nBased on the ${siteName.toLowerCase()} cancer profile and local exposure data, here are evidence-based actions:\n\n**Immediate Actions (This Week)**\n1. Check AirNow.gov daily — limit outdoor activity when AQI > 100\n2. Use a water filter certified for lead/PFAS removal\n3. Test your home for radon (kits available for ~$15)\n4. Document any visible industrial emissions nearby\n\n**Short-Term (Next 30 Days)**\n5. Schedule recommended cancer screenings\n6. Map facilities within 3 miles using EPA Envirofacts\n7. Review your drinking water quality report (CCR)\n8. Start an exposure diary in the Journal tab\n\n**Long-Term Habits**\n9. Maintain a plant-rich diet (antioxidants reduce oxidative damage)\n10. Exercise regularly — reduces cancer risk 20-30%\n11. Advocate for local environmental monitoring\n12. Share findings with your healthcare provider\n\n Your ${ctx.photoCount} captured photos and ${ctx.alertCount} alerts create a longitudinal evidence base.`,
      suggestions: ['Which screenings do I need?', 'How to test my water', 'Explain radon risk'],
    };
  }

  // Water safety
  if (lower.includes('water') || lower.includes('drink') || lower.includes('pfas') || lower.includes('lead')) {
    return {
      content: ` **Water Safety Assessment for ${loc}**\n\nWater contamination is linked to bladder, kidney, and liver cancers. Here's your local risk assessment:\n\n**Key Contaminants to Check:**\n• **PFAS** ("forever chemicals") — linked to kidney & testicular cancer\n• **Arsenic** — Group 1 carcinogen (skin, lung, bladder)\n• **Disinfection byproducts** (THMs) — bladder cancer risk\n• **Lead** — damages DNA repair mechanisms\n• **Nitrates** — stomach/colorectal cancer association\n\n**How to Investigate:**\n1. **Find your CCR** — Consumer Confidence Report at your water utility's website\n2. **EWG Tap Water Database** — ewg.org/tapwater (search by ZIP)\n3. **Test your water** — certified labs cost $50-150 for comprehensive panels\n4. **Check violations** — EPA SDWIS database tracks all violations\n\n**Protection Steps:**\n• Reverse osmosis filters remove 95%+ of contaminants\n• NSF-certified activated carbon reduces chlorine byproducts\n• Replace old pipes/fixtures if pre-1986 (lead solder)\n\n Use the Capture tab ( Water Source mode) to document any suspicious water conditions.`,
      suggestions: ['What filter should I buy?', 'Is bottled water safer?', 'Explain PFAS health effects'],
    };
  }

  // Air quality
  if (lower.includes('air') || lower.includes('pm2.5') || lower.includes('pollution') || lower.includes('smog')) {
    return {
      content: ` **Air Quality Intelligence for ${loc}**\n\nAir pollution is the #1 environmental cancer risk factor, responsible for ~29% of lung cancer deaths globally.\n\n**Your Key Metrics:**\n• **PM2.5** — fine particulate matter (most dangerous, penetrates deep lung tissue)\n• **Ozone** — ground-level ozone irritates airways, promotes mutations\n• **VOCs** — volatile organic compounds from industrial & vehicle emissions\n• **HAPs** — hazardous air pollutants (benzene, formaldehyde, etc.)\n\n**Real-Time Monitoring:**\n1. **AirNow.gov** — EPA's official AQI readings\n2. **PurpleAir** — community sensor network (real-time PM2.5)\n3. **IQAir** — global rankings and forecasts\n4. **EPA AirToxScreen** — annual toxic air pollutant estimates\n\n**Health-Protective Actions:**\n• AQI 0-50: Enjoy outdoor activities\n• AQI 51-100: Sensitive groups limit prolonged outdoor exertion\n• AQI 101-150: Everyone should reduce prolonged outdoor exertion\n• AQI 151+: Stay indoors, run air purifiers, use N95 if going outside\n\n**Long-Term Intel:**\nEvery 10 µg/m³ increase in PM2.5 exposure raises lung cancer risk by ~8% (WHO, 2021).`,
      suggestions: ['What air purifier works best?', 'Show TRI facilities near me', 'How does PM2.5 cause cancer?'],
    };
  }

  // Screening
  if (lower.includes('screen') || lower.includes('test') || lower.includes('detect') || lower.includes('checkup') || lower.includes('mammog')) {
    const screenings: Record<string, string> = {
      lung: '• **Low-dose CT scan** — yearly for ages 50-80 with 20+ pack-year smoking history\n• The only screening proven to reduce lung cancer mortality (20% reduction)',
      breast: '• **Mammogram** — every 1-2 years starting at age 40\n• **Clinical breast exam** — every 1-3 years ages 25-39\n• **MRI** — high-risk women (BRCA carriers) starting at 30',
      colorectal: '• **Colonoscopy** — every 10 years starting at 45\n• **FIT test** — annually\n• **Cologuard** — every 3 years\n• Earlier screening if family history of polyps',
      cervical: '• **Pap smear** — every 3 years, ages 21-65\n• **HPV co-test** — every 5 years, ages 30-65\n• **HPV vaccination** — recommended through age 26',
      melanoma: '• **Full-body skin exam** — annually by dermatologist\n• **Self-check** — monthly ABCDE assessment of moles\n• **Dermoscopy** — for atypical lesions',
    };
    const rec = screenings[ctx.site] ?? '• Consult your healthcare provider for personalized screening recommendations based on age, sex, and risk factors.';
    return {
      content: ` **Screening Recommendations: ${siteName}**\n\n${rec}\n\n**General Cancer Prevention Screenings:**\n• Annual physical with comprehensive bloodwork\n• Hepatitis B/C testing (liver cancer risk)\n• HPV testing (cervical, oral, throat cancers)\n• Skin checks for new or changing moles\n\n**When to Start Earlier:**\n• Family history of cancer → screen 10 years before youngest relative's diagnosis age\n• Environmental exposure history → discuss enhanced surveillance with oncologist\n• Occupational hazard exposure → report to occupational medicine specialist\n\n Track your screening history in the Journal tab for longitudinal monitoring.`,
      suggestions: ['What is a pack-year?', 'Family history impact', 'Insurance coverage for screening'],
    };
  }

  // Data interpretation
  if (lower.includes('interpret') || lower.includes('data') || lower.includes('pattern') || lower.includes('trend') || lower.includes('analytic')) {
    return {
      content: ` **Data Interpretation Guide**\n\nHere's how to read your Exposure2Tumor intelligence:\n\n**Risk Score (0-100)**\nA composite index combining all exposure families. It's a *relative* score — 75 means your area is above the 75th percentile nationally for combined cancer risk factors.\n\n**Exposure Families (7 Domains)**\nEach family is scored independently. Look for:\n• **Outliers** — any single family > 80th percentile is a red flag\n• **Clustering** — multiple families elevated together compounds risk\n• **Temporal trends** — improving or worsening over time\n\n**Confidence Intervals**\nSmall populations = wider CIs = less certainty. County-level data is most reliable; tract-level may have larger margins.\n\n**Percentile Rankings**\n• <25th: Better than 75% of the nation\n• 25-50th: Average range\n• 50-75th: Elevated — warrants attention\n• >75th: Significant concern — action recommended\n\n[chart] Use Analytics tab trends to see how your area's data changes over time.`,
      suggestions: ['What are confidence intervals?', 'Why do scores vary by geography?', 'Explain the exposure ribbon'],
    };
  }

  // Facilities
  if (lower.includes('facilit') || lower.includes('factory') || lower.includes('industrial') || lower.includes('epa') || lower.includes('tri')) {
    return {
      content: ` **Facility Risk Intelligence for ${loc}**\n\nIndustrial facilities releasing toxic chemicals are significant cancer risk factors. Here's how to investigate:\n\n**Key Databases:**\n1. **EPA TRI** (Toxics Release Inventory) — enviro.epa.gov\n   Annual reports of chemical releases from ~21,000 facilities\n2. **EPA Envirofacts** — Search by ZIP code for all regulated facilities\n3. **EPA ECHO** — Enforcement & compliance history\n4. **RMP** — Risk Management Plans for worst-case scenarios\n5. **Superfund/CERCLIS** — Hazardous waste cleanup sites\n\n**What to Look For:**\n• **Within 1 mile**: Highest exposure zone — monthly air monitoring recommended\n• **1-3 miles**: Elevated zone — quarterly checks suggested\n• **3-10 miles**: Monitoring zone — annual review of TRI data\n\n**Top Industrial Carcinogens:**\n• Benzene (leukemia)\n• Formaldehyde (nasopharyngeal)\n• Vinyl chloride (liver)\n• Chromium VI (lung)\n• Asbestos (mesothelioma)\n\n Document facilities using Capture tab ( Facility ID mode) for evidence building.`,
      suggestions: ['What is benzene exposure?', 'Superfund sites near me', 'How to report emissions'],
    };
  }

  // Gene-environment interaction
  if (lower.includes('gene') || lower.includes('genetic') || lower.includes('dna') || lower.includes('heredit') || lower.includes('brca')) {
    return {
      content: ` **Gene-Environment Interactions in Cancer**\n\nCancer is rarely caused by genetics OR environment alone — it's the interaction that matters.\n\n**How It Works:**\nEnvironmental carcinogens damage DNA → If repair genes (like BRCA1/2, p53) are compromised → Mutations accumulate faster → Cancer risk multiplies.\n\n**Key Gene-Environment Interactions:**\n\n• **BRCA1/2 mutations + radiation** → 33% higher breast cancer risk vs radiation alone\n• **NAT2 slow acetylator + smoking** → 2-3x bladder cancer risk increase\n• **GSTM1 null genotype + air pollution** → Enhanced lung cancer susceptibility\n• **CYP1A1 variants + PAH exposure** → Altered carcinogen metabolism\n• **p53 Li-Fraumeni + any carcinogen** → Dramatically elevated multi-cancer risk\n\n**Practical Implications:**\n1. Family history matters MORE when environmental exposures are high\n2. Genetic testing can reveal enhanced susceptibility to specific carcinogens\n3. Environmental monitoring is especially important for genetically susceptible individuals\n4. Epigenetic changes from environmental exposures can affect future generations\n\n**Bottom Line:** You can't change your genes, but you can minimize environmental triggers that activate genetic vulnerabilities.`,
      suggestions: ['Should I get genetic testing?', 'Epigenetics explained', 'Family cancer syndrome screening'],
    };
  }

  // Default intelligent response
  return {
    content: `I understand your question about "${userMsg.slice(0, 50)}${userMsg.length > 50 ? '...' : ''}".\n\nBased on your context in ${loc} monitoring ${siteName.toLowerCase()} cancer:\n\n**Quick Assessment:**\n• You have ${ctx.photoCount} photo${ctx.photoCount !== 1 ? 's' : ''} in your evidence vault\n• ${ctx.alertCount} active alert${ctx.alertCount !== 1 ? 's' : ''} being monitored\n• Active site: ${siteName}\n\nI can help with:\n•  **Risk score interpretation** — what your numbers mean\n•  **Exposure reduction** — practical protective steps\n•  **Water/air safety** — local environmental quality\n•  **Screening guidance** — when and what to test\n•  **Facility investigation** — industrial risks nearby\n•  **Gene-environment** — hereditary risk interactions\n•  **Data interpretation** — understanding your patterns\n\nWhat aspect would you like to explore?`,
    suggestions: ['Explain my risk score', 'How to reduce exposure', 'Screening recommendations'],
  };
}

// ────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────
export default function MessagesScreen() {
  const { currentGeo, activeSite, photos, alerts } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'sys-1', role: 'assistant', timestamp: new Date().toISOString(),
      content: ` **Welcome to the Exposure2Tumor AI Health Assistant**\n\nI'm your environmental health intelligence companion. I can help you:\n\n• Interpret your risk scores and exposure data\n• Explain cancer risk factors in your area\n• Provide evidence-based screening recommendations\n• Guide you through protective actions\n• Investigate industrial facilities and pollutants\n• Explain gene-environment interactions\n\nAsk me anything, or use the quick prompts below to get started.`,
      suggestions: QUICK_PROMPTS.slice(0, 4).map(q => q.label),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`, role: 'user', content: text.trim(), timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setShowQuick(false);

    // Simulate AI thinking delay
    setTimeout(() => {
      const response = generateAIResponse(text, {
        geo: currentGeo, site: activeSite, photoCount: photos.length, alertCount: alerts.length,
      });
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`, role: 'assistant', content: response.content,
        timestamp: new Date().toISOString(), suggestions: response.suggestions,
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  }, [currentGeo, activeSite, photos.length, alerts.length]);

  const handleSend = useCallback(() => sendMessage(inputText), [inputText, sendMessage]);

  return (
    <SafeAreaView style={st.safe}>
      {/* Header */}
      <View style={st.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={st.aiBadge}><SvgIcon name="robot" size={20} color="#fff" /></View>
          <View>
            <Text style={st.headerTitle}>AI Health Assistant</Text>
            <Text style={st.headerSub}>
              {currentGeo ? `${currentGeo.name}` : 'Environmental health intelligence'}
              {' · '}{CANCER_SITES[activeSite]?.shortLabel ?? activeSite}
            </Text>
          </View>
        </View>
        <View style={st.statusPill}>
          <View style={st.statusDot} />
          <Text style={st.statusText}>Online</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView ref={scrollRef} style={st.chatScroll} contentContainerStyle={st.chatContent} showsVerticalScrollIndicator={false}>
          {messages.map((msg) => (
            <View key={msg.id}>
              <View style={[st.bubble, msg.role === 'user' ? st.bubbleUser : st.bubbleAI]}>
                {msg.role === 'assistant' && <View style={st.aiAvatarSmall}><SvgIcon name="robot" size={12} color="#fff" /></View>}
                <View style={[st.bubbleContent, msg.role === 'user' ? st.bubbleContentUser : st.bubbleContentAI]}>
                  <Text style={st.msgText}>{msg.content}</Text>
                  <Text style={st.msgTime}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
              {/* Suggestion chips */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.sugScroll} contentContainerStyle={st.sugContent}>
                  {msg.suggestions.map((sug, i) => (
                    <Pressable key={i} style={st.sugChip} onPress={() => sendMessage(sug)}>
                      <Text style={st.sugText}>{sug}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <View style={[st.bubble, st.bubbleAI]}>
              <View style={st.aiAvatarSmall}><SvgIcon name="robot" size={12} color="#fff" /></View>
              <View style={[st.bubbleContentAI, st.typingBubble]}>
                <View style={st.typingDots}>
                  <View style={[st.dot, st.dot1]} /><View style={[st.dot, st.dot2]} /><View style={[st.dot, st.dot3]} />
                </View>
              </View>
            </View>
          )}

          {/* Quick prompts */}
          {showQuick && (
            <View style={st.quickGrid}>
              <Text style={st.quickLabel}>QUICK PROMPTS</Text>
              <View style={st.quickWrap}>
                {QUICK_PROMPTS.map((qp, i) => (
                  <Pressable key={i} style={st.quickCard} onPress={() => sendMessage(qp.prompt)}>
                    <SvgIcon name={qp.icon as IconName} size={22} color={Colors.accentTeal} />
                    <Text style={st.quickCardLabel}>{qp.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Composer */}
        <View style={st.composer}>
          {currentGeo && (
            <View style={st.composerCtx}>
              <Text style={st.composerCtxText}>{currentGeo.name} · {CANCER_SITES[activeSite]?.shortLabel}</Text>
            </View>
          )}
          <View style={st.composerRow}>
            <Pressable style={st.quickBtn} onPress={() => setShowQuick(v => !v)}>
              {showQuick ? <SvgIcon name="close" size={18} color={Colors.textMuted} /> : <SvgIcon name="bolt" size={18} color={Colors.accentTeal} />}
            </Pressable>
            <TextInput style={st.input} value={inputText} onChangeText={setInputText}
              placeholder="Ask about risks, screenings, exposures..." placeholderTextColor={Colors.textDisabled}
              multiline onSubmitEditing={handleSend} blurOnSubmit={false} />
            <Pressable style={[st.sendBtn, !inputText.trim() && st.sendBtnDisabled]} onPress={handleSend} disabled={!inputText.trim()}>
              <SvgIcon name="arrowUp" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── STYLES ──
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, backgroundColor: Colors.surface },
  aiBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accentTealBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.accentTealBorder },
  headerTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary },
  headerSub: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.success + '12', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.round },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  statusText: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.success },

  chatScroll: { flex: 1 },
  chatContent: { padding: 12, gap: 4 },

  bubble: { flexDirection: 'row', marginBottom: 4 },
  bubbleUser: { justifyContent: 'flex-end' },
  bubbleAI: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  aiAvatarSmall: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accentTealBg, justifyContent: 'center', alignItems: 'center', marginRight: 6, marginTop: 2 },
  bubbleContent: { maxWidth: '82%', borderRadius: BorderRadius.sm, padding: 12 },
  bubbleContentUser: { backgroundColor: Colors.accentTealBg, borderBottomRightRadius: 4 },
  bubbleContentAI: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  msgText: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textPrimary, lineHeight: 20 },
  msgTime: { fontFamily: 'Roboto Mono, monospace', fontSize: 10, color: Colors.textMuted, marginTop: 6, alignSelf: 'flex-end' },

  // Typing
  typingBubble: { paddingVertical: 14, paddingHorizontal: 16 },
  typingDots: { flexDirection: 'row', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.textMuted },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.8 },

  // Suggestions
  sugScroll: { marginLeft: 30, marginBottom: 8, maxHeight: 32 },
  sugContent: { gap: 6, paddingRight: 12 },
  sugChip: { backgroundColor: Colors.accentTealBg, borderRadius: BorderRadius.round, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.accentTealBorder },
  sugText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.accentTeal },

  // Quick prompts
  quickGrid: { marginTop: 8 },
  quickLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 8 },
  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickCard: { width: (SW - 48) / 2, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  quickCardLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 12, color: Colors.textPrimary },

  // Composer
  composer: { backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, paddingHorizontal: 12, paddingVertical: 8 },
  composerCtx: { backgroundColor: Colors.surfaceHighlight, borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  composerCtxText: { fontFamily: 'Roboto Mono, monospace', fontSize: 10, color: Colors.textMuted },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  quickBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceHighlight, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.background, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8, maxHeight: 100 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accentTeal, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.3 },
  sendText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.textInverse },
});