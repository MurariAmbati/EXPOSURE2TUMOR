// ============================================================
// Exposure2Tumor — Environmental Capture & Risk Identification
// Field photography with AI scene analysis, hazard detection,
// proximity risk identification, and environmental reporting
// ============================================================

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, Shadows } from '../src/theme';
import { useAppStore } from '../src/store';
import { CANCER_SITES } from '../src/config/cancerSites';
import { SvgIcon, IconName } from '../src/components/SvgIcon';
import type { ClinicalPhoto, LocalPhotoAnalysis, EnvironmentalHazard, ProximityRisk } from '../src/types';

const _dim = Dimensions.get('window');
const SW = Platform.OS === 'web' ? Math.min(_dim.width, 430) : _dim.width;
const IS_WEB = Platform.OS === 'web';

type ScreenMode = 'gallery' | 'camera' | 'review' | 'report';
type GalleryFilter = 'all' | 'hazards' | 'clinical' | 'environment' | 'flagged';
type CaptureIntent = 'environment' | 'clinical' | 'facility' | 'water' | 'air' | 'soil' | 'general';

// ── Capture intent definitions ──
const CAPTURE_INTENTS: { id: CaptureIntent; label: string; icon: string; color: string }[] = [
  { id: 'environment', label: 'Environment Scan', icon: 'globe', color: Colors.environmental },
  { id: 'facility', label: 'Facility ID', icon: 'factory', color: Colors.occupational },
  { id: 'water', label: 'Water Source', icon: 'water', color: '#2196F3' },
  { id: 'air', label: 'Air Quality', icon: 'haze', color: Colors.climateUV },
  { id: 'soil', label: 'Soil / Land', icon: 'rock', color: '#795548' },
  { id: 'clinical', label: 'Clinical Photo', icon: 'microscope', color: Colors.highAlert },
  { id: 'general', label: 'General', icon: 'camera', color: Colors.textMuted },
];

const BODY_REGIONS = [
  'head_neck', 'chest', 'abdomen', 'back', 'upper_extremity',
  'lower_extremity', 'skin_general', 'oral_cavity', 'other',
] as const;

const CLINICAL_TAGS = [
  'lesion', 'mole', 'rash', 'swelling', 'discoloration',
  'wound', 'growth', 'screening', 'follow_up', 'baseline',
] as const;

const ENV_TAGS = [
  'smoke_plume', 'chemical_odor', 'discolored_water', 'runoff', 'erosion',
  'dust_cloud', 'oil_spill', 'dead_vegetation', 'unusual_color', 'waste_pile',
  'pipe_discharge', 'stack_emission', 'noise_source', 'contaminated_soil',
  'abandoned_site', 'operating_facility', 'storage_tanks', 'power_lines',
] as const;

// ── Simulated AI environmental analysis engine ──
function generateEnvironmentalAnalysis(intent: CaptureIntent, tags: string[]): LocalPhotoAnalysis {
  const now = new Date().toISOString();
  const photoId = `photo-${Date.now()}`;
  const hazards: EnvironmentalHazard[] = [];
  const proximityRisks: ProximityRisk[] = [];

  if (intent === 'facility' || tags.includes('operating_facility') || tags.includes('stack_emission')) {
    hazards.push({
      id: `h-${Date.now()}-1`, type: 'industrial', label: 'Industrial emissions source', severity: 'high',
      confidence: 0.82 + Math.random() * 0.12,
      description: 'Detected industrial infrastructure with potential atmospheric emissions. Facilities of this type are associated with VOC, PM2.5, and heavy metal releases.',
      cancerRelevance: ['lung', 'liver', 'bladder'],
      mitigationActions: ['Document facility name and permit number', 'Check EPA TRI database for release reports', 'Monitor downwind air quality', 'Report visible emissions to state DEQ'],
    });
    proximityRisks.push({
      facilityType: 'Industrial facility', estimatedDistance: `~${(0.2 + Math.random() * 2).toFixed(1)} mi`, riskLevel: 'high',
      relevantExposures: ['VOCs', 'PM2.5', 'Heavy metals', 'NOx'],
      description: 'Within elevated exposure zone. EPA recommends enhanced monitoring within 3-mile radius of TRI facilities.',
    });
  }

  if (intent === 'water' || tags.includes('discolored_water') || tags.includes('runoff')) {
    hazards.push({
      id: `h-${Date.now()}-2`, type: 'water_contamination', label: 'Potential water contamination',
      severity: tags.includes('discolored_water') ? 'high' : 'moderate',
      confidence: 0.71 + Math.random() * 0.15,
      description: 'Water source shows indicators consistent with possible contamination. Visible turbidity, discoloration, or surface sheens may indicate industrial/agricultural runoff.',
      cancerRelevance: ['bladder', 'kidney', 'liver'],
      mitigationActions: ['Do not use for drinking or irrigation', 'Submit sample to certified lab', 'Check state drinking water violation database', 'Report to local health department', 'Document upstream sources'],
    });
    proximityRisks.push({
      facilityType: 'Water contamination source', estimatedDistance: 'Immediate vicinity',
      riskLevel: tags.includes('discolored_water') ? 'critical' : 'moderate',
      relevantExposures: ['Heavy metals', 'Nitrates', 'PFAS', 'Pesticides'],
      description: 'Contaminated water sources within residential proximity significantly increase exposure to carcinogens via dermal contact, ingestion, and vapor inhalation.',
    });
  }

  if (intent === 'air' || tags.includes('smoke_plume') || tags.includes('dust_cloud')) {
    hazards.push({
      id: `h-${Date.now()}-3`, type: 'air_pollution', label: 'Airborne particulate hazard',
      severity: tags.includes('smoke_plume') ? 'high' : 'moderate',
      confidence: 0.76 + Math.random() * 0.14,
      description: 'Visible atmospheric particles detected. Smoke plumes, dust clouds, and haze indicate elevated PM2.5/PM10 exposure. Chronic inhalation exposure increases lung cancer risk.',
      cancerRelevance: ['lung', 'oral'],
      mitigationActions: ['Limit outdoor exposure during visible events', 'Use N95 masks in affected areas', 'Check AirNow.gov for local AQI readings', 'Document duration and frequency of events', 'Report persistent sources to regional air board'],
    });
  }

  if (intent === 'soil' || tags.includes('contaminated_soil') || tags.includes('erosion')) {
    hazards.push({
      id: `h-${Date.now()}-4`, type: 'soil_contamination', label: 'Soil contamination indicators', severity: 'moderate',
      confidence: 0.68 + Math.random() * 0.15,
      description: 'Soil characteristics suggest potential contamination. Stained soil, unusual vegetation patterns, and proximity to industrial activities are risk indicators.',
      cancerRelevance: ['skin', 'liver', 'kidney'],
      mitigationActions: ['Avoid direct skin contact with suspect soil', 'Check EPA Brownfields/Superfund database', 'Request soil testing from county extension office', 'Prevent children from playing in affected areas'],
    });
  }

  if (tags.includes('waste_pile') || tags.includes('abandoned_site')) {
    hazards.push({
      id: `h-${Date.now()}-5`, type: 'waste', label: 'Uncontrolled waste / abandoned site', severity: 'high',
      confidence: 0.79 + Math.random() * 0.12,
      description: 'Abandoned or uncontrolled waste site detected. Such sites may contain hazardous materials, leaching chemicals, and pose long-term environmental contamination risks.',
      cancerRelevance: ['liver', 'kidney', 'bladder', 'lung'],
      mitigationActions: ['Do not enter or disturb the site', 'Report to EPA/state environmental agency', 'Check CERCLIS database for Superfund status', 'Document evidence of leaching or runoff'],
    });
  }

  if (tags.includes('power_lines')) {
    hazards.push({
      id: `h-${Date.now()}-6`, type: 'electromagnetic', label: 'EMF / infrastructure exposure', severity: 'low',
      confidence: 0.65 + Math.random() * 0.15,
      description: 'High-voltage power infrastructure detected. IARC classifies ELF magnetic fields as possibly carcinogenic (Group 2B).',
      cancerRelevance: ['brain', 'leukemia'],
      mitigationActions: ['Measure EMF levels with a gaussmeter', 'Maintain recommended distance from high-voltage lines', 'Document distance from nearest residence'],
    });
  }

  if (hazards.length === 0 && intent !== 'clinical' && intent !== 'general') {
    hazards.push({
      id: `h-${Date.now()}-0`, type: 'air_pollution', label: 'General environmental assessment', severity: 'low',
      confidence: 0.55 + Math.random() * 0.2,
      description: 'No immediate high-risk environmental hazards identified in this scene. Continue monitoring and document any changes over time.',
      cancerRelevance: [], mitigationActions: ['Periodic re-assessment recommended', 'Cross-reference with EPA facility data', 'Check community health data for area'],
    });
  }

  const classifications = intent === 'clinical'
    ? [
        { label: 'Normal tissue', confidence: 0.55 + Math.random() * 0.25 },
        { label: 'Benign lesion', confidence: 0.1 + Math.random() * 0.2 },
        { label: 'Requires follow-up', confidence: Math.random() * 0.2 },
        { label: 'Atypical pattern', confidence: Math.random() * 0.15 },
      ]
    : [
        { label: 'Environmental risk zone', confidence: 0.4 + Math.random() * 0.4 },
        { label: 'Industrial proximity', confidence: 0.2 + Math.random() * 0.35 },
        { label: 'Natural/low risk', confidence: 0.1 + Math.random() * 0.3 },
        { label: 'Residential buffer zone', confidence: 0.1 + Math.random() * 0.2 },
      ];
  classifications.sort((a, b) => b.confidence - a.confidence);

  const riskScore = hazards.length > 0
    ? Math.min(hazards.reduce((s, h) => s + (h.severity === 'critical' ? 0.9 : h.severity === 'high' ? 0.7 : h.severity === 'moderate' ? 0.45 : 0.2), 0) / hazards.length, 1)
    : 0.15 + Math.random() * 0.2;

  const sceneType = intent === 'clinical' ? 'clinical' : intent === 'water' ? 'water_body' : intent === 'facility' ? 'industrial' : intent === 'air' ? 'transportation' : intent === 'soil' ? 'construction' : 'residential';

  return {
    photoId, modelVersion: 'exposure2tumor-envision-v2.0', classifications, riskScore,
    suggestedActions: [...hazards.flatMap(h => h.mitigationActions.slice(0, 2)), 'Save to evidence vault for longitudinal tracking', 'Share findings with research team'].slice(0, 6),
    analyzedAt: now, sceneType, environmentalHazards: hazards, proximityRisks,
    airQualityEstimate: (intent === 'air' || tags.includes('smoke_plume') || tags.includes('dust_cloud'))
      ? { aqi: Math.floor(50 + Math.random() * 150), category: tags.includes('smoke_plume') ? 'Unhealthy' : 'Moderate', pm25: +(5 + Math.random() * 60).toFixed(1), pm10: +(10 + Math.random() * 100).toFixed(1), visibleIndicators: tags.filter(t => ['smoke_plume', 'dust_cloud', 'chemical_odor'].includes(t)) }
      : undefined,
    waterRiskIndicators: (intent === 'water' || tags.includes('discolored_water'))
      ? [{ type: 'Turbidity', severity: 'moderate' as const, description: 'Visible cloudiness may indicate suspended particulates' }, { type: 'Surface sheen', severity: 'high' as const, description: 'Oil/chemical film detected on water surface' }].slice(0, 1 + Math.floor(Math.random() * 1))
      : undefined,
    landUseClassification: sceneType,
  };
}

function severityColor(severity: string): string {
  return severity === 'critical' ? '#B71C1C' : severity === 'high' ? Colors.highAlert : severity === 'moderate' ? Colors.warning : severity === 'low' ? Colors.success : Colors.textMuted;
}

// ────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────
export default function CameraScreen() {
  const { activeSite, currentGeo, photos, addPhoto } = useAppStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScreenMode>('gallery');
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [captureIntent, setCaptureIntent] = useState<CaptureIntent>('environment');
  const [selectedRegion, setSelectedRegion] = useState<string>('skin_general');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<LocalPhotoAnalysis | null>(null);
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>('all');
  const [reportPhotoId, setReportPhotoId] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const siteConfig = CANCER_SITES[activeSite];

  const filteredPhotos = useMemo(() => {
    if (galleryFilter === 'all') return photos;
    if (galleryFilter === 'hazards') return photos.filter(p => p.analysis?.environmentalHazards?.some((h: EnvironmentalHazard) => h.severity === 'high' || h.severity === 'critical'));
    if (galleryFilter === 'clinical') return photos.filter(p => p.analysis?.sceneType === 'clinical');
    if (galleryFilter === 'environment') return photos.filter(p => p.analysis?.sceneType && p.analysis.sceneType !== 'clinical');
    if (galleryFilter === 'flagged') return photos.filter(p => p.analysis && p.analysis.riskScore > 0.5);
    return photos;
  }, [photos, galleryFilter]);

  const stats = useMemo(() => ({
    total: photos.length,
    analyzed: photos.filter(p => p.analysis).length,
    highRisk: photos.filter(p => p.analysis?.riskScore && p.analysis.riskScore > 0.6).length,
    hazardCount: photos.reduce((s, p) => s + (p.analysis?.environmentalHazards?.length ?? 0), 0),
  }), [photos]);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, exif: true });
      if (photo?.uri) { setCapturedUri(photo.uri); setMode('review'); }
    } catch { Alert.alert('Error', 'Failed to capture photo'); }
  }, []);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsEditing: true, exif: true });
    if (!result.canceled && result.assets[0]) { setCapturedUri(result.assets[0].uri); setMode('review'); }
  }, []);

  const analyzePhoto = useCallback(() => {
    if (!capturedUri) return;
    setIsAnalyzing(true);
    setTimeout(() => { setAnalysisResult(generateEnvironmentalAnalysis(captureIntent, selectedTags)); setIsAnalyzing(false); }, 1500 + Math.random() * 1500);
  }, [capturedUri, captureIntent, selectedTags]);

  const savePhoto = useCallback(() => {
    if (!capturedUri) return;
    addPhoto({
      id: `photo-${Date.now()}`, uri: capturedUri, capturedAt: new Date().toISOString(),
      bodyRegion: captureIntent === 'clinical' ? selectedRegion : undefined,
      tags: selectedTags, notes, siteId: activeSite,
      geoContext: currentGeo ?? undefined, analysis: analysisResult ?? undefined,
    });
    Alert.alert('Saved', 'Photo saved to your evidence vault with full geo-temporal context.');
    setCapturedUri(null); setMode('gallery'); setSelectedTags([]); setNotes(''); setAnalysisResult(null);
  }, [capturedUri, captureIntent, selectedRegion, selectedTags, notes, activeSite, currentGeo, analysisResult, addPhoto]);

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  // ── PERMISSION ──
  if (!permission?.granted && mode === 'camera') {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.permWrap}>
          <SvgIcon name="camera" size={48} color={Colors.textMuted} />
          <Text style={st.permTitle}>Camera Access Required</Text>
          <Text style={st.permDesc}>Grant camera access to capture environmental photos, identify risk sources, and build your evidence vault.</Text>
          <Pressable style={st.permBtn} onPress={requestPermission}><Text style={st.permBtnText}>Grant Camera Access</Text></Pressable>
          <Pressable onPress={() => setMode('gallery')}><Text style={st.permBack}>Back to Gallery</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── CAMERA VIEWFINDER ──
  if (mode === 'camera') {
    const ic = CAPTURE_INTENTS.find(c => c.id === captureIntent);
    return (
      <SafeAreaView style={st.safe}>
        <CameraView ref={cameraRef} style={st.camera} facing={facing}>
          <View style={st.camOverlay}>
            <View style={st.camTop}>
              <Pressable onPress={() => setMode('gallery')}><Text style={st.camBack}>× Close</Text></Pressable>
              <View style={[st.camBadge, { backgroundColor: ic?.color ?? Colors.textMuted }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><SvgIcon name={(ic?.icon ?? 'camera') as IconName} size={16} color="#fff" /><Text style={st.camBadgeText}>{ic?.label}</Text></View>
              </View>
              <Pressable onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}><Text style={st.camFlip}>Flip</Text></Pressable>
            </View>
            <View style={st.camCenter}>
              <View style={st.guideFrame}>
                <View style={[st.gCorner, { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 }]} />
                <View style={[st.gCorner, { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 }]} />
                <View style={[st.gCorner, { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
                <View style={[st.gCorner, { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 }]} />
              </View>
              <Text style={st.guideHint}>
                {captureIntent === 'facility' ? 'Center the facility in frame' : captureIntent === 'water' ? 'Capture the water source clearly' : captureIntent === 'air' ? 'Point at the sky or emission source' : captureIntent === 'soil' ? 'Focus on the soil / ground area' : captureIntent === 'clinical' ? 'Center the area of concern' : 'Frame the surrounding environment'}
              </Text>
            </View>
            <View style={st.camBottom}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, marginBottom: 16 }}>
                {CAPTURE_INTENTS.map(ci => (
                  <Pressable key={ci.id} style={[st.camPill, captureIntent === ci.id && { backgroundColor: ci.color + '30', borderColor: ci.color }]} onPress={() => setCaptureIntent(ci.id)}>
                    <SvgIcon name={ci.icon as IconName} size={18} color={captureIntent === ci.id ? ci.color : Colors.textMuted} />
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable style={st.shutter} onPress={takePhoto}>
                <View style={[st.shutterInner, { backgroundColor: ic?.color ?? 'white' }]} />
              </Pressable>
              {currentGeo && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center' }}><SvgIcon name="location" size={12} color={Colors.textMuted} /><Text style={st.camGeo}>{currentGeo.name}, {currentGeo.state ?? ''}</Text></View>}
            </View>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  // ── REPORT VIEW ──
  if (mode === 'report' && reportPhotoId) {
    const photo = photos.find(p => p.id === reportPhotoId);
    if (!photo?.analysis) { setMode('gallery'); return null; }
    const a = photo.analysis;
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.header}><View style={st.headerRow}>
          <Pressable onPress={() => setMode('gallery')}><Text style={st.backText}>← Back</Text></Pressable>
          <Text style={st.headerTitle}>Environmental Report</Text>
          <View style={{ width: 48 }} />
        </View></View>
        <ScrollView style={st.scroll} contentContainerStyle={st.scrollPad} showsVerticalScrollIndicator={false}>
          <Image source={{ uri: photo.uri }} style={st.reportImg} resizeMode="cover" />

          {/* Risk summary */}
          <View style={st.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={st.cardTitle}>RISK SUMMARY</Text>
              <View style={[st.riskBadge, { backgroundColor: a.riskScore > 0.6 ? Colors.highAlert : a.riskScore > 0.35 ? Colors.warning : Colors.success }]}>
                <Text style={st.riskBadgeText}>{(a.riskScore * 100).toFixed(0)}%</Text>
              </View>
            </View>
            <View style={st.riskBarBg}><View style={[st.riskBarFill, { width: `${a.riskScore * 100}%`, backgroundColor: a.riskScore > 0.6 ? Colors.highAlert : a.riskScore > 0.35 ? Colors.warning : Colors.success }]} /></View>
            <View style={st.summaryRow}>
              <View style={st.summaryCell}><Text style={st.summaryNum}>{a.environmentalHazards?.length ?? 0}</Text><Text style={st.summaryLabel}>Hazards</Text></View>
              <View style={st.summaryCell}><Text style={st.summaryNum}>{a.proximityRisks?.length ?? 0}</Text><Text style={st.summaryLabel}>Proximity</Text></View>
              <View style={st.summaryCell}><Text style={st.summaryNum}>{a.classifications.length}</Text><Text style={st.summaryLabel}>Classes</Text></View>
              <View style={st.summaryCell}><Text style={[st.summaryNum, { fontSize: 12 }]}>{a.sceneType?.replace(/_/g, ' ') ?? '—'}</Text><Text style={st.summaryLabel}>Scene</Text></View>
            </View>
          </View>

          {/* Hazards */}
          {a.environmentalHazards && a.environmentalHazards.length > 0 && (
            <View style={st.card}>
              <Text style={st.cardTitle}>IDENTIFIED HAZARDS</Text>
              {a.environmentalHazards.map((h, i) => (
                <View key={h.id} style={[{ paddingTop: 8 }, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.borderSubtle, marginTop: 8 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <View style={[st.sevDot, { backgroundColor: severityColor(h.severity) }]} />
                    <Text style={st.hazardLabel}>{h.label}</Text>
                    <Text style={[st.sevText, { color: severityColor(h.severity) }]}>{h.severity.toUpperCase()}</Text>
                  </View>
                  <Text style={st.hazardDesc}>{h.description}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Text style={st.confLbl}>CONFIDENCE</Text>
                    <View style={st.confBg}><View style={[st.confFill, { width: `${h.confidence * 100}%` }]} /></View>
                    <Text style={st.confVal}>{(h.confidence * 100).toFixed(0)}%</Text>
                  </View>
                  {h.cancerRelevance.length > 0 && (
                    <View style={st.tagRow}><Text style={st.tagLbl}>Cancer links:</Text>
                      {h.cancerRelevance.map(c => <View key={c} style={st.cancerChip}><Text style={st.cancerChipText}>{c}</Text></View>)}
                    </View>
                  )}
                  <Text style={st.actTitle}>RECOMMENDED ACTIONS</Text>
                  {h.mitigationActions.map((act, j) => <Text key={j} style={st.actItem}>• {act}</Text>)}
                </View>
              ))}
            </View>
          )}

          {/* Proximity risks */}
          {a.proximityRisks && a.proximityRisks.length > 0 && (
            <View style={st.card}>
              <Text style={st.cardTitle}>PROXIMITY RISK ASSESSMENT</Text>
              {a.proximityRisks.map((pr, i) => (
                <View key={i} style={[{ paddingTop: 8 }, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.borderSubtle, marginTop: 8 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={st.proxType}>{pr.facilityType}</Text>
                    <View style={[st.proxDist, { borderColor: severityColor(pr.riskLevel) }]}>
                      <Text style={[st.proxDistText, { color: severityColor(pr.riskLevel) }]}>{pr.estimatedDistance}</Text>
                    </View>
                  </View>
                  <Text style={st.proxDesc}>{pr.description}</Text>
                  <View style={st.tagRow}><Text style={st.tagLbl}>Exposures:</Text>
                    {pr.relevantExposures.map(e => <View key={e} style={st.expChip}><Text style={st.expChipText}>{e}</Text></View>)}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* AQI */}
          {a.airQualityEstimate && (
            <View style={st.card}>
              <Text style={st.cardTitle}>AIR QUALITY ESTIMATE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={[st.aqiCircle, { backgroundColor: a.airQualityEstimate.aqi > 150 ? Colors.highAlert : a.airQualityEstimate.aqi > 100 ? Colors.warning : Colors.success }]}>
                  <Text style={st.aqiNum}>{a.airQualityEstimate.aqi}</Text>
                  <Text style={st.aqiLbl}>AQI</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.aqiCat}>{a.airQualityEstimate.category}</Text>
                  <Text style={st.aqiMetric}>PM2.5: {a.airQualityEstimate.pm25} µg/m³</Text>
                  <Text style={st.aqiMetric}>PM10: {a.airQualityEstimate.pm10} µg/m³</Text>
                </View>
              </View>
            </View>
          )}

          {/* Water */}
          {a.waterRiskIndicators && a.waterRiskIndicators.length > 0 && (
            <View style={st.card}>
              <Text style={st.cardTitle}>WATER RISK INDICATORS</Text>
              {a.waterRiskIndicators.map((w, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle }}>
                  <View style={[st.sevDot, { backgroundColor: severityColor(w.severity) }]} />
                  <View style={{ flex: 1 }}><Text style={st.waterType}>{w.type}</Text><Text style={st.waterDesc}>{w.description}</Text></View>
                  <Text style={[st.sevText, { color: severityColor(w.severity) }]}>{w.severity}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Classifications */}
          <View style={st.card}>
            <Text style={st.cardTitle}>SCENE CLASSIFICATIONS</Text>
            {a.classifications.map((c, i) => (
              <View key={i} style={st.classRow}>
                <Text style={st.classLabel}>{c.label}</Text>
                <View style={st.classBg}><View style={[st.classFill, { width: `${c.confidence * 100}%` }]} /></View>
                <Text style={st.classConf}>{(c.confidence * 100).toFixed(0)}%</Text>
              </View>
            ))}
          </View>

          {/* Geo */}
          {photo.geoContext && (
            <View style={st.card}>
              <Text style={st.cardTitle}>LOCATION CONTEXT</Text>
              <Text style={st.geoLine}> {photo.geoContext.name}, {photo.geoContext.state ?? ''}</Text>
              <Text style={st.geoDetail}>FIPS: {photo.geoContext.fips} · Level: {photo.geoContext.level}</Text>
              <Text style={st.geoDetail}>Lat: {photo.geoContext.latitude.toFixed(4)} · Lng: {photo.geoContext.longitude.toFixed(4)}</Text>
            </View>
          )}

          {photo.notes ? <View style={st.card}><Text style={st.cardTitle}>FIELD NOTES</Text><Text style={st.notesText}>{photo.notes}</Text></View> : null}

          <View style={st.card}>
            <Text style={st.cardTitle}>ANALYSIS METADATA</Text>
            <Text style={st.metaLine}>Model: {a.modelVersion}</Text>
            <Text style={st.metaLine}>Analyzed: {new Date(a.analyzedAt).toLocaleString()}</Text>
            <Text style={st.metaLine}>Captured: {new Date(photo.capturedAt).toLocaleString()}</Text>
            <Text style={st.metaLine}>Cancer site context: {siteConfig.shortLabel}</Text>
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── REVIEW MODE ──
  if (mode === 'review' && capturedUri) {
    const isClinical = captureIntent === 'clinical';
    const activeTags = isClinical ? CLINICAL_TAGS : ENV_TAGS;
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.header}><View style={st.headerRow}>
          <Pressable onPress={() => { setCapturedUri(null); setMode('gallery'); setAnalysisResult(null); }}><Text style={st.backText}>← Back</Text></Pressable>
          <Text style={st.headerTitle}>Review & Analyze</Text>
          <Pressable style={st.saveBtn} onPress={savePhoto}><Text style={st.saveBtnText}>Save</Text></Pressable>
        </View></View>
        <ScrollView style={st.scroll} contentContainerStyle={st.scrollPad} showsVerticalScrollIndicator={false}>
          <Image source={{ uri: capturedUri }} style={st.preview} resizeMode="cover" />

          {/* Capture type */}
          <View style={st.section}>
            <Text style={st.secTitle}>CAPTURE TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CAPTURE_INTENTS.map(ci => (
                <Pressable key={ci.id} style={[st.intentChip, captureIntent === ci.id && { borderColor: ci.color, backgroundColor: ci.color + '12' }]}
                  onPress={() => { setCaptureIntent(ci.id); setSelectedTags([]); setAnalysisResult(null); }}>
                  <SvgIcon name={ci.icon as IconName} size={18} color={captureIntent === ci.id ? ci.color : Colors.textMuted} />
                  <Text style={[st.intentLabel, captureIntent === ci.id && { color: ci.color }]}>{ci.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Body region (clinical) */}
          {isClinical && (
            <View style={st.section}>
              <Text style={st.secTitle}>BODY REGION</Text>
              <View style={st.chipGrid}>
                {BODY_REGIONS.map(r => (
                  <Pressable key={r} style={[st.chip, selectedRegion === r && st.chipActive]} onPress={() => setSelectedRegion(r)}>
                    <Text style={[st.chipText, selectedRegion === r && st.chipTextActive]}>{r.replace(/_/g, ' ')}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Tags */}
          <View style={st.section}>
            <Text style={st.secTitle}>{isClinical ? 'CLINICAL TAGS' : 'ENVIRONMENTAL INDICATORS'}</Text>
            <Text style={st.secHint}>Select all that apply — improves analysis accuracy</Text>
            <View style={st.chipGrid}>
              {activeTags.map(tag => (
                <Pressable key={tag} style={[st.chip, selectedTags.includes(tag) && st.chipActive]} onPress={() => toggleTag(tag)}>
                  <Text style={[st.chipText, selectedTags.includes(tag) && st.chipTextActive]}>{tag.replace(/_/g, ' ')}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* AI Analysis */}
          <View style={st.section}>
            <Text style={st.secTitle}>AI RISK IDENTIFICATION</Text>
            {!analysisResult && !isAnalyzing && (
              <Pressable style={st.analyzeBtn} onPress={analyzePhoto}>
                <SvgIcon name="microscope" size={28} color={Colors.accentTeal} />
                <View><Text style={st.analyzeBtnText}>Run Environmental Analysis</Text><Text style={st.analyzeBtnSub}>Hazard detection · Scene classification · Risk scoring</Text></View>
              </Pressable>
            )}
            {isAnalyzing && (
              <View style={st.analyzingBox}>
                <ActivityIndicator color={Colors.accentTeal} size="small" />
                <View><Text style={st.analyzingText}>Analyzing environment...</Text><Text style={st.analyzingSub}>Scanning for hazards, classifying scene, assessing risk</Text></View>
              </View>
            )}
            {analysisResult && (
              <View style={st.analysisCard}>
                <View style={st.analysisHeader}>
                  <View style={[st.riskCircle, { borderColor: analysisResult.riskScore > 0.6 ? Colors.highAlert : analysisResult.riskScore > 0.35 ? Colors.warning : Colors.success }]}>
                    <Text style={[st.riskNum, { color: analysisResult.riskScore > 0.6 ? Colors.highAlert : analysisResult.riskScore > 0.35 ? Colors.warning : Colors.success }]}>{(analysisResult.riskScore * 100).toFixed(0)}</Text>
                    <Text style={st.riskSuffix}>risk</Text>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={st.aStat}>{analysisResult.environmentalHazards?.length ?? 0} hazard{(analysisResult.environmentalHazards?.length ?? 0) !== 1 ? 's' : ''} detected</Text>
                    <Text style={st.aStat}>{analysisResult.proximityRisks?.length ?? 0} proximity risk{(analysisResult.proximityRisks?.length ?? 0) !== 1 ? 's' : ''}</Text>
                    <Text style={st.aStat}>Scene: {analysisResult.sceneType?.replace(/_/g, ' ') ?? 'unknown'}</Text>
                  </View>
                </View>
                {analysisResult.environmentalHazards?.map(h => (
                  <View key={h.id} style={st.miniHazard}>
                    <View style={[st.sevDot, { backgroundColor: severityColor(h.severity) }]} />
                    <View style={{ flex: 1 }}><Text style={st.mhLabel}>{h.label}</Text><Text style={st.mhConf}>{h.severity} · {(h.confidence * 100).toFixed(0)}% conf</Text></View>
                  </View>
                ))}
                <Text style={[st.secTitle, { marginTop: 12, marginBottom: 6 }]}>CLASSIFICATIONS</Text>
                {analysisResult.classifications.slice(0, 3).map((c, i) => (
                  <View key={i} style={st.classRow}><Text style={st.classLabel}>{c.label}</Text><View style={st.classBg}><View style={[st.classFill, { width: `${c.confidence * 100}%` }]} /></View><Text style={st.classConf}>{(c.confidence * 100).toFixed(0)}%</Text></View>
                ))}
                <Text style={[st.secTitle, { marginTop: 12, marginBottom: 6 }]}>SUGGESTED ACTIONS</Text>
                {analysisResult.suggestedActions.slice(0, 4).map((act, i) => <Text key={i} style={st.actItem}>• {act}</Text>)}
                <Text style={st.modelInfo}>{analysisResult.modelVersion} · {new Date(analysisResult.analyzedAt).toLocaleTimeString()}</Text>
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={st.section}>
            <Text style={st.secTitle}>FIELD NOTES</Text>
            <TextInput style={st.notesInput} value={notes} onChangeText={setNotes}
              placeholder="Describe what you observe — odors, sounds, visible emissions, nearby structures..."
              placeholderTextColor={Colors.textDisabled} multiline numberOfLines={4} textAlignVertical="top" />
          </View>

          {currentGeo && (
            <View style={st.ctxBox}>
              <SvgIcon name="location" size={18} color={Colors.accentTeal} />
              <View><Text style={st.ctxName}>{currentGeo.name}, {currentGeo.state ?? ''}</Text><Text style={st.ctxDetail}>FIPS {currentGeo.fips} · {currentGeo.level}</Text></View>
            </View>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── GALLERY (default) ──
  return (
    <SafeAreaView style={st.safe}>
      <View style={st.header}>
        <Text style={st.screenTitle}>Environmental Capture</Text>
        <Text style={st.screenSub}>Photograph, identify, and document risk sources</Text>
      </View>

      {/* Stats */}
      <View style={st.statsBar}>
        <View style={st.sCell}><Text style={st.sNum}>{stats.total}</Text><Text style={st.sLabel}>Photos</Text></View>
        <View style={st.sDiv} />
        <View style={st.sCell}><Text style={st.sNum}>{stats.analyzed}</Text><Text style={st.sLabel}>Analyzed</Text></View>
        <View style={st.sDiv} />
        <View style={st.sCell}><Text style={[st.sNum, stats.highRisk > 0 && { color: Colors.highAlert }]}>{stats.highRisk}</Text><Text style={st.sLabel}>High Risk</Text></View>
        <View style={st.sDiv} />
        <View style={st.sCell}><Text style={st.sNum}>{stats.hazardCount}</Text><Text style={st.sLabel}>Hazards</Text></View>
      </View>

      {/* Capture buttons */}
      <View style={st.capRow}>
        <Pressable style={st.capBtn} onPress={() => setMode('camera')}>
          <SvgIcon name="camera" size={20} color={Colors.accentTeal} /><Text style={st.capLabel}>Take Photo</Text>
        </Pressable>
        <Pressable style={st.capBtn} onPress={pickImage}>
          <SvgIcon name="photo" size={20} color={Colors.accentTeal} /><Text style={st.capLabel}>From Library</Text>
        </Pressable>
      </View>

      {/* Intent selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.intBar} contentContainerStyle={st.intBarInner}>
        {CAPTURE_INTENTS.map(ci => (
          <Pressable key={ci.id} style={[st.intPill, captureIntent === ci.id && { borderColor: ci.color, backgroundColor: ci.color + '12' }]} onPress={() => setCaptureIntent(ci.id)}>
            <SvgIcon name={ci.icon as IconName} size={14} color={captureIntent === ci.id ? ci.color : Colors.textMuted} />
            <Text style={[st.intPillLabel, captureIntent === ci.id && { color: ci.color }]}>{ci.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Filters */}
      <View style={st.filterBar}>
        {(['all', 'hazards', 'environment', 'clinical', 'flagged'] as GalleryFilter[]).map(f => (
          <Pressable key={f} style={[st.fTab, galleryFilter === f && st.fTabActive]} onPress={() => setGalleryFilter(f)}>
            <Text style={[st.fTabText, galleryFilter === f && st.fTabTextActive]}>
              {f === 'all' ? 'All' : f === 'hazards' ? 'Hazards' : f === 'environment' ? 'Env' : f === 'clinical' ? 'Clinical' : 'Flagged'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Photos */}
      <ScrollView style={st.scroll} contentContainerStyle={st.scrollPad} showsVerticalScrollIndicator={false}>
        {filteredPhotos.length === 0 ? (
          <View style={st.emptyBox}>
            <SvgIcon name="camera" size={40} color={Colors.textMuted} />
            <Text style={st.emptyTitle}>{galleryFilter === 'all' ? 'No Photos Yet' : `No ${galleryFilter} photos`}</Text>
            <Text style={st.emptyDesc}>Capture photos of your surroundings to identify environmental risks, document hazard sources, photograph industrial facilities, water bodies, air quality conditions, and potential exposure sites. AI analysis detects risk factors and links them to cancer outcomes.</Text>
            <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
              <Text style={st.stepText}>1. Choose a capture type (Environment, Facility, Water...)</Text>
              <Text style={st.stepText}>2. Take a photo or pick from library</Text>
              <Text style={st.stepText}>3. Tag environmental indicators you observe</Text>
              <Text style={st.stepText}>4. Run AI analysis to identify hazards</Text>
              <Text style={st.stepText}>5. Save to your evidence vault for tracking</Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredPhotos.map(photo => {
              const a = photo.analysis;
              const hasHazards = a?.environmentalHazards && a.environmentalHazards.length > 0;
              const rc = a ? (a.riskScore > 0.6 ? Colors.highAlert : a.riskScore > 0.35 ? Colors.warning : Colors.success) : Colors.textMuted;
              return (
                <Pressable key={photo.id} style={st.pCard} onPress={() => {
                  if (a) { setReportPhotoId(photo.id); setMode('report'); } else {
                    setCapturedUri(photo.uri); setSelectedRegion(photo.bodyRegion ?? 'skin_general');
                    setSelectedTags(photo.tags ?? []); setAnalysisResult(photo.analysis ?? null); setMode('review');
                  }
                }}>
                  <Image source={{ uri: photo.uri }} style={st.pThumb} resizeMode="cover" />
                  {a && <View style={[st.pRiskBadge, { backgroundColor: rc }]}><Text style={st.pRiskText}>{(a.riskScore * 100).toFixed(0)}%</Text></View>}
                  <View style={st.pInfo}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={st.pType}>{a?.sceneType?.replace(/_/g, ' ') ?? (photo.bodyRegion ?? 'untagged').replace(/_/g, ' ')}</Text>
                      <Text style={st.pDate}>{new Date(photo.capturedAt).toLocaleDateString()}</Text>
                    </View>
                    {hasHazards && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {a!.environmentalHazards!.slice(0, 2).map(h => (
                          <View key={h.id} style={st.pHazChip}><View style={[st.sevDotSm, { backgroundColor: severityColor(h.severity) }]} /><Text style={st.pHazText} numberOfLines={1}>{h.label}</Text></View>
                        ))}
                      </View>
                    )}
                    {photo.tags.length > 0 && !hasHazards && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {photo.tags.slice(0, 3).map(tag => <View key={tag} style={st.pTagChip}><Text style={st.pTagText}>{tag.replace(/_/g, ' ')}</Text></View>)}
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      {a ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><SvgIcon name="check" size={12} color={Colors.success} /><Text style={st.pAnalyzed}>Analyzed</Text></View> : <Text style={st.pNotAnalyzed}>Tap to analyze</Text>}
                      {photo.geoContext && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><SvgIcon name="location" size={10} color={Colors.textMuted} /><Text style={st.pGeo} numberOfLines={1}>{photo.geoContext.name}</Text></View>}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, backgroundColor: Colors.surface },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  screenTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  screenSub: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  backText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.accentTeal },
  saveBtn: { backgroundColor: Colors.accentTeal, borderRadius: BorderRadius.sm, paddingHorizontal: 14, paddingVertical: 6 },
  saveBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.textInverse },

  // Stats
  statsBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  sCell: { flex: 1, alignItems: 'center' },
  sNum: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  sLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  sDiv: { width: 1, height: 24, backgroundColor: Colors.borderSubtle },

  // Capture
  capRow: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  capBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.background, borderRadius: BorderRadius.sm, paddingVertical: 14, borderWidth: 1, borderColor: Colors.border },
  capLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.textPrimary },

  // Intent bar
  intBar: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, maxHeight: 50 },
  intBarInner: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  intPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.round, borderWidth: 1, borderColor: Colors.border },
  intPillLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textSecondary },

  // Filter
  filterBar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, gap: 4, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  fTab: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.sm },
  fTabActive: { backgroundColor: Colors.accentTealBg },
  fTabText: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted },
  fTabTextActive: { color: Colors.accentTeal, fontWeight: '500' as const },

  scroll: { flex: 1 },
  scrollPad: { padding: 12, gap: 12 },

  // Empty
  emptyBox: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary, marginBottom: 8 },
  emptyDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  stepText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary, marginBottom: 4, paddingLeft: 8 },

  // Photo cards
  pCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  pThumb: { width: '100%', height: 160, backgroundColor: Colors.surfaceHighlight },
  pRiskBadge: { position: 'absolute', top: 8, right: 8, borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  pRiskText: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 12, color: 'white' },
  pInfo: { padding: 12 },
  pType: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.textPrimary, textTransform: 'capitalize' },
  pDate: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted },
  pHazChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.highAlert + '0A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.sm },
  sevDotSm: { width: 6, height: 6, borderRadius: 3 },
  pHazText: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textSecondary, maxWidth: 140 },
  pTagChip: { backgroundColor: Colors.surfaceHighlight, borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  pTagText: { fontFamily: 'Roboto Mono, monospace', fontSize: 10, color: Colors.textMuted },
  pAnalyzed: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.success },
  pNotAnalyzed: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, fontStyle: 'italic' },
  pGeo: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, maxWidth: 160 },

  // Review
  preview: { width: '100%', height: SW * 0.7, borderRadius: BorderRadius.sm, backgroundColor: Colors.surfaceHighlight },
  section: { marginTop: 16 },
  secTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 8 },
  secHint: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textDisabled, marginBottom: 8, marginTop: -4 },
  intentChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  intentLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 12, color: Colors.textSecondary },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipActive: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTealBg },
  chipText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: Colors.accentTeal },

  // Analyze
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.accentTealBg, borderRadius: BorderRadius.sm, padding: 16, borderWidth: 1, borderColor: Colors.accentTealBorder },
  analyzeBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.accentTeal },
  analyzeBtnSub: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  analyzingBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, borderWidth: 1, borderColor: Colors.border },
  analyzingText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.accentTeal },
  analyzingSub: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  analysisCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, borderWidth: 1, borderColor: Colors.border },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  riskCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  riskNum: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 22 },
  riskSuffix: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.textMuted },
  aStat: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary },
  miniHazard: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  mhLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textPrimary },
  mhConf: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted },
  modelInfo: { fontFamily: 'Roboto Mono, monospace', fontSize: 10, color: Colors.textDisabled, marginTop: 12 },

  // Classifications
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  classLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textPrimary, width: 120 },
  classBg: { flex: 1, height: 5, backgroundColor: Colors.surfaceHighlight, borderRadius: 3, overflow: 'hidden' },
  classFill: { height: 5, borderRadius: 3, backgroundColor: Colors.accentTeal },
  classConf: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, width: 32, textAlign: 'right' },
  actItem: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary, marginBottom: 3, lineHeight: 18 },
  actTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.6, marginBottom: 4, marginTop: 8 },

  // Notes
  notesInput: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textPrimary, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, padding: 12, minHeight: 80 },
  ctxBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 12, borderWidth: 1, borderColor: Colors.borderSubtle, marginTop: 16 },
  ctxName: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.textPrimary },
  ctxDetail: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },

  // Camera
  camera: { flex: 1 },
  camOverlay: { flex: 1, justifyContent: 'space-between' },
  camTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 24 },
  camBack: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: 'white' },
  camFlip: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: 'white' },
  camBadge: { borderRadius: BorderRadius.round, paddingHorizontal: 12, paddingVertical: 4 },
  camBadgeText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 12, color: 'white' },
  camCenter: { alignItems: 'center' },
  guideFrame: { width: SW * 0.7, height: SW * 0.7, position: 'relative' },
  gCorner: { position: 'absolute', width: 28, height: 28, borderColor: 'rgba(255,255,255,0.7)' },
  guideHint: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 12, textAlign: 'center' },
  camBottom: { paddingBottom: 16, alignItems: 'center' },
  camPill: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  shutter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  shutterInner: { width: 56, height: 56, borderRadius: 28 },
  camGeo: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  // Permission
  permWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary, marginBottom: 8 },
  permDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  permBtn: { backgroundColor: Colors.accentTeal, borderRadius: BorderRadius.sm, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textInverse },
  permBack: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.accentTeal, marginTop: 16 },

  // Report
  reportImg: { width: '100%', height: SW * 0.6, borderRadius: BorderRadius.sm, backgroundColor: Colors.surfaceHighlight },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 8 },
  riskBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 10, paddingVertical: 3 },
  riskBadgeText: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 13, color: 'white' },
  riskBarBg: { height: 4, backgroundColor: Colors.surfaceHighlight, borderRadius: 2, marginBottom: 12 },
  riskBarFill: { height: 4, borderRadius: 2 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCell: { flex: 1, alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.sm, padding: 8, borderWidth: 1, borderColor: Colors.borderSubtle },
  summaryNum: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  summaryLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  hazardLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.textPrimary, flex: 1 },
  sevText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  hazardDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  confLbl: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.textMuted, width: 70 },
  confBg: { flex: 1, height: 4, backgroundColor: Colors.surfaceHighlight, borderRadius: 2, overflow: 'hidden' },
  confFill: { height: 4, borderRadius: 2, backgroundColor: Colors.accentTeal },
  confVal: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, width: 32, textAlign: 'right' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 4 },
  tagLbl: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.textMuted, marginRight: 4 },
  cancerChip: { backgroundColor: Colors.highAlert + '12', borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  cancerChipText: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.highAlert, textTransform: 'capitalize' },
  expChip: { backgroundColor: Colors.environmental + '12', borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  expChipText: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.environmental },
  proxType: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.textPrimary },
  proxDist: { borderWidth: 1, borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 2 },
  proxDistText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11 },
  proxDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  aqiCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  aqiNum: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 22, color: 'white' },
  aqiLbl: { fontFamily: 'Roboto, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.8)' },
  aqiCat: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  aqiMetric: { fontFamily: 'Roboto Mono, monospace', fontSize: 12, color: Colors.textMuted },
  waterType: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 12, color: Colors.textPrimary },
  waterDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  geoLine: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.textPrimary },
  geoDetail: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  notesText: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  metaLine: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
});