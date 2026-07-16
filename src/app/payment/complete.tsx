import { View, Text } from "react-native";

export default function PaymentComplete() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "700" }}>
        🎉 Payment Complete
      </Text>

      <Text style={{ marginTop: 16, textAlign: "center" }}>
        Android App Links are working.
      </Text>
    </View>
  );
}