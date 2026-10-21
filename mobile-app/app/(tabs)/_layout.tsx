import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 52 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#E4B15A",
        tabBarInactiveTintColor: "#7E8796",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 4,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: "#090B10",
          borderTopColor: "#2A3140",
          borderTopWidth: 1,
        },
        tabBarItemStyle: { paddingHorizontal: 0 },
        tabBarAllowFontScaling: false,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "600",
          letterSpacing: 0,
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <IconSymbol size={20} name="map.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="hazards"
        options={{
          title: "Pins",
          tabBarAccessibilityLabel: "Hazards",
          tabBarIcon: ({ color }) => <IconSymbol size={20} name="exclamationmark.triangle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="navigation"
        options={{
          title: "Nav",
          tabBarIcon: ({ color }) => <IconSymbol size={20} name="location.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Crew",
          tabBarAccessibilityLabel: "Friends",
          tabBarIcon: ({ color }) => <IconSymbol size={20} name="person.3.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: "Car",
          tabBarAccessibilityLabel: "Garage",
          tabBarIcon: ({ color }) => <IconSymbol size={20} name="car.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="channels"
        options={{
          title: "Radio",
          tabBarAccessibilityLabel: "Channels",
          tabBarIcon: ({ color }) => <IconSymbol size={20} name="antenna.radiowaves.left.and.right" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "More",
          tabBarAccessibilityLabel: "Settings",
          tabBarIcon: ({ color }) => <IconSymbol size={20} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
