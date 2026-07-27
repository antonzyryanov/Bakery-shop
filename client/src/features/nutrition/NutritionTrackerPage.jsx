import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  addNutritionDish,
  fetchNutritionEntries,
  fetchNutritionStats,
  setAddOpen,
  setNutritionRange
} from './nutritionSlice.js';

const MacroChart = ({ title, buckets, field, color, t }) => {
  const maxValue = Math.max(...buckets.map((bucket) => Number(bucket[field] || 0)), 1);

  return (
    <article className="surface nutrition-chart-card">
      <h3>{title}</h3>
      <div className="nutrition-chart-bars">
        {buckets.map((bucket) => {
          const value = Number(bucket[field] || 0);
          const height = `${Math.max((value / maxValue) * 100, value > 0 ? 8 : 0)}%`;
          return (
            <div className="nutrition-chart-bar-wrap" key={`${bucket.label}-${field}`}>
              <div className="nutrition-chart-bar" style={{ height, backgroundColor: color }} title={`${value.toFixed(1)}`} />
              <small>{bucket.label}</small>
            </div>
          );
        })}
      </div>
      {!buckets.length && <p className="nutrition-empty-chart">{t('nutrition.noChartData')}</p>}
    </article>
  );
};

const emptyDishForm = () => ({
  dishName: '',
  calories: '',
  proteins: '',
  fats: '',
  carbohydrates: '',
  description: '',
  image: null,
  preview: ''
});

const AddDishForm = ({ open, onClose, onSubmit, saving, error, t }) => {
  const sectionRef = useRef(null);
  const [form, setForm] = useState(emptyDishForm);

  useEffect(() => {
    if (!open) {
      setForm(emptyDishForm());
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [open]);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleImage = (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    updateField('image', file);
    updateField('preview', URL.createObjectURL(file));
  };

  const submit = (event) => {
    event.preventDefault();
    if (!form.image) return;

    const payload = new FormData();
    payload.append('dishName', form.dishName.trim());
    payload.append('calories', form.calories);
    payload.append('proteins', form.proteins);
    payload.append('fats', form.fats);
    payload.append('carbohydrates', form.carbohydrates);
    payload.append('description', form.description.trim());
    payload.append('image', form.image);
    onSubmit(payload);
  };

  return (
    <section
      ref={sectionRef}
      className={`surface nutrition-add-panel ${open ? 'is-open' : ''}`}
      aria-hidden={!open}
    >
      <div className="nutrition-add-panel-inner">
        <header className="nutrition-add-panel-head">
          <h2>{t('nutrition.addDishTitle')}</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label={t('nutrition.closeForm')}>
            ×
          </button>
        </header>

        {error && <p className="error-text">{error}</p>}

        <form className="nutrition-form" onSubmit={submit}>
          <input
            value={form.dishName}
            onChange={(event) => updateField('dishName', event.target.value)}
            placeholder={t('nutrition.dishName')}
            required={open}
          />
          <label className="nutrition-upload">
            <span>{t('nutrition.dishPhoto')}</span>
            <input type="file" accept="image/*" onChange={handleImage} required={open} />
            {form.preview ? <img src={form.preview} alt={t('nutrition.dishPhoto')} /> : null}
          </label>
          <div className="nutrition-form-grid">
            <input type="number" min="0" step="0.1" value={form.calories} onChange={(e) => updateField('calories', e.target.value)} placeholder={t('nutrition.calories')} required={open} />
            <input type="number" min="0" step="0.1" value={form.proteins} onChange={(e) => updateField('proteins', e.target.value)} placeholder={t('nutrition.proteins')} required={open} />
            <input type="number" min="0" step="0.1" value={form.fats} onChange={(e) => updateField('fats', e.target.value)} placeholder={t('nutrition.fats')} required={open} />
            <input type="number" min="0" step="0.1" value={form.carbohydrates} onChange={(e) => updateField('carbohydrates', e.target.value)} placeholder={t('nutrition.carbohydrates')} required={open} />
          </div>
          <textarea
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder={t('nutrition.description')}
            required={open}
          />
          <button className="checkout-btn" type="submit" disabled={saving || !open}>
            {saving ? t('nutrition.saving') : t('nutrition.save')}
          </button>
        </form>
      </div>
    </section>
  );
};

const NutritionTrackerPage = ({ t }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    entries,
    stats,
    range,
    loading,
    statsLoading,
    saving,
    error,
    addOpen
  } = useSelector((state) => state.nutrition);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [customError, setCustomError] = useState('');

  const loadData = (nextRange, from = '', to = '') => {
    const filter = { range: nextRange, from, to };
    dispatch(fetchNutritionEntries(filter));
    dispatch(fetchNutritionStats(filter));
  };

  useEffect(() => {
    if (user) {
      loadData('last_month');
    }
  }, [dispatch, user]);

  const groupedByDay = useMemo(() => {
    const groups = {};
    entries.forEach((entry) => {
      const day = new Date(entry.eaten_at).toLocaleDateString();
      if (!groups[day]) groups[day] = [];
      groups[day].push(entry);
    });
    return Object.entries(groups);
  }, [entries]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const applyRange = (nextRange) => {
    setCustomError('');
    dispatch(setNutritionRange(nextRange));
    loadData(nextRange);
  };

  const applyCustomRange = () => {
    if (!customFrom || !customTo || customTo < customFrom) {
      setCustomError(t('nutrition.periodValidationError'));
      return;
    }
    setCustomError('');
    dispatch(setNutritionRange('custom'));
    loadData('custom', customFrom, customTo);
  };

  const openAddDish = () => dispatch(setAddOpen(true));

  const buckets = stats?.buckets || [];

  return (
    <section className="container admin-page nutrition-page">
      <div className="surface admin-orders-toolbar">
        <div>
          <h2>{t('nutrition.pageTitle')}</h2>
          <p>{t('nutrition.pageSubtitle')}</p>
        </div>
        <div className="page-toolbar-actions">
          <button className="checkout-btn" type="button" onClick={openAddDish}>
            {t('nutrition.addDish')}
          </button>
          <Link className="ghost-btn nav-link" to="/">{t('nutrition.backToShop')}</Link>
        </div>
      </div>

      <AddDishForm
        open={addOpen}
        onClose={() => dispatch(setAddOpen(false))}
        onSubmit={(formData) => dispatch(addNutritionDish(formData)).then((action) => {
          if (!action.error) {
            loadData(range, customFrom, customTo);
          }
        })}
        saving={saving}
        error={error}
        t={t}
      />

      <div className="surface admin-orders-toolbar">
        <div className="admin-filter-row" role="group" aria-label={t('nutrition.filterLabel')}>
          {['last_day', 'last_week', 'last_month'].map((preset) => (
            <button
              key={preset}
              className={`small-ghost ${range === preset ? 'active-filter' : ''}`}
              type="button"
              onClick={() => applyRange(preset)}
            >
              {t(`nutrition.${preset}`)}
            </button>
          ))}
          <button
            className={`small-ghost ${range === 'custom' ? 'active-filter' : ''}`}
            type="button"
            onClick={applyCustomRange}
          >
            {t('nutrition.customRange')}
          </button>
        </div>
        <div className="admin-custom-period-row">
          <label>
            <span>{t('nutrition.from')}</span>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          </label>
          <label>
            <span>{t('nutrition.to')}</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </label>
          <button className="small-ghost" type="button" onClick={applyCustomRange}>{t('nutrition.apply')}</button>
        </div>
        {customError && <p className="error-text">{customError}</p>}
      </div>

      {error && !addOpen && <p className="error-text">{error}</p>}

      <div className="nutrition-totals-grid">
        <article className="stat-card surface">
          <small>{t('nutrition.calories')}</small>
          <h3>{Number(stats?.totals?.calories || 0).toFixed(1)}</h3>
        </article>
        <article className="stat-card surface">
          <small>{t('nutrition.proteins')}</small>
          <h3>{Number(stats?.totals?.proteins || 0).toFixed(1)} g</h3>
        </article>
        <article className="stat-card surface">
          <small>{t('nutrition.fats')}</small>
          <h3>{Number(stats?.totals?.fats || 0).toFixed(1)} g</h3>
        </article>
        <article className="stat-card surface">
          <small>{t('nutrition.carbohydrates')}</small>
          <h3>{Number(stats?.totals?.carbohydrates || 0).toFixed(1)} g</h3>
        </article>
      </div>

      {(statsLoading || loading) && <section className="loading-block surface">{t('nutrition.loading')}</section>}

      <div className="nutrition-charts-grid">
        <MacroChart title={t('nutrition.calories')} buckets={buckets} field="calories" color="#f57c00" t={t} />
        <MacroChart title={t('nutrition.proteins')} buckets={buckets} field="proteins" color="#2e7d32" t={t} />
        <MacroChart title={t('nutrition.fats')} buckets={buckets} field="fats" color="#c62828" t={t} />
        <MacroChart title={t('nutrition.carbohydrates')} buckets={buckets} field="carbohydrates" color="#1565c0" t={t} />
      </div>

      <div className="nutrition-day-list">
        {!loading && groupedByDay.length === 0 && (
          <section className="surface admin-orders-empty">
            <h3>{t('nutrition.emptyTitle')}</h3>
            <p>{t('nutrition.emptyHint')}</p>
          </section>
        )}
        {groupedByDay.map(([day, dayEntries]) => (
          <section className="surface nutrition-day-card" key={day}>
            <h3>{day}</h3>
            <div className="nutrition-entry-grid">
              {dayEntries.map((entry) => (
                <article className="nutrition-entry-card" key={entry.id}>
                  <img src={entry.image_url} alt={entry.dish_name} />
                  <div>
                    <h4>{entry.dish_name}</h4>
                    <p>{entry.description}</p>
                    <small>
                      {t('nutrition.calories')}: {Number(entry.calories).toFixed(1)} ·
                      {' '}{t('nutrition.proteins')}: {Number(entry.proteins).toFixed(1)}g ·
                      {' '}{t('nutrition.fats')}: {Number(entry.fats).toFixed(1)}g ·
                      {' '}{t('nutrition.carbohydrates')}: {Number(entry.carbohydrates).toFixed(1)}g
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
};

export default NutritionTrackerPage;
