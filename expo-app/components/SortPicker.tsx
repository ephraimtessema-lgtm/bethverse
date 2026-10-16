import { useMemo, useState } from 'react';

import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/context/ThemeContext';

import { type SortKey } from '@/lib/theme';

import { getSortOptions } from '@/lib/sortOptions';



type Props = {

  value: SortKey;

  onChange: (v: SortKey) => void;

};



export function SortPicker({ value, onChange }: Props) {

  const { colors, t } = useAppTheme();

  const [open, setOpen] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const options = getSortOptions(t);

  const label = options.find((o) => o.value === value)?.label ?? t.sortNewest;



  return (

    <>

      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>

        <Ionicons name="swap-vertical" size={14} color={colors.muted} />

        <Text style={styles.triggerText}>{label}</Text>

        <Ionicons name="chevron-down" size={12} color={colors.muted} />

      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>

        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>

          <View style={styles.sheet}>

            <Text style={styles.sheetTitle}>{t.sortBy}</Text>

            {options.map((opt) => (

              <Pressable

                key={opt.value}

                style={[styles.option, value === opt.value && styles.optionActive]}

                onPress={() => {

                  onChange(opt.value);

                  setOpen(false);

                }}

              >

                <Text style={[styles.optionText, value === opt.value && styles.optionTextActive]}>

                  {opt.label}

                </Text>

                {value === opt.value ? (

                  <Ionicons name="checkmark" size={18} color={colors.primary} />

                ) : null}

              </Pressable>

            ))}

          </View>

        </Pressable>

      </Modal>

    </>

  );

}



function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {

  return StyleSheet.create({

    trigger: {

      flexDirection: 'row',

      alignItems: 'center',

      gap: 4,

      backgroundColor: colors.mutedBg,

      paddingHorizontal: 12,

      paddingVertical: 8,

      borderRadius: 20,

    },

    triggerText: { fontSize: 12, color: colors.text, fontWeight: '500' },

    backdrop: {

      flex: 1,

      backgroundColor: 'rgba(0,0,0,0.4)',

      justifyContent: 'flex-end',

    },

    sheet: {

      backgroundColor: colors.card,

      borderTopLeftRadius: 24,

      borderTopRightRadius: 24,

      padding: 20,

      paddingBottom: 36,

    },

    sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },

    option: {

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent: 'space-between',

      paddingVertical: 14,

      borderBottomWidth: 1,

      borderBottomColor: colors.border,

    },

    optionActive: { backgroundColor: colors.primarySoft, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 12 },

    optionText: { fontSize: 16, color: colors.text },

    optionTextActive: { color: colors.primary, fontWeight: '600' },

  });

}


