import { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { db, type Poem, type Collection } from '@/lib/db';
import { PoemCard } from '@/components/PoemCard';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { FixedHeaderScreen } from '@/components/FixedHeaderScreen';
import { useAppTheme } from '@/context/ThemeContext';
import { filterSavedPoems } from '@/lib/poemUtils';

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { colors, fonts, t } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);
  const [search, setSearch] = useState('');

  const { data: collectionsData } = useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: () => db.entities.Collection.list(),
  });
  const { data: poemsData } = useQuery<Poem[]>({
    queryKey: ['poems'],
    queryFn: async () => filterSavedPoems(await db.entities.Poem.list()),
  });
  const collections: Collection[] = collectionsData ?? [];
  const poems: Poem[] = poemsData ?? [];

  const collection = collections.find((c) => c.id === id);
  const filtered = useMemo(() => {
    let list = poems.filter((p) => p.collection === collection?.name && !p.is_archived);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.plain_text || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [poems, collection, search]);

  const header = (
    <View>
      <View style={styles.header}>
        <IconButton onPress={() => router.back()} size={44}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <View style={styles.headerText}>
          <Text style={styles.h1}>{collection?.name || t.collections}</Text>
          <Text style={styles.sub}>
            {filtered.length} {t.poems.toLowerCase()}
          </Text>
        </View>
      </View>
      <SearchBar value={search} onChange={setSearch} placeholder={t.searchPoems} />
    </View>
  );

  return (
    <FixedHeaderScreen header={header}>
      <FlatList
        style={{ flex: 1, marginHorizontal: -20, paddingHorizontal: 20 }}
        data={filtered}
        keyExtractor={(i) => i.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={filtered.length === 0 ? { flexGrow: 1 } : { paddingBottom: 24, paddingTop: 8 }}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title={t.noPoems}
            description={t.collectionsSub}
          />
        }
        renderItem={({ item }) => (
          <PoemCard
            poem={item}
            onPress={() => router.push(`/editor/${item.id}`)}
            onFavorite={async () => {
              await db.entities.Poem.update(item.id, { is_favorite: item.is_favorite ? 0 : 1 });
              qc.invalidateQueries({ queryKey: ['poems'] });
            }}
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
    header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
    headerText: { flex: 1 },
    h1: { fontFamily: fonts.display, fontSize: 22, fontWeight: '700', color: colors.text },
    sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  });
}
