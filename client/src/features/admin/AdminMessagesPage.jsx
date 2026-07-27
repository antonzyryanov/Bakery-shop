import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiFetch } from '../../app/api.js';
import AdminAccessGate from './AdminAccessGate.jsx';

const AdminMessagesPage = ({ t }) => {
  const { user } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeCustomer, setActiveCustomer] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return undefined;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch('/api/chat/admin/conversations');
        if (!cancelled) {
          setConversations(data.conversations || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load conversations.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const openConversation = async (conversation) => {
    setActiveId(conversation.id);
    setActiveCustomer(conversation.customerEmail);
    setError('');
    try {
      const data = await apiFetch(`/api/chat/admin/conversations/${conversation.id}`);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message || 'Failed to load messages.');
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!activeId || !draft.trim()) {
      return;
    }

    setSending(true);
    setError('');
    try {
      const data = await apiFetch(`/api/chat/admin/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft.trim() })
      });
      setMessages((prev) => [...prev, data.message]);
      setDraft('');
      const list = await apiFetch('/api/chat/admin/conversations');
      setConversations(list.conversations || []);
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminAccessGate t={t}>
      <section className="container admin-page admin-products-page">
        <div className="surface admin-orders-toolbar">
          <div>
            <h2>{t('admin.messagesPageTitle')}</h2>
            <p>{t('admin.messagesPageSubtitle')}</p>
          </div>
          <Link className="text-link nav-link" to="/admin">{t('admin.ordersBack')}</Link>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="admin-chat-layout">
          <aside className="surface admin-chat-list">
            <h3>{t('admin.messagesConversations')}</h3>
            {loading && <p>{t('admin.messagesLoading')}</p>}
            {!loading && conversations.length === 0 && <p>{t('admin.messagesEmpty')}</p>}
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={`admin-chat-list-item ${activeId === conversation.id ? 'active' : ''}`}
                onClick={() => openConversation(conversation)}
              >
                <strong>{conversation.customerEmail}</strong>
                <span>{conversation.lastMessage || t('admin.messagesNoPreview')}</span>
              </button>
            ))}
          </aside>

          <div className="surface admin-chat-panel">
            {!activeId ? (
              <p>{t('admin.messagesPick')}</p>
            ) : (
              <>
                <header className="admin-chat-panel-head">
                  <h3>{activeCustomer}</h3>
                </header>
                <div className="chat-messages">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`chat-bubble ${message.senderRole === 'ADMIN' ? 'chat-bubble-admin' : 'chat-bubble-customer'}`}
                    >
                      <small>{message.senderRole === 'ADMIN' ? t('admin.messagesYou') : message.senderEmail}</small>
                      <p>{message.body}</p>
                      <span>{new Date(message.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <form className="chat-compose" onSubmit={sendMessage}>
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={t('admin.messagesPlaceholder')}
                    maxLength={2000}
                  />
                  <button className="checkout-btn" type="submit" disabled={sending || !draft.trim()}>
                    {sending ? t('admin.messagesSending') : t('admin.messagesSend')}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </AdminAccessGate>
  );
};

export default AdminMessagesPage;
