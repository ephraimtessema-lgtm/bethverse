import { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { db, type Poem, type Collection } from '@/lib/db';
import { FixedHeaderScreen } from '@/components/FixedHeaderScreen';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { useAppTheme } from '@/context/ThemeContext';
import { COLLECTION_COLORS } from '@/lib/theme';

export default function CollectionsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { colors, fonts, t } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [color, setColor] = useState(COLLECTION_COLORS[0]);

  const { data: collectionsData } = useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: () => db.entities.Collection.list(),
  });
  const { data: poemsData } = useQuery<Poem[]>({
    queryKey: ['poems'],
    queryFn: () => db.entities.Poem.list(),
  });
  const collections: Collection[] = collectionsData ?? [];
  const poems: Poem[] = poemsData ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['collections'] });
    qc.invalidateQueries({ queryKey: ['poems'] });
  };

  const openNew = () => {
    setEditId(null);
    setName('');
    setColor(COLLECTION_COLORS[collections.length % COLLECTION_COLORS.length]);
    setModal(true);
  };

  const openEdit = (item: Collection, itemColor: string) => {
    setEditId(item.id);
    setName(item.name);
    setColor(itemColor);
    setModal(true);
  };

  const confirmDelete = (item: Collection) => {
    Alert.alert(t.deleteCollection, `"${item.name}"`, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          await db.entities.Collection.delete(item.id);
          for (const p of poems.filter((p) => p.collection === item.name)) {
            await db.entities.Poem.update(p.id, { collection: null });
          }
          invalidate();
        },
      },
    ]);
  };

  const save = async () => {
    if (!name.trim()) return;
    if (editId) {
      const old = collections.find((c) => c.id === editId);
      await db.entities.Collection.update(editId, { name: name.trim(), color });
      if (old && old.name !== name.trim()) {
        for (const p of poems.filter((p) => p.collection === old.name)) {
          await db.entities.Poem.update(p.id, { collection: name.trim() });
        }
      }
    } else {
      await db.entities.Collection.create({ name: name.trim(), color });
    }
    invalidate();
    setModal(false);
    setName('');
    setEditId(null);
  };

  const header = (
    <View style={styles.header}>
      <View>
        <Text style={styles.h1}>{t.collections}</Text>
        <Text style={styles.sub}>
          <Text style={styles.numeric}>{collections.length}</Text> {t.collectionCount}
        </Text>
      </View>
    </View>
  );

  return (
    <FixedHeaderScreen header={header}>
      <FlatList
        style={{ flex: 1, marginHorizontal: -20, paddingHorizontal: 20 }}
        contentContainerStyle={
          collections.length === 0 ? { flexGrow: 1, paddingBottom: 110 } : { paddingBottom: 110, paddingTop: 8 }
        }
        data={collections}
        keyExtractor={(c) => c.id}
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title={t.noCollectionsYet}
            description={t.collectionsSub}
            actionLabel={t.createCollection}
            onAction={openNew}
          />
        }
        renderItem={({ item, index }) => {
          const iconColor = item.color || COLLECTION_COLORS[index % COLLECTION_COLORS.length];
          const count = poems.filter((p) => p.collection === item.name && !p.is_archived).length;
          return (
            <View style={styles.row}>
              <Pressable
                style={styles.rowMain}
                onPress={() => router.push(`/collection/${item.id}`)}
              >
                <View style={[styles.iconBox, { backgroundColor: iconColor }]}>
                  <Ionicons name="folder-open-outline" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.rowSub}>
                    <Text style={styles.numeric}>{count}</Text> {t.poemCount}
                  </Text>
                </View>
              </Pressable>
              <View style={styles.rowActions}>
                <Pressable style={styles.actionBtn} onPress={() => openEdit(item, iconColor)} hitSlop={6}>
                  <Ionicons name="create-outline" size={18} color={colors.muted} />
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => confirmDelete(item)} hitSlop={6}>
                  <Ionicons name="trash-outline" size={18} color={colors.muted} />
                </Pressable>
                <Pressable onPress={() => router.push(`/collection/${item.id}`)} hitSlop={8}>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              </View>
            </View>
          );
        }}
      />
      <IconButton onPress={openNew} size={56} style={styles.floatingAdd}>
        <Ionicons name="add" size={26} color={colors.onPrimary} />
      </IconButton>

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <Pressable style={styles.modalBg} onPress={() => setModal(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              {editId ? t.editCollection : t.newCollection}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t.collectionName}
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoFocus
            />
            <Text style={styles.colorLabel}>{t.color}</Text>
            <View style={styles.colorRow}>
              {COLLECTION_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                />
              ))}
            </View>
            <Pressable style={styles.btn} onPress={save}>
              <Text style={styles.btnText}>{editId ? t.save : t.createCollection}</Text>
            </Pressable>
            <Pressable onPress={() => setModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancel}>{t.cancel}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    },
    h1: { fontFamily: fonts.display, fontSize: 26, fontWeight: '700', color: colors.text },
    sub: { fontSize: 12, color: colors.muted, marginTop: 4 },
    numeric: { fontFamily: 'Inter_400Regular' },
    floatingAdd: {
      position: 'absolute',
      right: 12,
      bottom: 8,
      backgroundColor: colors.primary,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    rowMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minWidth: 0,
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: {
      fontFamily: fonts.heading,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    rowSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
    rowActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    actionBtn: { padding: 8 },
    modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modal: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 36,
    },
    modalTitle: {
      fontFamily: fonts.heading,
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 16,
      color: colors.text,
    },
    input: {
      backgroundColor: colors.mutedBg,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      fontSize: 16,
      color: colors.text,
    },
    colorLabel: { fontSize: 13, color: colors.muted, marginBottom: 8 },
    colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
    colorDot: { width: 36, height: 36, borderRadius: 18 },
    colorDotActive: { borderWidth: 3, borderColor: colors.primary },
    btn: { backgroundColor: colors.primary, borderRadius: 999, padding: 14, alignItems: 'center' },
    btnText: { color: colors.onPrimary, fontWeight: '600', fontFamily: fonts.display },
    cancelBtn: { paddingVertical: 12, alignItems: 'center' },
    cancel: { color: colors.muted },
  });
}
