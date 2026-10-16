import { useState, useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Poem } from '@/lib/db';
import { useAppTheme } from '@/context/ThemeContext';
import { displayPoemTitle } from '@/lib/poemUtils';
import { formatPoemDate } from '@/lib/utils';
import { IconButton } from '@/components/IconButton';

type Props = {
  poem: Poem;
  onPress: () => void;
  onFavorite: () => void;
  onArchive?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
};

type MenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
};

export function PoemCard({
  poem,
  onPress,
  onFavorite,
  onArchive,
  onDuplicate,
  onDelete,
}: Props) {
  const { colors, fonts, t } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuAnchorRef = useRef<View>(null);

  const displayTitle = displayPoemTitle(poem.title, poem.plain_text, t.noTitle);

  const menuItems: MenuItem[] = [
    { key: 'edit', label: t.edit, icon: 'create-outline', onPress: onPress },
  ];
  if (onDuplicate) {
    menuItems.push({ key: 'dup', label: t.duplicate, icon: 'copy-outline', onPress: onDuplicate });
  }
  if (onArchive) {
    menuItems.push({
      key: 'arch',
      label: poem.is_archived ? t.restore : t.archive,
      icon: poem.is_archived ? 'arrow-undo-outline' : 'archive-outline',
      onPress: onArchive,
    });
  }
  if (onDelete) {
    menuItems.push({ key: 'del', label: t.delete, icon: 'trash-outline', onPress: onDelete, destructive: true });
  }

  const runMenuAction = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  const toggleMenu = () => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }

    menuAnchorRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPosition({ top: y + height, left: Math.max(8, x + width - 176) });
      setMenuOpen(true);
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable onPress={onPress} style={styles.titleArea}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {displayTitle}
          </Text>
        </Pressable>
        <View style={styles.actions}>
          <IconButton onPress={onFavorite} size={36}>
            <Ionicons
              name={poem.is_favorite ? 'heart' : 'heart-outline'}
              size={20}
              color={poem.is_favorite ? colors.primary : colors.muted}
            />
          </IconButton>
          <View ref={menuAnchorRef} style={styles.menuAnchor}>
            <IconButton onPress={toggleMenu} size={36}>
              <Ionicons name="ellipsis-vertical" size={18} color={colors.muted} />
            </IconButton>
          </View>
        </View>
      </View>

      <Pressable onPress={onPress}>
        <View style={styles.footer}>
          <Text style={styles.meta}>
            {formatPoemDate(poem.created_date)}
          </Text>
        </View>
      </Pressable>

      <Modal
        visible={menuOpen}
        transparent
        animationType="none"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.menuLayer}>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
          <View style={[styles.menuCard, menuPosition]}>
            {menuItems.map((item) => (
              <Pressable
                key={item.key}
                style={styles.menuRow}
                onPress={() => runMenuAction(item.onPress)}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={item.destructive ? colors.destructive : colors.text}
                />
                <Text style={[styles.menuLabel, item.destructive && { color: colors.destructive }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'visible',
    },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
    titleArea: { flex: 1, minWidth: 0, paddingVertical: 1 },
    title: {
      fontFamily: fonts.heading,
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    actions: { flexDirection: 'row', alignItems: 'center' },
    menuAnchor: { zIndex: 20 },
    footer: {
      marginTop: 3,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    meta: { fontSize: 12, color: colors.muted, flex: 1 },
    menuLayer: { flex: 1 },
    menuBackdrop: { ...StyleSheet.absoluteFillObject },
    menuCard: {
      position: 'absolute',
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 176,
      paddingVertical: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 12,
      zIndex: 100,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    menuLabel: {
      fontFamily: fonts.body,
      fontSize: 15,
      color: colors.text,
    },
  });
}
