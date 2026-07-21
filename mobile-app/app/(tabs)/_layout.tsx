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
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#F59E0B",
        tabBarInactiveTintColor: "#64748B",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: "#0F172A",
          borderTopColor: "#1E293B",
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="map.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="hazards"
        options={{
          title: "Hazards",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="exclamationmark.triangle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="navigation"
        options={{
          title: "Nav",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="location.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.3.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: "Premium",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="star.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="channels"
        options={{
          title: "Channels",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="antenna.radiowaves.left.and.right" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
