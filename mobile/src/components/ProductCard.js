import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet
} from 'react-native';
import { colors, radii, spacing } from '../theme';
import { resolveAssetUrl } from '../config';

const ProductCard = ({ product, quantity, onIncrement, onDecrement, cardWidth }) => (
  <View style={[styles.card, { width: cardWidth }]}>
    <Image
      source={{ uri: resolveAssetUrl(product.imageUrl) }}
      style={styles.image}
      resizeMode="cover"
    />
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{product.name.slice(0, 1)}</Text>
    </View>
    <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
    <Text style={styles.description} numberOfLines={3}>{product.description}</Text>

    <Pressable style={styles.priceBtn} onPress={onIncrement}>
      {quantity > 0 ? (
        <View style={styles.qtyRow}>
          <Pressable
            style={styles.qtyCircle}
            onPress={(event) => {
              event?.stopPropagation?.();
              onDecrement();
            }}
          >
            <Text style={styles.qtyCircleText}>-</Text>
          </Pressable>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <Pressable style={styles.qtyCircle} onPress={onIncrement}>
            <Text style={styles.qtyCircleText}>+</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.priceText}>+ ${Number(product.price).toFixed(2)}</Text>
      )}
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.gray100
  },
  badge: {
    position: 'absolute',
    top: spacing.md + 8,
    right: spacing.md + 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.orange500,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: {
    color: colors.white,
    fontWeight: '800'
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.black900,
    marginBottom: 6
  },
  description: {
    color: colors.gray500,
    lineHeight: 20,
    marginBottom: spacing.sm,
    flexGrow: 1
  },
  priceBtn: {
    backgroundColor: colors.orange600,
    borderRadius: radii.pill,
    paddingVertical: 12,
    alignItems: 'center'
  },
  priceText: {
    color: colors.white,
    fontWeight: '800'
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  qtyCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qtyCircleText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16
  },
  qtyValue: {
    color: colors.white,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center'
  }
});

export default ProductCard;
