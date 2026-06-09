import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminStats } from './adminSlice.js';
import AdminAccessGate from './AdminAccessGate.jsx';

const AdminPage = ({ t }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats } = useSelector((state) => state.admin);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      dispatch(fetchAdminStats());
    }
  }, [dispatch, user]);

  return (
    <AdminAccessGate t={t}>
      <section className="container admin-page admin-dashboard-page">
        <div className="surface admin-orders-toolbar">
          <div>
            <h2>{t('admin.dashboardTitle')}</h2>
            <p>{t('admin.dashboardSubtitle')}</p>
          </div>
        </div>

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

        <div className="admin-sections-grid">
          <Link className="surface admin-section-card admin-section-card-primary" to="/admin/products">
            <h2>{t('admin.productsSectionTitle')}</h2>
            <p>{t('admin.productsSectionDescription')}</p>
            <span className="section-action">{t('admin.openSection')}</span>
          </Link>
          <Link className="surface admin-section-card" to="/admin/orders">
            <h2>{t('admin.ordersSectionTitle')}</h2>
            <p>{t('admin.ordersSectionDescription')}</p>
            <span className="section-action">{t('admin.openSection')}</span>
          </Link>
        </div>
      </section>
    </AdminAccessGate>
  );
};

export default AdminPage;