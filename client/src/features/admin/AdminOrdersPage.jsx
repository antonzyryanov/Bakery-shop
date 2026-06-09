import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminOrders, fetchAdminStats } from './adminSlice.js';
import AdminAccessGate from './AdminAccessGate.jsx';

const AdminOrdersPage = ({ t }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    stats,
    orders,
    ordersRange,
    ordersLoading,
    ordersError
  } = useSelector((state) => state.admin);

  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [customRangeError, setCustomRangeError] = useState('');

  const isInitialOrdersLoad = ordersLoading && orders.length === 0;

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      dispatch(fetchAdminStats());
      dispatch(fetchAdminOrders('last_month'));
    }
  }, [dispatch, user]);

  const applyPresetRange = (range) => {
    setCustomRangeError('');
    dispatch(fetchAdminOrders(range));
  };

  const applyCustomRange = () => {
    if (!customFrom || !customTo) {
      setCustomRangeError(t('admin.periodValidationError'));
      return;
    }

    if (customTo < customFrom) {
      setCustomRangeError(t('admin.periodValidationError'));
      return;
    }

    setCustomRangeError('');
    dispatch(fetchAdminOrders({
      range: 'custom',
      from: customFrom,
      to: customTo
    }));
  };

  return (
    <AdminAccessGate t={t}>
      <section className="container admin-orders-page">
        <div className="stats-grid">
          <article className="stat-card surface">
            <small>{t('admin.totalOrders')}</small>
            <h3>{stats?.totalOrders || 0}</h3>
          </article>
          <article className="stat-card surface">
            <small>{t('admin.totalCustomers')}</small>
            <h3>{stats?.totalCustomers || 0}</h3>
          </article>
          <article className="stat-card surface">
            <small>{t('admin.totalProducts')}</small>
            <h3>{stats?.totalProducts || 0}</h3>
          </article>
          <article className="stat-card surface">
            <small>{t('admin.revenue')}</small>
            <h3>${Number(stats?.revenue || 0).toFixed(2)}</h3>
          </article>
        </div>

        <div className="surface admin-orders-toolbar">
          <div>
            <h2>{t('admin.ordersTitle')}</h2>
            <p>{t('admin.ordersToolbarHint')}</p>
          </div>

          <div className="admin-filter-row" role="group" aria-label={t('admin.ordersFilterLabel')}>
            <button
              className={`small-ghost ${ordersRange === 'last_day' ? 'active-filter' : ''}`}
              onClick={() => applyPresetRange('last_day')}
              type="button"
            >
              {t('admin.lastDay')}
            </button>
            <button
              className={`small-ghost ${ordersRange === 'last_week' ? 'active-filter' : ''}`}
              onClick={() => applyPresetRange('last_week')}
              type="button"
            >
              {t('admin.lastWeek')}
            </button>
            <button
              className={`small-ghost ${ordersRange === 'last_month' ? 'active-filter' : ''}`}
              onClick={() => applyPresetRange('last_month')}
              type="button"
            >
              {t('admin.lastMonth')}
            </button>
            <button
              className={`small-ghost ${ordersRange === 'last_year' ? 'active-filter' : ''}`}
              onClick={() => applyPresetRange('last_year')}
              type="button"
            >
              {t('admin.lastYear')}
            </button>
            <button
              className={`small-ghost ${ordersRange === 'custom' ? 'active-filter' : ''}`}
              onClick={applyCustomRange}
              type="button"
            >
              {t('admin.choosePeriod')}
            </button>
          </div>

          <div className="admin-custom-period-row">
            <label>
              <span>{t('admin.periodFrom')}</span>
              <input
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
              />
            </label>
            <label>
              <span>{t('admin.periodTo')}</span>
              <input
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
              />
            </label>
            <button
              className="small-ghost"
              onClick={applyCustomRange}
              type="button"
            >
              {t('admin.applyPeriod')}
            </button>
          </div>
          {customRangeError && <p className="error-text">{customRangeError}</p>}
        </div>

        {ordersError && <p className="error-text">{ordersError}</p>}

        {isInitialOrdersLoad ? (
          <div className="surface admin-orders-loading">
            <p>{t('admin.ordersLoading')}</p>
          </div>
        ) : (
          <div className="orders-board" aria-busy={ordersLoading}>
            {!orders.length ? (
              <div className="surface admin-orders-empty">
                <h3>{t('admin.noOrders')}</h3>
                <p>{t('admin.ordersEmptyHint')}</p>
              </div>
            ) : (
              orders.map((order, index) => (
                <article className="surface order-card" key={order.id}>
                  <div className="order-card-head">
                    <div>
                      <span className="order-card-index">{String(index + 1).padStart(2, '0')}</span>
                      <h3>#{order.id}</h3>
                    </div>
                    <span className={`order-status-badge order-status-${String(order.status || 'unknown').toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="order-card-grid">
                    <div>
                      <small>{t('admin.orderCustomer')}</small>
                      <strong>{order.customerEmail}</strong>
                    </div>
                    <div>
                      <small>{t('admin.orderPhone')}</small>
                      <strong>{order.phoneNumber || '-'}</strong>
                    </div>
                    <div className="order-card-wide">
                      <small>{t('admin.orderAdress')}</small>
                      <strong>{order.adress || '-'}</strong>
                    </div>
                    <div>
                      <small>{t('admin.orderTotal')}</small>
                      <strong>${Number(order.totalPrice).toFixed(2)}</strong>
                    </div>
                    <div>
                      <small>{t('admin.orderCreatedAt')}</small>
                      <strong>{new Date(order.createdAt).toLocaleString()}</strong>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </AdminAccessGate>
  );
};

export default AdminOrdersPage;