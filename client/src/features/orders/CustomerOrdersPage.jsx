import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  cancelMyOrder,
  fetchMyChat,
  fetchMyOrders,
  sendMyChatMessage,
  setChatOpen
} from './customerOrdersSlice.js';

const CustomerOrdersPage = ({ t }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    orders,
    loading,
    error,
    chatOpen,
    messages,
    chatLoading,
    chatError,
    sending
  } = useSelector((state) => state.customerOrders);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (user) {
      dispatch(fetchMyOrders());
    }
  }, [dispatch, user]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const openChat = () => {
    dispatch(setChatOpen(true));
    dispatch(fetchMyChat());
  };

  const submitMessage = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) {
      return;
    }
    const action = await dispatch(sendMyChatMessage(body));
    if (!action.error) {
      setDraft('');
    }
  };

  return (
    <section className="container admin-page">
      <div className="surface admin-orders-toolbar">
        <div>
          <h2>{t('orders.pageTitle')}</h2>
          <p>{t('orders.pageSubtitle')}</p>
        </div>
        <div className="page-toolbar-actions">
          <button className="ghost-btn" type="button" onClick={openChat}>{t('orders.chat')}</button>
          <Link className="ghost-btn nav-link" to="/">{t('orders.backToShop')}</Link>
        </div>
      </div>

      {loading && <section className="loading-block surface">{t('orders.loading')}</section>}
      {error && <p className="error-text">{error}</p>}

      {!loading && orders.length === 0 && (
        <section className="surface admin-orders-empty">
          <h3>{t('orders.emptyTitle')}</h3>
          <p>{t('orders.emptyHint')}</p>
        </section>
      )}

      <div className="orders-board">
        {orders.map((order) => (
          <article className="order-card surface" key={order.id}>
            <div className="order-card-head">
              <div>
                <span className="order-card-index">#{order.id.slice(0, 8)}</span>
                <h3>{t(`orders.status.${order.status}`)}</h3>
              </div>
              <span className={`order-status-badge order-status-${String(order.status).toLowerCase()}`}>
                {t(`orders.status.${order.status}`)}
              </span>
            </div>

            <div className="order-card-grid">
              <div>
                <small>{t('orders.total')}</small>
                <strong>${Number(order.totalPrice).toFixed(2)}</strong>
              </div>
              <div>
                <small>{t('orders.createdAt')}</small>
                <strong>{new Date(order.createdAt).toLocaleString()}</strong>
              </div>
              {order.phoneNumber ? (
                <div>
                  <small>{t('orders.phone')}</small>
                  <strong>{order.phoneNumber}</strong>
                </div>
              ) : null}
              {order.adress ? (
                <div className="order-card-wide">
                  <small>{t('orders.address')}</small>
                  <strong>{order.adress}</strong>
                </div>
              ) : null}
              <div className="order-card-wide">
                <small>{t('orders.items')}</small>
                <strong>
                  {(order.items || []).map((item) => (
                    `${item.productName} ×${item.quantity}`
                  )).join(', ') || '—'}
                </strong>
              </div>
            </div>

            {order.canCancel && (
              <button
                className="small-danger"
                type="button"
                onClick={() => dispatch(cancelMyOrder(order.id))}
              >
                {t('orders.cancel')}
              </button>
            )}
          </article>
        ))}
      </div>

      {chatOpen && (
        <div className="modal-backdrop" onClick={() => dispatch(setChatOpen(false))}>
          <div className="auth-modal surface chat-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <h2>{t('orders.chatTitle')}</h2>
              <button className="icon-btn" type="button" onClick={() => dispatch(setChatOpen(false))}>×</button>
            </header>

            <div className="chat-messages">
              {chatLoading && <p>{t('orders.chatLoading')}</p>}
              {chatError && <p className="error-text">{chatError}</p>}
              {!chatLoading && messages.length === 0 && <p>{t('orders.chatEmpty')}</p>}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-bubble ${message.senderRole === 'ADMIN' ? 'chat-bubble-admin' : 'chat-bubble-customer'}`}
                >
                  <small>{message.senderRole === 'ADMIN' ? t('orders.chatAdmin') : t('orders.chatYou')}</small>
                  <p>{message.body}</p>
                  <span>{new Date(message.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <form className="chat-compose" onSubmit={submitMessage}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={t('orders.chatPlaceholder')}
                maxLength={2000}
              />
              <button className="checkout-btn" type="submit" disabled={sending || !draft.trim()}>
                {sending ? t('orders.chatSending') : t('orders.chatSend')}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default CustomerOrdersPage;
