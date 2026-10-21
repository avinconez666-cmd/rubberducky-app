import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Modal, TextInput, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/contexts/AppContext";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const VEHICLE_EMOJI = {
  car: "🚗",
  truck: "🚚",
  motorcycle: "🏍️",
  rv: "🚐",
};

export default function FriendsScreen() {
  const colors = useColors();
  const { friends, addFriend, removeFriend } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [friendName, setFriendName] = useState("");

  const handleAddFriend = () => {
    if (friendName.trim().length < 2) return;
    addFriend(friendName);
    setFriendName("");
    setShowModal(false);
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">Friends</Text>
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              className="bg-primary px-4 py-2 rounded-full"
            >
              <Text className="text-background font-semibold">+ Add</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-muted text-sm">Handles saved on this phone. Not live locations.</Text>
          {friends.length === 0 ? (
            <View className="flex-1 items-center justify-center gap-2">
              <IconSymbol name="person.3.fill" size={48} color={colors.muted} />
              <Text className="text-muted text-lg">No friends yet</Text>
              <Text className="text-muted text-sm">Save a convoy handle to remember who you roll with</Text>
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={friends}
              keyExtractor={(f) => f.id}
              renderItem={({ item }) => (
                <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 flex-row items-center gap-3">
                      {/* Vehicle Emoji */}
                      <Text className="text-3xl">
                        {VEHICLE_EMOJI[item.vehicleType as keyof typeof VEHICLE_EMOJI]}
                      </Text>

                      {/* Friend Info */}
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold">{item.displayName}</Text>
                        <View className="flex-row items-center gap-1 mt-1">
                          <Text className="text-muted text-xs">Saved on this phone</Text>
                        </View>
                      </View>
                    </View>

                    {/* Remove Button */}
                    <TouchableOpacity
                      onPress={() => removeFriend(item.id)}
                      className="p-2"
                    >
                      <IconSymbol name="xmark.circle.fill" size={24} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Add Friend Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">Add Friend</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <IconSymbol name="xmark" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Friend Handle Input */}
            <View className="gap-2">
              <Text className="text-foreground font-semibold">Friend's Handle</Text>
              <TextInput
                placeholder="e.g., RoadRunner, DustDevil..."
                placeholderTextColor={colors.muted}
                value={friendName}
                onChangeText={setFriendName}
                className="bg-surface border border-border rounded-lg p-3 text-foreground"
              />
              <Text className="text-muted text-xs">A name you will recognise. Nothing is sent off this phone.</Text>
            </View>

            {/* Buttons */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="flex-1 bg-surface border border-border py-3 rounded-lg"
              >
                <Text className="text-foreground font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddFriend}
                className="flex-1 bg-primary py-3 rounded-lg"
              >
                <Text className="text-background font-semibold text-center">Add Friend</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
