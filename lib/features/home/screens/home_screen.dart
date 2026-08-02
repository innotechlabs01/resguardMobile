import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/providers/auth_provider.dart';
import '../../../shared/providers/notifications_provider.dart';
import '../../../features/parking/parking_screen.dart';
import '../../../features/reservations/reservations_screen.dart';
import '../../../features/payments/payments_screen.dart';
import '../../../features/notifications/notifications_screen.dart';
import '../../../features/citofono/citofono_screen.dart';
import '../../../features/assemblies/assemblies_screen.dart';
import '../../../features/mercado/mercado_screen.dart';
import '../../../features/alquiler/alquiler_screen.dart';
import '../../../features/account/account_screen.dart';
import '../../../features/communications/communications_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.currentUser;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: user == null
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: CustomScrollView(
                slivers: [
                  // App Bar
                  SliverAppBar(
                    floating: true,
                    backgroundColor: AppColors.background,
                    elevation: 0,
                    title: Row(
                      children: [
                        Icon(
                          Icons.shield_outlined,
                          color: AppColors.primary,
                          size: 28,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'ResGuard',
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    actions: [
                      Consumer<NotificationsProvider>(
                        builder: (context, notificationsProvider, _) {
                          final unreadCount = notificationsProvider.unreadCount;
                          return Stack(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.notifications_outlined),
                                onPressed: () => _navigateTo(
                                  context,
                                  const NotificationsScreen(),
                                ),
                              ),
                              if (unreadCount > 0)
                                Positioned(
                                  right: 8,
                                  top: 8,
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                      color: AppColors.error,
                                      shape: BoxShape.circle,
                                    ),
                                    constraints: const BoxConstraints(
                                      minWidth: 18,
                                      minHeight: 18,
                                    ),
                                    child: Text(
                                      unreadCount > 9
                                          ? '9+'
                                          : unreadCount.toString(),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ),
                            ],
                          );
                        },
                      ),
                      PopupMenuButton<String>(
                        icon: CircleAvatar(
                          radius: 16,
                          backgroundColor: AppColors.primary,
                          child: Text(
                            user.displayName.isNotEmpty
                                ? user.displayName[0].toUpperCase()
                                : 'U',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        onSelected: (value) {
                          if (value == 'account') {
                            _navigateTo(context, const AccountScreen());
                          } else if (value == 'logout') {
                            authProvider.signOut();
                          }
                        },
                        itemBuilder: (context) => [
                          PopupMenuItem(
                            value: 'account',
                            child: Row(
                              children: [
                                const Icon(Icons.person_outline, size: 20),
                                const SizedBox(width: 8),
                                Text(user.displayName),
                              ],
                            ),
                          ),
                          const PopupMenuDivider(),
                          const PopupMenuItem(
                            value: 'logout',
                            child: Row(
                              children: [
                                Icon(
                                  Icons.logout,
                                  size: 20,
                                  color: AppColors.error,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'Cerrar sesión',
                                  style: TextStyle(color: AppColors.error),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 8),
                    ],
                  ),

                  // Content
                  SliverPadding(
                    padding: const EdgeInsets.all(20),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        // Greeting
                        Text(
                          'Hola, ${user.displayName.split(' ').first}',
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _getRoleName(user.role),
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 24),

                        // Quick Actions Grid
                        Text(
                          'Módulos',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 16),
                      ]),
                    ),
                  ),

                  // Module Grid
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            mainAxisSpacing: 12,
                            crossAxisSpacing: 12,
                            childAspectRatio: 0.9,
                          ),
                      delegate: SliverChildListDelegate([
                        _ModuleCard(
                          icon: Icons.directions_car_outlined,
                          label: 'Parqueadero',
                          onTap: () =>
                              _navigateTo(context, const ParkingScreen()),
                        ),
                        _ModuleCard(
                          icon: Icons.event_outlined,
                          label: 'Reservas',
                          onTap: () =>
                              _navigateTo(context, const ReservationsScreen()),
                        ),
                        _ModuleCard(
                          icon: Icons.payment_outlined,
                          label: 'Pagos',
                          onTap: () =>
                              _navigateTo(context, const PaymentsScreen()),
                        ),
                        _ModuleCard(
                          icon: Icons.campaign_outlined,
                          label: 'Comunicados',
                          onTap: () => _navigateTo(
                            context,
                            const CommunicationsScreen(),
                          ),
                        ),
                        _ModuleCard(
                          icon: Icons.video_camera_front_outlined,
                          label: 'Citófono',
                          onTap: () =>
                              _navigateTo(context, const CitofonoScreen()),
                        ),
                        _ModuleCard(
                          icon: Icons.storefront_outlined,
                          label: 'Mercado',
                          onTap: () =>
                              _navigateTo(context, const MercadoScreen()),
                        ),
                        _ModuleCard(
                          icon: Icons.how_to_vote_outlined,
                          label: 'Asambleas',
                          onTap: () =>
                              _navigateTo(context, const AssembliesScreen()),
                        ),
                        _ModuleCard(
                          icon: Icons.home_outlined,
                          label: 'Alquiler',
                          onTap: () =>
                              _navigateTo(context, const AlquilerScreen()),
                        ),
                        _ModuleCard(
                          icon: Icons.person_outline,
                          label: 'Cuenta',
                          onTap: () =>
                              _navigateTo(context, const AccountScreen()),
                        ),
                      ]),
                    ),
                  ),

                  // Bottom padding
                  const SliverPadding(padding: EdgeInsets.only(bottom: 32)),
                ],
              ),
            ),
    );
  }

  void _navigateTo(BuildContext context, Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (context) => screen));
  }

  String _getRoleName(dynamic role) {
    switch (role.toString()) {
      case 'UserRole.superAdmin':
        return 'Super Administrador';
      case 'UserRole.admin':
        return 'Administrador';
      case 'UserRole.vigilante':
        return 'Vigilante';
      default:
        return 'Residente';
    }
  }
}

class _ModuleCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ModuleCard({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border, width: 1),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 32, color: AppColors.iconPrimary),
              const SizedBox(height: 8),
              Text(
                label,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w500),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
