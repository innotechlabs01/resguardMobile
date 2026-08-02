import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class AlquilerScreen extends StatefulWidget {
  const AlquilerScreen({super.key});

  @override
  State<AlquilerScreen> createState() => _AlquilerScreenState();
}

class _AlquilerScreenState extends State<AlquilerScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _rentals = [];

  @override
  void initState() {
    super.initState();
    _loadRentals();
  }

  Future<void> _loadRentals() async {
    setState(() => _isLoading = true);
    try {
      // In a real app, this would fetch from the database
      // For now, we'll use dummy data
      await Future.delayed(const Duration(seconds: 2));
      setState(() {
        _isLoading = false;
        _rentals = [
          {
            'id': '1',
            'property': 'Apartamento 301',
            'tenant': 'María González',
            'startDate': '2026-01-15',
            'endDate': '2026-12-31',
            'monthlyRent': 800000,
            'status': 'Activo',
          },
          {
            'id': '2',
            'property': 'Apartamento 405',
            'tenant': 'Carlos Rodríguez',
            'startDate': '2026-03-01',
            'endDate': '2027-02-28',
            'monthlyRent': 950000,
            'status': 'Activo',
          },
        ];
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Mis Alquileres'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textLight,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _rentals.isEmpty
          ? _buildEmptyState()
          : ListView.builder(
              itemCount: _rentals.length,
              itemBuilder: (context, index) {
                final rental = _rentals[index];
                return _buildRentalCard(rental);
              },
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        onPressed: () {
          // TODO: Show rental management form
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Funcionalidad de gestión de alquileres en desarrollo',
              ),
              backgroundColor: AppColors.info,
            ),
          );
        },
        child: const Icon(Icons.add, color: AppColors.textLight),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.home_outlined, size: 64, color: AppColors.textSecondary),
            const SizedBox(height: 24),
            Text(
              'No tienes alquileres activos',
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
              'Tus alquileres aparecerán aquí cuando los tengas registrados',
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

  Widget _buildRentalCard(Map<String, dynamic> rental) {
    return Card(
      color: AppColors.surface,
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
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
                        rental['property'],
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: AppColors.text,
                            ) ??
                            TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              color: AppColors.text,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Inquilino: ${rental['tenant']}',
                        style:
                            Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ) ??
                            TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Período: ${rental['startDate']} - ${rental['endDate']}',
                        style:
                            Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ) ??
                            TextStyle(
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
                    Text(
                      '\$${rental['monthlyRent'].toStringAsFixed(0)}/mes',
                      style:
                          Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: rental['status'] == 'Activo'
                                ? AppColors.success
                                : AppColors.error,
                            fontWeight: FontWeight.bold,
                          ) ??
                          TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: rental['status'] == 'Activo'
                                ? AppColors.success
                                : AppColors.error,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: rental['status'] == 'Activo'
                            ? AppColors.success.withValues(alpha: 0.2)
                            : AppColors.error.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        rental['status'],
                        style: TextStyle(
                          color: rental['status'] == 'Activo'
                              ? AppColors.success
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
            const SizedBox(height: 12),
            Divider(color: AppColors.border),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.calendar_today,
                  size: 16,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    'Próximo pago: ${_getNextPaymentDate(rental['endDate'])}',
                    style:
                        Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ) ??
                        const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getNextPaymentDate(String endDate) {
    // Simplified: just return a fixed date for demo
    return '2026-04-30';
  }
}
