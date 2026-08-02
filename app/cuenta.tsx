import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button, Surface, TextInput, Switch, Divider, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../src/lib/theme';
import { mockUser } from '../src/services/mockData';

export default function CuentaScreen() {
  const [user] = useState(mockUser);
  const [profile, setProfile] = useState({
    name: user.displayName,
    email: user.email,
    phone: '+57 300 123 4567',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    parking: true,
    payments: true,
    announcements: true,
  });
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    setEditing(false);
    Alert.alert('Exito', 'Perfil actualizado correctamente.');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={80} 
              label={profile.name.split(' ').map(n => n[0]).join('')} 
              style={{ backgroundColor: Colors.primary }}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.profileName}>{profile.name}</Text>
              <Text variant="bodyMedium" style={styles.profileUnit}>Apartamento {user.unit}</Text>
              <Text variant="bodySmall" style={styles.profileBuilding}>{user.buildingName}</Text>
            </View>
            <Button 
              mode="contained-tonal" 
              icon="pencil-outline" 
              onPress={() => setEditing(!editing)}
              compact
            >
              {editing ? 'Cancelar' : 'Editar'}
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>Informacion Personal</Text>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.inputGroup}>
            <Text variant="bodySmall" style={styles.inputLabel}>Nombre Completo</Text>
            {editing ? (
              <TextInput
                mode="outlined"
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
                style={styles.input}
              />
            ) : (
              <View style={styles.infoRow}>
                <Icon name="account-outline" size={20} color={Colors.textSecondary} />
                <Text variant="bodyMedium" style={styles.infoText}>{profile.name}</Text>
              </View>
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text variant="bodySmall" style={styles.inputLabel}>Correo Electronico</Text>
            {editing ? (
              <TextInput
                mode="outlined"
                value={profile.email}
                onChangeText={(text) => setProfile({ ...profile, email: text })}
                style={styles.input}
                keyboardType="email-address"
              />
            ) : (
              <View style={styles.infoRow}>
                <Icon name="email-outline" size={20} color={Colors.textSecondary} />
                <Text variant="bodyMedium" style={styles.infoText}>{profile.email}</Text>
              </View>
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text variant="bodySmall" style={styles.inputLabel}>Telefono</Text>
            {editing ? (
              <TextInput
                mode="outlined"
                value={profile.phone}
                onChangeText={(text) => setProfile({ ...profile, phone: text })}
                style={styles.input}
                keyboardType="phone-pad"
              />
            ) : (
              <View style={styles.infoRow}>
                <Icon name="phone-outline" size={20} color={Colors.textSecondary} />
                <Text variant="bodyMedium" style={styles.infoText}>{profile.phone}</Text>
              </View>
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text variant="bodySmall" style={styles.inputLabel}>Apartamento</Text>
            <View style={styles.infoRow}>
              <Icon name="home-outline" size={20} color={Colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.infoText}>{user.unit}</Text>
            </View>
          </View>

          {editing && (
            <Button mode="contained" onPress={handleSave} style={styles.saveButton} buttonColor={Colors.primary}>
              Guardar Cambios
            </Button>
          )}
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>Notificaciones</Text>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Icon name="email-outline" size={20} color={Colors.text} />
              <View>
                <Text variant="bodyMedium" style={styles.switchLabel}>Correo electronico</Text>
                <Text variant="bodySmall" style={styles.switchDesc}>Recibir notificaciones por email</Text>
              </View>
            </View>
            <Switch
              value={notifications.email}
              onValueChange={(value) => setNotifications({ ...notifications, email: value })}
              color={Colors.secondary}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Icon name="bell-outline" size={20} color={Colors.text} />
              <View>
                <Text variant="bodyMedium" style={styles.switchLabel}>Notificaciones push</Text>
                <Text variant="bodySmall" style={styles.switchDesc}>Recibir alertas en el dispositivo</Text>
              </View>
            </View>
            <Switch
              value={notifications.push}
              onValueChange={(value) => setNotifications({ ...notifications, push: value })}
              color={Colors.secondary}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Icon name="car-outline" size={20} color={Colors.text} />
              <View>
                <Text variant="bodyMedium" style={styles.switchLabel}>Parqueadero</Text>
                <Text variant="bodySmall" style={styles.switchDesc}>Notificaciones de parqueo</Text>
              </View>
            </View>
            <Switch
              value={notifications.parking}
              onValueChange={(value) => setNotifications({ ...notifications, parking: value })}
              color={Colors.secondary}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Icon name="credit-card-outline" size={20} color={Colors.text} />
              <View>
                <Text variant="bodyMedium" style={styles.switchLabel}>Pagos</Text>
                <Text variant="bodySmall" style={styles.switchDesc}>Recordatorios de pagos</Text>
              </View>
            </View>
            <Switch
              value={notifications.payments}
              onValueChange={(value) => setNotifications({ ...notifications, payments: value })}
              color={Colors.secondary}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Icon name="megaphone-outline" size={20} color={Colors.text} />
              <View>
                <Text variant="bodyMedium" style={styles.switchLabel}>Avisos y circulares</Text>
                <Text variant="bodySmall" style={styles.switchDesc}>Comunicaciones del edificio</Text>
              </View>
            </View>
            <Switch
              value={notifications.announcements}
              onValueChange={(value) => setNotifications({ ...notifications, announcements: value })}
              color={Colors.secondary}
            />
          </View>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>Seguridad</Text>
      <Card style={styles.card}>
        <Card.Content>
          <Button 
            mode="outlined" 
            icon="lock-outline" 
            style={styles.securityButton}
          >
            Cambiar Contrasena
          </Button>
          <Divider style={styles.divider} />
          <Button 
            mode="outlined" 
            icon="shield-check-outline" 
            style={styles.securityButton}
          >
            Autenticacion Biometrica
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.logoutContainer}>
        <Button 
          mode="contained" 
          icon="logout" 
          onPress={() => Alert.alert('Cerrar Sesion', 'Estas seguro de cerrar sesion?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Cerrar Sesion', style: 'destructive' },
          ])}
          style={styles.logoutButton}
          buttonColor={Colors.primary}
        >
          Cerrar Sesion
        </Button>
      </View>

      <Text variant="bodySmall" style={styles.appVersion}>
        ResGuard Mobile v1.0.0
      </Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  profileUnit: {
    color: 'rgba(255,255,255,0.9)',
  },
  profileBuilding: {
    color: 'rgba(255,255,255,0.7)',
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    color: Colors.text,
  },
  divider: {
    marginVertical: 12,
  },
  saveButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchLabel: {
    fontWeight: '500',
  },
  switchDesc: {
    color: Colors.textSecondary,
  },
  securityButton: {
    marginVertical: 4,
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  logoutButton: {
    borderRadius: 12,
  },
  appVersion: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 20,
  },
});