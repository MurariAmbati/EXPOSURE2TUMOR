// ============================================================
// Exposure2Tumor — Survey Screen
// Community health surveys with live form + insight dashboard
// ============================================================

import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Colors, BorderRadius } from '../src/theme';
import { useAppStore } from '../src/store';
import { SvgIcon, IconName } from '../src/components/SvgIcon';
import {
  BUILT_IN_SURVEYS,
  computeSurveyInsights,
  generateDemoResponses,
  createSurveyResponse,
  SURVEY_CATEGORY_META,
} from '../src/services/surveyService';
import type {
  Survey,
  SurveyQuestion,
  SurveyAnswer,
  SurveyResponse,
  SurveyCategory,
} from '../src/types';

const _dim = Dimensions.get('window');
const SCREEN_W = Platform.OS === 'web' ? Math.min(_dim.width, 430) : _dim.width;

type ScreenView = 'browse' | 'take' | 'insights';

// ── Likert dots component ── //
function LikertScale({
  value,
  min,
  max,
  minLabel,
  maxLabel,
  onChange,
}: {
  value: number | null;
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  onChange: (v: number) => void;
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <View>
      <View style={st.likertRow}>
        {steps.map((n) => (
          <TouchableOpacity
            key={n}
            style={[st.likertDot, value === n && st.likertDotActive]}
            onPress={() => onChange(n)}
          >
            <Text style={[st.likertNum, value === n && st.likertNumActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {(minLabel || maxLabel) && (
        <View style={st.likertLabels}>
          <Text style={st.likertLabel}>{minLabel}</Text>
          <Text style={st.likertLabel}>{maxLabel}</Text>
        </View>
      )}
    </View>
  );
}

// ── Slider-like stepper (for numeric_slider) ── //
function NumericStepper({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={st.stepperRow}>
      <TouchableOpacity
        style={st.stepperBtn}
        onPress={() => onChange(Math.max(min, value - step))}
      >
        <Text style={st.stepperBtnText}>−</Text>
      </TouchableOpacity>
      <View style={st.stepperValue}>
        <Text style={st.stepperValueText}>{value}</Text>
      </View>
      <TouchableOpacity
        style={st.stepperBtn}
        onPress={() => onChange(Math.min(max, value + step))}
      >
        <Text style={st.stepperBtnText}>+</Text>
      </TouchableOpacity>
      <Text style={st.stepperRange}>{min}–{max}</Text>
    </View>
  );
}

// ── Insight bar chart ── //
function InsightBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <View style={st.insightBarRow}>
      <Text style={st.insightBarLabel} numberOfLines={1}>{label}</Text>
      <View style={st.insightBarTrack}>
        <View style={[st.insightBarFill, { width: `${Math.min(100, percent)}%`, backgroundColor: color }]} />
      </View>
      <Text style={st.insightBarPct}>{percent}%</Text>
    </View>
  );
}

// ════════════════════════════════════════════════════════════ //
export default function SurveyScreen() {
  const {
    surveyResponses,
    completedSurveyIds,
    addSurveyResponse,
    markSurveyCompleted,
    currentGeo,
  } = useAppStore();

  const [view, setView] = useState<ScreenView>('browse');
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [insightsSurvey, setInsightsSurvey] = useState<Survey | null>(null);
  const [filterCategory, setFilterCategory] = useState<SurveyCategory | 'all'>('all');
  const confettiOpacity = useRef(new Animated.Value(0)).current;
  const startTime = useRef(Date.now());

  // Merge real + demo responses for insights
  const allResponses = useMemo(() => {
    const demo = BUILT_IN_SURVEYS.flatMap((s) => generateDemoResponses(s, s.totalResponses));
    return [...surveyResponses, ...demo];
  }, [surveyResponses]);

  const filteredSurveys = useMemo(() => {
    if (filterCategory === 'all') return BUILT_IN_SURVEYS;
    return BUILT_IN_SURVEYS.filter((s) => s.category === filterCategory);
  }, [filterCategory]);

  // ── Start a survey ── //
  const startSurvey = useCallback((survey: Survey) => {
    setActiveSurvey(survey);
    setAnswers({});
    setCurrentQ(0);
    setShowComplete(false);
    startTime.current = Date.now();
    setView('take');
  }, []);

  // ── Save answer ── //
  const saveAnswer = useCallback((qId: string, value: string | number | string[]) => {
    setAnswers((prev) => ({ ...prev, [qId]: { questionId: qId, value } }));
  }, []);

  // ── Submit survey ── //
  const submitSurvey = useCallback(() => {
    if (!activeSurvey) return;
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    const response = createSurveyResponse(
      activeSurvey.id,
      Object.values(answers),
      duration,
      currentGeo ?? undefined,
    );
    addSurveyResponse(response);
    markSurveyCompleted(activeSurvey.id);
    setShowComplete(true);
    Animated.sequence([
      Animated.timing(confettiOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(confettiOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [activeSurvey, answers, currentGeo, addSurveyResponse, markSurveyCompleted, confettiOpacity]);

  // ── Open insights ── //
  const openInsights = useCallback((survey: Survey) => {
    setInsightsSurvey(survey);
    setView('insights');
  }, []);

  // Progress for active survey
  const totalQuestions = activeSurvey?.questions.length ?? 0;
  const answeredCount = Object.keys(answers).length;
  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const question: SurveyQuestion | undefined = activeSurvey?.questions[currentQ];

  // Insights
  const insights = useMemo(() => {
    if (!insightsSurvey) return [];
    return computeSurveyInsights(insightsSurvey, allResponses);
  }, [insightsSurvey, allResponses]);

  const views: { key: ScreenView; label: string }[] = [
    { key: 'browse', label: 'Surveys' },
    { key: 'insights', label: 'Insights' },
  ];

  // ════════════════ RENDER ════════════════════════════════ //
  return (
    <SafeAreaView style={st.safe}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.title}>Surveys</Text>
        <Text style={st.subtitle}>Community health data collection</Text>
      </View>

      {/* Tab bar (only in browse / insights) */}
      {view !== 'take' && (
        <View style={st.tabBar}>
          {views.map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[st.tab, view === v.key && st.tabActive]}
              onPress={() => setView(v.key)}
            >
              <Text style={[st.tabText, view === v.key && st.tabTextActive]}>{v.label}</Text>
            </TouchableOpacity>
          ))}
          <View style={st.tabBadge}>
            <Text style={st.tabBadgeText}>{completedSurveyIds.length}/{BUILT_IN_SURVEYS.length}</Text>
          </View>
        </View>
      )}

      {/* ──────────── BROWSE ──────────── */}
      {view === 'browse' && (
        <>
          {/* Category filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={st.filterBar}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <TouchableOpacity
              style={[st.filterChip, filterCategory === 'all' && st.filterChipActive]}
              onPress={() => setFilterCategory('all')}
            >
              <Text style={[st.filterChipText, filterCategory === 'all' && st.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {(Object.keys(SURVEY_CATEGORY_META) as SurveyCategory[]).map((cat) => {
              const meta = SURVEY_CATEGORY_META[cat];
              return (
                <TouchableOpacity
                  key={cat}
                  style={[st.filterChip, filterCategory === cat && st.filterChipActive]}
                  onPress={() => setFilterCategory(cat)}
                >
                  <SvgIcon name={meta.icon as IconName} size={14} color={filterCategory === cat ? Colors.accentTeal : Colors.textMuted} />
                  <Text style={[st.filterChipText, filterCategory === cat && st.filterChipTextActive]}>{meta.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView style={st.content} contentContainerStyle={st.contentInner}>
            {/* Featured banner */}
            {filteredSurveys.some((s) => s.featured) && (
              <View style={st.featuredBanner}>
                <Text style={st.featuredLabel}>FEATURED</Text>
                <Text style={st.featuredTitle}>
                  {filteredSurveys.find((s) => s.featured)?.title}
                </Text>
                <Text style={st.featuredDesc} numberOfLines={2}>
                  {filteredSurveys.find((s) => s.featured)?.description}
                </Text>
                <TouchableOpacity
                  style={st.featuredBtn}
                  onPress={() => {
                    const feat = filteredSurveys.find((s) => s.featured);
                    if (feat) startSurvey(feat);
                  }}
                >
                  <Text style={st.featuredBtnText}>
                    {completedSurveyIds.includes(filteredSurveys.find((s) => s.featured)?.id ?? '')
                      ? 'Retake Survey'
                      : 'Start Survey'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Survey cards */}
            {filteredSurveys.map((survey) => {
              const isCompleted = completedSurveyIds.includes(survey.id);
              const catMeta = SURVEY_CATEGORY_META[survey.category];
              return (
                <View key={survey.id} style={st.surveyCard}>
                  <View style={st.cardTop}>
                    <View style={[st.cardIcon, { backgroundColor: survey.color + '20' }]}>
                      <SvgIcon name={(survey.icon || 'clipboard') as IconName} size={22} color={survey.color} />
                    </View>
                    <View style={st.cardInfo}>
                      <Text style={st.cardTitle}>{survey.title}</Text>
                      <View style={st.cardMeta}>
                        <View style={[st.catBadge, { backgroundColor: catMeta.color + '20' }]}>
                          <Text style={[st.catBadgeText, { color: catMeta.color }]}>{catMeta.label}</Text>
                        </View>
                        <Text style={st.metaDot}>·</Text>
                        <Text style={st.metaText}>{survey.questions.length} questions</Text>
                        <Text style={st.metaDot}>·</Text>
                        <Text style={st.metaText}>~{survey.estimatedMinutes} min</Text>
                      </View>
                    </View>
                    {isCompleted && (
                      <View style={st.completedBadge}>
                        <SvgIcon name="check" size={12} color={Colors.success} />
                      </View>
                    )}
                  </View>
                  <Text style={st.cardDesc} numberOfLines={2}>{survey.description}</Text>
                  <View style={st.cardStats}>
                    <Text style={st.statText}>{survey.totalResponses.toLocaleString()} responses</Text>
                  </View>
                  <View style={st.cardActions}>
                    <TouchableOpacity
                      style={[st.cardBtn, st.cardBtnPrimary]}
                      onPress={() => startSurvey(survey)}
                    >
                      <Text style={st.cardBtnPrimaryText}>
                        {isCompleted ? 'Retake' : 'Take Survey'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={st.cardBtn}
                      onPress={() => openInsights(survey)}
                    >
                      <Text style={st.cardBtnText}>View Insights</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Summary stats */}
            <View style={st.summaryCard}>
              <Text style={st.summaryTitle}>Your Survey Activity</Text>
              <View style={st.summaryRow}>
                <View style={st.summaryItem}>
                  <Text style={st.summaryNum}>{completedSurveyIds.length}</Text>
                  <Text style={st.summaryLabel}>Completed</Text>
                </View>
                <View style={st.summaryDivider} />
                <View style={st.summaryItem}>
                  <Text style={st.summaryNum}>{surveyResponses.length}</Text>
                  <Text style={st.summaryLabel}>Responses</Text>
                </View>
                <View style={st.summaryDivider} />
                <View style={st.summaryItem}>
                  <Text style={st.summaryNum}>{BUILT_IN_SURVEYS.length - completedSurveyIds.length}</Text>
                  <Text style={st.summaryLabel}>Remaining</Text>
                </View>
              </View>
              {/* Progress bar */}
              <View style={st.summaryProgressTrack}>
                <View
                  style={[
                    st.summaryProgressFill,
                    { width: `${(completedSurveyIds.length / BUILT_IN_SURVEYS.length) * 100}%` },
                  ]}
                />
              </View>
              <Text style={st.summaryProgressLabel}>
                {Math.round((completedSurveyIds.length / BUILT_IN_SURVEYS.length) * 100)}% completion rate
              </Text>
            </View>
          </ScrollView>
        </>
      )}

      {/* ──────────── TAKE SURVEY ──────────── */}
      {view === 'take' && activeSurvey && (
        <View style={st.takeContainer}>
          {/* Back + progress */}
          <View style={st.takeHeader}>
            <TouchableOpacity onPress={() => setView('browse')} style={st.backBtn}>
              <Text style={st.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <View style={st.progressContainer}>
              <View style={st.progressTrack}>
                <View style={[st.progressFill, { width: `${progressPct}%` }]} />
              </View>
              <Text style={st.progressText}>{currentQ + 1} / {totalQuestions}</Text>
            </View>
          </View>

          {/* Completion overlay */}
          {showComplete ? (
            <View style={st.completeOverlay}>
              <Animated.View style={[{ opacity: confettiOpacity }]}>
                <SvgIcon name="star" size={48} color={Colors.warning} />
              </Animated.View>
              <Text style={st.completeTitle}>Survey Complete!</Text>
              <Text style={st.completeSubtitle}>
                Thank you for contributing to community health data.
              </Text>
              <Text style={st.completeStat}>
                {answeredCount}/{totalQuestions} questions answered
              </Text>
              <Text style={st.completeStat}>
                Duration: {Math.round((Date.now() - startTime.current) / 1000)}s
              </Text>
              <TouchableOpacity
                style={st.completeBtn}
                onPress={() => {
                  openInsights(activeSurvey);
                }}
              >
                <Text style={st.completeBtnText}>View Insights →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.completeBtn, st.completeBtnSecondary]}
                onPress={() => setView('browse')}
              >
                <Text style={st.completeBtnSecondaryText}>Back to Surveys</Text>
              </TouchableOpacity>
            </View>
          ) : question ? (
            <ScrollView style={st.questionContainer} contentContainerStyle={st.questionInner}>
              {/* Question header */}
              <Text style={st.questionNum}>Question {currentQ + 1}</Text>
              <Text style={st.questionText}>{question.text}</Text>
              {question.description && (
                <Text style={st.questionDesc}>{question.description}</Text>
              )}
              {question.required && (
                <Text style={st.requiredTag}>Required</Text>
              )}

              {/* Likert scale */}
              {question.type === 'likert_scale' && (
                <LikertScale
                  value={answers[question.id]?.value as number | null ?? null}
                  min={question.min ?? 1}
                  max={question.max ?? 5}
                  minLabel={question.minLabel}
                  maxLabel={question.maxLabel}
                  onChange={(v) => saveAnswer(question.id, v)}
                />
              )}

              {/* Numeric slider */}
              {question.type === 'numeric_slider' && (
                <NumericStepper
                  value={(answers[question.id]?.value as number) ?? question.min ?? 0}
                  min={question.min ?? 0}
                  max={question.max ?? 10}
                  step={question.step ?? 1}
                  onChange={(v) => saveAnswer(question.id, v)}
                />
              )}

              {/* Single choice */}
              {question.type === 'single_choice' && question.options && (
                <View style={st.optionsGroup}>
                  {question.options.map((opt) => {
                    const sel = answers[question.id]?.value === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[st.optionBtn, sel && st.optionBtnSelected]}
                        onPress={() => saveAnswer(question.id, opt.value)}
                      >
                        <View style={[st.radioOuter, sel && st.radioOuterActive]}>
                          {sel && <View style={st.radioInner} />}
                        </View>
                        <Text style={[st.optionLabel, sel && st.optionLabelSelected]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Multiple choice */}
              {question.type === 'multiple_choice' && question.options && (
                <View style={st.optionsGroup}>
                  {question.options.map((opt) => {
                    const currentVals = (answers[question.id]?.value as string[]) ?? [];
                    const sel = currentVals.includes(opt.value);
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[st.optionBtn, sel && st.optionBtnSelected]}
                        onPress={() => {
                          const next = sel
                            ? currentVals.filter((v) => v !== opt.value)
                            : [...currentVals, opt.value];
                          saveAnswer(question.id, next);
                        }}
                      >
                        <View style={[st.checkOuter, sel && st.checkOuterActive]}>
                          {sel && <SvgIcon name="check" size={12} color="#fff" />}
                        </View>
                        <Text style={[st.optionLabel, sel && st.optionLabelSelected]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Yes / No */}
              {question.type === 'yes_no' && (
                <View style={st.yesNoRow}>
                  {(['yes', 'no'] as const).map((v) => {
                    const sel = answers[question.id]?.value === v;
                    return (
                      <TouchableOpacity
                        key={v}
                        style={[st.yesNoBtn, sel && (v === 'yes' ? st.yesNoYesActive : st.yesNoNoActive)]}
                        onPress={() => saveAnswer(question.id, v)}
                      >
                        <Text style={[st.yesNoText, sel && st.yesNoTextActive]}>
                          {v === 'yes' ? 'Yes' : 'No'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Free text */}
              {question.type === 'free_text' && (
                <TextInput
                  style={st.freeText}
                  placeholder={question.placeholder ?? 'Type your answer...'}
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={(answers[question.id]?.value as string) ?? ''}
                  onChangeText={(t) => saveAnswer(question.id, t)}
                />
              )}

              {/* Navigation */}
              <View style={st.navRow}>
                <TouchableOpacity
                  style={[st.navBtn, currentQ === 0 && st.navBtnDisabled]}
                  onPress={() => currentQ > 0 && setCurrentQ(currentQ - 1)}
                  disabled={currentQ === 0}
                >
                  <Text style={st.navBtnText}>← Previous</Text>
                </TouchableOpacity>

                {currentQ < totalQuestions - 1 ? (
                  <TouchableOpacity
                    style={[st.navBtn, st.navBtnPrimary]}
                    onPress={() => setCurrentQ(currentQ + 1)}
                  >
                    <Text style={st.navBtnPrimaryText}>Next →</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[st.navBtn, st.navBtnSubmit]}
                    onPress={submitSurvey}
                  >
                    <Text style={st.navBtnPrimaryText}>Submit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Question dots */}
              <View style={st.dotsRow}>
                {activeSurvey.questions.map((q, idx) => {
                  const answered = !!answers[q.id];
                  const isCurrent = idx === currentQ;
                  return (
                    <TouchableOpacity
                      key={q.id}
                      style={[
                        st.dot,
                        answered && st.dotAnswered,
                        isCurrent && st.dotCurrent,
                      ]}
                      onPress={() => setCurrentQ(idx)}
                    />
                  );
                })}
              </View>
            </ScrollView>
          ) : null}
        </View>
      )}

      {/* ──────────── INSIGHTS ──────────── */}
      {view === 'insights' && (
        <ScrollView style={st.content} contentContainerStyle={st.contentInner}>
          {!insightsSurvey ? (
            <>
              <Text style={st.sectionTitle}>Select a survey to view insights</Text>
              {BUILT_IN_SURVEYS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={st.insightPickCard}
                  onPress={() => openInsights(s)}
                >
                  <SvgIcon name={(s.icon || 'clipboard') as IconName} size={28} color={Colors.accentTeal} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.insightPickTitle}>{s.title}</Text>
                    <Text style={st.insightPickMeta}>{s.totalResponses.toLocaleString()} responses</Text>
                  </View>
                  <Text style={st.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => setInsightsSurvey(null)} style={st.backBtn}>
                <Text style={st.backBtnText}>← All Surveys</Text>
              </TouchableOpacity>

              {/* Insights header */}
              <View style={st.insightsHeader}>
                <SvgIcon name={(insightsSurvey.icon || 'clipboard') as IconName} size={48} color={Colors.accentTeal} />
                <Text style={st.insightsTitle}>{insightsSurvey.title}</Text>
                <Text style={st.insightsRespondents}>
                  {insightsSurvey.totalResponses.toLocaleString()} total responses
                </Text>
              </View>

              {/* Insight cards */}
              {insights.map((insight, idx) => (
                <View key={insight.questionId} style={st.insightCard}>
                  <View style={st.insightQHeader}>
                    <View style={st.insightQNum}>
                      <Text style={st.insightQNumText}>Q{idx + 1}</Text>
                    </View>
                    <Text style={st.insightQText}>{insight.questionText}</Text>
                  </View>

                  {insight.distribution.length > 0 ? (
                    <View style={st.insightBars}>
                      {insight.distribution.slice(0, 6).map((d, i) => (
                        <InsightBar
                          key={d.label}
                          label={d.label}
                          percent={d.percent}
                          color={i === 0 ? insightsSurvey.color : Colors.textMuted}
                        />
                      ))}
                    </View>
                  ) : (
                    <Text style={st.insightNoData}>{insight.topAnswer}</Text>
                  )}

                  <View style={st.insightFooter}>
                    <Text style={st.insightTopAnswer}>
                      Top: {insight.topAnswer}
                      {insight.topAnswerPercent > 0 ? ` (${insight.topAnswerPercent}%)` : ''}
                    </Text>
                    <Text style={st.insightTotal}>{insight.totalAnswers} answers</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════ //
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  title: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  subtitle: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted, marginTop: 4 },

  // Tab bar
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, alignItems: 'center' },
  tab: { paddingVertical: 8, paddingHorizontal: 12, marginRight: 4, borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.accentTealBg, borderWidth: 1, borderColor: Colors.accentTealBorder },
  tabText: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted },
  tabTextActive: { color: Colors.accentTeal, fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const },
  tabBadge: { marginLeft: 'auto', backgroundColor: Colors.accentTealBg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.sm },
  tabBadgeText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.accentTeal },

  // Filter chips
  filterBar: { maxHeight: 48, marginBottom: 4 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, marginRight: 4 },
  filterChipActive: { backgroundColor: Colors.accentTealBg, borderColor: Colors.accentTeal },
  filterChipIcon: { fontSize: 14, marginRight: 4 },
  filterChipText: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted },
  filterChipTextActive: { color: Colors.accentTeal },

  // Content
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 120 },

  // Featured banner
  featuredBanner: {
    backgroundColor: Colors.accentTealBg,
    borderWidth: 1,
    borderColor: Colors.accentTealBorder,
    borderRadius: BorderRadius.sm,
    padding: 16,
    marginBottom: 16,
  },
  featuredLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.accentTeal, marginBottom: 4 },
  featuredTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary, marginBottom: 4 },
  featuredDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  featuredBtn: { backgroundColor: Colors.accentTeal, paddingVertical: 8, paddingHorizontal: 16, borderRadius: BorderRadius.sm, alignSelf: 'flex-start', height: 40, justifyContent: 'center' },
  featuredBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textInverse },

  // Survey card
  surveyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardIcon: { width: 44, height: 44, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  cardIconText: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2, flexWrap: 'wrap' },
  catBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: BorderRadius.sm },
  catBadgeText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, fontWeight: '500' },
  metaDot: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginHorizontal: 4 },
  metaText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },
  completedBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.success + '20', justifyContent: 'center', alignItems: 'center' },
  completedBadgeText: { color: Colors.success, fontWeight: '700', fontSize: 14 },
  cardDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  cardStats: { marginBottom: 8 },
  statText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },
  cardActions: { flexDirection: 'row', gap: 8 },
  cardBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, height: 40, justifyContent: 'center' },
  cardBtnPrimary: { backgroundColor: Colors.accentTeal, borderColor: Colors.accentTeal },
  cardBtnPrimaryText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.textInverse },
  cardBtnText: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary },

  // Summary card
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  summaryItem: { alignItems: 'center' },
  summaryNum: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.accentTeal },
  summaryLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: Colors.border, height: '100%' },
  summaryProgressTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  summaryProgressFill: { height: '100%', backgroundColor: Colors.accentTeal, borderRadius: 3 },
  summaryProgressLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },

  // ── Take survey ──
  takeContainer: { flex: 1 },
  takeHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  backBtn: { paddingVertical: 4 },
  backBtnText: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.accentTeal },
  progressContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.accentTeal, borderRadius: 2 },
  progressText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, minWidth: 40, textAlign: 'right' },

  // Question
  questionContainer: { flex: 1 },
  questionInner: { padding: 16, paddingBottom: 120 },
  questionNum: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.accentTeal, marginBottom: 4 },
  questionText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary, marginBottom: 4 },
  questionDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted, marginBottom: 8 },
  requiredTag: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.highAlert, marginBottom: 12 },

  // Likert
  likertRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  likertDot: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  likertDotActive: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTealBg },
  likertNum: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  likertNumActive: { color: Colors.accentTeal },
  likertLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  likertLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },

  // Stepper
  stepperRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 12 },
  stepperBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  stepperBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.accentTeal },
  stepperValue: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.accentTealBg, justifyContent: 'center', alignItems: 'center' },
  stepperValueText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 28, color: Colors.accentTeal },
  stepperRange: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },

  // Options (single / multi)
  optionsGroup: { marginVertical: 8, gap: 4 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  optionBtnSelected: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTealBg },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.textMuted, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  radioOuterActive: { borderColor: Colors.accentTeal },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.accentTeal },
  checkOuter: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: Colors.textMuted, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  checkOuterActive: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTeal },
  checkMark: { color: Colors.textInverse, fontSize: 14, fontWeight: '700' },
  optionLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textSecondary, flex: 1 },
  optionLabelSelected: { color: Colors.textPrimary },

  // Yes/No
  yesNoRow: { flexDirection: 'row', gap: 12, marginVertical: 12 },
  yesNoBtn: { flex: 1, paddingVertical: 16, borderRadius: BorderRadius.sm, borderWidth: 2, borderColor: Colors.border, alignItems: 'center' },
  yesNoYesActive: { borderColor: Colors.success, backgroundColor: Colors.success + '15' },
  yesNoNoActive: { borderColor: Colors.highAlert, backgroundColor: Colors.highAlert + '15' },
  yesNoText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textMuted },
  yesNoTextActive: { color: Colors.textPrimary, fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const },

  // Free text
  freeText: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginVertical: 8,
  },

  // Navigation
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  navBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, height: 40, justifyContent: 'center' },
  navBtnDisabled: { opacity: 0.3 },
  navBtnPrimary: { backgroundColor: Colors.accentTeal, borderColor: Colors.accentTeal },
  navBtnSubmit: { backgroundColor: Colors.success, borderColor: Colors.success },
  navBtnText: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textMuted },
  navBtnPrimaryText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textInverse },

  // Question dots
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 6, flexWrap: 'wrap' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  dotAnswered: { backgroundColor: Colors.accentTeal },
  dotCurrent: { borderWidth: 2, borderColor: Colors.textPrimary },

  // Completion overlay
  completeOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  confetti: { fontSize: 64, marginBottom: 12 },
  completeTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 28, color: Colors.textPrimary, marginBottom: 8 },
  completeSubtitle: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  completeStat: { fontFamily: 'Roboto Mono, monospace', fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  completeBtn: { backgroundColor: Colors.accentTeal, paddingVertical: 8, paddingHorizontal: 24, borderRadius: BorderRadius.sm, marginTop: 12, height: 40, justifyContent: 'center' },
  completeBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textInverse },
  completeBtnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border },
  completeBtnSecondaryText: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textSecondary },

  // ── Insights ──
  sectionTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary, marginBottom: 12 },
  insightPickCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  insightPickIcon: { fontSize: 28, marginRight: 12 },
  insightPickTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  insightPickMeta: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },
  chevron: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.textMuted },

  insightsHeader: { alignItems: 'center', marginBottom: 16, paddingTop: 8 },
  insightsIcon: { fontSize: 48, marginBottom: 8 },
  insightsTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary, textAlign: 'center' },
  insightsRespondents: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, marginTop: 4 },

  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  insightQHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  insightQNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.accentTealBg, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  insightQNumText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.accentTeal, fontWeight: '700' },
  insightQText: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textPrimary, flex: 1 },
  insightBars: { marginBottom: 8 },
  insightBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  insightBarLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, width: 110 },
  insightBarTrack: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  insightBarFill: { height: '100%', borderRadius: 4 },
  insightBarPct: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, width: 36, textAlign: 'right' },
  insightNoData: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', marginBottom: 8 },
  insightFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.borderSubtle, paddingTop: 4 },
  insightTopAnswer: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.accentTeal },
  insightTotal: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },
});
