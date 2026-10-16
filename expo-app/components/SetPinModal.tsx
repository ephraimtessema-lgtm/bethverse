import { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePinLock } from '@/context/PinLockContext';
import { useAppTheme } from '@/context/ThemeContext';
import { PinPadInput } from '@/components/PinPadInput';

export type PinModalMode = 'set' | 'change' | 'disable';

type Props = {
  visible: boolean;
  mode: PinModalMode;
  onClose: () => void;
};

const PIN_LENGTH = 4;

export function SetPinModal({ visible, mode, onClose }: Props) {
  const { pin, savePin, removePin } = usePinLock();
  const { colors, fonts, t } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  const [step, setStep] = useState(1);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (visible) {
      setStep(1);
      setOldPin('');
      setNewPin('');
      setConfirm('');
    }
  }, [visible, mode]);

  const title =
    mode === 'set' ? t.setPin : mode === 'change' ? t.changePin : t.disablePin;

  const close = () => {
    setStep(1);
    setOldPin('');
    setNewPin('');
    setConfirm('');
    onClose();
  };

  const handleSave = async () => {
    if (mode === 'change' && oldPin !== pin) {
      Alert.alert(t.incorrectPin);
      setOldPin('');
      setStep(1);
      return;
    }
    if (newPin !== confirm) {
      Alert.alert(t.pinsDontMatch);
      setConfirm('');
      setNewPin('');
      setStep(mode === 'change' ? 2 : 1);
      return;
    }
    await savePin(newPin);
    Alert.alert(mode === 'set' ? t.pinSetSuccess : t.pinChangedSuccess);
    close();
  };

  const handleDisable = async () => {
    if (oldPin !== pin) {
      Alert.alert(t.incorrectPin);
      setOldPin('');
      return;
    }
    await removePin();
    Alert.alert(t.pinRemovedSuccess);
    close();
  };

  const primaryLabel =
    mode === 'disable'
      ? t.disablePin
      : (mode === 'set' && step === 2) || (mode === 'change' && step === 3)
        ? t.savePin
        : t.next;

  const primaryDisabled =
    mode === 'disable'
      ? oldPin.length < PIN_LENGTH
      : mode === 'change' && step === 1
        ? oldPin.length < PIN_LENGTH
        : (mode === 'set' && step === 1) || (mode === 'change' && step === 2)
          ? newPin.length < PIN_LENGTH
          : confirm.length < PIN_LENGTH;

  const onPrimary = () => {
    if (mode === 'disable') {
      handleDisable();
      return;
    }
    if (mode === 'change' && step === 1) {
      if (oldPin !== pin) {
        Alert.alert(t.incorrectPin);
        setOldPin('');
        return;
      }
      setStep(2);
      return;
    }
    if ((mode === 'set' && step === 1) || (mode === 'change' && step === 2)) {
      setStep(step + 1);
      return;
    }
    handleSave();
  };

  let pinLabel: string = t.enterNewPin;
  let pinValue = newPin;
  let pinOnChange = setNewPin;

  if (mode === 'disable') {
    pinLabel = t.enterCurrentPinDisable;
    pinValue = oldPin;
    pinOnChange = setOldPin;
  } else if (mode === 'change' && step === 1) {
    pinLabel = t.enterCurrentPin;
    pinValue = oldPin;
    pinOnChange = setOldPin;
  } else if ((mode === 'set' && step === 2) || (mode === 'change' && step === 3)) {
    pinLabel = t.confirmNewPin;
    pinValue = confirm;
    pinOnChange = setConfirm;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={close} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <PinPadInput
            label={pinLabel}
            value={pinValue}
            onChange={pinOnChange}
            length={PIN_LENGTH}
          />

          <Pressable
            style={[styles.primaryBtn, primaryDisabled && styles.primaryBtnDisabled]}
            onPress={onPrimary}
            disabled={primaryDisabled}
          >
            <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    sheet: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    closeBtn: { padding: 4 },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 20,
    },
    primaryBtnDisabled: { opacity: 0.45 },
    primaryBtnText: {
      color: colors.onPrimary,
      fontFamily: fonts.display,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
