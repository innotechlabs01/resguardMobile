import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/providers/auth_provider.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  bool _isEditing = false;
  bool _emailNotifications = true;
  bool _pushNotifications = true;
  bool _parkingNotifications = true;
  bool _paymentsNotifications = true;
  bool _announcementsNotifications = true;

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.currentUser;

    if (user == null) {
      return const Scaffold(body: Center(child: Text('Usuario no encontrado')));
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 48, 24, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header con avatar y nombre
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: AppColors.primary,
                        child: Text(
                          user.displayName.isNotEmpty
                              ? user.displayName[0].toUpperCase()
                              : 'U',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.displayName,
                              style: Theme.of(context).textTheme.headlineMedium,
                            ),
                            Text(
                              'Apartamento ${user.unit ?? 'N/A'}',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            Text(
                              user.buildingId ?? 'Edificio no asignado',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: Icon(
                          _isEditing ? Icons.close : Icons.edit,
                          color: AppColors.textLight,
                        ),
                        onPressed: () {
                          setState(() {
                            _isEditing = !_isEditing;
                          });
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
          // Información Personal
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Información Personal',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  _buildInfoCard(
                    context,
                    icon: Icons.person_outline,
                    label: 'Nombre Completo',
                    value: user.displayName,
                    isEditing: _isEditing,
                    onChanged: (value) {
                      // Handle name change
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildInfoCard(
                    context,
                    icon: Icons.email_outlined,
                    label: 'Correo Electrónico',
                    value: user.email,
                    isEditing: _isEditing,
                    onChanged: (value) {
                      // Handle email change
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildInfoCard(
                    context,
                    icon: Icons.phone_outlined,
                    label: 'Teléfono',
                    value: '+57 300 123 4567', // Placeholder
                    isEditing: _isEditing,
                    onChanged: (value) {
                      // Handle phone change
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildInfoCard(
                    context,
                    icon: Icons.home_outlined,
                    label: 'Apartamento',
                    value: user.unit ?? 'N/A',
                    isEditing: false, // Not editable
                    onChanged: (value) {
                      // Not used
                    },
                  ),
                  if (_isEditing)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _isEditing = false;
                            });
                            // TODO: Save changes to backend
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Perfil actualizado correctamente',
                                ),
                                backgroundColor: AppColors.success,
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text(
                            'Guardar Cambios',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          // Notificaciones
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 24),
                  Text(
                    'Notificaciones',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  _buildNotificationSwitch(
                    context,
                    icon: Icons.email_outlined,
                    label: 'Correo electrónico',
                    description: 'Recibir notificaciones por email',
                    value: _emailNotifications,
                    onChanged: (value) {
                      setState(() {
                        _emailNotifications = value;
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildNotificationSwitch(
                    context,
                    icon: Icons.notifications_outlined,
                    label: 'Notificaciones push',
                    description: 'Recibir alertas en el dispositivo',
                    value: _pushNotifications,
                    onChanged: (value) {
                      setState(() {
                        _pushNotifications = value;
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildNotificationSwitch(
                    context,
                    icon: Icons.local_parking_outlined,
                    label: 'Parqueadero',
                    description: 'Notificaciones de parqueo',
                    value: _parkingNotifications,
                    onChanged: (value) {
                      setState(() {
                        _parkingNotifications = value;
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildNotificationSwitch(
                    context,
                    icon: Icons.credit_card_outlined,
                    label: 'Pagos',
                    description: 'Recordatorios de pagos',
                    value: _paymentsNotifications,
                    onChanged: (value) {
                      setState(() {
                        _paymentsNotifications = value;
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildNotificationSwitch(
                    context,
                    icon: Icons.announcement_outlined,
                    label: 'Avisos y circulares',
                    description: 'Comunicaciones del edificio',
                    value: _announcementsNotifications,
                    onChanged: (value) {
                      setState(() {
                        _announcementsNotifications = value;
                      });
                    },
                  ),
                ],
              ),
            ),
          ),
          // Seguridad
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 24),
                  Text(
                    'Seguridad',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  _buildSecurityButton(
                    context,
                    icon: Icons.lock_outline,
                    label: 'Cambiar Contraseña',
                    onPressed: () {
                      // TODO: Navigate to change password screen
                    },
                  ),
                  const SizedBox(height: 8),
                  _buildSecurityButton(
                    context,
                    icon: Icons.fingerprint,
                    label: 'Autenticación Biométrica',
                    onPressed: () {
                      // TODO: Toggle biometric auth
                    },
                  ),
                ],
              ),
            ),
          ),
          // Cerrar sesión y versión
          SliverFillRemaining(
            hasScrollBody: false,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        await authProvider.signOut();
                        // Navigate to login screen will be handled by main.dart
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.error,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Cerrar Sesión',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'ResGuard Mobile v1.0.0',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    required bool isEditing,
    required Function(String) onChanged,
  }) {
    return Card(
      color: AppColors.surface,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                Icon(icon, color: AppColors.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            isEditing
                ? TextField(
                    onChanged: (value) => onChanged(value),
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: AppColors.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: AppColors.border),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(
                          color: AppColors.primary,
                          width: 2,
                        ),
                      ),
                      filled: true,
                      fillColor: AppColors.background,
                    ),
                    style: Theme.of(context).textTheme.bodyMedium,
                    controller: TextEditingController(text: value),
                  )
                : Row(
                    children: [
                      Icon(icon, size: 20, color: AppColors.textSecondary),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          value,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                    ],
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationSwitch(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String description,
    required bool value,
    required Function(bool) onChanged,
  }) {
    return Card(
      color: AppColors.surface,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(icon, color: AppColors.text),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            Switch(
              value: value,
              onChanged: onChanged,
              activeThumbColor: AppColors.primary,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSecurityButton(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
  }) {
    return Card(
      color: AppColors.surface,
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(label, style: Theme.of(context).textTheme.bodyMedium),
        trailing: const Icon(
          Icons.chevron_right,
          color: AppColors.textSecondary,
        ),
        onTap: onPressed,
      ),
    );
  }
}
