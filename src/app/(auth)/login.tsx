import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLogo } from '@/components/BrandLogo';
import { useAuth } from '@/hooks/useAuth';
import { isEmailIdentifier, isValidPhone } from '@/lib/authValidation';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ identifier?: string; message?: string }>();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState(params.identifier ?? '');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; setPassword(''); }, []);
  async function submit() {
    if (busy) return;
    if (!identifier.trim() || !password) return setError('Enter your phone number or email and password.');
    if (!isEmailIdentifier(identifier) && !isValidPhone(identifier)) return setError('Enter a phone number in international format, starting with +.');
    setBusy(true); setError(null);
    try { await signIn(identifier, password); }
    catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : 'Unable to log in. Please try again.'); }
    finally { if (mounted.current) setBusy(false); }
  }
  return <SafeAreaView style={s.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>
    <View style={s.card}><BrandLogo /><Text style={s.title}>Welcome back ♡</Text><Text style={s.sub}>Personal pet care, happy life.</Text>
      {params.message ? <Banner kind="success" text={params.message} /> : null}{error ? <Banner kind="error" text={error} /> : null}
      <Field label="Phone number or email" value={identifier} onChangeText={setIdentifier} keyboardType="email-address" textContentType="username" />
      <View><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry={!visible} textContentType="password" onSubmitEditing={submit} /><Pressable accessibilityLabel={visible ? 'Hide password' : 'Show password'} style={s.eye} onPress={() => setVisible(v => !v)}><Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color="#4c1d95" /></Pressable></View>
      <Pressable accessibilityRole="button" disabled={busy} style={[s.button, busy && s.disabled]} onPress={submit}>{busy ? <ActivityIndicator color="white" /> : <Text style={s.buttonText}>Log in</Text>}</Pressable>
      <Text style={s.footer}>New here? <Link href="/(auth)/register" style={s.link}>Create an account</Link></Text>
    </View></ScrollView></SafeAreaView>;
}
function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) { const { label, ...rest } = props; return <View style={s.group}><Text style={s.label}>{label}</Text><TextInput {...rest} accessibilityLabel={label} autoCapitalize="none" autoCorrect={false} placeholderTextColor="#80758f" style={s.input} /></View>; }
function Banner({ text, kind }: { text: string; kind: 'error' | 'success' }) { return <Text accessibilityRole="alert" style={[s.banner, kind === 'error' ? s.error : s.success]}>{text}</Text>; }
const s = StyleSheet.create({ safe:{flex:1,backgroundColor:'#f7f4ef'},page:{flexGrow:1,justifyContent:'center',padding:20},card:{backgroundColor:'white',borderRadius:24,padding:24,gap:18,shadowColor:'#29134f',shadowOpacity:.1,shadowRadius:20,elevation:5},title:{color:'#211332',fontSize:28,fontWeight:'900',textAlign:'center'},sub:{color:'#71657c',textAlign:'center',marginBottom:8},group:{gap:8},label:{color:'#211332',fontWeight:'800'},input:{borderColor:'#d8cee4',borderWidth:1.5,borderRadius:12,minHeight:54,paddingHorizontal:15,color:'#211332',fontSize:16},eye:{position:'absolute',right:14,bottom:16},button:{backgroundColor:'#4c1d95',borderRadius:12,minHeight:56,alignItems:'center',justifyContent:'center',marginTop:6},buttonText:{color:'white',fontWeight:'900',fontSize:16},disabled:{opacity:.6},footer:{textAlign:'center',color:'#71657c'},link:{color:'#4c1d95',fontWeight:'900'},banner:{padding:12,borderRadius:10,lineHeight:20},error:{backgroundColor:'#fff1f2',color:'#a51d35'},success:{backgroundColor:'#ecfdf3',color:'#176b3a'} });
