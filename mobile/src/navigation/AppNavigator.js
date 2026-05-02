import { TouchableOpacity, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "../screens/DashboardScreen";
import PatientDetailScreen from "../screens/PatientDetailScreen";
import DayDetailScreen from "../screens/DayDetailScreen";
import AlertScreen from "../screens/AlertScreen";
import { useTheme } from "../theme/ThemeContext";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isDark, toggle, theme } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: theme.background },
          headerStyle: { backgroundColor: theme.header },
          headerTintColor: theme.headerText,
          headerTitleStyle: { fontWeight: "bold" },
          headerRight: () => (
            <TouchableOpacity onPress={toggle} style={{ marginRight: 8 }}>
              <Text style={{ fontSize: 20 }}>{isDark ? "☀️" : "🌙"}</Text>
            </TouchableOpacity>
          ),
        }}
      >
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: "DementIQ" }}
        />
        <Stack.Screen
          name="PatientDetail"
          component={PatientDetailScreen}
          options={({ route }) => ({
            title: `Patient ${route.params.patientId}`,
          })}
        />
        <Stack.Screen
          name="DayDetail"
          component={DayDetailScreen}
          options={({ route }) => { const d = new Date(route.params.day.date_only + 'T00:00:00'); return { title: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }; }}
        />
        <Stack.Screen
          name="Alert"
          component={AlertScreen}
          options={{ title: "Alert Details" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}