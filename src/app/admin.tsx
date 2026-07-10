import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, Loading, Screen, Typography } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

const ADMIN_EMAIL = 'jeroen@jeroenandpaws.com';

type AdminSection = {
  key: string;
  label: string;
  emoji: string;
  group: string;
  description: string;
  table?: string;
};

const adminSections: AdminSection[] = [
  { key: 'dashboard', label: 'Dashboard', emoji: '🏠', group: 'Overview', description: 'Live business overview, website activity, revenue, and upcoming work.' },
  { key: 'bookings', label: 'Bookings', emoji: '📅', group: 'Manage', description: 'Review, confirm, and track customer booking requests.', table: 'portal_bookings' },
  { key: 'services', label: 'Services', emoji: '🐾', group: 'Manage', description: 'Manage walking, training, sitting, and other service offerings.', table: 'portal_services' },
  { key: 'dogs', label: 'Dogs', emoji: '🐶', group: 'Manage', description: 'See dog profiles, notes, owners, and care preferences.', table: 'portal_dogs' },
  { key: 'clients', label: 'Clients', emoji: '👥', group: 'Manage', description: 'Manage client contact details, status, notes, dogs, and booking history.', table: 'portal_clients' },
  { key: 'calendar', label: 'Calendar', emoji: '🗓️', group: 'Manage', description: 'Mobile view for backend bookings and calendar planning.', table: 'portal_bookings' },
  { key: 'invoices', label: 'Invoices', emoji: '🧾', group: 'Business', description: 'Track portal invoices and Revolut payment reconciliation.', table: 'portal_invoices' },
  { key: 'photo-updates', label: 'Photo Updates', emoji: '🖼️', group: 'Content', description: 'Review session gallery and client photo update content.', table: 'portal_photo_updates' },
  { key: 'reviews', label: 'Reviews', emoji: '⭐', group: 'Content', description: 'Monitor testimonials and public trust signals.' },
  { key: 'faq', label: 'FAQ', emoji: '❔', group: 'Content', description: 'Keep frequently asked questions aligned with the website.' },
  { key: 'settings', label: 'Settings', emoji: '⚙️', group: 'Settings', description: 'Business profile, social links, contact details, and backend preferences.' },
];

type Counts = Record<string, number | 'error'>;

async function getCurrentEmail() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  return data.user?.email?.toLowerCase() ?? null;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [activeKey, setActiveKey] = useState('dashboard');
  const [email, setEmail] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts>({});
  const [isChecking, setIsChecking] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const activeSection = useMemo(
    () => adminSections.find((section) => section.key === activeKey) ?? adminSections[0],
    [activeKey],
  );

  const loadCounts = useCallback(async () => {
    const uniqueTables = Array.from(new Set(adminSections.map((section) => section.table).filter(Boolean))) as string[];
    const nextCounts: Counts = {};

    await Promise.all(
      uniqueTables.map(async (table) => {
        const { count, error: countError } = await supabase.from(table).select('id', { count: 'exact', head: true });
        nextCounts[table] = countError ? 'error' : count ?? 0;
      }),
    );

    setCounts(nextCounts);
  }, []);

  const verifyAdmin = useCallback(async () => {
    setError(undefined);

    try {
      const currentEmail = await getCurrentEmail();

      if (currentEmail !== ADMIN_EMAIL) {
        await supabase.auth.signOut();
        Alert.alert('Admin only', 'This backend is only available to the Jeroen & Paws business account.');
        router.replace('/(auth)/login');
        return;
      }

      setEmail(currentEmail);
      await loadCounts();
    } catch (adminError) {
      setError(adminError instanceof Error ? adminError.message : 'Unable to verify backend access.');
    } finally {
      setIsChecking(false);
      setIsRefreshing(false);
    }
  }, [loadCounts, router]);

  useEffect(() => {
    void verifyAdmin();
  }, [verifyAdmin]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void verifyAdmin();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  if (isChecking) {
    return (
      <Screen centered>
        <Loading label="Checking backend access…" />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.screenContent}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primaryLight} />}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Typography variant="caption" color={theme.colors.primaryLight}>BACKEND ACCESS</Typography>
            <Typography variant="display">Admin dashboard 🐾</Typography>
            <Typography variant="subtitle">Signed in as {email}. This mobile backend mirrors the sections from the official website backend.</Typography>
          </View>
          <Button variant="secondary" onPress={handleSignOut}>Log Out</Button>
        </View>

        {error ? <Card style={styles.errorCard}><Typography color={theme.colors.danger}>{error}</Typography></Card> : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {adminSections.map((section) => {
            const isActive = activeKey === section.key;

            return (
              <Pressable
                key={section.key}
                accessibilityRole="button"
                onPress={() => setActiveKey(section.key)}
                style={[styles.tab, isActive ? styles.activeTab : undefined]}
              >
                <Typography variant="label" color={isActive ? theme.colors.text : theme.colors.textMuted}>{section.emoji} {section.label}</Typography>
              </Pressable>
            );
          })}
        </ScrollView>

        <Card style={styles.activeCard}>
          <Typography variant="caption" color={theme.colors.primaryLight}>{activeSection.group.toUpperCase()}</Typography>
          <Typography variant="title">{activeSection.emoji} {activeSection.label}</Typography>
          <Typography variant="body" color={theme.colors.textMuted}>{activeSection.description}</Typography>
          {activeSection.table ? (
            <View style={styles.countPill}>
              <Typography variant="caption">Live Supabase table</Typography>
              <Typography variant="title">
                {counts[activeSection.table] === 'error' ? '—' : counts[activeSection.table] ?? 0}
              </Typography>
              <Typography variant="caption">rows in {activeSection.table}</Typography>
            </View>
          ) : null}
        </Card>

        <View style={styles.grid}>
          {adminSections.filter((section) => section.table).map((section) => (
            <Card key={`${section.key}-${section.table}`} style={styles.statCard}>
              <Typography variant="caption" color={theme.colors.textMuted}>{section.label}</Typography>
              <Typography variant="title">{counts[section.table!] === 'error' ? '—' : counts[section.table!] ?? 0}</Typography>
              <Typography variant="caption">{section.table}</Typography>
            </Card>
          ))}
        </View>

        <Card style={styles.noteCard}>
          <Typography variant="label">Website backend sections included</Typography>
          <Typography variant="body" color={theme.colors.textMuted}>
            Dashboard, Bookings, Services, Dogs, Clients, Calendar, Invoices, Photo Updates, Reviews, FAQ, and Settings are available from this admin-only mobile view.
          </Typography>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    padding: 0,
  },
  scrollContent: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    gap: theme.spacing.lg,
  },
  headerCopy: {
    gap: theme.spacing.sm,
  },
  errorCard: {
    borderColor: theme.colors.danger,
  },
  tabs: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.lg,
  },
  tab: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  activeCard: {
    gap: theme.spacing.md,
  },
  countPill: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: theme.spacing.xs,
    minWidth: 150,
  },
  noteCard: {
    gap: theme.spacing.sm,
  },
});
