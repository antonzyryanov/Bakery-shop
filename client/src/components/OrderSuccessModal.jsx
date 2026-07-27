import { createPortal } from 'react-dom';

const OrderSuccessModal = ({ open, onClose, order, t }) => {
  if (!open || !order) {
    return null;
  }

  const items = order.items || [];
  const placedAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : new Date().toLocaleString();

  return createPortal(
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="auth-modal surface order-success-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-success-title"
      >
        <header>
          <h2 id="order-success-title">{t('cart.orderMadeTitle')}</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label={t('cart.orderMadeClose')}>
            ×
          </button>
        </header>

        <div className="order-success-body">
          <p className="order-success-lead">{t('cart.orderMadeLead')}</p>

          <div className="order-success-meta">
            <div>
              <small>{t('cart.orderMadeDate')}</small>
              <strong>{placedAt}</strong>
            </div>
            <div>
              <small>{t('cart.total')}</small>
              <strong>${Number(order.totalPrice || 0).toFixed(2)}</strong>
            </div>
          </div>

          <div className="order-success-items">
            <small>{t('cart.orderMadeItems')}</small>
            <ul>
              {items.map((item) => (
                <li key={`${item.productId || item.id}-${item.quantity}`}>
                  <span>{item.productName || item.productId}</span>
                  <span>×{item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button className="checkout-btn" type="button" onClick={onClose}>
          {t('cart.orderMadeClose')}
        </button>
      </div>
    </div>,
    document.body
  );
};

export default OrderSuccessModal;
