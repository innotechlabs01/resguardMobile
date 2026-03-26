import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { Card, Text, Button, Surface, Chip, TextInput, Portal, Modal, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../src/lib/theme';
import { mockMarketplaceItems } from '../src/services/mockData';
import { MarketplaceItem } from '../src/types';

const categoryConfig: Record<string, { label: string; icon: string; color: string }> = {
  food: { label: 'Comida', icon: 'food-outline', color: Colors.textSecondary },
  services: { label: 'Servicios', icon: 'wrench-outline', color: Colors.textSecondary },
  products: { label: 'Productos', icon: 'shopping-outline', color: Colors.textSecondary },
  crafts: { label: 'Artesanias', icon: 'palette-outline', color: Colors.textSecondary },
  other: { label: 'Otro', icon: 'dots-horizontal', color: Colors.textSecondary },
};

export default function MercadoScreen() {
  const [products, setProducts] = useState<MarketplaceItem[]>(mockMarketplaceItems);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'services',
    contactPhone: '',
    whatsapp: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const myProducts = products.filter((p) => p.sellerUnit === '301');
  const otherProducts = products.filter((p) => p.sellerUnit !== '301');

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleCreate = () => {
    if (!formData.title || !formData.price) {
      Alert.alert('Error', 'Por favor completa los campos requeridos.');
      return;
    }

    const newProduct: MarketplaceItem = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      price: parseInt(formData.price.replace(/\D/g, '')) || 0,
      category: formData.category,
      sellerName: 'Juan Perez',
      sellerUnit: '301',
      createdAt: new Date(),
      status: 'active',
    };

    setProducts([newProduct, ...products]);
    setShowCreate(false);
    setFormData({ title: '', description: '', price: '', category: 'services', contactPhone: '', whatsapp: '' });
    Alert.alert('Exito', 'Publicacion creada correctamente.');
  };

  const handleWhatsApp = (phone: string) => {
    const url = `https://wa.me/57${phone.replace(/\D/g, '')}`;
    Linking.openURL(url);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getCategoryConfig = (category: string) => {
    return categoryConfig[category] || categoryConfig.other;
  };

  const categories = ['all', 'food', 'services', 'products', 'crafts'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text variant="headlineSmall" style={styles.statValue}>
              {new Set(products.map((p) => p.sellerUnit)).size}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>Emprendedores</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text variant="headlineSmall" style={styles.statValue}>
              {products.filter((p) => p.status === 'active').length}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>Publicaciones</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text variant="headlineSmall" style={styles.statValue}>
              {myProducts.length}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>Mis Publicaciones</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          mode="outlined"
          placeholder="Buscar producto o servicio..."
          value={search}
          onChangeText={setSearch}
          left={<TextInput.Icon icon="magnify-outline" />}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <Chip
              key={cat}
              mode={categoryFilter === cat ? 'flat' : 'outlined'}
              selected={categoryFilter === cat}
              onPress={() => setCategoryFilter(cat)}
              style={[
                styles.categoryChip,
                categoryFilter === cat && { backgroundColor: Colors.primary },
              ]}
              textStyle={categoryFilter === cat ? { color: '#FFF' } : {}}
            >
              {cat === 'all' ? 'Todos' : categoryConfig[cat]?.label}
            </Chip>
          ))}
        </View>
      </ScrollView>

      {myProducts.length > 0 && (
        <>
          <Text variant="titleMedium" style={styles.sectionTitle}>Mis Publicaciones</Text>
          <Card style={styles.productsCard}>
            <Card.Content>
              {myProducts.map((product, index) => {
                const catCfg = getCategoryConfig(product.category);
                return (
                  <View key={product.id}>
                    <Surface style={styles.productItem} elevation={0}>
                      <View style={styles.productIcon}>
                        <Icon name={catCfg.icon} size={24} color={Colors.text} />
                      </View>
                      <View style={styles.productInfo}>
                        <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{product.title}</Text>
                        <Text variant="bodySmall" style={styles.productDesc} numberOfLines={1}>
                          {product.description}
                        </Text>
                        <View style={styles.productMeta}>
                          <Text variant="titleMedium" style={{ color: Colors.text, fontWeight: 'bold' }}>
                            {formatCurrency(product.price)}
                          </Text>
                          <Chip compact style={{ backgroundColor: product.status === 'active' ? Colors.successContainer : Colors.background }}>
                            {product.status === 'active' ? 'Activo' : 'Vendido'}
                          </Chip>
                        </View>
                      </View>
                    </Surface>
                    {index < myProducts.length - 1 && <Divider />}
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        </>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>Negocios del Edificio</Text>
      <Card style={styles.productsCard}>
        <Card.Content>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="shopping-outline" size={64} color={Colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.emptyText}>
                No hay publicaciones disponibles
              </Text>
            </View>
          ) : (
            filteredProducts.map((product, index) => {
              const catCfg = getCategoryConfig(product.category);
              return (
                <View key={product.id}>
                  <Surface style={styles.productItem} elevation={0}>
                    <View style={styles.productIcon}>
                      <Icon name={catCfg.icon} size={24} color={Colors.text} />
                    </View>
                    <View style={styles.productInfo}>
                      <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{product.title}</Text>
                      <Text variant="bodySmall" style={styles.productDesc} numberOfLines={1}>
                        {product.description}
                      </Text>
                      <View style={styles.productMeta}>
                        <View>
                          <Text variant="titleMedium" style={{ color: Colors.text, fontWeight: 'bold' }}>
                            {formatCurrency(product.price)}
                          </Text>
                          <Text variant="bodySmall" style={styles.sellerInfo}>
                            Apto {product.sellerUnit} - {product.sellerName}
                          </Text>
                        </View>
                        <View style={styles.productActions}>
                          <Button
                            mode="contained-tonal"
                            compact
                            icon="whatsapp"
                            onPress={() => handleWhatsApp('3001234567')}
                            style={{ backgroundColor: Colors.muted }}
                            labelStyle={{ color: Colors.text }}
                          >
                            WhatsApp
                          </Button>
                        </View>
                      </View>
                    </View>
                  </Surface>
                  {index < filteredProducts.length - 1 && <Divider />}
                </View>
              );
            })
          )}
        </Card.Content>
      </Card>

      <View style={styles.fabContainer}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => setShowCreate(true)}
          style={styles.fabButton}
          buttonColor={Colors.primary}
        >
          Publicar Negocio
        </Button>
      </View>

      <Portal>
        <Modal
          visible={showCreate}
          onDismiss={() => setShowCreate(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Publicar mi negocio
            </Text>

            <TextInput
              mode="outlined"
              label="Categoria *"
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Nombre del producto/servicio *"
              placeholder="Ej: Almuerzos caseros, Clases de ingles..."
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Descripcion"
              placeholder="Describe tu producto o servicio..."
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Precio (COP) *"
              placeholder="15000"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.inputRow}>
              <TextInput
                mode="outlined"
                label="Telefono"
                placeholder="+57 300..."
                value={formData.contactPhone}
                onChangeText={(text) => setFormData({ ...formData, contactPhone: text })}
                style={[styles.input, { flex: 1 }]}
              />
            </View>

            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={() => setShowCreate(false)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button 
                mode="contained" 
                onPress={handleCreate} 
                style={{ flex: 1, backgroundColor: Colors.primary }}
                disabled={!formData.title || !formData.price}
              >
                Publicar
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    color: Colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchInput: {
    backgroundColor: Colors.surface,
  },
  categoryScroll: {
    paddingLeft: 16,
    marginTop: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  categoryChip: {
    marginRight: 4,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  productsCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.muted,
  },
  productInfo: {
    flex: 1,
  },
  productDesc: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  sellerInfo: {
    color: Colors.textSecondary,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  fabContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  fabButton: {
    borderRadius: 12,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});