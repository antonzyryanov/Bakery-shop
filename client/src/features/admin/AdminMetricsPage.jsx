import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AdminAccessGate from './AdminAccessGate.jsx';
import { fetchMetricsEvents, fetchMetricsLookups, fetchMetricsSummary } from '../metrics/metricsSlice.js';
import { trackActivity } from '../metrics/activityLogger.js';

const emptyFilters = {
  eventType: '',
  platform: '',
  page: '',
  customerId: '',
  sessionId: '',
  from: '',
  to: ''
};

const AdminMetricsPage = ({ t }) => {
  const dispatch = useDispatch();
  const { lookups, events, total, summary, loading, error } = useSelector((state) => state.metrics);
  const [filters, setFilters] = useState(emptyFilters);

  useEffect(() => {
    trackActivity('PAGE_VIEW', { page: 'ADMIN_METRICS' });
    dispatch(fetchMetricsLookups());
    dispatch(fetchMetricsEvents(emptyFilters));
    dispatch(fetchMetricsSummary({}));
  }, [dispatch]);

  const applyFilters = (event) => {
    event.preventDefault();
    dispatch(fetchMetricsEvents(filters));
    dispatch(fetchMetricsSummary({
      from: filters.from,
      to: filters.to,
      platform: filters.platform
    }));
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    dispatch(fetchMetricsEvents(emptyFilters));
    dispatch(fetchMetricsSummary({}));
  };

  return (
    <AdminAccessGate t={t}>
      <section className="container admin-page admin-products-page">
        <div className="surface admin-orders-toolbar">
          <div>
            <h2>{t('admin.metricsPageTitle')}</h2>
            <p>{t('admin.metricsPageSubtitle')}</p>
          </div>
          <Link className="text-link nav-link" to="/admin">{t('admin.ordersBack')}</Link>
        </div>

        <div className="stats-grid">
          <article className="stat-card surface">
            <small>{t('admin.metricsTotalEvents')}</small>
            <h3>{total}</h3>
          </article>
          {(summary.byPlatform || []).slice(0, 3).map((item) => (
            <article className="stat-card surface" key={item.code}>
              <small>{item.name}</small>
              <h3>{item.count}</h3>
            </article>
          ))}
        </div>

        <form className="surface admin-panel admin-metrics-filters" onSubmit={applyFilters}>
          <h2>{t('admin.metricsFiltersTitle')}</h2>

          <div className="admin-filter-row">
            <label>
              <span>{t('admin.metricsEventType')}</span>
              <select
                value={filters.eventType}
                onChange={(event) => setFilters({ ...filters, eventType: event.target.value })}
              >
                <option value="">{t('admin.metricsAny')}</option>
                {(lookups.eventTypes || []).map((item) => (
                  <option key={item.code} value={item.code}>{item.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span>{t('admin.metricsPlatform')}</span>
              <select
                value={filters.platform}
                onChange={(event) => setFilters({ ...filters, platform: event.target.value })}
              >
                <option value="">{t('admin.metricsAny')}</option>
                {(lookups.platforms || []).map((item) => (
                  <option key={item.code} value={item.code}>{item.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span>{t('admin.metricsPage')}</span>
              <select
                value={filters.page}
                onChange={(event) => setFilters({ ...filters, page: event.target.value })}
              >
                <option value="">{t('admin.metricsAny')}</option>
                {(lookups.pages || []).map((item) => (
                  <option key={item.code} value={item.code}>{item.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-custom-period-row">
            <label>
              <span>{t('admin.periodFrom')}</span>
              <input
                type="date"
                value={filters.from}
                onChange={(event) => setFilters({ ...filters, from: event.target.value })}
              />
            </label>
            <label>
              <span>{t('admin.periodTo')}</span>
              <input
                type="date"
                value={filters.to}
                onChange={(event) => setFilters({ ...filters, to: event.target.value })}
              />
            </label>
            <label>
              <span>{t('admin.metricsCustomerId')}</span>
              <input
                value={filters.customerId}
                onChange={(event) => setFilters({ ...filters, customerId: event.target.value })}
                placeholder="customer-id"
              />
            </label>
            <label>
              <span>{t('admin.metricsSessionId')}</span>
              <input
                value={filters.sessionId}
                onChange={(event) => setFilters({ ...filters, sessionId: event.target.value })}
                placeholder="session-id"
              />
            </label>
          </div>

          <div className="admin-filter-row">
            <button className="checkout-btn" type="submit">{t('admin.metricsApplyFilters')}</button>
            <button className="small-ghost" type="button" onClick={resetFilters}>{t('admin.metricsResetFilters')}</button>
          </div>
        </form>

        {error && <p className="error-text">{error}</p>}

        <div className="surface admin-table-wrap">
          {loading ? (
            <p>{t('admin.metricsLoading')}</p>
          ) : events.length === 0 ? (
            <p>{t('admin.metricsEmpty')}</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.metricsColTime')}</th>
                  <th>{t('admin.metricsColEvent')}</th>
                  <th>{t('admin.metricsColPlatform')}</th>
                  <th>{t('admin.metricsColPage')}</th>
                  <th>{t('admin.metricsColUser')}</th>
                  <th>{t('admin.metricsColDetails')}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{new Date(event.createdAt).toLocaleString()}</td>
                    <td>{event.eventTypeName}</td>
                    <td>{event.platformName}</td>
                    <td>{event.pageName || '—'}</td>
                    <td>{event.customerEmail || event.customerId || '—'}</td>
                    <td>
                      {[
                        event.productName ? `${t('admin.metricsProduct')}: ${event.productName}` : '',
                        event.orderId ? `${t('admin.metricsOrder')}: ${event.orderId}` : '',
                        event.sessionId ? `${t('admin.metricsSession')}: ${event.sessionId.slice(0, 10)}…` : '',
                        ...(event.attributes || []).map((attr) => `${attr.key}: ${attr.value}`)
                      ].filter(Boolean).join(' · ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </AdminAccessGate>
  );
};

export default AdminMetricsPage;
