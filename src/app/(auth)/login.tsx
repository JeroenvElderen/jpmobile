import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

const ADMIN_EMAIL = 'jeroen@jeroenandpaws.com'.toLowerCase();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setError('Enter your email and password to log in.');
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const authenticatedEmail = data.user?.email?.toLowerCase() ?? normalizedEmail.toLowerCase();

    if (authenticatedEmail === ADMIN_EMAIL) {
      router.replace('/admin');
      return;
    }

    router.replace('/client');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <DecorativeBubble />
        <BrandHeader />

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>Welcome back <Text style={styles.heart}>♡</Text></Text>
            <Text style={styles.subtitle}>Log in to your account</Text>
          </View>

          <View style={styles.form}>
            <AuthField
              icon="mail-outline"
              label="Email address"
              placeholder="Enter your email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />
            <AuthField
              icon="lock-closed-outline"
              label="Password"
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              textContentType="password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
              rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
              onPressRightIcon={() => setShowPassword((visible) => !visible)}
            />

            <Pressable style={styles.forgotButton} onPress={() => setError('Password reset is not available yet.')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable disabled={isSubmitting} onPress={handleLogin} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, isSubmitting && styles.disabled]}>
              <View style={styles.buttonGradient}>
                <Text style={styles.buttonText}>{isSubmitting ? 'Logging in...' : 'Log In'}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don’t have an account? </Text>
          <Link href="/(auth)/register" style={styles.footerLink}>Sign up</Link>
        </View>
      <PawPrint />
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

function BrandHeader() {
  return (
    <View style={styles.brand}>
      <Ionicons name="paw" size={55} color={theme.colors.primaryDark} />
      <Text style={styles.brandTitle}>PawCare</Text>
      <Text style={styles.brandSubtitle}>Happy pets, happy life. <Text style={styles.heart}>♡</Text></Text>
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
  bubble: { backgroundColor: 'rgba(91,61,245,0.08)', borderRadius: 46, height: 92, position: 'absolute', right: -22, top: 66, width: 92 },
  bubbleDrop: { backgroundColor: 'rgba(91,61,245,0.08)', borderRadius: 18, bottom: -16, height: 34, position: 'absolute', right: 10, transform: [{ rotate: '-40deg' }], width: 28 },
  brand: { alignItems: 'center', marginBottom: 54, marginTop: 24 },
  brandTitle: { color: '#11162B', fontSize: 34, fontWeight: '900', letterSpacing: -0.5, marginTop: 4 },
  brandSubtitle: { color: '#52618D', fontSize: 17, fontWeight: '500', marginTop: 12 },
  heart: { color: '#4D1DFF', fontWeight: '900' },
  card: { backgroundColor: '#FFFFFF', borderColor: 'rgba(91,61,245,0.10)', borderRadius: 24, borderWidth: 1, paddingHorizontal: 24, paddingTop: 58, paddingBottom: 40, shadowColor: '#3F2B79', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.08, shadowRadius: 40, elevation: 8 },
  cardHeader: { alignItems: 'center', marginBottom: 46 },
  title: { color: '#10162E', fontSize: 26, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { color: '#61709B', fontSize: 14, fontWeight: '600', marginTop: 14 },
  form: { gap: 24 },
  fieldGroup: { gap: 12 },
  label: { color: '#10162E', fontSize: 14, fontWeight: '800' },
  inputWrap: { alignItems: 'center', borderColor: 'rgba(101,114,159,0.24)', borderRadius: 10, borderWidth: 1.4, flexDirection: 'row', gap: 14, minHeight: 60, paddingHorizontal: 16 },
  input: { color: '#11162B', flex: 1, fontSize: 15, fontWeight: '600' },
  forgotButton: { alignSelf: 'flex-end', marginTop: -2 },
  forgotText: { color: '#4D1DFF', fontSize: 14, fontWeight: '800' },
  error: { color: theme.colors.danger, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  primaryButton: { borderRadius: 10, marginTop: 24, overflow: 'hidden' },
  buttonGradient: { alignItems: 'center', backgroundColor: theme.colors.primaryDark, minHeight: 58, justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.58 },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: 86 },
  footerText: { color: '#52618D', fontSize: 15, fontWeight: '500' },
  footerLink: { color: '#4D1DFF', fontSize: 15, fontWeight: '900' },
  bottomPaw: { bottom: 20, left: 10, position: 'absolute' },
});
