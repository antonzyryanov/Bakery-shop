import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

/** Black outline cart icon drawn with Views. */
const CartIcon = ({ color = colors.black900 }) => (
  <View style={styles.wrap}>
    <View style={[styles.handle, { borderColor: color }]} />
    <View style={[styles.basket, { borderColor: color }]} />
    <View style={[styles.wheel, { backgroundColor: color, left: 5 }]} />
    <View style={[styles.wheel, { backgroundColor: color, right: 5 }]} />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  handle: {
    position: 'absolute',
    top: 1,
    right: 3,
    width: 9,
    height: 8,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: colors.black900,
    borderTopRightRadius: 5
  },
  basket: {
    position: 'absolute',
    top: 7,
    left: 2,
    right: 2,
    height: 11,
    borderWidth: 2.5,
    borderRadius: 3,
    backgroundColor: 'transparent'
  },
  wheel: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2
  }
});

export default CartIcon;
