import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/providers/auth_provider.dart';

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key});

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  int _selectedIndex = 0;
  bool _isLoading = true;
  List<Map<String, dynamic>> _payments = [];
  final ApiService _api = ApiService();

  @override
  void initState() {
    super.initState();
    _loadPayments();
  }

  Future<void> _loadPayments() async {
    setState(() => _isLoading = true);
    try {
      final auth = context.read<AuthProvider>();
      final buildingId = auth.currentUser?.buildingId ?? '';

      final response = await _api.get('/api/payments', queryParams: {
        if (buildingId.isNotEmpty) 'buildingId': buildingId,
      });

      if (response['payments'] != null) {
        _payments = List<Map<String, dynamic>>.from(response['payments']);
      }
    } catch (e) {
      debugPrint('Error loading payments: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  List<Map<String, dynamic>> get _recentPayments =>
      _payments.where((p) => p['status'] == 'paid').toList();

  List<Map<String, dynamic>> get _pendingPayments =>
      _payments.where((p) => p['status'] == 'pending').toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Mis Pagos'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textLight,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadPayments,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : CustomScrollView(
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
                          context,
                          label: 'Recientes',
                          isSelected: _selectedIndex == 0,
                          onTap: () => setState(() => _selectedIndex = 0),
                        ),
                        _buildTabButton(
                          context,
                          label: 'Pendientes',
                          isSelected: _selectedIndex == 1,
                          onTap: () => setState(() => _selectedIndex = 1),
                        ),
                        _buildTabButton(
                          context,
                          label: 'Historial',
                          isSelected: _selectedIndex == 2,
                          onTap: () => setState(() => _selectedIndex = 2),
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
                        ? _buildRecentPayments()
                        : _selectedIndex == 1
                        ? _buildPendingPayments()
                        : _buildPaymentHistory(),
                  ),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Funcionalidad de pago en desarrollo'),
              backgroundColor: AppColors.info,
            ),
          );
        },
        child: const Icon(Icons.add, color: AppColors.textLight),
      ),
    );
  }

  Widget _buildTabButton(
    BuildContext context, {
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

  Widget _buildRecentPayments() {
    if (_recentPayments.isEmpty) {
      return _buildEmptyState(
        icon: Icons.payment_outlined,
        title: 'No hay pagos recientes',
        subtitle: 'Tus pagos más recientes aparecerán aquí',
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _recentPayments.length,
      itemBuilder: (context, index) {
        final payment = _recentPayments[index];
        return _buildPaymentCard(payment, showDetails: true);
      },
    );
  }

  Widget _buildPendingPayments() {
    if (_pendingPayments.isEmpty) {
      return _buildEmptyState(
        icon: Icons.pending_outlined,
        title: 'No hay pagos pendientes',
        subtitle: '¡Estás al día con tus pagos!',
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _pendingPayments.length,
      itemBuilder: (context, index) {
        final payment = _pendingPayments[index];
        return _buildPaymentCard(payment, showDetails: true, isPending: true);
      },
    );
  }

  Widget _buildPaymentHistory() {
    if (_payments.isEmpty) {
      return _buildEmptyState(
        icon: Icons.history_outlined,
        title: 'Historial de Pagos',
        subtitle: 'Ver el historial completo de tus pagos',
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _payments.length,
      itemBuilder: (context, index) {
        final payment = _payments[index];
        return _buildPaymentCard(payment, showDetails: true);
      },
    );
  }

  Widget _buildPaymentCard(
    Map<String, dynamic> payment, {
    bool showDetails = false,
    bool isPending = false,
  }) {
    final amount = (payment['amount'] ?? 0).toDouble();
    final status = payment['status'] ?? 'pending';
    final description = payment['description'] ?? 'Pago';
    final createdAt = payment['created_at'] ?? '';
    final paymentMethod = payment['payment_method'] ?? '';

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
                        description,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Fecha: $createdAt',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      if (showDetails && paymentMethod.isNotEmpty)
                        Text(
                          'Método: $paymentMethod',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '\$${amount.toStringAsFixed(0)}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    if (showDetails)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: status == 'paid'
                              ? AppColors.success.withValues(alpha: 0.2)
                              : AppColors.warning.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          status == 'paid' ? 'Pagado' : 'Pendiente',
                          style: const TextStyle(
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
            Text(title, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
