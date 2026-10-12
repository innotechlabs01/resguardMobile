import { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Surface,
  Avatar,
  Divider,
  Portal,
  Modal,
  TextInput,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  getProviders,
  getProviderById,
  addReview,
  Provider,
  ProviderReview,
} from '../../src/services/providers';

const categoryConfig: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
  plumber: { label: 'Plomero', icon: 'wrench', color: '#3B82F6', bgColor: '#DBEAFE' },
  electrician: { label: 'Electricista', icon: 'flash', color: '#F59E0B', bgColor: '#FEF3C7' },
  painter: { label: 'Pintor', icon: 'palette', color: '#8B5CF6', bgColor: '#EDE9FE' },
  carpenter: { label: 'Carpintero', icon: 'saw-blade', color: '#92400E', bgColor: '#FEF3C7' },
  appliance_repair: { label: 'Electrodomesticos', icon: 'washing-machine', color: '#6366F1', bgColor: '#E0E7FF' },
  locksmith: { label: 'Cerrajero', icon: 'lock', color: '#DC2626', bgColor: '#FEE2E2' },
  cleaning: { label: 'Limpieza', icon: 'broom', color: '#10B981', bgColor: '#D1FAE5' },
  gardening: { label: 'Jardineria', icon: 'flower', color: '#059669', bgColor: '#D1FAE5' },
  other: { label: 'Otro', icon: 'dots-horizontal', color: '#666666', bgColor: '#F3F4F6' },
};

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <Icon
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

export default function ProveedoresScreen() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<ProviderReview[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Review modal
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const fetchProviders = useCallback(async () => {
    if (!user?.building_id) return;
    try {
      const data = await getProviders(user.building_id, filterCategory === 'all' ? undefined : filterCategory);
      setProviders(data);
    } catch (err) {
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.building_id, filterCategory]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProviders();
  }, [fetchProviders]);

  // Open detail
  const openDetail = async (provider: Provider) => {
    setSelectedProvider(provider);
    setLoadingDetail(true);
    try {
      const result = await getProviderById(provider.id);
      if (result) {
        setSelectedProvider(result.provider);
        setReviews(result.reviews);
      }
    } catch (err) {
      console.error('Error fetching detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Add review
  const handleAddReview = async () => {
    if (!selectedProvider || !reviewForm.comment.trim() || !user) return;
    setSubmittingReview(true);
    try {
      const review = await addReview({
        provider_id: selectedProvider.id,
        reviewer_id: user.id,
        reviewer_name: user.display_name,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      if (review) {
        setReviews(prev => [review, ...prev]);
        setReviewModalVisible(false);
        setReviewForm({ rating: 5, comment: '' });
        openDetail(selectedProvider);
        fetchProviders();
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo agregar la resena');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Detail view
  if (selectedProvider) {
    const catCfg = categoryConfig[selectedProvider.category] || categoryConfig.other;

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Button
          mode="text"
          icon="arrow-left"
          onPress={() => { setSelectedProvider(null); setReviews([]); fetchProviders(); }}
          style={styles.backButton}
          labelStyle={styles.backLabel}
        >
          Volver
        </Button>

        {/* Header */}
        <Surface style={styles.detailHeader} elevation={1}>
          <View style={styles.detailHeaderTop}>
            <View style={[styles.categoryBadge, { backgroundColor: catCfg.bgColor }]}>
              <Icon name={catCfg.icon} size={16} color={catCfg.color} />
              <Text variant="bodySmall" style={[styles.categoryLabel, { color: catCfg.color }]}>
                {catCfg.label}
              </Text>
            </View>
            {selectedProvider.is_verified && (
              <View style={styles.verifiedBadge}>
                <Icon name="check-decagram" size={14} color={Colors.success} />
                <Text variant="bodySmall" style={{ color: Colors.success, fontSize: 11 }}>Verificado</Text>
              </View>
            )}
          </View>

          <Text variant="titleLarge" style={styles.detailTitle}>{selectedProvider.name}</Text>

          <View style={styles.ratingRow}>
            <StarRating rating={Math.round(selectedProvider.avg_rating)} />
            <Text variant="bodySmall" style={styles.ratingText}>
              {selectedProvider.avg_rating.toFixed(1)} ({selectedProvider.total_reviews} resenas)
            </Text>
          </View>

          {selectedProvider.description && (
            <Text variant="bodyMedium" style={styles.detailDescription}>{selectedProvider.description}</Text>
          )}

          {/* Contact buttons */}
          <View style={styles.contactRow}>
            <Button
              mode="contained"
              icon="phone"
              onPress={() => Linking.openURL(`tel:${selectedProvider.phone}`)}
              style={styles.contactButton}
              buttonColor={Colors.primary}
            >
              Llamar
            </Button>
            {selectedProvider.whatsapp && (
              <Button
                mode="contained"
                icon="whatsapp"
                onPress={() => {
                  const num = selectedProvider.whatsapp!.replace(/[^0-9]/g, '');
                  Linking.openURL(`https://wa.me/${num}`);
                }}
                style={styles.contactButton}
                buttonColor="#25D366"
              >
                WhatsApp
              </Button>
            )}
          </View>

          {selectedProvider.verified_by && (
            <Text variant="bodySmall" style={styles.verifiedBy}>
              Verificado por: {selectedProvider.verified_by}
            </Text>
          )}
        </Surface>

        {/* Reviews */}
        <View style={styles.reviewsHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Resenas ({reviews.length})</Text>
          <Button
            mode="contained"
            icon="star"
            compact
            onPress={() => setReviewModalVisible(true)}
            buttonColor={Colors.secondary}
            labelStyle={{ fontSize: 12 }}
          >
            Calificar
          </Button>
        </View>

        {loadingDetail ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : reviews.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="star-outline" size={32} color={Colors.textSecondary} />
              <Text variant="bodySmall" style={styles.emptyText}>No hay resenas aun</Text>
            </Card.Content>
          </Card>
        ) : (
          reviews.map(review => (
            <Surface key={review.id} style={styles.reviewCard} elevation={0}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAuthor}>
                  <Avatar.Text size={28} label={review.reviewer_name.charAt(0)} style={{ backgroundColor: Colors.muted }} />
                  <View>
                    <Text variant="bodySmall" style={styles.reviewAuthorName}>{review.reviewer_name}</Text>
                    <StarRating rating={review.rating} size={12} />
                  </View>
                </View>
                <Text variant="bodySmall" style={styles.reviewTime}>
                  {new Date(review.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
              {review.comment && (
                <Text variant="bodyMedium" style={styles.reviewContent}>{review.comment}</Text>
              )}
            </Surface>
          ))
        )}

        <View style={{ height: 30 }} />

        {/* Review Modal */}
        <Portal>
          <Modal
            visible={reviewModalVisible}
            onDismiss={() => setReviewModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Icon name="star" size={32} color={Colors.secondary} />
                <Text variant="titleLarge" style={styles.modalTitle}>Calificar Proveedor</Text>
              </View>

              <Text variant="bodySmall" style={styles.modalSubtitle}>{selectedProvider.name}</Text>

              <Text variant="bodySmall" style={styles.formLabel}>Calificacion</Text>
              <View style={styles.starPicker}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Button
                    key={star}
                    mode="text"
                    onPress={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                    style={styles.starButton}
                  >
                    <Icon
                      name={star <= reviewForm.rating ? 'star' : 'star-outline'}
                      size={32}
                      color="#F59E0B"
                    />
                  </Button>
                ))}
              </View>

              <TextInput
                mode="outlined"
                label="Comentario *"
                value={reviewForm.comment}
                onChangeText={v => setReviewForm(prev => ({ ...prev, comment: v }))}
                placeholder="Describe tu experiencia..."
                multiline
                numberOfLines={4}
                style={styles.formInput}
                outlineStyle={styles.formInputOutline}
              />

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setReviewModalVisible(false)}
                  style={styles.cancelButton}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  icon="check"
                  onPress={handleAddReview}
                  disabled={submittingReview || !reviewForm.comment.trim()}
                  style={styles.submitButton}
                  buttonColor={Colors.primary}
                >
                  {submittingReview ? 'Enviando...' : 'Enviar'}
                </Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>
      </ScrollView>
    );
  }

  // List view
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          <Chip
            selected={filterCategory === 'all'}
            onPress={() => setFilterCategory('all')}
            style={[styles.filterChip, filterCategory === 'all' && { backgroundColor: Colors.primary }]}
            textStyle={filterCategory === 'all' ? { color: '#FFF' } : {}}
          >
            Todos
          </Chip>
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <Chip
              key={key}
              selected={filterCategory === key}
              onPress={() => setFilterCategory(key)}
              icon={cfg.icon}
              style={[styles.filterChip, filterCategory === key && { backgroundColor: cfg.color }]}
              textStyle={filterCategory === key ? { color: '#FFF' } : {}}
            >
              {cfg.label}
            </Chip>
          ))}
        </View>
      </ScrollView>

      {/* Providers list */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : providers.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="account-group-outline" size={56} color={Colors.textSecondary} />
          <Text variant="bodyLarge" style={styles.emptyTitle}>Sin proveedores</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            No hay proveedores registrados en esta categoria
          </Text>
        </View>
      ) : (
        providers.map(provider => {
          const catCfg = categoryConfig[provider.category] || categoryConfig.other;
          return (
            <Card key={provider.id} style={styles.providerCard} onPress={() => openDetail(provider)}>
              <Card.Content>
                <View style={styles.providerHeader}>
                  <View style={[styles.providerIcon, { backgroundColor: catCfg.bgColor }]}>
                    <Icon name={catCfg.icon} size={20} color={catCfg.color} />
                  </View>
                  <View style={styles.providerInfo}>
                    <View style={styles.providerNameRow}>
                      <Text variant="titleSmall" style={styles.providerName}>{provider.name}</Text>
                      {provider.is_verified && (
                        <Icon name="check-decagram" size={14} color={Colors.success} />
                      )}
                    </View>
                    <Text variant="bodySmall" style={styles.providerCategory}>{catCfg.label}</Text>
                    <View style={styles.providerRating}>
                      <StarRating rating={Math.round(provider.avg_rating)} size={12} />
                      <Text variant="bodySmall" style={styles.ratingCount}>
                        {provider.avg_rating.toFixed(1)} ({provider.total_reviews})
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.providerFooter}>
                  <View style={styles.contactIcons}>
                    <Button
                      mode="text"
                      compact
                      icon="phone"
                      onPress={() => Linking.openURL(`tel:${provider.phone}`)}
                      labelStyle={{ fontSize: 11 }}
                    >
                      Llamar
                    </Button>
                    {provider.whatsapp && (
                      <Button
                        mode="text"
                        compact
                        icon="whatsapp"
                        onPress={() => {
                          const num = provider.whatsapp!.replace(/[^0-9]/g, '');
                          Linking.openURL(`https://wa.me/${num}`);
                        }}
                        labelStyle={{ fontSize: 11, color: '#25D366' }}
                      >
                        WhatsApp
                      </Button>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          );
        })
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Filter
  filterScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    borderRadius: 20,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Provider card
  providerCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  providerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  providerName: {
    fontWeight: '600',
    color: Colors.text,
  },
  providerCategory: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  providerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  starRow: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingCount: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  providerFooter: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  contactIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  // Detail
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: 8,
    marginTop: 8,
  },
  backLabel: {
    color: Colors.primary,
    fontSize: 13,
  },
  detailHeader: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    backgroundColor: Colors.surface,
  },
  detailHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  categoryLabel: {
    fontWeight: '500',
    fontSize: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingText: {
    color: Colors.textSecondary,
  },
  detailDescription: {
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  contactButton: {
    flex: 1,
    borderRadius: 10,
  },
  verifiedBy: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  // Reviews
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: Colors.text,
    fontSize: 16,
  },
  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 10,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
  reviewCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.muted,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewAuthorName: {
    fontWeight: '600',
    color: Colors.text,
  },
  reviewTime: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  reviewContent: {
    color: Colors.text,
    lineHeight: 18,
  },
  // Modal
  modalContainer: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    maxHeight: '85%',
  },
  modalScroll: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  starPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 0,
  },
  formInput: {
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  formInputOutline: {
    borderRadius: 10,
  },
  formLabel: {
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 10,
  },
  submitButton: {
    flex: 1,
    borderRadius: 10,
  },
});
