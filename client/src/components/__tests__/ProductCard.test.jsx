import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProductCard from '../ProductCard.jsx';

const product = {
  id: 'prd-001',
  name: 'Sourdough Loaf',
  description: 'Rustic bread',
  price: 5.9
};

describe('ProductCard', () => {
  it('shows add button label when quantity is zero', () => {
    render(
      <ProductCard
        product={product}
        quantity={0}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: '+ $5.90' })).toBeInTheDocument();
  });

  it('calls decrement and increment callbacks in quantity mode', () => {
    const onIncrement = vi.fn();
    const onDecrement = vi.fn();

    render(
      <ProductCard
        product={product}
        quantity={2}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
      />
    );

    fireEvent.click(screen.getByText('-'));
    fireEvent.click(screen.getByText('+'));

    expect(onDecrement).toHaveBeenCalledTimes(1);
    expect(onIncrement).toHaveBeenCalledTimes(1);
  });
});
