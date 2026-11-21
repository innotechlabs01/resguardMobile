import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button, TextInput, Switch, Divider, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../src/lib/theme';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/services/supabase';

export default function CuentaScreen() {
  const { user, logout, checkAuth } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.display_name || '',
    email: user?.email || '',
    phone: '',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    parking: true,
    payments: true,
    announcements: true,
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfile((prev) => ({
      ...prev,
      name: user?.display_name || '',
      email: user?.email || '',
    }));
  }, [user?.display_name, user?.email]);

  useEffect(() => {
    if (!user?.email) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('residents')
        .select('phone')
        .eq('email', user.email)
        .maybeSingle();
      if (active && data?.phone) {
        setProfile((prev) => ({ ...prev, phone: data.phone }));
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.email]);

  const handleSave = async () => {
    if (!user?.id) return;
    const trimmedName = profile.name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'El nombre no puede estar vacío.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ name: trimmedName })
        .eq('id', user.id);

      if (error) throw error;

      if (user.email) {
        const residentUpdate: { name: string; phone?: string } = { name: trimmedName };
        if (profile.phone.trim()) {
          residentUpdate.phone = profile.phone.trim();
        }
        await supabase
          .from('residents')
          .update(residentUpdate)
          .eq('email', user.email);
      }

      await checkAuth();
      setEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const initials =
    (profile.name || user?.email || 'R')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'R';

  const residentTypeLabel = user?.is_tenant ? 'Inquilino' : 'Propietario';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Text
              size={80}
              label={initials}
              style={{ backgroundColor: Colors.primary }}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.profileName}>
                {profile.name || 'Residente'}
              </Text>
              <Text variant="bodyMedium" style={styles.profileUnit}>
                {user?.unit ? `Apartamento ${user.unit}` : 'Sin unidad'} · {residentTypeLabel}
              </Text>
              {user?.building_name || user?.unit ? (
                <Text variant="bodySmall" style={styles.profileBuilding}>
                  {[user?.building_name, user?.unit ? `Apto ${user.unit}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              ) : null}
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
            <View style={styles.infoRow}>
              <Icon name="email-outline" size={20} color={Colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.infoText}>{profile.email}</Text>
            </View>
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
                <Text variant="bodyMedium" style={styles.infoText}>{profile.phone || 'No registrado'}</Text>
              </View>
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text variant="bodySmall" style={styles.inputLabel}>Apartamento</Text>
            <View style={styles.infoRow}>
              <Icon name="home-outline" size={20} color={Colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.infoText}>
                {user?.unit || 'Sin asignar'} ({residentTypeLabel})
                {user?.building_name ? ` · ${user.building_name}` : ''}
              </Text>
            </View>
          </View>

          {editing && (
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
              buttonColor={Colors.primary}
            >
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
          onPress={() => Alert.alert('Cerrar Sesion', '¿Estás seguro de cerrar sesión?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Cerrar Sesión', style: 'destructive', onPress: () => { void logout(); } },
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