import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/contexts/AppContext";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const PREMIUM_FEATURES = [
  { icon: "exclamationmark.triangle.fill", label: "Report Hazards", description: "Report accidents, speed cameras, and police" },
  { icon: "location.fill", label: "Real-Time Navigation", description: "Turn-by-turn directions with speed limits" },
  { icon: "person.3.fill", label: "Friend System", description: "Add friends and see their activity" },
  { icon: "bell.fill", label: "Priority Alerts", description: "Get notified of hazards first" },
  { icon: "shield.fill", label: "Advanced Safety", description: "Enhanced safety mode features" },
  { icon: "star.fill", label: "Premium Support", description: "Priority customer support" },
];

export default function SubscriptionScreen() {
  const colors = useColors();
  const { subscription, upgradeToPremium } = useApp();

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">10/4 Premium</Text>
            <Text className="text-muted">Unlock all features</Text>
          </View>

          {/* Current Plan */}
          <View
            className={`rounded-2xl p-6 border-2 ${
              subscription.tier === "premium"
                ? "bg-primary/20 border-primary"
                : "bg-surface border-border"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="gap-1">
                <Text className="text-foreground font-bold text-lg">
                  {subscription.tier === "premium" ? "Premium" : "Free"}
                </Text>
                {subscription.tier === "premium" && subscription.expiresAt && (
                  <Text className="text-muted text-sm">
                    Expires {new Date(subscription.expiresAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
              {subscription.tier === "premium" && (
                <IconSymbol name="checkmark.circle.fill" size={32} color={colors.success} />
              )}
            </View>
          </View>

          {/* Premium Features */}
          <View className="gap-3">
            <Text className="text-foreground font-bold text-lg">Premium Features</Text>
            {PREMIUM_FEATURES.map((feature, idx) => (
              <View
                key={idx}
                className={`flex-row items-start gap-3 p-3 rounded-lg ${
                  subscription.tier === "premium"
                    ? "bg-success/10 border border-success"
                    : "bg-surface border border-border"
                }`}
              >
                <IconSymbol
                  name={feature.icon as any}
                  size={24}
                  color={subscription.tier === "premium" ? colors.success : colors.primary}
                />
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{feature.label}</Text>
                  <Text className="text-muted text-sm">{feature.description}</Text>
                </View>
                {subscription.tier === "premium" && (
                  <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
                )}
              </View>
            ))}
          </View>

          {/* Pricing */}
          {subscription.tier === "free" && (
            <View className="gap-4">
              <View className="bg-primary/10 border border-primary rounded-lg p-4 gap-2">
                <Text className="text-primary font-bold text-2xl">$4.99</Text>
                <Text className="text-muted text-sm">per month • Cancel anytime</Text>
              </View>

              {/* Upgrade Button */}
              <TouchableOpacity
                onPress={upgradeToPremium}
                className="bg-primary py-4 rounded-lg items-center"
              >
                <Text className="text-background font-bold text-lg">Upgrade to Premium</Text>
              </TouchableOpacity>

              {/* Free Trial Info */}
              <View className="bg-surface rounded-lg p-4 items-center gap-1">
                <Text className="text-foreground font-semibold">7-Day Free Trial</Text>
                <Text className="text-muted text-sm text-center">
                  Try all premium features for free. Cancel anytime before the trial ends.
                </Text>
              </View>
            </View>
          )}

          {/* Active Premium Info */}
          {subscription.tier === "premium" && (
            <View className="gap-3">
              <View className="bg-success/10 border border-success rounded-lg p-4">
                <Text className="text-success font-bold text-lg">✓ Premium Active</Text>
                <Text className="text-muted text-sm mt-1">
                  You have access to all premium features
                </Text>
              </View>

              {/* Manage Subscription */}
              <TouchableOpacity className="bg-surface border border-border py-3 rounded-lg items-center">
                <Text className="text-foreground font-semibold">Manage Subscription</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
