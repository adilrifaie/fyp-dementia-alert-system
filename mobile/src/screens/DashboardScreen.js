import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '../theme/ThemeContext';
import { getRiskLevel, getRiskLabel, riskColors } from '../theme/colors';

export default function DashboardScreen({ navigation }) {
  const { apiBaseUrl } = Constants.expoConfig.extra;
  const { theme, isDark } = useTheme();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/patients`)
      .then(res => res.json())
      .then(data => { setPatients(data); setLoading(false); })
      .catch(err => { console.log('Error:', err); setLoading(false); });
  }, []);

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.background }}>
      <ActivityIndicator size="large" color={riskColors.watch.primary} />
    </View>
  );

  const getRiskBadgeStyle = (riskLevel) => {
    const rc = riskColors[riskLevel];
    return {
      backgroundColor: isDark ? rc.darkBackground : rc.background,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    };
  };

  const getRiskTextStyle = (riskLevel) => ({
    color: isDark ? riskColors[riskLevel].darkText : riskColors[riskLevel].text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 13, color: theme.subtext, letterSpacing: 0.5 }}>
          MONITORING {patients.length} PATIENTS
        </Text>
      </View>

      <FlatList
        data={patients}
        keyExtractor={item => item.patient_id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => {
          const riskLevel = getRiskLevel(item.max_risk_score);
          const rc = riskColors[riskLevel];

          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('PatientDetail', { patientId: item.patient_id })}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text, letterSpacing: 0.3 }}>
                  Patient {item.patient_id}
                </Text>
                <View style={getRiskBadgeStyle(riskLevel)}>
                  <Text style={getRiskTextStyle(riskLevel)}>
                    {getRiskLabel(item.max_risk_score).toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: rc.primary }}>
                    {item.alert_days}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>
                    Alert Days
                  </Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text }}>
                    {item.total_days}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>
                    Total Days
                  </Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text }}>
                    {Math.round((item.alert_days / item.total_days) * 100)}%
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>
                    Alert Rate
                  </Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.subtext }}>
                    {item.latest_date}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>
                    Last Entry
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}