import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/providers/auth_provider.dart';
import '../../shared/providers/notifications_provider.dart';

class CitofonoScreen extends StatefulWidget {
  const CitofonoScreen({super.key});

  @override
  State<CitofonoScreen> createState() => _CitofonoScreenState();
}

class _CitofonoScreenState extends State<CitofonoScreen> {
  bool _isLoading = true;
  bool _isStreaming = false;
  String _visitorName = '';
  String _visitorTime = '';
  bool _doorUnlocked = false;
  final ApiService _api = ApiService();
  List<Map<String, dynamic>> _intercomCalls = [];
  Map<String, dynamic>? _currentCall;

  @override
  void initState() {
    super.initState();
    _loadCitofonoStatus();
  }

  Future<void> _loadCitofonoStatus() async {
    setState(() => _isLoading = true);
    try {
      final auth = context.read<AuthProvider>();
      final buildingId = auth.currentUser?.buildingId ?? '';

      if (buildingId.isNotEmpty) {
        final response = await _api.get('/api/intercom', queryParams: {
          'buildingId': buildingId,
          'type': 'calls',
        });
        if (response['calls'] != null) {
          _intercomCalls = List<Map<String, dynamic>>.from(response['calls']);
          if (_intercomCalls.isNotEmpty) {
            final call = _intercomCalls.first;
            _visitorName = call['caller_name'] ?? call['unit_number'] ?? '';
            _visitorTime = call['created_at'] ?? '';
            _currentCall = call;
          }
        }
      }

      setState(() => _isLoading = false);
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleStream() async {
    setState(() => _isStreaming = !_isStreaming);
  }

  Future<void> _unlockDoor() async {
    setState(() => _doorUnlocked = true);

    final authProvider = context.read<AuthProvider>();
    final notificationsProvider = context.read<NotificationsProvider>();

    if (_currentCall != null) {
      try {
        await _api.post('/api/intercom', body: {
          'buildingId': authProvider.currentUser?.buildingId ?? '',
          'callId': _currentCall!['id'],
          'response': 'approved',
        });
      } catch (e) {
        debugPrint('Error responding to call: $e');
      }
    }

    await notificationsProvider.createVigilanteEvent(
      eventType: 'visitor',
      description: 'Puerta desbloqueada para visitante: $_visitorName',
      visitorName: _visitorName,
      createdBy: authProvider.currentUser?.id ?? 'unknown',
    );

    await Future.delayed(const Duration(seconds: 3));
    setState(() => _doorUnlocked = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Puerta desbloqueada por 30 segundos'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Citófono'),
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
                  // Video Feed Preview
                  Container(
                    height: 200,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: _isStreaming
                          ? const Icon(
                              Icons.videocam,
                              size: 48,
                              color: AppColors.primary,
                            )
                          : const Icon(
                              Icons.videocam_off,
                              size: 48,
                              color: AppColors.textSecondary,
                            ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Stream Control Button
                  ElevatedButton.icon(
                    onPressed: _toggleStream,
                    icon: Icon(_isStreaming ? Icons.stop : Icons.play_arrow),
                    label: Text(
                      _isStreaming
                          ? 'Detener Transmisión'
                          : 'Iniciar Transmisión',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: AppColors.textLight,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Visitor Info Card
                  Card(
                    color: AppColors.surface,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Visitante Reciente',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: AppColors.text,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              const Icon(
                                Icons.person_outline,
                                size: 24,
                                color: AppColors.primary,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _visitorName,
                                      style:
                                          Theme.of(
                                            context,
                                          ).textTheme.titleMedium?.copyWith(
                                            color: AppColors.text,
                                          ) ??
                                          Theme.of(
                                            context,
                                          ).textTheme.titleMedium,
                                    ),
                                    Text(
                                      _visitorTime,
                                      style:
                                          Theme.of(
                                            context,
                                          ).textTheme.bodySmall?.copyWith(
                                            color: AppColors.textSecondary,
                                          ) ??
                                          Theme.of(context).textTheme.bodySmall,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Unlock Door Button
                  ElevatedButton.icon(
                    onPressed: _unlockDoor,
                    icon: const Icon(Icons.lock_open),
                    label: const Text('Desbloquear Puerta Principal'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _doorUnlocked
                          ? AppColors.success
                          : AppColors.primary,
                      foregroundColor: AppColors.textLight,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Status Indicator
                  if (_doorUnlocked)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 16,
                            color: AppColors.success,
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              'Puerta desbloqueada - Se cerrará automáticamente',
                              style: TextStyle(
                                color: AppColors.success,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}
