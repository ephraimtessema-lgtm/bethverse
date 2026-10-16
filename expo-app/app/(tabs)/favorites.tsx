import { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, type Poem } from '@/lib/db';
import { PoemCard } from '@/components/PoemCard';
import { SearchBar } from '@/components/SearchBar';
import { SortPicker } from '@/components/SortPicker';
import { EmptyState } from '@/components/EmptyState';
import { FixedHeaderScreen } from '@/components/FixedHeaderScreen';
import { useAppTheme } from '@/context/ThemeContext';
import { filterSavedPoems } from '@/lib/poemUtils';
import { sortPoems } from '@/lib/utils';
import { type SortKey } from '@/lib/theme';

export default function FavoritesScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { colors, fonts, t } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('-created_date');

  const { data, isLoading } = useQuery<Poem[]>({
    queryKey: ['poems'],
    queryFn: async () => filterSavedPoems(await db.entities.Poem.list()),
  });
  const poems: Poem[] = data ?? [];

  const updateMu = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      db.entities.Poem.update(id, data as never),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['poems'] }),
  });

  const list = useMemo(() => {
    let f = poems.filter((p) => p.is_favorite && !p.is_archived);
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.plain_text || '').toLowerCase().includes(q),
      );
    }
    return sortPoems(f, sort);
  }, [poems, search, sort]);

  const header = (
    <View>
      <Text style={styles.h1}>{t.favorites}</Text>
      <Text style={styles.sub}>
        <Text style={styles.numeric}>{list.length}</Text> {t.poemCount}
      </Text>
      <SearchBar value={search} onChange={setSearch} placeholder={t.searchPoems} />
      <View style={styles.sortRow}>
        <SortPicker value={sort} onChange={setSort} />
      </View>
    </View>
  );

  return (
    <FixedHeaderScreen header={header}>
      <FlatList
        style={{ flex: 1, marginHorizontal: -20, paddingHorizontal: 20 }}
        data={list}
        keyExtractor={(i) => i.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={list.length === 0 ? { flexGrow: 1 } : { paddingBottom: 24, paddingTop: 8 }}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="heart-outline"
              title={t.noFavorites}
              description={t.favoritesEmptyDesc}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <PoemCard
            poem={item}
            onPress={() => router.push(`/editor/${item.id}`)}
            onFavorite={() => updateMu.mutate({ id: item.id, data: { is_favorite: 0 } })}
          />
        )}
      />
    </FixedHeaderScreen>
  );
}

function createStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
) {
  return StyleSheet.create({
    h1: {
      fontFamily: fonts.display,
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    sub: { fontSize: 12, color: colors.muted, marginBottom: 16 },
    numeric: { fontFamily: 'Inter_400Regular' },
    sortRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, marginBottom: 4 },
  });
}
