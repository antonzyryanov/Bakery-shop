import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../theme';
import {
  cancelMyOrder,
  fetchMyChat,
  fetchMyOrders,
  sendMyChatMessage
} from '../features/customerOrdersSlice';

const statusKey = (status) => `status${status}`;

const OrdersModal = ({ visible, onClose, t }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const {
    orders,
    loading,
    error,
    messages,
    chatLoading,
    chatError,
    sending
  } = useSelector((state) => state.customerOrders);
  const [chatOpen, setChatOpen] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (visible) {
      dispatch(fetchMyOrders());
      setChatOpen(false);
      setDraft('');
    }
  }, [dispatch, visible]);

  const openChat = () => {
    setChatOpen(true);
    dispatch(fetchMyChat());
  };

  const submitMessage = async () => {
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('ordersTitle')}</Text>
            <Text style={styles.subtitle}>{t('ordersSubtitle')}</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{t('close')}</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.chatBtn} onPress={openChat}>
            <Text style={styles.chatBtnText}>{t('chat')}</Text>
          </Pressable>
        </View>

        {loading ? <Text style={styles.hint}>{t('ordersLoading')}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && orders.length === 0 ? (
          <Text style={styles.hint}>{t('ordersEmpty')}</Text>
        ) : null}

        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardId}>#{item.id.slice(0, 8)}</Text>
                <Text style={styles.status}>{t(statusKey(item.status))}</Text>
              </View>
              <Text style={styles.meta}>{t('total')}: ${Number(item.totalPrice).toFixed(2)}</Text>
              <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
              {item.phoneNumber ? <Text style={styles.meta}>{t('phone')}: {item.phoneNumber}</Text> : null}
              {item.adress ? <Text style={styles.meta}>{t('address')}: {item.adress}</Text> : null}
              <Text style={styles.items}>
                {(item.items || []).map((line) => `${line.productName} ×${line.quantity}`).join(', ') || '—'}
              </Text>
              {item.canCancel ? (
                <Pressable style={styles.cancelBtn} onPress={() => dispatch(cancelMyOrder(item.id))}>
                  <Text style={styles.cancelText}>{t('cancelOrder')}</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        />

        <Modal visible={chatOpen} animationType="slide" onRequestClose={() => setChatOpen(false)}>
          <KeyboardAvoidingView
            style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{t('chatTitle')}</Text>
              <Pressable style={styles.closeBtn} onPress={() => setChatOpen(false)}>
                <Text style={styles.closeText}>{t('close')}</Text>
              </Pressable>
            </View>

            {chatLoading ? <Text style={styles.hint}>{t('chatLoading')}</Text> : null}
            {chatError ? <Text style={styles.error}>{chatError}</Text> : null}

            <ScrollView contentContainerStyle={styles.chatList}>
              {!chatLoading && messages.length === 0 ? (
                <Text style={styles.hint}>{t('chatEmpty')}</Text>
              ) : null}
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.bubble,
                    message.senderRole === 'ADMIN' ? styles.bubbleAdmin : styles.bubbleCustomer
                  ]}
                >
                  <Text style={styles.bubbleRole}>
                    {message.senderRole === 'ADMIN' ? t('chatAdmin') : t('chatYou')}
                  </Text>
                  <Text style={styles.bubbleBody}>{message.body}</Text>
                  <Text style={styles.bubbleTime}>{new Date(message.createdAt).toLocaleString()}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.compose}>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                placeholder={t('chatPlaceholder')}
                maxLength={2000}
              />
              <Pressable
                style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendDisabled]}
                disabled={!draft.trim() || sending}
                onPress={submitMessage}
              >
                <Text style={styles.sendText}>{sending ? t('chatSending') : t('chatSend')}</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.md
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: spacing.sm
  },
  headerText: {
    flex: 1,
    gap: 4
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.black900
  },
  subtitle: {
    color: colors.black700,
    fontWeight: '600',
    lineHeight: 20
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: 'rgba(255,255,255,0.8)'
  },
  closeText: {
    fontWeight: '800',
    color: colors.black700
  },
  actions: {
    marginBottom: spacing.sm
  },
  chatBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.orange500,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.black900
  },
  chatBtnText: {
    fontWeight: '800',
    color: colors.black900
  },
  hint: {
    color: colors.gray500,
    fontWeight: '700',
    marginBottom: 8
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
    marginBottom: 8
  },
  list: {
    gap: 12,
    paddingBottom: 24
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray300,
    padding: 14,
    gap: 6
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  cardId: {
    fontWeight: '900',
    color: colors.orange700
  },
  status: {
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
    color: colors.black700
  },
  meta: {
    color: colors.black700,
    fontWeight: '600'
  },
  items: {
    marginTop: 4,
    color: colors.black900,
    fontWeight: '700',
    lineHeight: 20
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#ffe7e7',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  cancelText: {
    color: '#8c1c1c',
    fontWeight: '800'
  },
  chatList: {
    gap: 10,
    paddingVertical: 8,
    paddingBottom: 16
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: 14,
    padding: 10,
    gap: 4
  },
  bubbleCustomer: {
    alignSelf: 'flex-start',
    backgroundColor: '#f4f1ea'
  },
  bubbleAdmin: {
    alignSelf: 'flex-end',
    backgroundColor: '#fff0df'
  },
  bubbleRole: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.gray500
  },
  bubbleBody: {
    color: colors.black900,
    fontWeight: '600',
    lineHeight: 20
  },
  bubbleTime: {
    fontSize: 11,
    color: colors.gray500
  },
  compose: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff'
  },
  sendBtn: {
    backgroundColor: colors.black900,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  sendDisabled: {
    opacity: 0.5
  },
  sendText: {
    color: colors.white,
    fontWeight: '800'
  }
});

export default OrdersModal;
