import { Image } from "expo-image";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

const logo = require("../../assets/images/logo4.svg");

export const COMPANY_NAME = "Jeroen & Paws";

export function BrandLogo({ style, variant = "full" }: { style?: StyleProp<ViewStyle>; variant?: "full" | "mark" }) {
  return (
    <View style={[variant === "mark" ? styles.markWrap : styles.fullWrap, style]}>
      <Image
        source={logo}
        contentFit="contain"
        style={variant === "mark" ? styles.markLogo : styles.fullLogo}
        accessibilityLabel={`${COMPANY_NAME} logo`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullWrap: {
    aspectRatio: 510 / 224,
    width: 230,
  },
  fullLogo: {
    height: "100%",
    width: "100%",
  },
  markWrap: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    overflow: "hidden",
    width: 58,
  },
  markLogo: {
    height: 28,
    width: 48,
  },
});