// ============================================================
// Exposure2Tumor — Survey Service
// Built-in community health surveys with insights engine
// ============================================================

import type {
  Survey,
  SurveyResponse,
  SurveyAnswer,
  SurveyInsight,
  SurveyCategory,
  GeoIdentifier,
} from '../types';

// ---- Factory Helpers ----

let _sid = 0;
const uid = () => `sr_${Date.now()}_${++_sid}`;

export function createSurveyResponse(
  surveyId: string,
  answers: SurveyAnswer[],
  durationSeconds: number,
  geoContext?: GeoIdentifier,
): SurveyResponse {
  return {
    id: uid(),
    surveyId,
    answers,
    geoContext,
    completedAt: new Date().toISOString(),
    durationSeconds,
  };
}

// ---- Built-in Survey Templates ----

export const BUILT_IN_SURVEYS: Survey[] = [
  {
    id: 'env_concern_v1',
    title: 'Environmental Concern Assessment',
    description: 'Rate the environmental quality around your residence and report concerns about pollution, water quality, and industrial activity.',
    category: 'environmental_concern',
    icon: 'globe',
    color: '#14B8A6',
    estimatedMinutes: 4,
    totalResponses: 1247,
    createdAt: '2025-09-15T00:00:00Z',
    featured: true,
    questions: [
      {
        id: 'ec1', type: 'likert_scale', text: 'How would you rate the overall air quality in your neighborhood?',
        required: true, min: 1, max: 5, minLabel: 'Very Poor', maxLabel: 'Excellent',
      },
      {
        id: 'ec2', type: 'multiple_choice', text: 'Which environmental concerns apply to your area?',
        description: 'Select all that apply',
        required: true,
        options: [
          { id: 'ec2a', label: 'Industrial emissions', value: 'industrial' },
          { id: 'ec2b', label: 'Water contamination', value: 'water' },
          { id: 'ec2c', label: 'Soil pollution', value: 'soil' },
          { id: 'ec2d', label: 'Noise pollution', value: 'noise' },
          { id: 'ec2e', label: 'Light pollution', value: 'light' },
          { id: 'ec2f', label: 'Pesticide/herbicide use', value: 'pesticide' },
          { id: 'ec2g', label: 'No major concerns', value: 'none' },
        ],
      },
      {
        id: 'ec3', type: 'single_choice', text: 'How close is the nearest industrial facility to your home?',
        required: true,
        options: [
          { id: 'ec3a', label: 'Less than 1 mile', value: '<1mi' },
          { id: 'ec3b', label: '1–3 miles', value: '1-3mi' },
          { id: 'ec3c', label: '3–10 miles', value: '3-10mi' },
          { id: 'ec3d', label: 'More than 10 miles', value: '>10mi' },
          { id: 'ec3e', label: 'Not sure', value: 'unknown' },
        ],
      },
      {
        id: 'ec4', type: 'yes_no', text: 'Have you ever noticed unusual odors or discoloration in your local water supply?',
        required: true,
      },
      {
        id: 'ec5', type: 'free_text', text: 'Describe any specific environmental concerns in your community.',
        required: false, placeholder: 'Optional: share details about local environmental issues...',
      },
    ],
  },
  {
    id: 'health_percept_v1',
    title: 'Health & Cancer Risk Perception',
    description: 'Help researchers understand how communities perceive cancer risk factors and their personal exposure levels.',
    category: 'health_perception',
    icon: 'stethoscope',
    color: '#E879F9',
    estimatedMinutes: 5,
    totalResponses: 892,
    createdAt: '2025-10-01T00:00:00Z',
    featured: true,
    questions: [
      {
        id: 'hp1', type: 'likert_scale', text: 'How concerned are you about your personal cancer risk?',
        required: true, min: 1, max: 5, minLabel: 'Not at all', maxLabel: 'Extremely',
      },
      {
        id: 'hp2', type: 'single_choice', text: 'Do you believe environmental factors in your area increase cancer risk?',
        required: true,
        options: [
          { id: 'hp2a', label: 'Definitely yes', value: 'definitely' },
          { id: 'hp2b', label: 'Probably yes', value: 'probably' },
          { id: 'hp2c', label: 'Not sure', value: 'unsure' },
          { id: 'hp2d', label: 'Probably not', value: 'probably_not' },
          { id: 'hp2e', label: 'Definitely not', value: 'definitely_not' },
        ],
      },
      {
        id: 'hp3', type: 'multiple_choice', text: 'Which cancer risk factors do you consider most relevant to your life?',
        required: true,
        options: [
          { id: 'hp3a', label: 'Tobacco / smoking', value: 'tobacco' },
          { id: 'hp3b', label: 'Air pollution', value: 'air' },
          { id: 'hp3c', label: 'Diet / nutrition', value: 'diet' },
          { id: 'hp3d', label: 'UV / sun exposure', value: 'uv' },
          { id: 'hp3e', label: 'Family history', value: 'family' },
          { id: 'hp3f', label: 'Occupational exposure', value: 'occupational' },
          { id: 'hp3g', label: 'Alcohol consumption', value: 'alcohol' },
          { id: 'hp3h', label: 'Physical inactivity', value: 'inactivity' },
        ],
      },
      {
        id: 'hp4', type: 'numeric_slider', text: 'How many cancer screenings have you had in the past 5 years?',
        required: true, min: 0, max: 10, step: 1,
      },
      {
        id: 'hp5', type: 'yes_no', text: 'Has anyone in your immediate family been diagnosed with cancer?',
        required: true,
      },
      {
        id: 'hp6', type: 'free_text', text: 'What would help you feel more informed about local cancer risks?',
        required: false, placeholder: 'Share your thoughts...',
      },
    ],
  },
  {
    id: 'access_care_v1',
    title: 'Access to Healthcare Survey',
    description: 'Assess the availability and accessibility of healthcare services, screening facilities, and preventive care in your community.',
    category: 'access_to_care',
    icon: 'hospital',
    color: '#FB923C',
    estimatedMinutes: 3,
    totalResponses: 634,
    createdAt: '2025-11-10T00:00:00Z',
    featured: false,
    questions: [
      {
        id: 'ac1', type: 'single_choice', text: 'How far is the nearest cancer screening facility from you?',
        required: true,
        options: [
          { id: 'ac1a', label: 'Under 15 minutes', value: '<15min' },
          { id: 'ac1b', label: '15–30 minutes', value: '15-30min' },
          { id: 'ac1c', label: '30–60 minutes', value: '30-60min' },
          { id: 'ac1d', label: 'Over 1 hour', value: '>60min' },
          { id: 'ac1e', label: 'I don\'t know', value: 'unknown' },
        ],
      },
      {
        id: 'ac2', type: 'yes_no', text: 'Do you currently have health insurance?',
        required: true,
      },
      {
        id: 'ac3', type: 'multiple_choice', text: 'What barriers do you face accessing healthcare?',
        required: true,
        options: [
          { id: 'ac3a', label: 'Cost', value: 'cost' },
          { id: 'ac3b', label: 'Distance / transportation', value: 'distance' },
          { id: 'ac3c', label: 'Long wait times', value: 'wait' },
          { id: 'ac3d', label: 'Language barriers', value: 'language' },
          { id: 'ac3e', label: 'No barriers', value: 'none' },
        ],
      },
      {
        id: 'ac4', type: 'likert_scale', text: 'How satisfied are you with the quality of healthcare in your area?',
        required: true, min: 1, max: 5, minLabel: 'Very Dissatisfied', maxLabel: 'Very Satisfied',
      },
    ],
  },
  {
    id: 'neighborhood_v1',
    title: 'Neighborhood Quality & Safety',
    description: 'Evaluate walkability, food access, green spaces, and structural factors in your neighborhood that may affect long-term health outcomes.',
    category: 'neighborhood_quality',
    icon: 'neighborhood',
    color: '#34D399',
    estimatedMinutes: 4,
    totalResponses: 518,
    createdAt: '2025-12-05T00:00:00Z',
    featured: false,
    questions: [
      {
        id: 'nq1', type: 'likert_scale', text: 'How would you rate walkability in your neighborhood?',
        required: true, min: 1, max: 5, minLabel: 'Very Poor', maxLabel: 'Excellent',
      },
      {
        id: 'nq2', type: 'single_choice', text: 'How far is the nearest grocery store with fresh produce?',
        required: true,
        options: [
          { id: 'nq2a', label: 'Walking distance (< 10 min)', value: 'walking' },
          { id: 'nq2b', label: 'Short drive (< 15 min)', value: 'short_drive' },
          { id: 'nq2c', label: 'Long drive (15–30 min)', value: 'long_drive' },
          { id: 'nq2d', label: 'Very far (30+ min)', value: 'very_far' },
        ],
      },
      {
        id: 'nq3', type: 'yes_no', text: 'Is there a public park or green space within walking distance of your home?',
        required: true,
      },
      {
        id: 'nq4', type: 'multiple_choice', text: 'Which of these describe your neighborhood?',
        required: true,
        options: [
          { id: 'nq4a', label: 'Sidewalks available', value: 'sidewalks' },
          { id: 'nq4b', label: 'Bike lanes nearby', value: 'bikelanes' },
          { id: 'nq4c', label: 'Well-lit streets', value: 'welllit' },
          { id: 'nq4d', label: 'Public transit access', value: 'transit' },
          { id: 'nq4e', label: 'Community gardens', value: 'gardens' },
          { id: 'nq4f', label: 'None of the above', value: 'none' },
        ],
      },
      {
        id: 'nq5', type: 'likert_scale', text: 'How safe do you feel in your neighborhood at night?',
        required: true, min: 1, max: 5, minLabel: 'Very Unsafe', maxLabel: 'Very Safe',
      },
    ],
  },
  {
    id: 'occ_safety_v1',
    title: 'Occupational Exposure Check',
    description: 'Identify potential workplace carcinogen exposures and safety practices to assess occupational cancer risk factors.',
    category: 'occupational_safety',
    icon: 'construction',
    color: '#FBBF24',
    estimatedMinutes: 3,
    totalResponses: 312,
    createdAt: '2026-01-20T00:00:00Z',
    featured: false,
    questions: [
      {
        id: 'os1', type: 'single_choice', text: 'What best describes your work environment?',
        required: true,
        options: [
          { id: 'os1a', label: 'Office / remote', value: 'office' },
          { id: 'os1b', label: 'Industrial / manufacturing', value: 'industrial' },
          { id: 'os1c', label: 'Agriculture / farming', value: 'agriculture' },
          { id: 'os1d', label: 'Healthcare', value: 'healthcare' },
          { id: 'os1e', label: 'Construction', value: 'construction' },
          { id: 'os1f', label: 'Other', value: 'other' },
        ],
      },
      {
        id: 'os2', type: 'multiple_choice', text: 'Are you regularly exposed to any of these at work?',
        required: true,
        options: [
          { id: 'os2a', label: 'Chemicals / solvents', value: 'chemicals' },
          { id: 'os2b', label: 'Dust / asbestos', value: 'dust' },
          { id: 'os2c', label: 'Radiation', value: 'radiation' },
          { id: 'os2d', label: 'Heavy metals', value: 'metals' },
          { id: 'os2e', label: 'None', value: 'none' },
        ],
      },
      {
        id: 'os3', type: 'yes_no', text: 'Does your employer provide personal protective equipment (PPE)?',
        required: true,
      },
      {
        id: 'os4', type: 'likert_scale', text: 'How confident are you in your workplace safety practices?',
        required: true, min: 1, max: 5, minLabel: 'Not Confident', maxLabel: 'Very Confident',
      },
    ],
  },
];

// ---- Insights Engine ----

export function computeSurveyInsights(
  survey: Survey,
  responses: SurveyResponse[],
): SurveyInsight[] {
  const surveyResponses = responses.filter((r) => r.surveyId === survey.id);
  if (surveyResponses.length === 0) return [];

  return survey.questions.map((q) => {
    const answers = surveyResponses
      .map((r) => r.answers.find((a) => a.questionId === q.id))
      .filter(Boolean) as SurveyAnswer[];

    const totalAnswers = answers.length;

    if (q.type === 'likert_scale' || q.type === 'numeric_slider') {
      const nums = answers.map((a) => Number(a.value)).filter((n) => !isNaN(n));
      const avg = nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
      const rounded = Math.round(avg * 10) / 10;
      const buckets: Record<string, number> = {};
      nums.forEach((n) => {
        const key = String(n);
        buckets[key] = (buckets[key] || 0) + 1;
      });
      const distribution = Object.entries(buckets)
        .map(([label, count]) => ({ label, count, percent: Math.round((count / totalAnswers) * 100) }))
        .sort((a, b) => Number(a.label) - Number(b.label));

      return {
        questionId: q.id,
        questionText: q.text,
        topAnswer: `Average: ${rounded}`,
        topAnswerPercent: 0,
        totalAnswers,
        distribution,
      };
    }

    if (q.type === 'yes_no') {
      const yesCount = answers.filter((a) => a.value === 'yes').length;
      const noCount = totalAnswers - yesCount;
      const topIsYes = yesCount >= noCount;
      return {
        questionId: q.id,
        questionText: q.text,
        topAnswer: topIsYes ? 'Yes' : 'No',
        topAnswerPercent: Math.round(((topIsYes ? yesCount : noCount) / totalAnswers) * 100),
        totalAnswers,
        distribution: [
          { label: 'Yes', count: yesCount, percent: Math.round((yesCount / totalAnswers) * 100) },
          { label: 'No', count: noCount, percent: Math.round((noCount / totalAnswers) * 100) },
        ],
      };
    }

    if (q.type === 'free_text') {
      return {
        questionId: q.id,
        questionText: q.text,
        topAnswer: `${totalAnswers} text responses`,
        topAnswerPercent: 0,
        totalAnswers,
        distribution: [],
      };
    }

    // single_choice, multiple_choice, ranking
    const freq: Record<string, number> = {};
    answers.forEach((a) => {
      const vals = Array.isArray(a.value) ? a.value : [String(a.value)];
      vals.forEach((v) => { freq[v] = (freq[v] || 0) + 1; });
    });

    const distribution = Object.entries(freq)
      .map(([value, count]) => {
        const option = q.options?.find((o) => o.value === value);
        return { label: option?.label ?? value, count, percent: Math.round((count / totalAnswers) * 100) };
      })
      .sort((a, b) => b.count - a.count);

    const top = distribution[0];
    return {
      questionId: q.id,
      questionText: q.text,
      topAnswer: top?.label ?? '—',
      topAnswerPercent: top?.percent ?? 0,
      totalAnswers,
      distribution,
    };
  });
}

// ---- Demo Response Generator ----

export function generateDemoResponses(survey: Survey, count: number): SurveyResponse[] {
  const responses: SurveyResponse[] = [];
  for (let i = 0; i < count; i++) {
    const answers: SurveyAnswer[] = survey.questions.map((q) => {
      const hash = ((survey.id.length * 31 + i * 7 + q.id.charCodeAt(q.id.length - 1)) >>> 0) % 100;
      if (q.type === 'likert_scale' || q.type === 'numeric_slider') {
        const min = q.min ?? 1;
        const max = q.max ?? 5;
        return { questionId: q.id, value: min + (hash % (max - min + 1)) };
      }
      if (q.type === 'yes_no') {
        return { questionId: q.id, value: hash > 45 ? 'yes' : 'no' };
      }
      if (q.type === 'free_text') {
        return { questionId: q.id, value: '' };
      }
      if (q.options && q.options.length > 0) {
        if (q.type === 'multiple_choice') {
          const picks = q.options.filter((_, idx) => ((hash + idx * 13) % 3) === 0);
          return { questionId: q.id, value: picks.length > 0 ? picks.map((o) => o.value) : [q.options[0].value] };
        }
        return { questionId: q.id, value: q.options[hash % q.options.length].value };
      }
      return { questionId: q.id, value: '' };
    });
    responses.push({
      id: `demo_${survey.id}_${i}`,
      surveyId: survey.id,
      answers,
      completedAt: new Date(Date.now() - i * 86400000).toISOString(),
      durationSeconds: 120 + (hash7(i) % 300),
    });
  }
  return responses;
}

function hash7(n: number): number {
  return ((n * 2654435761) >>> 0) % 1000;
}

// ---- Helpers ----

export function getSurveysByCategory(category: SurveyCategory): Survey[] {
  return BUILT_IN_SURVEYS.filter((s) => s.category === category);
}

export function getSurveyCompletionRate(
  survey: Survey,
  responses: SurveyResponse[],
): number {
  const mine = responses.filter((r) => r.surveyId === survey.id);
  if (mine.length === 0) return 0;
  const requiredQ = survey.questions.filter((q) => q.required).length;
  const latest = mine[mine.length - 1];
  const answered = latest.answers.filter((a) => {
    if (Array.isArray(a.value)) return a.value.length > 0;
    return a.value !== '' && a.value !== undefined;
  }).length;
  return requiredQ > 0 ? Math.round((answered / requiredQ) * 100) : 100;
}

export const SURVEY_CATEGORY_META: Record<SurveyCategory, { label: string; icon: string; color: string }> = {
  environmental_concern: { label: 'Environment', icon: 'globe', color: '#14B8A6' },
  health_perception: { label: 'Health', icon: 'stethoscope', color: '#E879F9' },
  exposure_awareness: { label: 'Exposure', icon: 'warning', color: '#F87171' },
  neighborhood_quality: { label: 'Neighborhood', icon: 'neighborhood', color: '#34D399' },
  access_to_care: { label: 'Healthcare', icon: 'hospital', color: '#FB923C' },
  lifestyle_habits: { label: 'Lifestyle', icon: 'runner', color: '#60A5FA' },
  occupational_safety: { label: 'Workplace', icon: 'construction', color: '#FBBF24' },
  community_action: { label: 'Community', icon: 'handshake', color: '#A78BFA' },
  custom: { label: 'Custom', icon: 'clipboard', color: '#94A3B8' },
};
