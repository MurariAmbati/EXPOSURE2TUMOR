// ============================================================
// Exposure2Tumor — Trend Line Chart
// Multi-year trend with regression line, confidence bands, anomalies
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Line, Circle, Rect, G, Text as SvgText } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../../theme';
import type { TrendDataPoint, RegressionResult, AnomalyDetection, ForecastPoint } from '../../types';

interface Props {
  dataPoints: TrendDataPoint[];
  regression?: RegressionResult;
  anomalies?: AnomalyDetection[];
  forecast?: ForecastPoint[];
  width?: number;
  height?: number;
  title?: string;
  showConfidence?: boolean;
  color?: string;
}

export function TrendChart({
  dataPoints,
  regression,
  anomalies = [],
  forecast = [],
  width = 340,
  height = 200,
  title,
  showConfidence = true,
  color = Colors.accentTeal,
}: Props) {
  if (dataPoints.length < 2) return null;

  const pad = { top: 20, right: 16, bottom: 30, left: 42 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const allYears = [
    ...dataPoints.map(d => d.year),
    ...forecast.map(f => f.year),
  ];
  const allValues = [
    ...dataPoints.map(d => d.value),
    ...forecast.map(f => f.ci_upper),
    ...forecast.map(f => f.ci_lower),
  ];

  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);
  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.1;
  const yearRange = maxYear - minYear || 1;
  const valRange = maxVal - minVal || 1;

  const x = (year: number) => pad.left + ((year - minYear) / yearRange) * chartW;
  const y = (val: number) => pad.top + chartH - ((val - minVal) / valRange) * chartH;

  const dataLine = dataPoints
    .map(d => `${x(d.year)},${y(d.value)}`)
    .join(' ');

  // Regression line
  const regLine = regression
    ? `${x(dataPoints[0].year)},${y(regression.slope * dataPoints[0].year + regression.intercept)} ${x(dataPoints[dataPoints.length - 1].year)},${y(regression.slope * dataPoints[dataPoints.length - 1].year + regression.intercept)}`
    : null;

  // Forecast line
  const forecastLine = forecast.length > 0
    ? [
        `${x(dataPoints[dataPoints.length - 1].year)},${y(dataPoints[dataPoints.length - 1].value)}`,
        ...forecast.map(f => `${x(f.year)},${y(f.predicted)}`),
      ].join(' ')
    : null;

  // Y-axis labels (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => minVal + (valRange * i) / 4);

  // X-axis year labels
  const yearStep = Math.max(1, Math.ceil(yearRange / 6));
  const xTicks: number[] = [];
  for (let yr = minYear; yr <= maxYear; yr += yearStep) xTicks.push(yr);

  const trendColor = regression
    ? regression.direction === 'worsening' ? Colors.highAlert
      : regression.direction === 'improving' ? Colors.success
      : Colors.textMuted
    : color;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <Line
            key={`grid-${i}`}
            x1={pad.left}
            y1={y(tick)}
            x2={width - pad.right}
            y2={y(tick)}
            stroke={Colors.chartGrid}
            strokeWidth={0.5}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <SvgText
            key={`ylabel-${i}`}
            x={pad.left - 4}
            y={y(tick) + 3}
            textAnchor="end"
            fill={Colors.chartAxis}
            fontSize={9}
          >
            {tick.toFixed(tick >= 100 ? 0 : 1)}
          </SvgText>
        ))}

        {/* X-axis labels */}
        {xTicks.map((yr, i) => (
          <SvgText
            key={`xlabel-${i}`}
            x={x(yr)}
            y={height - 6}
            textAnchor="middle"
            fill={Colors.chartAxis}
            fontSize={9}
          >
            {yr}
          </SvgText>
        ))}

        {/* Confidence band for forecast */}
        {showConfidence && forecast.length > 0 && forecast.map((f, i) => (
          <Rect
            key={`fc-band-${i}`}
            x={x(f.year) - 3}
            y={y(f.ci_upper)}
            width={6}
            height={y(f.ci_lower) - y(f.ci_upper)}
            fill={color}
            opacity={0.1}
            rx={2}
          />
        ))}

        {/* Regression line */}
        {regLine && (
          <Polyline
            points={regLine}
            fill="none"
            stroke={trendColor}
            strokeWidth={1.5}
            strokeDasharray="6,3"
            opacity={0.7}
          />
        )}

        {/* Data line */}
        <Polyline
          points={dataLine}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Forecast line */}
        {forecastLine && (
          <Polyline
            points={forecastLine}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray="4,4"
            opacity={0.6}
          />
        )}

        {/* Data points */}
        {dataPoints.map((d, i) => (
          <Circle
            key={`pt-${i}`}
            cx={x(d.year)}
            cy={y(d.value)}
            r={3}
            fill={anomalies.some(a => a.year === d.year) ? Colors.highAlert : color}
            stroke={Colors.surface}
            strokeWidth={1}
          />
        ))}

        {/* Anomaly markers */}
        {anomalies.map((a, i) => (
          <G key={`anomaly-${i}`}>
            <Circle
              cx={x(a.year)}
              cy={y(a.value)}
              r={6}
              fill="none"
              stroke={Colors.highAlert}
              strokeWidth={1.5}
              strokeDasharray="2,2"
            />
            <SvgText
              x={x(a.year)}
              y={y(a.value) - 10}
              textAnchor="middle"
              fill={Colors.highAlert}
              fontSize={8}
              fontWeight="bold"
            >
              !
            </SvgText>
          </G>
        ))}

        {/* Forecast dots */}
        {forecast.map((f, i) => (
          <Circle
            key={`forecast-${i}`}
            cx={x(f.year)}
            cy={y(f.predicted)}
            r={2.5}
            fill={color}
            opacity={0.5}
          />
        ))}
      </Svg>

      {regression && (
        <View style={styles.statsRow}>
          <Text style={[styles.stat, { color: trendColor }]}>
            {regression.direction === 'worsening' ? '↑' : regression.direction === 'improving' ? '↓' : '→'}{' '}
            {Math.abs(regression.annualChangePercent).toFixed(1)}%/yr
          </Text>
          <Text style={styles.stat}>R² = {regression.rSquared.toFixed(2)}</Text>
          <Text style={styles.stat}>
            {regression.significanceLevel === 'not_significant' ? 'NS' : regression.significanceLevel.replace('p', 'p<0.')}
          </Text>
          {anomalies.length > 0 && (
            <Text style={[styles.stat, { color: Colors.highAlert }]}>
              {anomalies.length} anomal{anomalies.length === 1 ? 'y' : 'ies'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: Spacing.sm },
  title: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.xs },
  stat: { ...Typography.monoSmall, color: Colors.textMuted },
});
