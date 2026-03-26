import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { Card, Text, Button, Surface, Chip, TextInput, Portal, Modal, Divider, SegmentedButtons } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../src/lib/theme';
import { mockRentalProperties } from '../src/services/mockData';
import { RentalProperty } from '../src/types';

export default function AlquilerScreen() {
  const [properties, setProperties] = useState<RentalProperty[]>(mockRentalProperties);
  const [activeTab, setActiveTab] = useState('mispublicaciones');
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    type: 'apartment' as 'apartment' | 'parking',
    title: '',
    description: '',
    price: '',
    period: 'monthly' as 'monthly' | 'daily',
    rooms: '',
    bathrooms: '',
    area: '',
    contactPhone: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const myProperties = properties.filter((p) => p.ownerUnit === '301');
  const availableProperties = properties.filter((p) => p.status === 'available');

  const handleCreate = () => {
    if (!formData.title || !formData.price) {
      Alert.alert('Error', 'Por favor completa los campos requeridos.');
      return;
    }

    const newProperty: RentalProperty = {
      id: Date.now().toString(),
      type: formData.type,
      title: formData.title,
      description: formData.description,
      price: parseInt(formData.price.replace(/\D/g, '')) || 0,
      status: 'available',
      ownerName: 'Juan Perez',
      ownerUnit: '301',
    };

    setProperties([newProperty, ...properties]);
    setShowCreate(false);
    setFormData({
      type: 'apartment',
      title: '',
      description: '',
      price: '',
      period: 'monthly',
      rooms: '',
      bathrooms: '',
      area: '',
      contactPhone: '',
    });
    Alert.alert('Exito', 'Publicacion creada correctamente.');
  };

  const handleCall = () => {
    Linking.openURL('tel:+573001234567');
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return { label: 'Disponible', color: Colors.success, bgColor: Colors.successContainer };
      case 'rented':
        return { label: 'Arrendado', color: Colors.textSecondary, bgColor: Colors.muted };
      default:
        return { label: status, color: Colors.textSecondary, bgColor: Colors.background };
    }
  };

  const monthlyIncome = myProperties
    .filter((p) => p.status === 'rented')
    .reduce((sum, p) => sum + p.price, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="account-group-outline" size={24} color={Colors.textSecondary} />
            <Text variant="headlineSmall" style={styles.statValue}>
              {myProperties.filter((p) => p.status === 'rented').length}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>Arrendados</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="cash-outline" size={24} color={Colors.success} />
            <Text variant="headlineSmall" style={[styles.statValue, { color: Colors.success }]}>
              {formatCurrency(monthlyIncome)}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>Ingreso mensual</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="home-outline" size={24} color={Colors.textSecondary} />
            <Text variant="headlineSmall" style={styles.statValue}>
              {availableProperties.length}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>Disponibles</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'mispublicaciones', label: 'Mis Publicaciones' },
            { value: 'disponibles', label: 'Disponibles' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {activeTab === 'mispublicaciones' && (
        <>
          <View style={styles.fabContainer}>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => setShowCreate(true)}
              style={styles.fabButton}
              buttonColor={Colors.primary}
            >
              Nueva Publicacion
            </Button>
          </View>

          {myProperties.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Icon name="home-off-outline" size={64} color={Colors.textSecondary} />
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No tienes publicaciones
                </Text>
                <Text variant="bodySmall" style={styles.emptySubtext}>
                  Crea una publicacion para rentar tu propiedad
                </Text>
              </Card.Content>
            </Card>
          ) : (
            myProperties.map((property) => {
              const statusConfig = getStatusConfig(property.status);
              return (
                <Card key={property.id} style={styles.propertyCard}>
                  <Card.Content>
                    <View style={styles.propertyHeader}>
                      <View style={styles.propertyTitle}>
                        <View style={styles.propertyIcon}>
                          <Icon 
                            name={property.type === 'apartment' ? 'home-outline' : 'car-outline'} 
                            size={24} 
                            color={Colors.text} 
                          />
                        </View>
                        <View>
                          <Text variant="titleMedium" style={{ fontWeight: '600' }}>{property.title}</Text>
                          <Text variant="bodySmall" style={styles.propertyType}>
                            {property.type === 'apartment' ? 'Apartamento' : 'Parqueadero'}
                          </Text>
                        </View>
                      </View>
                      <Chip 
                        mode="flat" 
                        compact
                        style={{ backgroundColor: statusConfig.bgColor }}
                        textStyle={{ color: statusConfig.color, fontSize: 10 }}
                      >
                        {statusConfig.label}
                      </Chip>
                    </View>

                    <Text variant="bodySmall" style={styles.propertyDesc} numberOfLines={2}>
                      {property.description}
                    </Text>

                    <View style={styles.propertyFooter}>
                      <Text variant="titleLarge" style={{ color: Colors.text, fontWeight: 'bold' }}>
                        {formatCurrency(property.price)}
                        <Text variant="bodySmall" style={{ color: Colors.textSecondary }}>/mes</Text>
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              );
            })
          )}
        </>
      )}

      {activeTab === 'disponibles' && (
        <>
          {availableProperties.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Icon name="home-off-outline" size={64} color={Colors.textSecondary} />
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No hay propiedades disponibles
                </Text>
              </Card.Content>
            </Card>
          ) : (
            availableProperties.map((property) => {
              return (
                <Card key={property.id} style={styles.propertyCard}>
                  <Card.Content>
                    <View style={styles.propertyHeader}>
                      <View style={styles.propertyTitle}>
                        <View style={styles.propertyIcon}>
                          <Icon 
                            name={property.type === 'apartment' ? 'home-outline' : 'car-outline'} 
                            size={24} 
                            color={Colors.text} 
                          />
                        </View>
                        <View>
                          <Text variant="titleMedium" style={{ fontWeight: '600' }}>{property.title}</Text>
                          <Text variant="bodySmall" style={styles.propertyType}>
                            Apto {property.ownerUnit} - {property.ownerName}
                          </Text>
                        </View>
                      </View>
                      <Chip 
                        mode="flat" 
                        compact
                        style={{ backgroundColor: Colors.successContainer }}
                        textStyle={{ color: Colors.success, fontSize: 10 }}
                      >
                        Disponible
                      </Chip>
                    </View>

                    <Text variant="bodySmall" style={styles.propertyDesc} numberOfLines={2}>
                      {property.description}
                    </Text>

                    <View style={styles.propertyFooter}>
                      <Text variant="titleLarge" style={{ color: Colors.text, fontWeight: 'bold' }}>
                        {formatCurrency(property.price)}
                        <Text variant="bodySmall" style={{ color: Colors.textSecondary }}>/mes</Text>
                      </Text>
                      <Button
                        mode="contained"
                        icon="phone-outline"
                        onPress={handleCall}
                        compact
                        buttonColor={Colors.primary}
                      >
                        Contactar
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              );
            })
          )}
        </>
      )}

      <Portal>
        <Modal
          visible={showCreate}
          onDismiss={() => setShowCreate(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Publicar Arrendamiento
            </Text>

            <SegmentedButtons
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as 'apartment' | 'parking' })}
              buttons={[
                { value: 'apartment', label: 'Apartamento', icon: 'home-outline' },
                { value: 'parking', label: 'Parqueadero', icon: 'car-outline' },
              ]}
              style={styles.typeSelector}
            />

            <TextInput
              mode="outlined"
              label="Titulo *"
              placeholder="Ej: Apto 301 disponible"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Descripcion"
              placeholder="Descripcion detallada..."
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Precio (COP) *"
              placeholder="1500000"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
              style={styles.input}
            />

            {formData.type === 'apartment' && (
              <View style={styles.inputRow}>
                <TextInput
                  mode="outlined"
                  label="Habitaciones"
                  placeholder="3"
                  value={formData.rooms}
                  onChangeText={(text) => setFormData({ ...formData, rooms: text })}
                  keyboardType="numeric"
                  style={[styles.input, { flex: 1 }]}
                />
                <TextInput
                  mode="outlined"
                  label="Banos"
                  placeholder="2"
                  value={formData.bathrooms}
                  onChangeText={(text) => setFormData({ ...formData, bathrooms: text })}
                  keyboardType="numeric"
                  style={[styles.input, { flex: 1 }]}
                />
              </View>
            )}

            <TextInput
              mode="outlined"
              label="Telefono contacto"
              placeholder="+57 300..."
              value={formData.contactPhone}
              onChangeText={(text) => setFormData({ ...formData, contactPhone: text })}
              style={styles.input}
            />

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
  },
  statValue: {
    fontWeight: 'bold',
    marginTop: 8,
    color: Colors.text,
  },
  statLabel: {
    color: Colors.textSecondary,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  segmentedButtons: {
    backgroundColor: Colors.surface,
  },
  fabContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  fabButton: {
    borderRadius: 12,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  propertyCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  propertyTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  propertyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.muted,
  },
  propertyType: {
    color: Colors.textSecondary,
  },
  propertyDesc: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '85%',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  typeSelector: {
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