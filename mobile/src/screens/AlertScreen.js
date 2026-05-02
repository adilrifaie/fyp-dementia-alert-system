import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { riskColors } from '../theme/colors';

export default function AlertScreen({ route, navigation }) {
  const { day, patientId } = route.params;
  const { theme, isDark } = useTheme();
  const rc = riskColors.alert;

  const reasons = [];
  if (day.dev_nocturnal_movements < -1.5)
    reasons.push('Sleep duration significantly below baseline');
  if (day.dev_total_movements > 1.5)
    reasons.push('Total movement much higher than usual');
  if (day.dev_total_movements < -1.5)
    reasons.push('Total movement much lower than usual');
  if (day.dev_Hallway > 1.5)
    reasons.push('Hallway activity significantly elevated');
  if (day.dev_first_movement_hour > 1.5)
    reasons.push('First movement of the day unusually late');
  if (day.dev_first_movement_hour < -1.5)
    reasons.push('First movement of the day unusually early');
  if (reasons.length === 0)
    reasons.push('Multiple sensor deviations exceeded risk threshold');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ padding: 16 }}>

        {/* Alert Banner */}
        <View style={{
          backgroundColor: isDark ? rc.darkBackground : rc.background,
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: rc.primary + '60',
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>🚨</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: rc.primary, marginBottom: 4 }}>
            High Risk Detected
          </Text>
          <Text style={{ fontSize: 13, color: isDark ? rc.darkText : rc.text, fontWeight: '600' }}>
            Patient {patientId} — {day.date_only}
          </Text>
          <Text style={{ fontSize: 12, color: isDark ? rc.darkText : rc.text, marginTop: 4, opacity: 0.8 }}>
            Risk Score: {Math.round(day.risk_score * 100)}%
          </Text>
        </View>

        {/* Why triggered */}
        <View style={{
          backgroundColor: theme.card,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: theme.cardBorder,
        }}>
          <Text style={{
            fontSize: 12, fontWeight: '700', color: theme.subtext,
            letterSpacing: 0.5, marginBottom: 12,
          }}>
            WHY THIS ALERT WAS TRIGGERED
          </Text>
          {reasons.map((reason, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
              <View style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: rc.primary, marginTop: 5,
              }} />
              <Text style={{ fontSize: 13, color: theme.text, flex: 1, lineHeight: 20 }}>
                {reason}
              </Text>
            </View>
          ))}
          <View style={{
            marginTop: 8, padding: 10, borderRadius: 8,
            backgroundColor: isDark ? '#1A1D2E' : '#F0F4F8',
          }}>
            <Text style={{ fontSize: 11, color: theme.subtext, lineHeight: 16 }}>
              ℹ️ This is an early warning. No immediate clinical action is required unless symptoms are observed.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <Text style={{
          fontSize: 12, fontWeight: '700', color: theme.subtext,
          letterSpacing: 0.5, marginBottom: 8,
        }}>
          ACTIONS
        </Text>

        <TouchableOpacity
          onPress={() => Alert.alert(
            'Notify Clinician',
            'In a real deployment this would send an alert to the assigned clinician.',
            [{ text: 'OK' }]
          )}
          style={{
            backgroundColor: rc.primary,
            borderRadius: 14, padding: 16,
            alignItems: 'center', marginBottom: 10,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}>
            📞 Notify Clinician
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Marked as Reviewed',
              'This alert has been noted.',
              [{ text: 'OK', onPress: () => navigation.popToTop() }]
            );
          }}
          style={{
            backgroundColor: 'transparent',
            borderRadius: 14, padding: 16,
            alignItems: 'center', marginBottom: 10,
            borderWidth: 1.5,
            borderColor: rc.primary,
          }}
        >
          <Text style={{ color: rc.primary, fontWeight: '700', fontSize: 15 }}>
            ✓ Mark as Reviewed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.popToTop()}
          style={{ alignItems: 'center', padding: 12 }}
        >
          <Text style={{ color: theme.subtext, fontSize: 13 }}>
            ← Back to Dashboard
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}