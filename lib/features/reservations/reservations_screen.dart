import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class ReservationsScreen extends StatefulWidget {
  const ReservationsScreen({super.key});

  @override
  State<ReservationsScreen> createState() => _ReservationsScreenState();
}

class _ReservationsScreenState extends State<ReservationsScreen> {
  int _selectedIndex = 0;

  // Sample reservation data - in a real app, this would come from backend
  final List<Map<String, dynamic>> _upcomingReservations = [
    {
      'id': '1',
      'space': 'Salón de Eventos',
      'date': '2026-04-15',
      'time': '18:00 - 22:00',
      'purpose': 'Fiesta de cumpleaños',
      'status': 'Confirmada',
      'guests': 25,
    },
    {
      'id': '2',
      'space': 'Parque Infantil',
      'date': '2026-04-20',
      'time': '10:00 - 14:00',
      'purpose': 'Reunión familiar',
      'status': 'Pendiente de pago',
      'guests': 15,
    },
  ];

  final List<Map<String, dynamic>> _pastReservations = [
    {
      'id': '3',
      'space': 'Salón de Eventos',
      'date': '2026-03-10',
      'time': '19:00 - 23:00',
      'purpose': 'Asamblea de propietarios',
      'status': 'Completada',
      'guests': 30,
    },
    {
      'id': '4',
      'space': 'Área de Parrillas',
      'date': '2026-03-05',
      'time': '12:00 - 16:00',
      'purpose': 'Asado familiar',
      'status': 'Completada',
      'guests': 12,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Mis Reservas'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textLight,
        elevation: 0,
      ),
      body: CustomScrollView(
        slivers: [
          // Tabs
          SliverToBoxAdapter(
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
              ),
              margin: const EdgeInsets.all(24),
              padding: const EdgeInsets.all(4),
              child: Row(
                children: [
                  _buildTabButton(
                    context: context,
                    label: 'Próximas',
                    isSelected: _selectedIndex == 0,
                    onTap: () => setState(() => _selectedIndex = 0),
                  ),
                  _buildTabButton(
                    context: context,
                    label: 'Historial',
                    isSelected: _selectedIndex == 1,
                    onTap: () => setState(() => _selectedIndex = 1),
                  ),
                ],
              ),
            ),
          ),
          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: _selectedIndex == 0
                  ? _buildUpcomingReservations()
                  : _buildPastReservations(),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        onPressed: () {
          // TODO: Show new reservation form
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Funcionalidad de nueva reserva en desarrollo'),
              backgroundColor: AppColors.info,
            ),
          );
        },
        child: const Icon(Icons.add, color: AppColors.textLight),
      ),
    );
  }

  Widget _buildTabButton({
    required BuildContext context,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primary.withValues(alpha: 0.2)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildUpcomingReservations() {
    if (_upcomingReservations.isEmpty) {
      return _buildEmptyState(
        icon: Icons.calendar_today_outlined,
        title: 'No hay reservas próximas',
        subtitle: 'Reserva un espacio común para tu próximo evento',
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _upcomingReservations.length,
      itemBuilder: (context, index) {
        final reservation = _upcomingReservations[index];
        return _buildReservationCard(reservation, showDetails: true);
      },
    );
  }

  Widget _buildPastReservations() {
    if (_pastReservations.isEmpty) {
      return _buildEmptyState(
        icon: Icons.history_outlined,
        title: 'No hay historial de reservas',
        subtitle: 'Tus reservas anteriores aparecerán aquí',
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _pastReservations.length,
      itemBuilder: (context, index) {
        final reservation = _pastReservations[index];
        return _buildReservationCard(reservation, showDetails: true);
      },
    );
  }

  Widget _buildReservationCard(
    Map<String, dynamic> reservation, {
    bool showDetails = false,
  }) {
    return Card(
      color: AppColors.surface,
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        reservation['space'],
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: AppColors.text,
                            ) ??
                            const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              color: AppColors.text,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${reservation['date']} • ${reservation['time']}',
                        style:
                            Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ) ??
                            const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                      ),
                      if (showDetails)
                        Text(
                          'Propósito: ${reservation['purpose']}',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                              ) ??
                              const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                        ),
                      if (showDetails && reservation.containsKey('guests'))
                        Text(
                          'Invitados: ${reservation['guests']}',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                              ) ??
                              const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                        ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: reservation['status'] == 'Confirmada'
                            ? AppColors.success.withValues(alpha: 0.2)
                            : reservation['status'] == 'Pendiente de pago'
                            ? AppColors.warning.withValues(alpha: 0.2)
                            : AppColors.error.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        reservation['status'],
                        style: TextStyle(
                          color: reservation['status'] == 'Confirmada'
                              ? AppColors.success
                              : reservation['status'] == 'Pendiente de pago'
                              ? AppColors.warning
                              : AppColors.error,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            if (showDetails) ...[
              const SizedBox(height: 12),
              Divider(color: AppColors.border),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.group_outlined,
                    size: 16,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Invitados: ${reservation['guests']}',
                    style:
                        Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ) ??
                        const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 64, color: AppColors.textSecondary),
            const SizedBox(height: 24),
            Text(
              title,
              style:
                  Theme.of(
                    context,
                  ).textTheme.headlineSmall?.copyWith(color: AppColors.text) ??
                  const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style:
                  Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ) ??
                  const TextStyle(fontSize: 14, color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
