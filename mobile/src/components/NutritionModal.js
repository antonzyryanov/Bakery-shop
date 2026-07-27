import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  ScrollView,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../theme';
import { API_BASE_URL } from '../config';
import {
  addNutritionDish,
  fetchNutritionEntries,
  fetchNutritionStats
} from '../features/nutritionSlice';

const MacroBars = ({ title, buckets, field, color }) => {
  const max = Math.max(...buckets.map((bucket) => Number(bucket[field] || 0)), 1);
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartRow}>
          {buckets.map((bucket) => {
            const value = Number(bucket[field] || 0);
            const height = Math.max((value / max) * 90, value > 0 ? 8 : 0);
            return (
              <View key={`${bucket.label}-${field}`} style={styles.chartBarWrap}>
                <View style={[styles.chartBar, { height, backgroundColor: color }]} />
                <Text style={styles.chartLabel}>{bucket.label}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const NutritionModal = ({ visible, onClose, t }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { entries, stats, loading, statsLoading, saving, error } = useSelector((state) => state.nutrition);
  const [addOpen, setAddOpen] = useState(false);
  const [range, setRange] = useState('last_month');
  const [form, setForm] = useState({
    dishName: '',
    calories: '',
    proteins: '',
    fats: '',
    carbohydrates: '',
    description: '',
    image: null
  });

  const loadData = (nextRange) => {
    const filter = { range: nextRange };
    dispatch(fetchNutritionEntries(filter));
    dispatch(fetchNutritionStats(filter));
    setRange(nextRange);
  };

  useEffect(() => {
    if (visible) {
      loadData('last_month');
      setAddOpen(false);
    }
  }, [visible, dispatch]);

  const groupedByDay = useMemo(() => {
    const groups = {};
    entries.forEach((entry) => {
      const day = new Date(entry.eaten_at).toLocaleDateString();
      if (!groups[day]) groups[day] = [];
      groups[day].push(entry);
    });
    return Object.entries(groups);
  }, [entries]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85
    });
    if (!result.canceled && result.assets?.[0]) {
      setForm((prev) => ({ ...prev, image: result.assets[0] }));
    }
  };

  const submitDish = async () => {
    if (!form.image || !form.dishName.trim() || !form.description.trim()) return;
    const payload = new FormData();
    payload.append('dishName', form.dishName.trim());
    payload.append('calories', form.calories);
    payload.append('proteins', form.proteins);
    payload.append('fats', form.fats);
    payload.append('carbohydrates', form.carbohydrates);
    payload.append('description', form.description.trim());
    payload.append('image', {
      uri: form.image.uri,
      name: form.image.fileName || `dish-${Date.now()}.jpg`,
      type: form.image.mimeType || 'image/jpeg'
    });
    const action = await dispatch(addNutritionDish(payload));
    if (!action.error) {
      setAddOpen(false);
      setForm({
        dishName: '',
        calories: '',
        proteins: '',
        fats: '',
        carbohydrates: '',
        description: '',
        image: null
      });
      loadData(range);
    }
  };

  const buckets = stats?.buckets || [];
  const imageUri = (url) => (url?.startsWith('http') ? url : `${API_BASE_URL}${url}`);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('nutritionTitle')}</Text>
            <Text style={styles.subtitle}>{t('nutritionSubtitle')}</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{t('close')}</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryBtn} onPress={() => setAddOpen(true)}>
            <Text style={styles.primaryBtnText}>{t('addDish')}</Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {['last_day', 'last_week', 'last_month'].map((preset) => (
            <Pressable
              key={preset}
              style={[styles.filterChip, range === preset && styles.filterChipActive]}
              onPress={() => loadData(preset)}
            >
              <Text style={[styles.filterText, range === preset && styles.filterTextActive]}>
                {t(`nutrition_${preset}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {(loading || statsLoading) && <Text style={styles.hint}>{t('nutritionLoading')}</Text>}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalItem}>{t('calories')}: {Number(stats?.totals?.calories || 0).toFixed(1)}</Text>
            <Text style={styles.totalItem}>{t('proteins')}: {Number(stats?.totals?.proteins || 0).toFixed(1)}g</Text>
            <Text style={styles.totalItem}>{t('fats')}: {Number(stats?.totals?.fats || 0).toFixed(1)}g</Text>
            <Text style={styles.totalItem}>{t('carbohydrates')}: {Number(stats?.totals?.carbohydrates || 0).toFixed(1)}g</Text>
          </View>

          <MacroBars title={t('calories')} buckets={buckets} field="calories" color={colors.orange500} />
          <MacroBars title={t('proteins')} buckets={buckets} field="proteins" color="#2e7d32" />
          <MacroBars title={t('fats')} buckets={buckets} field="fats" color={colors.danger} />
          <MacroBars title={t('carbohydrates')} buckets={buckets} field="carbohydrates" color="#1565c0" />

          {!loading && groupedByDay.length === 0 ? (
            <Text style={styles.hint}>{t('nutritionEmpty')}</Text>
          ) : null}

          {groupedByDay.map(([day, dayEntries]) => (
            <View key={day} style={styles.dayCard}>
              <Text style={styles.dayTitle}>{day}</Text>
              {dayEntries.map((entry) => (
                <View key={entry.id} style={styles.entryCard}>
                  <Image source={{ uri: imageUri(entry.image_url) }} style={styles.entryImage} />
                  <View style={styles.entryBody}>
                    <Text style={styles.entryTitle}>{entry.dish_name}</Text>
                    <Text style={styles.entryDesc}>{entry.description}</Text>
                    <Text style={styles.entryMeta}>
                      {Number(entry.calories).toFixed(1)} kcal · P {Number(entry.proteins).toFixed(1)} · F {Number(entry.fats).toFixed(1)} · C {Number(entry.carbohydrates).toFixed(1)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>

        <Modal visible={addOpen} animationType="slide" onRequestClose={() => setAddOpen(false)}>
          <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('addDish')}</Text>
              <Pressable style={styles.closeBtn} onPress={() => setAddOpen(false)}>
                <Text style={styles.closeText}>{t('close')}</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.formContent}>
              <TextInput style={styles.input} value={form.dishName} onChangeText={(v) => setForm((p) => ({ ...p, dishName: v }))} placeholder={t('dishName')} />
              <Pressable style={styles.photoBtn} onPress={pickImage}>
                <Text style={styles.photoBtnText}>{form.image ? t('photoSelected') : t('pickPhoto')}</Text>
              </Pressable>
              {form.image ? <Image source={{ uri: form.image.uri }} style={styles.preview} /> : null}
              <TextInput style={styles.input} keyboardType="decimal-pad" value={form.calories} onChangeText={(v) => setForm((p) => ({ ...p, calories: v }))} placeholder={t('calories')} />
              <TextInput style={styles.input} keyboardType="decimal-pad" value={form.proteins} onChangeText={(v) => setForm((p) => ({ ...p, proteins: v }))} placeholder={t('proteins')} />
              <TextInput style={styles.input} keyboardType="decimal-pad" value={form.fats} onChangeText={(v) => setForm((p) => ({ ...p, fats: v }))} placeholder={t('fats')} />
              <TextInput style={styles.input} keyboardType="decimal-pad" value={form.carbohydrates} onChangeText={(v) => setForm((p) => ({ ...p, carbohydrates: v }))} placeholder={t('carbohydrates')} />
              <TextInput style={[styles.input, styles.textarea]} multiline value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} placeholder={t('description')} />
              <Pressable style={[styles.primaryBtn, saving && styles.disabled]} disabled={saving} onPress={submitDish}>
                <Text style={styles.primaryBtnText}>{saving ? t('saving') : t('save')}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: spacing.sm },
  headerText: { flex: 1, gap: 4 },
  title: { fontSize: 24, fontWeight: '800', color: colors.black900 },
  subtitle: { color: colors.black700, fontWeight: '600', lineHeight: 20 },
  closeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.gray300, backgroundColor: 'rgba(255,255,255,0.8)' },
  closeText: { fontWeight: '800', color: colors.black700 },
  actions: { marginBottom: spacing.sm },
  primaryBtn: { alignSelf: 'flex-start', backgroundColor: colors.orange500, borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1.5, borderColor: colors.black900 },
  primaryBtnText: { fontWeight: '800', color: colors.black900 },
  disabled: { opacity: 0.6 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  filterChip: { borderWidth: 1, borderColor: colors.gray300, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: colors.black900 },
  filterText: { fontWeight: '700', color: colors.black700 },
  filterTextActive: { color: colors.orange500 },
  hint: { color: colors.gray500, fontWeight: '700', marginBottom: 8 },
  error: { color: colors.danger, fontWeight: '700', marginBottom: 8 },
  scrollContent: { gap: 12, paddingBottom: 24 },
  totalsRow: { gap: 6 },
  totalItem: { fontWeight: '700', color: colors.black900 },
  chartCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.gray300, padding: 12, gap: 8 },
  chartTitle: { fontWeight: '800', color: colors.black900 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, minHeight: 110 },
  chartBarWrap: { alignItems: 'center', width: 34 },
  chartBar: { width: 22, borderRadius: 6 },
  chartLabel: { fontSize: 10, color: colors.gray500, marginTop: 4 },
  dayCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.gray300, padding: 12, gap: 10 },
  dayTitle: { fontWeight: '800', color: colors.black900 },
  entryCard: { flexDirection: 'row', gap: 10 },
  entryImage: { width: 72, height: 72, borderRadius: 10, backgroundColor: colors.gray100 },
  entryBody: { flex: 1, gap: 4 },
  entryTitle: { fontWeight: '800', color: colors.black900 },
  entryDesc: { color: colors.black700 },
  entryMeta: { fontSize: 12, color: colors.gray500, fontWeight: '700' },
  formContent: { gap: 10, paddingBottom: 24 },
  input: { borderWidth: 1, borderColor: colors.gray300, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  photoBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 10, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.gray300, backgroundColor: '#fff' },
  photoBtnText: { fontWeight: '700', color: colors.black700 },
  preview: { width: 120, height: 120, borderRadius: 12 }
});

export default NutritionModal;
