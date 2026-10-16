import { useState, useEffect, useCallback, useMemo } from 'react';

import {

  View,

  Text,

  TextInput,

  Pressable,

  StyleSheet,

  ScrollView,

  KeyboardAvoidingView,

  Platform,

  Modal,

} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Ionicons } from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';

import { db, plainTextToHtml, type Poem, type Collection } from '@/lib/db';

import { useAppTheme } from '@/context/ThemeContext';

import { IconButton } from '@/components/IconButton';

import { poemHasContent } from '@/lib/poemUtils';

import { consumeEditorDraft } from '@/lib/editorDraft';



export default function EditorScreen() {

  const { id } = useLocalSearchParams<{ id: string }>();

  const isNew = id === 'new';

  const router = useRouter();

  const qc = useQueryClient();

  const { colors, fonts, t } = useAppTheme();

  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  const [poemId, setPoemId] = useState<string | null>(isNew ? null : id ?? null);

  const [title, setTitle] = useState('');

  const [body, setBody] = useState('');

  const [collection, setCollection] = useState<string | null>(null);

  const [collectionModal, setCollectionModal] = useState(false);

  const [saving, setSaving] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);



  const { data: poem, isLoading } = useQuery<Poem | undefined>({

    queryKey: ['poem', poemId],

    queryFn: async () => {

      const rows = await db.entities.Poem.filter({ id: poemId! });

      return rows[0];

    },

    enabled: !!poemId && id !== 'new',

  });



  const { data: collectionsData } = useQuery<Collection[]>({

    queryKey: ['collections'],

    queryFn: () => db.entities.Collection.list(),

  });

  const collections: Collection[] = collectionsData ?? [];



  useEffect(() => {

    if (isNew) {

      const draft = consumeEditorDraft();

      if (draft) {

        setTitle(draft.title ?? '');

        setBody(draft.body ?? '');

        setHasChanges(poemHasContent(draft.title ?? '', draft.body ?? ''));

      }

      return;

    }

    if (poem) {

      setTitle(poem.title || '');

      setBody(poem.plain_text || '');

      setCollection(poem.collection);

      setIsFavorite(!!poem.is_favorite);

      setHasChanges(false);

    }

  }, [poem, isNew]);



  const invalidate = useCallback(() => {

    qc.invalidateQueries({ queryKey: ['poems'] });

    if (poemId) qc.invalidateQueries({ queryKey: ['poem', poemId] });

  }, [qc, poemId]);



  const save = useCallback(async () => {

    if (!poemHasContent(title, body)) {

      if (poemId) {

        await db.entities.Poem.delete(poemId);

        invalidate();

        setPoemId(null);

      }

      setSaving(false);

      setHasChanges(false);

      return;

    }



    setSaving(true);

    const words = body.trim() ? body.trim().split(/\s+/).length : 0;

    const payload = {

      title: title.trim(),

      plain_text: body,

      content: plainTextToHtml(body),

      word_count: words,

      char_count: body.length,

      collection,

      is_favorite: isFavorite ? 1 : 0,

      is_archived: poem?.is_archived ?? 0,

    };



    if (poemId) {
      const editCount = poem?.edit_count ?? 0;
      await db.entities.Poem.update(poemId, {
        ...payload,
        edit_count: poem ? editCount + 1 : editCount,
      });
    } else {
      const created = await db.entities.Poem.create(payload);
      setPoemId(created.id);
      if (id === 'new') router.replace(`/editor/${created.id}`);
    }



    invalidate();

    setSaving(false);

    setHasChanges(false);

  }, [title, body, collection, poemId, poem, isFavorite, isNew, router, invalidate]);



  const goBack = async () => {

    router.back();

  };



  const toggleFavorite = async () => {

    const next = !isFavorite;

    setIsFavorite(next);

    if (poemId && poem) {

      await db.entities.Poem.update(poemId, { is_favorite: next ? 1 : 0 });

      invalidate();

    } else {

      setHasChanges(true);

    }

  };



  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  const statusLabel = saving ? t.saving : hasChanges ? t.unsaved : poemHasContent(title, body) ? t.saved : '';
  const canSave = !saving && (poemHasContent(title, body) || !!poemId);



  if (!isNew && isLoading) {

    return (

      <SafeAreaView style={[styles.flex, { alignItems: 'center', justifyContent: 'center' }]} edges={['top']}>

        <Text style={{ color: colors.muted }}>{t.saving}</Text>

      </SafeAreaView>

    );

  }



  return (

    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>

      <KeyboardAvoidingView

        style={styles.flex}

        behavior={Platform.OS === 'ios' ? 'padding' : undefined}

      >

        <View style={styles.topBar}>

          <IconButton onPress={goBack} size={44}>

            <Ionicons name="arrow-back" size={24} color={colors.text} />

          </IconButton>

          <Text style={styles.saveLabel}>{statusLabel}</Text>

          <View style={styles.topActions}>

            <IconButton onPress={toggleFavorite} size={44} disabled={!poemHasContent(title, body)}>

              <Ionicons

                name={isFavorite ? 'heart' : 'heart-outline'}

                size={24}

                color={isFavorite ? colors.primary : colors.muted}

              />

            </IconButton>

            <Pressable
              onPress={save}
              disabled={!canSave}
              style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            >
              <Ionicons name="save-outline" size={17} color={colors.onPrimary} />
              <Text style={styles.saveButtonText}>{t.save}</Text>
            </Pressable>

          </View>

        </View>



        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">

          <Pressable style={styles.collectionBtn} onPress={() => setCollectionModal(true)}>

            <Ionicons name="folder-outline" size={16} color={colors.primary} />

            <Text style={styles.collectionText}>{collection || t.noCollection}</Text>

            <Ionicons name="chevron-down" size={16} color={colors.muted} />

          </Pressable>

          <TextInput

            value={title}

            onChangeText={(next) => {
              setTitle(next);
              setHasChanges(true);
            }}

            placeholder={t.poemTitle}

            style={styles.titleInput}

            placeholderTextColor={colors.muted}

          />

          <TextInput

            value={body}

            onChangeText={(next) => {
              setBody(next);
              setHasChanges(true);
            }}

            placeholder={t.poemBody}

            multiline

            textAlignVertical="top"

            style={styles.bodyInput}

            placeholderTextColor={colors.muted}

          />

        </ScrollView>



        <View style={styles.stats}>

          <Text style={styles.statsText}>

            {words} {t.words} · {body.length} {t.chars} · ~{Math.max(1, Math.ceil(words / 200))} {t.minRead}

          </Text>

        </View>



        <Modal visible={collectionModal} transparent animationType="fade" onRequestClose={() => setCollectionModal(false)}>

          <Pressable style={styles.modalBackdrop} onPress={() => setCollectionModal(false)}>

            <Pressable style={styles.modalSheet} onPress={() => {}}>

              <Text style={styles.modalTitle}>{t.collections}</Text>

              <Pressable

                style={styles.modalRow}

                onPress={() => {

                  setCollection(null);

                  setHasChanges(true);

                  setCollectionModal(false);

                }}

              >

                <Text style={styles.modalRowText}>{t.none}</Text>

              </Pressable>

              {collections.map((c) => (

                <Pressable

                  key={c.id}

                  style={styles.modalRow}

                  onPress={() => {

                    setCollection(c.name);

                    setHasChanges(true);

                    setCollectionModal(false);

                  }}

                >

                  <Text style={styles.modalRowText}>{c.name}</Text>

                </Pressable>

              ))}

            </Pressable>

          </Pressable>

        </Modal>

      </KeyboardAvoidingView>

    </SafeAreaView>

  );

}



function createStyles(

  colors: ReturnType<typeof useAppTheme>['colors'],

  fonts: ReturnType<typeof useAppTheme>['fonts'],

) {

  return StyleSheet.create({

    flex: { flex: 1, backgroundColor: colors.background },

    topBar: {

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent: 'space-between',

      paddingHorizontal: 8,

      paddingBottom: 12,

      borderBottomWidth: 1,

      borderBottomColor: colors.border,

      backgroundColor: colors.background,

    },

    saveLabel: { fontSize: 12, color: colors.muted },

    topActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },

    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 12,
      minHeight: 38,
    },

    saveButtonDisabled: { opacity: 0.45 },

    saveButtonText: { color: colors.onPrimary, fontWeight: '700', fontSize: 13 },

    body: { flex: 1, padding: 20 },

    collectionBtn: {

      flexDirection: 'row',

      alignItems: 'center',

      gap: 6,

      marginBottom: 12,

      paddingVertical: 8,

      minHeight: 44,

    },

    collectionText: { flex: 1, fontSize: 14, color: colors.primary },

    titleInput: {

      fontFamily: fonts.display,

      fontSize: 24,

      fontWeight: '700',

      marginBottom: 16,

      color: colors.text,

    },

    modalBackdrop: {

      flex: 1,

      backgroundColor: 'rgba(0,0,0,0.4)',

      justifyContent: 'flex-end',

    },

    modalSheet: {

      backgroundColor: colors.card,

      borderTopLeftRadius: 16,

      borderTopRightRadius: 16,

      padding: 20,

      paddingBottom: 40,

    },

    modalTitle: {

      fontFamily: fonts.heading,

      fontSize: 18,

      fontWeight: '700',

      marginBottom: 12,

      color: colors.text,

    },

    modalRow: {

      paddingVertical: 14,

      borderBottomWidth: 1,

      borderBottomColor: colors.border,

      minHeight: 48,

      justifyContent: 'center',

    },

    modalRowText: { fontSize: 16, color: colors.text },

    bodyInput: {

      fontFamily: fonts.body,

      fontSize: 16,

      lineHeight: 26,

      minHeight: 300,

      color: colors.text,

    },

    stats: { padding: 12, borderTopWidth: 1, borderTopColor: colors.border },

    statsText: { fontSize: 12, color: colors.muted, textAlign: 'center' },

  });

}


