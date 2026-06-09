import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminStats,
  updateAdminProduct
} from './adminSlice.js';
import { fetchProducts } from '../products/productsSlice.js';
import AdminAccessGate from './AdminAccessGate.jsx';
import { apiFetch } from '../../app/api.js';

const emptyForm = { name: '', description: '', imageUrl: '', price: '' };

const AdminProductsPage = ({ t }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: products } = useSelector((state) => state.products);
  const { stats, loading, error } = useSelector((state) => state.admin);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const productFormRef = useRef(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      dispatch(fetchAdminStats());
      dispatch(fetchProducts());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (!editingId || !productFormRef.current) {
      return;
    }

    productFormRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, [editingId]);

  const submit = (event) => {
    event.preventDefault();
    if (!form.imageUrl.trim()) {
      setUploadError(t('admin.imageUploadError'));
      return;
    }

    const payload = { ...form, price: Number(form.price) };

    if (editingId) {
      dispatch(updateAdminProduct({ id: editingId, ...payload })).then(() => {
        setEditingId('');
        setForm(emptyForm);
      });
      return;
    }

    dispatch(createAdminProduct(payload)).then(() => setForm(emptyForm));
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setUploadError('');
    setForm({
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: String(product.price)
    });
  };

  const handleImageSelected = async (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    setUploadError('');
    setUploadingImage(true);

    try {
      const payload = new FormData();
      payload.append('image', file);
      const response = await apiFetch('/api/admin/products/upload-image', {
        method: 'POST',
        body: payload
      });

      setForm((prev) => ({ ...prev, imageUrl: response.imageUrl }));
    } catch (uploadErr) {
      setUploadError(uploadErr.message || t('admin.imageUploadError'));
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  return (
    <AdminAccessGate t={t}>
      <section className="container admin-page admin-products-page">
        <div className="surface admin-orders-toolbar">
          <div>
            <h2>{t('admin.productsPageTitle')}</h2>
            <p>{t('admin.productsPageSubtitle')}</p>
          </div>
          <Link className="text-link nav-link" to="/admin">{t('admin.ordersBack')}</Link>
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

        <div className="surface admin-panel" ref={productFormRef}>
          <h2>{editingId ? t('admin.editProduct') : t('admin.addProduct')}</h2>
          {error && <p className="error-text">{error}</p>}
          <form className="admin-form" onSubmit={submit}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('admin.productName')}
              required
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('admin.description')}
              required
            />

            <div className="admin-upload-field">
              <label className="small-ghost admin-upload-btn" htmlFor="product-image-upload">
                {uploadingImage ? t('admin.imageUploading') : t('admin.imageUploadButton')}
              </label>
              <input
                id="product-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelected}
                disabled={uploadingImage}
              />
              <small>{form.imageUrl || t('admin.imageUploadHint')}</small>
              {uploadError && <small className="error-text">{uploadError}</small>}
            </div>

            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              type="number"
              step="0.01"
              min="0"
              placeholder={t('admin.price')}
              required
            />
            <button className="checkout-btn" disabled={loading || uploadingImage}>
              {editingId ? t('admin.update') : t('admin.create')}
            </button>
          </form>
        </div>

        <div className="surface admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.tableName')}</th>
                <th>{t('admin.tableDescription')}</th>
                <th>{t('admin.tablePrice')}</th>
                <th>{t('admin.tableImageUrl')}</th>
                <th>{t('admin.tableActions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.description}</td>
                  <td>${Number(product.price).toFixed(2)}</td>
                  <td>{product.imageUrl}</td>
                  <td>
                    <div className="row-actions">
                      <button className="small-ghost" onClick={() => startEdit(product)}>{t('admin.edit')}</button>
                      <button className="small-danger" onClick={() => dispatch(deleteAdminProduct(product.id))}>{t('admin.delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminAccessGate>
  );
};

export default AdminProductsPage;
