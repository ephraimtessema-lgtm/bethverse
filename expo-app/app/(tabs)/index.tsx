import { useState, useMemo, useCallback } from 'react';

import {

  View,

  Text,

  FlatList,

  Pressable,

  StyleSheet,

  Alert,

  RefreshControl,

} from 'react-native';

import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { db, type Poem } from '@/lib/db';

import { PoemCard } from '@/components/PoemCard';

import { SearchBar } from '@/components/SearchBar';

import { SortPicker } from '@/components/SortPicker';

import { EmptyState } from '@/components/EmptyState';

import { SkeletonCard } from '@/components/SkeletonCard';

import { IconButton } from '@/components/IconButton';

import { FixedHeaderScreen } from '@/components/FixedHeaderScreen';

import { AppLogo } from '@/components/AppLogo';

import { ScanButton } from '@/components/ScanButton';

import { useAppTheme } from '@/context/ThemeContext';

import { type SortKey } from '@/lib/theme';

import { sortPoems } from '@/lib/utils';

import { filterSavedPoems, poemHasContent, isPoemEmpty } from '@/lib/poemUtils';



export default function HomeScreen() {

  const router = useRouter();

  const qc = useQueryClient();

  const { colors, fonts, t } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);



  const [search, setSearch] = useState('');

  const [sort, setSort] = useState<SortKey>('-created_date');

  const [tab, setTab] = useState<'active' | 'archived'>('active');



  const { data, isLoading, refetch, isRefetching } = useQuery<Poem[]>({

    queryKey: ['poems'],

    queryFn: async () => {

      const all = await db.entities.Poem.list();

      for (const p of all.filter(isPoemEmpty)) {

        await db.entities.Poem.delete(p.id);

      }

      return filterSavedPoems(all);

    },

  });

  const poems: Poem[] = data ?? [];



  const invalidate = () => qc.invalidateQueries({ queryKey: ['poems'] });



  const updateMu = useMutation({

    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>

      db.entities.Poem.update(id, data as never),

    onSuccess: invalidate,

  });



  const deleteMu = useMutation({

    mutationFn: (id: string) => db.entities.Poem.delete(id),

    onSuccess: invalidate,

  });



  const createMu = useMutation({

    mutationFn: (payload: Partial<Poem>) => {

      if (!poemHasContent(payload.title ?? '', payload.plain_text ?? '')) {

        throw new Error('Empty poem');

      }

      return db.entities.Poem.create(payload);

    },

    onSuccess: (p) => router.push(`/editor/${p.id}`),

  });



  const filtered = useMemo(() => {

    let list = poems.filter((p) => (tab === 'archived' ? p.is_archived : !p.is_archived));

    if (search) {

      const q = search.toLowerCase();

      list = list.filter(

        (p) =>

          (p.title || '').toLowerCase().includes(q) ||

          (p.plain_text || '').toLowerCase().includes(q) ||

          (p.collection || '').toLowerCase().includes(q),

      );

    }

    return sortPoems(list, sort);

  }, [poems, search, sort, tab]);



  const activeCount = poems.filter((p) => !p.is_archived).length;

  const archivedCount = poems.filter((p) => p.is_archived).length;



  const confirmDelete = (poem: Poem) => {

    Alert.alert(t.deletePoem, `"${poem.title || t.noTitle}"`, [

      { text: t.cancel, style: 'cancel' },

      { text: t.delete, style: 'destructive', onPress: () => deleteMu.mutate(poem.id) },

    ]);

  };



  const header = (

    <View>

      <View style={styles.header}>

        <View style={styles.brand}>

          <AppLogo size={44} />

          <View>

            <Text style={styles.h1}>{t.appName}</Text>

            <Text style={styles.sub}>{t.tagline}</Text>

          </View>

        </View>

        <View style={styles.headerActions} />

      </View>

      <SearchBar value={search} onChange={setSearch} placeholder={t.searchPoems} />

      <View style={styles.toolbar}>

        <View style={styles.tabs}>

          <Pressable

            style={[styles.tab, tab === 'active' && styles.tabActive]}

            onPress={() => setTab('active')}

          >

            <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>

              {t.poems}{activeCount > 0 ? ` (${activeCount})` : ''}

            </Text>

          </Pressable>

          <Pressable

            style={[styles.tab, tab === 'archived' && styles.tabActive]}

            onPress={() => setTab('archived')}

          >

            <Ionicons

              name="archive-outline"

              size={14}

              color={tab === 'archived' ? colors.primary : colors.muted}

              style={{ marginRight: 4 }}

            />

            <Text style={[styles.tabText, tab === 'archived' && styles.tabTextActive]}>

              {archivedCount > 0 ? archivedCount : t.archive}

            </Text>

          </Pressable>

        </View>

        <SortPicker value={sort} onChange={setSort} />

      </View>

    </View>

  );



  return (

    <FixedHeaderScreen header={header}>
      {isLoading ? (

        <View style={{ paddingTop: 8 }}>

          {[0, 1, 2, 3].map((i) => (

            <SkeletonCard key={i} />

          ))}

        </View>

      ) : (
        <>
          <FlatList

          style={{ flex: 1, marginHorizontal: -20, paddingHorizontal: 20 }}

          data={filtered}

          keyExtractor={(item) => item.id}

          keyboardShouldPersistTaps="handled"

          refreshControl={

            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />

          }

          contentContainerStyle={
            filtered.length === 0 ? { flexGrow: 1 } : { paddingBottom: 144 }
          }

          ListEmptyComponent={

            <EmptyState

              title={search ? t.noPoems : tab === 'archived' ? t.noArchived : t.beginJourney}

              description={

                search ? t.noPoemsSearch : tab === 'archived' ? t.noArchivedDesc : t.beginDesc

              }

              actionLabel={!search && tab === 'active' ? t.writePoem : undefined}

              onAction={!search && tab === 'active' ? () => router.push('/editor/new') : undefined}

            />

          }

          renderItem={({ item }) => (

            <PoemCard

              poem={item}

              onPress={() => router.push(`/editor/${item.id}`)}

              onFavorite={() =>

                updateMu.mutate({ id: item.id, data: { is_favorite: item.is_favorite ? 0 : 1 } })

              }

              onArchive={() =>

                updateMu.mutate({ id: item.id, data: { is_archived: item.is_archived ? 0 : 1 } })

              }

              onDuplicate={() => {

                if (!poemHasContent(item.title, item.plain_text)) return;

                createMu.mutate({

                  title: item.title ? `${item.title} (copy)` : '',

                  plain_text: item.plain_text,

                  content: item.content,

                  collection: item.collection,

                  word_count: item.word_count,

                  char_count: item.char_count,

                });

              }}

              onDelete={() => confirmDelete(item)}

            />

          )}
          />

          <View
            pointerEvents="box-none"
            style={styles.floatingActions}
          >
            <ScanButton
              onPress={() => router.push('/ocr')}
              size={48}
              style={StyleSheet.flatten([styles.floatFabShadow, styles.floatScan])}
            />
            <IconButton
              onPress={() => router.push('/editor/new')}
              size={56}
              style={StyleSheet.flatten([styles.floatFabShadow, styles.floatAdd])}
              accessibilityLabel={t.writePoem}
              accessibilityRole="button"
            >
              <Ionicons name="add" size={26} color={colors.onPrimary} />
            </IconButton>
          </View>
        </>
      )}


    </FixedHeaderScreen>

  );

}



function createStyles(

  colors: ReturnType<typeof useAppTheme>['colors'],

  fonts: ReturnType<typeof useAppTheme>['fonts'],

) {

  return StyleSheet.create({

    header: {

      flexDirection: 'row',

      justifyContent: 'space-between',

      alignItems: 'flex-start',

      marginBottom: 16,

    },

    brand: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },

    h1: { fontFamily: fonts.display, fontSize: 24, fontWeight: '700', color: colors.text },

    sub: { fontSize: 11, color: colors.muted, marginTop: 2, maxWidth: 200 },

    headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },

    fab: { backgroundColor: colors.primary },

    floatingActions: {
      position: 'absolute',
      right: 12,
      bottom: 8,
      gap: 10,
      alignItems: 'flex-end',
    },
    floatFabShadow: {
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    floatScan: { backgroundColor: colors.mutedBg, borderWidth: 1, borderColor: colors.border },
    floatAdd: { backgroundColor: colors.primary },

    toolbar: {

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent: 'space-between',

      marginTop: 12,

      marginBottom: 4,

    },

    tabs: {

      flexDirection: 'row',

      gap: 6,

      backgroundColor: colors.mutedBg,

      borderRadius: 20,

      padding: 4,

    },

    tab: {

      flexDirection: 'row',

      alignItems: 'center',

      paddingHorizontal: 14,

      paddingVertical: 8,

      borderRadius: 16,

      minHeight: 36,

    },

    tabActive: { backgroundColor: colors.card },

    tabText: { fontSize: 12, color: colors.muted, fontWeight: '500' },

    tabTextActive: { color: colors.primary, fontWeight: '600' },

  });

}
