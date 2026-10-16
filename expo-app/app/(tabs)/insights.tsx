import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { db, type Poem, type Collection } from '@/lib/db';
import { FixedHeaderScreen } from '@/components/FixedHeaderScreen';
import { useAppTheme } from '@/context/ThemeContext';
import { filterSavedPoems } from '@/lib/poemUtils';

const NUMERIC_FONT = 'Inter_700Bold';

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
  fonts: ReturnType<typeof useAppTheme>['fonts'];
};

function StatCard({ icon, iconBg, label, value, colors, fonts }: StatCardProps) {
  const styles = useMemo(() => createStatStyles(colors, fonts), [colors, fonts]);
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function calcWritingStreak(poems: Poem[]): number {
  const active = poems.filter((p) => !p.is_archived);
  const dates = new Set(active.map((p) => new Date(p.created_date).toDateString()));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (dates.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export default function InsightsScreen() {
  const { colors, fonts, t } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  const { data: poemsData } = useQuery<Poem[]>({
    queryKey: ['poems'],
    queryFn: async () => filterSavedPoems(await db.entities.Poem.list()),
  });
  const { data: collectionsData } = useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: () => db.entities.Collection.list(),
  });
  const poems: Poem[] = poemsData ?? [];
  const collections: Collection[] = collectionsData ?? [];

  const stats = useMemo(() => {
    const active = poems.filter((p) => !p.is_archived);
    const totalWords = active.reduce((s, p) => s + (p.word_count || 0), 0);
    let longest = active[0];
    let mostEdited = active[0];
    for (const p of active) {
      if ((p.word_count || 0) > (longest?.word_count || 0)) longest = p;
      if ((p.edit_count || 0) > (mostEdited?.edit_count || 0)) mostEdited = p;
    }
    return {
      totalPoems: active.length,
      totalWords,
      favorites: active.filter((p) => p.is_favorite).length,
      collections: collections.length,
      archived: poems.filter((p) => p.is_archived).length,
      writingStreak: calcWritingStreak(poems),
      longest,
      mostEdited,
    };
  }, [poems, collections]);

  const header = (
    <View>
      <Text style={styles.h1}>{t.insights}</Text>
      <Text style={styles.sub}>{t.insightsSub}</Text>
    </View>
  );

  const cards: StatCardProps[] = [
    { icon: 'document-text', iconBg: '#D4AF37', label: t.totalPoems, value: String(stats.totalPoems), colors, fonts },
    { icon: 'text', iconBg: '#3B82F6', label: t.totalWords, value: stats.totalWords.toLocaleString(), colors, fonts },
    { icon: 'flame', iconBg: '#F97316', label: t.writingStreak, value: `${stats.writingStreak}d`, colors, fonts },
    { icon: 'heart', iconBg: '#F43F5E', label: t.favorites, value: String(stats.favorites), colors, fonts },
    { icon: 'folder-open', iconBg: '#10B981', label: t.collections, value: String(stats.collections), colors, fonts },
    { icon: 'archive', iconBg: '#64748B', label: t.archive, value: String(stats.archived), colors, fonts },
  ];

  return (
    <FixedHeaderScreen header={header}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}>
        <View style={styles.grid}>
          {cards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </View>
        {stats.totalPoems > 0 && (
          <View style={styles.highlights}>
            <Text style={styles.section}>{t.highlights}</Text>
            <View style={styles.highlightCard}>
              <View style={styles.hlRow}>
                <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
                <Text style={styles.hlTitle}>{t.longestPoem}</Text>
              </View>
              <Text style={styles.hlName}>{stats.longest?.title || '—'}</Text>
              <Text style={styles.hlMeta}>
                {stats.longest?.word_count || 0} {t.words}
              </Text>
            </View>
            <View style={styles.highlightCard}>
              <View style={styles.hlRow}>
                <Ionicons name="create-outline" size={20} color={colors.primary} />
                <Text style={styles.hlTitle}>{t.mostEdited}</Text>
              </View>
              <Text style={styles.hlName}>{stats.mostEdited?.title || '—'}</Text>
              <Text style={styles.hlMeta}>
                {stats.mostEdited?.edit_count || 0} {t.edits}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </FixedHeaderScreen>
  );
}

function createStatStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
) {
  return StyleSheet.create({
    statCard: {
      width: '47%',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    statValue: {
      fontFamily: NUMERIC_FONT,
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    statLabel: { fontSize: 12, color: colors.muted, marginTop: 4 },
  });
}

function createStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
) {
  return StyleSheet.create({
    h1: { fontFamily: fonts.display, fontSize: 26, fontWeight: '700', color: colors.text },
    sub: { fontSize: 12, color: colors.muted, marginBottom: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    highlights: { marginTop: 24 },
    section: { fontFamily: fonts.heading, fontSize: 18, fontWeight: '600', marginBottom: 12, color: colors.text },
    highlightCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hlRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    hlTitle: { fontSize: 14, fontWeight: '500', color: colors.text },
    hlName: { fontFamily: fonts.heading, fontSize: 16, fontWeight: '600', marginTop: 4, color: colors.text },
    hlMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  });
}
