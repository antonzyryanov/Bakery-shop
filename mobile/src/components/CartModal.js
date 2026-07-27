import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../theme';

const CartModal = ({
  visible,
  onClose,
  items,
  productsById,
  total,
  onCheckout,
  placing,
  error,
  t
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [adress, setAdress] = useState('');
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const rows = useMemo(
    () => Object.entries(items)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({
        id,
        qty,
        product: productsById[id]
      }))
      .filter((row) => row.product),
    [items, productsById]
  );

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
        <View
          style={[
            styles.sheet,
            {
              marginHorizontal: 16,
              marginBottom: Math.max(insets.bottom, 16),
              maxHeight: height * 0.82
            }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t('cart')}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>{t('close')}</Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {rows.length === 0 ? (
              <Text style={styles.empty}>{t('emptyCart')}</Text>
            ) : (
              rows.map((row) => (
                <View key={row.id} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{row.product.name}</Text>
                    <Text style={styles.rowMeta}>x{row.qty}</Text>
                  </View>
                  <Text style={styles.rowPrice}>
                    ${(Number(row.product.price) * row.qty).toFixed(2)}
                  </Text>
                </View>
              ))
            )}

            {rows.length > 0 && (
              <>
                <Text style={styles.label}>{t('phone')}</Text>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
                <Text style={styles.label}>{t('address')}</Text>
                <TextInput
                  style={styles.input}
                  value={adress}
                  onChangeText={setAdress}
                />
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.total}>{t('total')}: ${Number(total).toFixed(2)}</Text>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable
              style={[styles.primaryBtn, rows.length === 0 && styles.disabled]}
              disabled={placing || rows.length === 0}
              onPress={() => onCheckout({ phoneNumber, adress })}
            >
              <Text style={styles.primaryText}>
                {placing ? t('processing') : t('placeOrder')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end'
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  title: {
    fontSize: 22,
    fontWeight: '800'
  },
  close: {
    fontWeight: '700',
    color: colors.orange700
  },
  empty: {
    color: colors.gray500,
    marginVertical: spacing.lg
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm
  },
  rowName: {
    fontWeight: '800',
    color: colors.black900
  },
  rowMeta: {
    color: colors.gray500,
    marginTop: 2
  },
  rowPrice: {
    fontWeight: '800'
  },
  label: {
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: spacing.sm
  },
  footer: {
    marginTop: spacing.md,
    gap: 10
  },
  total: {
    fontSize: 18,
    fontWeight: '800'
  },
  error: {
    color: colors.danger
  },
  primaryBtn: {
    backgroundColor: colors.black900,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center'
  },
  disabled: {
    opacity: 0.5
  },
  primaryText: {
    color: colors.white,
    fontWeight: '800'
  }
});

export default CartModal;
