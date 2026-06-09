import { createPortal } from 'react-dom';

const CartDrawer = ({ open, onClose, items, productsById, total, onCheckout, placing, error, t }) => {
  if (!open) {
    return null;
  }

  const cartEntries = Object.entries(items).filter(([, qty]) => qty > 0);

  return createPortal(
    <div className="overlay" onClick={onClose}>
      <aside className="cart-drawer" onClick={(event) => event.stopPropagation()}>
        <header>
          <h2>{t('cart.title')}</h2>
          <button className="icon-btn" onClick={onClose}>x</button>
        </header>

        <div className="cart-list">
          {!cartEntries.length && <p>{t('cart.empty')}</p>}
          {cartEntries.map(([id, qty]) => {
            const product = productsById[id];
            if (!product) {
              return null;
            }
            return (
              <div className="cart-row" key={id}>
                <div>
                  <strong>{product.name}</strong>
                  <small>{qty} x ${Number(product.price).toFixed(2)}</small>
                </div>
                <b>${(Number(product.price) * qty).toFixed(2)}</b>
              </div>
            );
          })}
        </div>

        <footer>
          <h3>{t('cart.total')}: ${total.toFixed(2)}</h3>
          {error && <p className="error-text">{error}</p>}
          <button className="checkout-btn" disabled={!cartEntries.length || placing} onClick={onCheckout}>
            {placing ? t('cart.processing') : t('cart.placeOrder')}
          </button>
        </footer>
      </aside>
    </div>,
    document.body
  );
};

export default CartDrawer;
