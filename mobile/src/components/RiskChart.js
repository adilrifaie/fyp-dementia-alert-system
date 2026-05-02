import { useRef, useState } from 'react';
import { View, PanResponder } from 'react-native';
import Svg, { Line, Polyline, Text, Circle, Rect, G } from 'react-native-svg';

const CHART_HEIGHT = 180;
const THRESHOLD = 0.13;

export default function RiskChart({ days, width, isDark, onDaySelect }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const chartWidth = width - 32;
  const chartHeight = CHART_HEIGHT;
  const paddingLeft = 40;
  const paddingRight = 32;
  const paddingTop = 12;
  const paddingBottom = 32;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const totalPoints = days.length;

  const getX = (index) => paddingLeft + (index / (totalPoints - 1)) * plotWidth;
  const getY = (score) => paddingTop + plotHeight - score * plotHeight;
  const thresholdY = getY(THRESHOLD);

  const getIndexFromX = (x) => {
    const relX = x - paddingLeft;
    const ratio = relX / plotWidth;
    const index = Math.round(ratio * (totalPoints - 1));
    return Math.max(0, Math.min(totalPoints - 1, index));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const index = getIndexFromX(evt.nativeEvent.locationX);
        setActiveIndex(index);
      },
      onPanResponderMove: (evt) => {
        const index = getIndexFromX(evt.nativeEvent.locationX);
        setActiveIndex(index);
      },
      onPanResponderRelease: (evt) => {
        const index = getIndexFromX(evt.nativeEvent.locationX);
        const day = days[index];
        if (day && onDaySelect) {
          onDaySelect(day);
        }
        setTimeout(() => setActiveIndex(null), 300);
      },
    })
  ).current;

  const points = days
    .map((d, i) => `${getX(i)},${getY(d.risk_score)}`)
    .join(' ');

  const labelIndices = [
    0,
    Math.floor(totalPoints * 0.25),
    Math.floor(totalPoints * 0.5),
    Math.floor(totalPoints * 0.75),
    totalPoints - 1,
  ];

  const textColor = isDark ? '#A0AEC0' : '#718096';
  const gridColor = isDark ? '#2D3148' : '#E2E8F0';
  const tooltipBg = isDark ? '#1E2235' : '#1A202C';

  // Active point data
  const activeDay = activeIndex !== null ? days[activeIndex] : null;
  const activeX = activeIndex !== null ? getX(activeIndex) : null;
  const activeY = activeIndex !== null ? getY(activeDay.risk_score) : null;

  // Tooltip flips to left side if active point is in right half
  const tooltipOnRight = activeIndex !== null && activeX < chartWidth / 2;
  const tooltipX = tooltipOnRight ? activeX + 10 : activeX - 145;
  const tooltipY = Math.max(paddingTop, activeY - 70);
  const tooltipWidth = 135;
  const tooltipHeight = activeDay?.agitation || activeDay?.alert ? 72 : 52;

  return (
    <View {...panResponder.panHandlers}>
      <Svg width={chartWidth} height={chartHeight}>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((val) => (
          <Line
            key={val}
            x1={paddingLeft} y1={getY(val)}
            x2={paddingLeft + plotWidth} y2={getY(val)}
            stroke={gridColor} strokeWidth="1"
          />
        ))}

        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map((val) => (
          <Text
            key={val}
            x={paddingLeft - 6} y={getY(val / 100) + 4}
            fontSize="9" fill={textColor} textAnchor="end"
          >
            {val}%
          </Text>
        ))}

        {/* Agitation markers */}
        {days.map((d, i) =>
          d.agitation === 1 ? (
            <Line
              key={`ag-${i}`}
              x1={getX(i)} y1={paddingTop}
              x2={getX(i)} y2={paddingTop + plotHeight}
              stroke="#EF4444" strokeWidth="1" opacity="0.5"
            />
          ) : null
        )}

        {/* Threshold line */}
        <Line
          x1={paddingLeft} y1={thresholdY}
          x2={paddingLeft + plotWidth} y2={thresholdY}
          stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4,3"
        />
        <Text
          x={paddingLeft + plotWidth - 2} y={thresholdY - 4}
          fontSize="8" fill="#F59E0B" textAnchor="end"
        >
          13% threshold
        </Text>

        {/* Risk score line */}
        <Polyline
          points={points}
          fill="none" stroke="#3B82F6"
          strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
        />

        {/* X-axis labels */}
        {labelIndices.map((i) => {
          if (i >= totalPoints) return null;
          return (
            <Text
              key={`label-${i}`}
              x={getX(i)} y={chartHeight - 6}
              fontSize="9" fill={textColor} textAnchor="middle"
            >
              {days[i].date_only.slice(5)}
            </Text>
          );
        })}

        {/* Active point overlay */}
        {activeDay && (
          <G>
            {/* Vertical indicator */}
            <Line
              x1={activeX} y1={paddingTop}
              x2={activeX} y2={paddingTop + plotHeight}
              stroke="#FFFFFF" strokeWidth="1" opacity="0.3"
            />

            {/* Dot on line */}
            <Circle
              cx={activeX} cy={activeY}
              r="5" fill="#3B82F6"
              stroke="#FFFFFF" strokeWidth="2"
            />

            {/* Tooltip background */}
            <Rect
              x={tooltipX} y={tooltipY}
              width={tooltipWidth} height={tooltipHeight}
              rx="6" fill={tooltipBg} opacity="0.95"
            />

            {/* Tooltip date */}
            <Text
              x={tooltipX + 8} y={tooltipY + 14}
              fontSize="10" fill="#FFFFFF" fontWeight="700"
            >
              {activeDay.date_only}
            </Text>

            {/* Risk score */}
            <Text
              x={tooltipX + 8} y={tooltipY + 28}
              fontSize="10"
              fill={
                activeDay.risk_score > 0.5 ? '#EF4444' :
                activeDay.risk_score > 0.13 ? '#F59E0B' : '#10B981'
              }
            >
              Risk: {Math.round(activeDay.risk_score * 100)}%
            </Text>

            {/* Alert flag */}
            {activeDay.alert === 1 && (
              <Text
                x={tooltipX + 8} y={tooltipY + 44}
                fontSize="10" fill="#F59E0B"
              >
                ⚠ Alert flagged
              </Text>
            )}

            {/* Agitation flag */}
            {activeDay.agitation === 1 && (
              <Text
                x={tooltipX + 8}
                y={activeDay.alert === 1 ? tooltipY + 58 : tooltipY + 44}
                fontSize="10" fill="#EF4444"
              >
                × Actual agitation
              </Text>
            )}
          </G>
        )}

      </Svg>
    </View>
  );
}