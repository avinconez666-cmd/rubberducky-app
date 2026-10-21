import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/contexts/AppContext";
import { useRadio } from "@/contexts/RadioContext";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function FriendsScreen() {
  const colors = useColors();
  const { friends, addFriend, removeFriend, user, isConnected } = useApp();
  const radio = useRadio();
  const [showModal, setShowModal] = useState(false);
  const [friendName, setFriendName] = useState("");

  const handleAddFriend = () => {
    const handle = friendName.trim();
    if (handle.length < 2) return;
    if (handle.toLowerCase() === user?.displayName.toLowerCase()) {
      Alert.alert("That's you", "Ask for the other driver's handle.");
      return;
    }
    if (friends.some((f) => f.displayName.toLowerCase() === handle.toLowerCase())) {
      Alert.alert("Already there", "That handle is already on your list.");
      return;
    }
    addFriend(handle);
    radio.requestFriend(handle);
    setFriendName("");
    setShowModal(false);
  };

  const incoming = friends.filter((f) => f.status === "incoming");
  const rest = friends.filter((f) => f.status !== "incoming");

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">Friends</Text>
            <TouchableOpacity onPress={() => setShowModal(true)} className="bg-primary px-4 py-2 rounded-full">
              <Text className="text-background font-semibold">+ Add</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-muted text-sm">
            {isConnected
              ? "They have to be on the radio to get the request. Accepted friends share the Convoy room."
              : "Set a relay in Settings first. A request only goes out while you are both connected."}
          </Text>

          {incoming.map((item) => (
            <View key={item.id} className="bg-primary/15 border border-primary rounded-lg p-4 gap-3">
              <Text className="text-foreground font-semibold">{item.displayName} wants to be friends</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => radio.respondFriend(item.displayName, true)}
                  className="flex-1 bg-primary py-2 rounded-lg"
                >
                  <Text className="text-background font-semibold text-center">Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeFriend(item.id)} className="flex-1 bg-surface border border-border py-2 rounded-lg">
                  <Text className="text-foreground font-semibold text-center">Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {rest.length === 0 ? (
            <View className="items-center gap-2 py-8">
              <IconSymbol name="person.3.fill" size={48} color={colors.muted} />
              <Text className="text-muted text-lg">No friends yet</Text>
              <Text className="text-muted text-sm text-center">Add a handle. They accept on their phone.</Text>
            </View>
          ) : (
            rest.map((item) => (
              <View key={item.id} className="bg-surface rounded-lg p-4 border border-border flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{item.displayName}</Text>
                  <Text className="text-muted text-xs mt-1">
                    {item.status === "outgoing"
                      ? "Request sent"
                      : radio.online.some((o) => o.handle.toLowerCase() === item.displayName.toLowerCase())
                        ? "On the radio"
                        : "Accepted"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeFriend(item.id)} className="p-2">
                  <IconSymbol name="xmark.circle.fill" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">Add a driver</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <IconSymbol name="xmark" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Their exact handle"
              placeholderTextColor={colors.muted}
              value={friendName}
              onChangeText={setFriendName}
              autoCapitalize="none"
              className="bg-surface border border-border rounded-lg p-3 text-foreground"
            />
            <TouchableOpacity onPress={handleAddFriend} className="bg-primary py-3 rounded-lg">
              <Text className="text-background font-semibold text-center">Send request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
