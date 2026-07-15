import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandLogo } from "@/components/BrandLogo";
import { completeClientAccount, isClientAccountComplete, isTemporaryOnboardingEmail } from "@/lib/accountSetup";
import { supabase } from "@/lib/supabase";
import { theme } from "@/lib/theme";

export default function CompleteAccountScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!cancelled && (await isClientAccountComplete(data.user))) {
        router.replace("/client");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleCompleteAccount = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password || !confirmPassword) {
      setError("Enter your real email address, new password, and confirmation.");
      return;
    }

    if (isTemporaryOnboardingEmail(normalizedEmail)) {
      setError("Please use your real email address, not the temporary onboarding email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      await completeClientAccount({ email: normalizedEmail, password });
      router.replace("/client");
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Unable to complete your account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.header}>
            <BrandLogo />
            <Text style={styles.title}>Complete your account</Text>
            <Text style={styles.subtitle}>Replace your temporary login with your real email and a private password before continuing.</Text>
          </View>

          <View style={styles.form}>
            <AccountField icon="mail-outline" label="Real email address" placeholder="you@example.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" value={email} onChangeText={setEmail} />
            <AccountField icon="lock-closed-outline" label="New password" placeholder="Create a secure password" autoComplete="new-password" secureTextEntry={!showPassword} textContentType="newPassword" value={password} onChangeText={setPassword} rightIcon={showPassword ? "eye-outline" : "eye-off-outline"} onPressRightIcon={() => setShowPassword((visible) => !visible)} />
            <AccountField icon="lock-closed-outline" label="Confirm new password" placeholder="Confirm your new password" autoComplete="new-password" secureTextEntry={!showConfirmPassword} textContentType="newPassword" value={confirmPassword} onChangeText={setConfirmPassword} onSubmitEditing={handleCompleteAccount} rightIcon={showConfirmPassword ? "eye-outline" : "eye-off-outline"} onPressRightIcon={() => setShowConfirmPassword((visible) => !visible)} />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable disabled={isSubmitting} onPress={handleCompleteAccount} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, isSubmitting && styles.disabled]}>
              <Text style={styles.buttonText}>{isSubmitting ? "Saving..." : "Save and continue"}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type AccountFieldProps = ComponentProps<typeof TextInput> & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onPressRightIcon?: () => void;
};

function AccountField({ icon, label, rightIcon, onPressRightIcon, style, ...props }: AccountFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={22} color="#65729F" />
        <TextInput placeholderTextColor="#7480AD" style={[styles.input, style]} {...props} />
        {rightIcon ? (
          <Pressable accessibilityRole="button" onPress={onPressRightIcon} hitSlop={10}>
            <Ionicons name={rightIcon} size={20} color="#65729F" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: "#FBFAFF", flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#FFFFFF", borderColor: "rgba(91,61,245,0.10)", borderRadius: 24, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 34, shadowColor: "#3F2B79", shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.08, shadowRadius: 40, elevation: 8 },
  header: { alignItems: "center", gap: 14, marginBottom: 28 },
  title: { color: "#10162E", fontSize: 26, fontWeight: "900", letterSpacing: -0.4, textAlign: "center" },
  subtitle: { color: "#61709B", fontSize: 15, fontWeight: "600", lineHeight: 22, textAlign: "center" },
  form: { gap: 20 },
  fieldGroup: { gap: 12 },
  label: { color: "#10162E", fontSize: 14, fontWeight: "800" },
  inputWrap: { alignItems: "center", borderColor: "rgba(101,114,159,0.24)", borderRadius: 10, borderWidth: 1.4, flexDirection: "row", gap: 14, minHeight: 60, paddingHorizontal: 16 },
  input: { color: "#11162B", flex: 1, fontSize: 15, fontWeight: "600" },
  error: { color: theme.colors.danger, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  primaryButton: { alignItems: "center", backgroundColor: theme.colors.primaryDark, borderRadius: 10, justifyContent: "center", minHeight: 58 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.58 },
});