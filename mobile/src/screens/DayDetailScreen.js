import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getRiskLevel, getRiskLabel, riskColors } from '../theme/colors';

export default function DayDetailScreen({ route, navigation }) {
  const { day, patientId } = route.params;
  const { theme, isDark } = useTheme();

  const riskLevel = getRiskLevel(day.risk_score);
  const rc = riskColors[riskLevel];

  const features = [
    { label: 'Hallway Movement', value: day.dev_Hallway, icon: '🚶' },
    { label: 'Total Movement', value: day.dev_total_movements, icon: '📊' },
    { label: 'Nocturnal Movement', value: day.dev_nocturnal_movements, icon: '🌙' },
    { label: 'First Movement Hour', value: day.dev_first_movement_hour, icon: '⏰' },
  ];

  const getDeviationLabel = (val) => {
    if (val === null || val === undefined) return { text: 'No data', color: theme.subtext };
    if (val > 1.5) return { text: 'Much higher than usual', color: riskColors.alert.primary };
    if (val > 0.5) return { text: 'Slightly elevated', color: riskColors.watch.primary };
    if (val < -1.5) return { text: 'Much lower than usual', color: riskColors.alert.primary };
    if (val < -0.5) return { text: 'Slightly reduced', color: riskColors.watch.primary };
    return { text: 'Within normal range', color: riskColors.safe.primary };
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ padding: 16 }}>

        {/* Risk Score Card */}
        <View style={{
          backgroundColor: isDark ? rc.darkBackground : rc.background,
          borderRadius: 20,
          padding: 20,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: rc.primary + '40',
        }}>
          <Text style={{
            fontSize: 12, fontWeight: '600', letterSpacing: 1,
            color: isDark ? rc.darkText : rc.text, marginBottom: 4,
          }}>
            {day.date_only}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 }}>
            <Text style={{ fontSize: 56, fontWeight: '800', color: rc.primary, lineHeight: 60 }}>
              {Math.round(day.risk_score * 100)}
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '600', color: rc.primary, marginBottom: 8, marginLeft: 4 }}>
              %
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? rc.darkText : rc.text, marginBottom: 10, marginLeft: 12 }}>
              {getRiskLabel(day.risk_score).toUpperCase()}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{
              backgroundColor: day.alert ? rc.primary + '30' : theme.card + '60',
              borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: day.alert ? (isDark ? rc.darkText : rc.text) : theme.subtext }}>
                {day.alert ? '⚠️ ALERT TRIGGERED' : '✓ NO ALERT'}
              </Text>
            </View>
            <View style={{
              backgroundColor: day.agitation ? rc.primary + '30' : theme.card + '60',
              borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: day.agitation ? (isDark ? rc.darkText : rc.text) : theme.subtext }}>
                {day.agitation ? '🔴 AGITATION' : '✓ NO AGITATION'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sensor Signals */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.subtext, letterSpacing: 1, marginBottom: 8 }}>
          SENSOR SIGNALS
        </Text>

        {features.map((f) => {
          const deviation = getDeviationLabel(f.value);
          return (
            <View key={f.label} style={{
              backgroundColor: theme.card,
              borderRadius: 12,
              padding: 14,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 20 }}>{f.icon}</Text>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                    {f.label}
                  </Text>
                  <Text style={{ fontSize: 11, color: deviation.color, marginTop: 2, fontWeight: '600' }}>
                    {deviation.text}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.subtext }}>
                {f.value?.toFixed(2) ?? '—'}
              </Text>
            </View>
          );
        })}

        {/* Alert Button — only if high risk */}
        {day.risk_score > 0.5 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Alert', { day, patientId })}
            style={{
              backgroundColor: riskColors.alert.primary,
              borderRadius: 14,
              padding: 16,
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}>
              ⚠️ VIEW ALERT DETAILS
            </Text>
          </TouchableOpacity>
        )}

      </View>
    </ScrollView>
  );
}