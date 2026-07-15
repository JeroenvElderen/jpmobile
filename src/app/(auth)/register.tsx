import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo, COMPANY_NAME } from '@/components/BrandLogo';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const normalizedEmail = email.trim();

    if (!trimmedName || !normalizedEmail || !password || !confirmPassword) {
      setError('Enter your name, email, password, and confirmation to create an account.');
      setSuccessMessage(undefined);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setSuccessMessage(undefined);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setSuccessMessage(undefined);
      return;
    }

    setIsSubmitting(true);
    setError(undefined);
    setSuccessMessage(undefined);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name: trimmedName,
          full_name: trimmedName,
        },
      },
    });

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.replace('/');
      return;
    }

    setSuccessMessage('Account created. Check your email to confirm your account, then log in.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.primaryDark} />
        </Pressable>
        <DecorativeBubble />

        <View style={styles.card}>
          <View style={styles.brand}>
            <BrandLogo />
              <Text style={styles.brandSubtitle}>Personal pet care, happy life. <Text style={styles.heart}>♡</Text></Text>
          </View>

          <View style={styles.form}>
            <AuthField icon="person-outline" label="Full name" placeholder="Enter your full name" autoCapitalize="words" autoComplete="name" textContentType="name" value={name} onChangeText={setName} />
            <AuthField icon="mail-outline" label="Email address" placeholder="Enter your email" autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" textContentType="emailAddress" value={email} onChangeText={setEmail} />
            <View style={styles.passwordGroup}>
              <AuthField icon="lock-closed-outline" label="Password" placeholder="Create a password" autoComplete="new-password" secureTextEntry={!showPassword} textContentType="newPassword" value={password} onChangeText={setPassword} rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'} onPressRightIcon={() => setShowPassword((visible) => !visible)} />
            </View>
            <AuthField icon="lock-closed-outline" label="Confirm password" placeholder="Confirm your password" autoComplete="new-password" secureTextEntry={!showConfirmPassword} textContentType="newPassword" value={confirmPassword} onChangeText={setConfirmPassword} onSubmitEditing={handleRegister} rightIcon={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} onPressRightIcon={() => setShowConfirmPassword((visible) => !visible)} />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

            <Pressable disabled={isSubmitting} onPress={handleRegister} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, isSubmitting && styles.disabled]}>
              <View style={styles.buttonGradient}>
                <Text style={styles.buttonText}>{isSubmitting ? 'Signing up...' : 'Sign Up'}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type AuthFieldProps = ComponentProps<typeof TextInput> & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onPressRightIcon?: () => void;
};

function AuthField({ icon, label, rightIcon, onPressRightIcon, style, ...props }: AuthFieldProps) {
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

function DecorativeBubble() {
  return <View style={styles.bubble}><View style={styles.bubbleDrop} /></View>;
}

function PawPrint() {
  return <Ionicons name="paw" size={78} color="rgba(91,61,245,0.08)" style={styles.bottomPaw} />;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FBFAFF', flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 42, paddingBottom: 30 },
  backButton: { alignItems: 'center', backgroundColor: 'rgba(91,61,245,0.08)', borderRadius: 22, height: 44, justifyContent: 'center', left: 30, position: 'absolute', top: 60, width: 44, zIndex: 2 },
  bubble: { backgroundColor: 'rgba(91,61,245,0.08)', borderRadius: 46, height: 92, position: 'absolute', right: -22, top: 66, width: 92 },
  bubbleDrop: { backgroundColor: 'rgba(91,61,245,0.08)', borderRadius: 18, bottom: -16, height: 34, position: 'absolute', right: 10, transform: [{ rotate: '-40deg' }], width: 28 },
  brand: { alignItems: 'center', marginBottom: 54, marginTop: -30 },
  brandTitle: { color: '#11162B', fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginTop: 10 },
  brandSubtitle: { color: '#52618D', fontSize: 17, fontWeight: '500', marginTop: 12, marginBottom: -40 },
  heart: { color: '#4D1DFF', fontWeight: '900' },
  card: { backgroundColor: '#FFFFFF', borderColor: 'rgba(91,61,245,0.10)', borderRadius: 24, borderWidth: 1, paddingHorizontal: 24, paddingTop: 58, paddingBottom: 40, shadowColor: '#3F2B79', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.08, shadowRadius: 40, elevation: 8 },
  cardHeader: { alignItems: 'center', marginBottom: 46 },
  title: { color: '#10162E', fontSize: 26, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { color: '#61709B', fontSize: 14, fontWeight: '600', marginTop: 26, marginBottom: -30 },
  form: { gap: 12 },
  passwordGroup: { gap: 8 },
  helperText: { color: '#7480AD', fontSize: 13, fontWeight: '600' },
  fieldGroup: { gap: 12 },
  label: { color: '#10162E', fontSize: 14, fontWeight: '800' },
  inputWrap: { alignItems: 'center', borderColor: 'rgba(101,114,159,0.24)', borderRadius: 10, borderWidth: 1.4, flexDirection: 'row', gap: 14, minHeight: 60, paddingHorizontal: 16 },
  input: { color: '#11162B', flex: 1, fontSize: 15, fontWeight: '600' },
  forgotButton: { alignSelf: 'flex-end', marginTop: -2 },
  forgotText: { color: '#4D1DFF', fontSize: 14, fontWeight: '800' },
  error: { color: theme.colors.danger, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  success: { color: theme.colors.success, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  primaryButton: { borderRadius: 10, marginTop: 24, overflow: 'hidden' },
  buttonGradient: { alignItems: 'center', backgroundColor: theme.colors.primaryDark, minHeight: 58, justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.58 },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: 86 },
  footerText: { color: '#52618D', fontSize: 15, fontWeight: '500' },
  footerLink: { color: '#4D1DFF', fontSize: 15, fontWeight: '900' },
  bottomPaw: { bottom: 20, left: 10, position: 'absolute' },
  padding: { marginBottom: 20 },
});
