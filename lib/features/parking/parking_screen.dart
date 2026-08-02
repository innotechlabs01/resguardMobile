import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/providers/auth_provider.dart';

class ParkingScreen extends StatefulWidget {
  const ParkingScreen({super.key});

  @override
  State<ParkingScreen> createState() => _ParkingScreenState();
}

class _ParkingScreenState extends State<ParkingScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _parkingRequests = [];
  bool _hasActiveSpot = false;
  String _spotLocation = '';
  final ApiService _api = ApiService();

  @override
  void initState() {
    super.initState();
    _loadParkingRequests();
  }

  Future<void> _loadParkingRequests() async {
    setState(() => _isLoading = true);
    try {
      final response = await _api.get('/api/parking');
      if (response['parking_requests'] != null) {
        _parkingRequests = List<Map<String, dynamic>>.from(
          response['parking_requests'],
        );
        _hasActiveSpot = _parkingRequests.any(
          (p) => p['status'] == 'approved' || p['status'] == 'active',
        );
        if (_hasActiveSpot) {
          final active = _parkingRequests.firstWhere(
            (p) => p['status'] == 'approved' || p['status'] == 'active',
          );
          _spotLocation = active['spot_number'] ?? active['spot'] ?? '';
        }
      }
    } catch (e) {
      debugPrint('Error loading parking requests: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Parqueadero'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textLight,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Active Spot Status
                  if (_hasActiveSpot)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.local_parking,
                            size: 24,
                            color: AppColors.success,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Parqueadero Activo',
                                  style:
                                      Theme.of(
                                        context,
                                      ).textTheme.titleMedium?.copyWith(
                                        color: AppColors.success,
                                      ) ??
                                      const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w500,
                                        color: AppColors.success,
                                      ),
                                ),
                                Text(
                                  'Espacio: $_spotLocation',
                                  style:
                                      Theme.of(context).textTheme.bodyMedium
                                          ?.copyWith(color: AppColors.text) ??
                                      const TextStyle(color: AppColors.text),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 24),
                  // Request History
                  Text(
                    'Historial de Solicitudes',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  _parkingRequests.isEmpty
                      ? SizedBox(height: 200, child: _buildEmptyState())
                      : SizedBox(
                          height: _parkingRequests.length * 160.0,
                          child: ListView.builder(
                            itemCount: _parkingRequests.length,
                            itemBuilder: (context, index) {
                              final request = _parkingRequests[index];
                              return _buildParkingRequestCard(request);
                            },
                          ),
                        ),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        onPressed: () {
          // TODO: Show new parking request form
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Funcionalidad de solicitar parqueadero en desarrollo',
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
            Icon(
              Icons.local_parking_outlined,
              size: 64,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 24),
            Text(
              'No hay solicitudes de parqueadero',
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
              'Tus solicitudes de parqueadero aparecerán aquí',
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

  Widget _buildParkingRequestCard(Map<String, dynamic> request) {
    final status = request['status'] ?? 'pending';
    final spotNumber = request['spot_number'] ?? request['spot'] ?? '';
    final vehicleInfo = request['vehicle_info'] ?? request['vehicle'] ?? '';
    final startDate = request['start_date'] ?? request['date'] ?? '';
    final endDate = request['end_date'] ?? '';
    final startTime = request['start_time'] ?? request['startTime'] ?? '';
    final endTime = request['end_time'] ?? request['endTime'] ?? '';

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
                        'Espacio: $spotNumber',
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
                        'Vehículo: $vehicleInfo',
                        style:
                            Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ) ??
                            const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Fecha: $startDate${endDate.isNotEmpty ? ' - $endDate' : ''}',
                        style:
                            Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ) ??
                            const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                      ),
                      if (startTime.isNotEmpty && endTime.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Horario: $startTime - $endTime',
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
                        color: status == 'approved' || status == 'active'
                            ? AppColors.success.withValues(alpha: 0.2)
                            : status == 'pending'
                            ? AppColors.warning.withValues(alpha: 0.2)
                            : AppColors.error.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        status == 'approved' || status == 'active'
                            ? 'Activa'
                            : status == 'pending'
                            ? 'Pendiente'
                            : 'Rechazada',
                        style: TextStyle(
                          color: status == 'approved' || status == 'active'
                              ? AppColors.success
                              : status == 'pending'
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
          ],
        ),
      ),
    );
  }
}
