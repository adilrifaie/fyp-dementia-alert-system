import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import Constants from "expo-constants";
import { useTheme } from "../theme/ThemeContext";
import { getRiskLevel, getRiskLabel, riskColors } from "../theme/colors";
import RiskChart from "../components/RiskChart";

export default function PatientDetailScreen({ route, navigation }) {
  const { patientId } = route.params;
  const { apiBaseUrl, groqApiKey } = Constants.expoConfig.extra;
  const { theme, isDark } = useTheme();
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [careTip, setCareTip] = useState(null);
  const [tipLoading, setTipLoading] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/patient/${patientId}`)
      .then((res) => res.json())
      .then((data) => {
        setDays(data);
        setLoading(false);

        const latest = data[data.length - 1];
        if (latest) {
          setTipLoading(true);
          fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              max_tokens: 120,
              messages: [
                {
                  role: "system",
                  content:
                    "You are a dementia care assistant. Based on sensor data, give one short, practical, warm care tip for today. Maximum 2 sentences. No medical jargon.",
                },
                {
                  role: "user",
                  content: `Today's data for dementia patient:
- Risk score: ${Math.round(latest.risk_score * 100)}%
- Alert triggered: ${latest.alert ? "Yes" : "No"}
- Hallway movement deviation: ${latest.dev_Hallway?.toFixed(2)}
- Total movement deviation: ${latest.dev_total_movements?.toFixed(2)}
- Nocturnal movement deviation: ${latest.dev_nocturnal_movements?.toFixed(2)}
- First movement hour deviation: ${latest.dev_first_movement_hour?.toFixed(2)}
Give a care tip for the caregiver today.`,
                },
              ],
            }),
          })
            .then((res) => res.json())
            .then((groqData) => {
              setCareTip(
                groqData.choices?.[0]?.message?.content ?? "No tip available.",
              );
              setTipLoading(false);
            })
            .catch((err) => {
              console.log("Groq error:", err);
              setCareTip("Could not load care tip.");
              setTipLoading(false);
            });
        }
      })
      .catch((err) => {
        console.log("Error:", err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={riskColors.watch.primary} />
      </View>
    );

  const latest = days[days.length - 1];
  const latestRiskLevel = getRiskLevel(latest?.risk_score ?? 0);
  const latestRc = riskColors[latestRiskLevel];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={[...days].reverse()}
        keyExtractor={(item) => item.date_only}
        ListHeaderComponent={() => (
          <View style={{ padding: 16 }}>
            {/* Latest Day Card */}
            <View
              style={{
                backgroundColor: isDark
                  ? latestRc.darkBackground
                  : latestRc.background,
                borderRadius: 20,
                padding: 20,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: latestRc.primary + "40",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  letterSpacing: 1,
                  color: isDark ? latestRc.darkText : latestRc.text,
                  marginBottom: 4,
                }}
              >
                LATEST ENTRY — {latest?.date_only}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 56,
                    fontWeight: "800",
                    color: latestRc.primary,
                    lineHeight: 60,
                  }}
                >
                  {Math.round((latest?.risk_score ?? 0) * 100)}
                </Text>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "600",
                    color: latestRc.primary,
                    marginBottom: 8,
                    marginLeft: 4,
                  }}
                >
                  %
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: isDark ? latestRc.darkText : latestRc.text,
                    marginBottom: 10,
                    marginLeft: 12,
                  }}
                >
                  {getRiskLabel(latest?.risk_score ?? 0).toUpperCase()}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View
                  style={{
                    backgroundColor: latest?.alert
                      ? latestRc.primary + "30"
                      : theme.card + "60",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: latest?.alert
                        ? isDark
                          ? latestRc.darkText
                          : latestRc.text
                        : theme.subtext,
                    }}
                  >
                    {latest?.alert ? "⚠️ ALERT TRIGGERED" : "✓ NO ALERT"}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: latest?.agitation
                      ? latestRc.primary + "30"
                      : theme.card + "60",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: latest?.agitation
                        ? isDark
                          ? latestRc.darkText
                          : latestRc.text
                        : theme.subtext,
                    }}
                  >
                    {latest?.agitation ? "🔴 AGITATION" : "✓ NO AGITATION"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Risk Chart */}
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: theme.subtext,
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                📈 DAILY RISK SCORE
              </Text>
              <RiskChart
                days={days}
                width={width}
                isDark={isDark}
                onDaySelect={(day) =>
                  navigation.navigate("DayDetail", { day, patientId })
                }
              />
              <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <View
                    style={{ width: 12, height: 2, backgroundColor: "#3B82F6" }}
                  />
                  <Text style={{ fontSize: 10, color: theme.subtext }}>
                    Risk score
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <View
                    style={{ width: 12, height: 2, backgroundColor: "#F59E0B" }}
                  />
                  <Text style={{ fontSize: 10, color: theme.subtext }}>
                    Threshold (13%)
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <View
                    style={{ width: 2, height: 10, backgroundColor: "#EF4444" }}
                  />
                  <Text style={{ fontSize: 10, color: theme.subtext }}>
                    Agitation day
                  </Text>
                </View>
              </View>
            </View>

            {/* Care Tip Card */}
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: theme.subtext,
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                💡 CARE TIP
              </Text>
              {tipLoading ? (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <ActivityIndicator
                    size="small"
                    color={riskColors.watch.primary}
                  />
                  <Text style={{ fontSize: 13, color: theme.subtext }}>
                    Generating tip...
                  </Text>
                </View>
              ) : (
                <Text
                  style={{ fontSize: 14, color: theme.text, lineHeight: 20 }}
                >
                  {careTip ?? "No tip available."}
                </Text>
              )}
            </View>

            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: theme.subtext,
                letterSpacing: 1,
                marginTop: 8,
                marginBottom: 8,
              }}
            >
              DAILY HISTORY
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const riskLevel = getRiskLevel(item.risk_score);
          const rc = riskColors[riskLevel];

          return (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("DayDetail", { day: item, patientId })
              }
              activeOpacity={0.7}
              style={{
                marginHorizontal: 16,
                marginBottom: 6,
                backgroundColor: theme.card,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: item.alert ? rc.primary + "60" : theme.cardBorder,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: theme.text }}
                >
                  {item.date_only}
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  {item.alert === 1 && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: riskColors.alert.primary,
                        fontWeight: "600",
                      }}
                    >
                      ⚠️ Alert
                    </Text>
                  )}
                  {item.agitation === 1 && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: riskColors.alert.primary,
                        fontWeight: "600",
                      }}
                    >
                      🔴 Agitation
                    </Text>
                  )}
                  {item.alert === 0 && item.agitation === 0 && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: riskColors.safe.primary,
                        fontWeight: "600",
                      }}
                    >
                      ✓ Clear
                    </Text>
                  )}
                </View>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{ fontSize: 22, fontWeight: "800", color: rc.primary }}
                >
                  {Math.round(item.risk_score * 100)}%
                </Text>
                <Text
                  style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}
                >
                  {getRiskLabel(item.risk_score)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}
