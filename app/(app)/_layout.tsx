import { Drawer } from 'expo-router/drawer';
import { Colors } from '../../src/lib/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, Text, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useAuth } from '../../src/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../../src/services/supabase';

function CustomDrawerContent(props: any) {
  const { user } = useAuth();
  const [buildingName, setBuildingName] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) { setBuildingName(null); return; }
      const { data: userData } = await supabase.from('users').select('building_id').eq('id', user.id).single();
      if (userData?.building_id) {
        const { data: b } = await supabase.from('buildings').select('name').eq('id', userData.building_id).single();
        setBuildingName(b?.name ?? null);
      } else {
        setBuildingName(null);
      }
    }
    fetchData();
  }, [user?.id]);

  const displayName = user?.name || user?.email || 'Usuario';
  const buildingInfo = buildingName ?? (user?.building_id ? `Edificio ${user.building_id}` : 'Sin edificio asignado');

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 12 }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Icon name="account-circle" size={56} color="#FFF" />
        </View>
        <View style={{ marginLeft: 12, flex:1 }}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.building}>{buildingInfo}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PRINCIPAL</Text>
        <DrawerItem
          label="Inicio"
          icon={({ color, size }) => <Icon name="home-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate('tabs')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GESTIÓN</Text>
        <DrawerItem label="Asambleas" icon={({ color, size }) => <Icon name="vote-outline" size={size} color={color} />} onPress={() => props.navigation.navigate('asambleas')} />
        <DrawerItem label="Mantenimiento" icon={({ color, size }) => <Icon name="wrench-outline" size={size} color={color} />} onPress={() => props.navigation.navigate('mantenimiento')} />
        <DrawerItem label="Convivencia" icon={({ color, size }) => <Icon name="shield-alert-outline" size={size} color={color} />} onPress={() => props.navigation.navigate('convivencia')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>COMUNIDAD</Text>
        <DrawerItem label="Mensajes" icon={({ color, size }) => <Icon name="message-text-outline" size={size} color={color} />} onPress={() => props.navigation.navigate('mensajes')} />
        <DrawerItem label="Servicios" icon={({ color, size }) => <Icon name="water-outline" size={size} color={color} />} onPress={() => props.navigation.navigate('servicios')} />
        <DrawerItem label="Proveedores" icon={({ color, size }) => <Icon name="account-group-outline" size={size} color={color} />} onPress={() => props.navigation.navigate('proveedores')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MÁS</Text>
        <DrawerItem label="Encuestas" icon={({ color, size }) => <Icon name="clipboard-check-outline" size={size} color={color} />} onPress={() => props.navigation.navigate('encuestas')} />
        <DrawerItem label="Soporte" icon={({ color, size }) => <Icon name="headset-outline" size={size} color={color} />} onPress={() => props.navigation.navigate('soporte')} />
      </View>
    </DrawerContentScrollView>
  );
}

export default function AppDrawer() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.textSecondary,
        drawerStyle: { backgroundColor: Colors.surface, width: 300 },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#FFF',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Drawer.Screen
        name="tabs"
        options={{
          title: 'Principal',
          drawerIcon: ({ color }) => <Icon name="view-dashboard-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="asambleas"
        options={{
          title: 'Asambleas',
          drawerIcon: ({ color }) => <Icon name="vote-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="mantenimiento"
        options={{
          title: 'Mantenimiento',
          drawerIcon: ({ color }) => <Icon name="wrench-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="convivencia"
        options={{
          title: 'Convivencia',
          drawerIcon: ({ color }) => <Icon name="shield-alert-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="mensajes"
        options={{
          title: 'Mensajes',
          drawerIcon: ({ color }) => <Icon name="message-text-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="servicios"
        options={{
          title: 'Servicios',
          drawerIcon: ({ color }) => <Icon name="water-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="proveedores"
        options={{
          title: 'Proveedores',
          drawerIcon: ({ color }) => <Icon name="account-group-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="encuestas"
        options={{
          title: 'Encuestas',
          drawerIcon: ({ color }) => <Icon name="clipboard-check-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="soporte"
        options={{
          title: 'Soporte',
          drawerIcon: ({ color }) => <Icon name="headset-outline" size={22} color={color} />,
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: Colors.primary,
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  building: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
});
