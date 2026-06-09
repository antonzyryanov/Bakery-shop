import { describe, expect, it } from 'vitest';
import cartReducer, { decrementItem, incrementItem } from '../cartSlice.js';

describe('cartSlice reducer', () => {
  it('increments item quantity', () => {
    const state = cartReducer({ items: {}, placing: false, error: '', lastOrder: null }, incrementItem('prd-001'));

    expect(state.items['prd-001']).toBe(1);
  });

  it('decrements and removes item at zero', () => {
    const withOne = cartReducer(
      { items: { 'prd-001': 1 }, placing: false, error: '', lastOrder: null },
      decrementItem('prd-001')
    );

    expect(withOne.items['prd-001']).toBeUndefined();
  });
});
