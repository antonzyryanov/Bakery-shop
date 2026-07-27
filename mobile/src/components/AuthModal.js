import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../theme';

const AuthModal = ({
  visible,
  onClose,
  mode,
  setMode,
  onSubmit,
  loading,
  error,
  t
}) => {
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const submit = () => {
    if (mode === 'signin') {
      onSubmit({ identifier, password });
      return;
    }

    onSubmit({ email, password });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      navigationBarTranslucent={Platform.OS === 'android'}
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { minHeight: height }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.sheet,
              {
                marginTop: Math.max(insets.top, 16) + 8,
                marginBottom: Math.max(insets.bottom, 16) + 8,
                marginHorizontal: 16,
                maxHeight: height - Math.max(insets.top, 16) - Math.max(insets.bottom, 16) - 40
              }
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>
                {mode === 'signin' ? t('welcomeBack') : t('createAccount')}
              </Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Text style={styles.close}>{t('close')}</Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
            >
              {mode === 'signin' ? (
                <>
                  <Text style={styles.label}>{t('emailOrLogin')}</Text>
                  <TextInput
                    style={styles.input}
                    autoCapitalize="none"
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder="Admin or you@bakery.com"
                  />
                </>
              ) : (
                <>
                  <Text style={styles.label}>{t('email')}</Text>
                  <TextInput
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@bakery.com"
                  />
                </>
              )}

              <Text style={styles.label}>{t('password')}</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="********"
              />

              {!!error && <Text style={styles.error}>{error}</Text>}

              <Pressable style={styles.primaryBtn} onPress={submit} disabled={loading}>
                <Text style={styles.primaryText}>
                  {loading ? t('processing') : (mode === 'signin' ? t('signIn') : t('signUp'))}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                style={styles.switchBtn}
              >
                <Text style={styles.switchText}>
                  {mode === 'signin' ? t('needAccount') : t('haveAccount')}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center'
  },
  sheetWrap: {
    width: '100%',
    justifyContent: 'center'
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  formContent: {
    paddingBottom: spacing.sm
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.black900,
    flex: 1,
    paddingRight: 12
  },
  close: {
    fontWeight: '700',
    color: colors.orange700
  },
  label: {
    fontWeight: '700',
    marginBottom: 6,
    color: colors.black700
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: spacing.sm,
    backgroundColor: colors.white
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.sm
  },
  primaryBtn: {
    backgroundColor: colors.black900,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm
  },
  primaryText: {
    color: colors.white,
    fontWeight: '800'
  },
  switchBtn: {
    marginTop: spacing.md,
    alignItems: 'center'
  },
  switchText: {
    color: colors.orange700,
    fontWeight: '700'
  }
});

export default AuthModal;
