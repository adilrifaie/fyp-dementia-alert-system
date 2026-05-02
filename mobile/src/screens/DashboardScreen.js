import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '../theme/ThemeContext';
import { riskColors } from '../theme/colors';

const getCurrentRiskLevel = (alertDays, totalDays) => {
  const rate = alertDays / totalDays;
  if (rate > 0.4) return 'alert';
  if (rate > 0.1) return 'watch';
  return 'safe';
};

const getRiskLabel = (riskLevel) => {
  if (riskLevel === 'alert') return 'HIGH';
  if (riskLevel === 'watch') return 'WATCH';
  return 'SAFE';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function DashboardScreen({ navigation }) {
  const { apiBaseUrl } = Constants.expoConfig.extra;
  const { theme, isDark } = useTheme();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/patients`)
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => {
          const rateA = a.alert_days / a.total_days;
          const rateB = b.alert_days / b.total_days;
          return rateB - rateA;
        });
        setPatients(sorted);
        setLoading(false);
      })
      .catch(err => { console.log('Error:', err); setLoading(false); });
  }, []);

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.background }}>
      <ActivityIndicator size="large" color={riskColors.watch.primary} />
    </View>
  );

  const counts = patients.reduce((acc, p) => {
    const level = getCurrentRiskLevel(p.alert_days, p.total_days);
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  const filteredPatients = activeFilter
    ? patients.filter(p => getCurrentRiskLevel(p.alert_days, p.total_days) === activeFilter)
    : patients;

  const handleFilterPress = (level) => {
    setActiveFilter(prev => prev === level ? null : level);
  };

  const FILTERS = [
    { key: 'alert', label: 'HIGH',  rc: riskColors.alert },
    { key: 'watch', label: 'WATCH', rc: riskColors.watch },
    { key: 'safe',  label: 'SAFE',  rc: riskColors.safe  },
  ];

  const SummaryStrip = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {FILTERS.map(({ key, label, rc }) => {
          const isActive = activeFilter === key;
          const isOtherActive = activeFilter !== null && activeFilter !== key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => handleFilterPress(key)}
              activeOpacity={0.75}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive
                  ? rc.primary
                  : isOtherActive
                    ? 'transparent'
                    : isDark ? rc.darkBackground : rc.background,
                borderWidth: isOtherActive ? 1 : 0,
                borderColor: rc.primary + '40',
                opacity: isOtherActive ? 0.5 : 1,
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '800',
                letterSpacing: 0.5,
                color: isActive
                  ? '#FFFFFF'
                  : isDark ? rc.darkText : rc.text,
              }}>
                {counts[key] || 0} {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ minHeight: 24, justifyContent: 'center', marginTop: 8 }}>
        {activeFilter ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: theme.subtext }}>
              Showing {counts[activeFilter] || 0} {getRiskLabel(activeFilter).toLowerCase()} risk patients
            </Text>
            <TouchableOpacity onPress={() => setActiveFilter(null)}>
              <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: '600' }}>
                Show all
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ fontSize: 12, color: theme.subtext, letterSpacing: 0.5 }}>
            MONITORING {patients.length} PATIENTS
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={filteredPatients}
        keyExtractor={item => item.patient_id}
        ListHeaderComponent={SummaryStrip}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>
              {activeFilter === 'safe' ? '✓' : '—'}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 6 }}>
              No {getRiskLabel(activeFilter)} patients
            </Text>
            <Text style={{ fontSize: 13, color: theme.subtext, textAlign: 'center', lineHeight: 20 }}>
              {activeFilter === 'safe'
                ? 'All monitored patients currently show elevated risk.'
                : 'No patients in this category right now.'}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10, paddingTop: 8 }}
        renderItem={({ item }) => {
          const riskLevel = getCurrentRiskLevel(item.alert_days, item.total_days);
          const rc = riskColors[riskLevel];
          const alertRate = Math.round((item.alert_days / item.total_days) * 100);

          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('PatientDetail', { patientId: item.patient_id })}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: riskLevel === 'safe' ? theme.cardBorder : rc.primary + '50',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text, letterSpacing: 0.3 }}>
                  Patient {item.patient_id}
                </Text>
                <View style={{
                  backgroundColor: isDark ? rc.darkBackground : rc.background,
                  paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: 20,
                }}>
                  <Text style={{
                    color: isDark ? rc.darkText : rc.text,
                    fontSize: 11, fontWeight: '800', letterSpacing: 0.5,
                  }}>
                    {getRiskLabel(riskLevel)}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: rc.primary }}>
                    {item.alert_days}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>Alert Days</Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text }}>
                    {item.actual_agitation_days}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>Agitation Days</Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: rc.primary }}>
                    {alertRate}%
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>Alert Rate</Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.subtext }}>
                    {formatDate(item.latest_date)}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>Last Entry</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}