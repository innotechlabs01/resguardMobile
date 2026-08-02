import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/services/api_service.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/providers/auth_provider.dart';
import '../../shared/providers/voting_provider.dart';

class AssembliesScreen extends StatefulWidget {
  const AssembliesScreen({super.key});

  @override
  State<AssembliesScreen> createState() => _AssembliesScreenState();
}

class _AssembliesScreenState extends State<AssembliesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiService _api = ApiService();
  List<Map<String, dynamic>> _assemblies = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadAssemblies();
  }

  Future<void> _loadAssemblies() async {
    setState(() => _isLoading = true);
    try {
      final auth = context.read<AuthProvider>();
      final buildingId = auth.currentUser?.buildingId ?? '';

      if (buildingId.isNotEmpty) {
        final response = await _api.get(
          '/api/assemblies',
          queryParams: {'buildingId': buildingId},
        );

        if (response['assemblies'] != null) {
          _assemblies = List<Map<String, dynamic>>.from(
            response['assemblies'],
          );
        }
      }
    } catch (e) {
      debugPrint('Error loading assemblies: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showCreateVotingDialog() {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 20,
          right: 20,
          top: 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Activar Nueva Votación',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Solo administradores pueden activar votaciones',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: titleController,
              decoration: InputDecoration(
                labelText: 'Título de la votación',
                hintText: 'Ej: Nueva normativa de mascotas',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: descriptionController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: 'Descripción',
                hintText: 'Describe la propuesta a votar',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                if (titleController.text.isNotEmpty) {
                  final votingProvider = Provider.of<VotingProvider>(
                    context,
                    listen: false,
                  );
                  votingProvider.enableVoting(
                    votingId: 'voting_${DateTime.now().millisecondsSinceEpoch}',
                    title: titleController.text,
                    description: descriptionController.text.isNotEmpty
                        ? descriptionController.text
                        : 'Sin descripción',
                  );
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Votación activada exitosamente'),
                      backgroundColor: AppColors.success,
                    ),
                  );
                }
              },
              child: const Text('Activar Votación'),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  void _showVoteDialog() {
    final votingProvider = context.read<VotingProvider>();
    final authProvider = context.read<AuthProvider>();
    final user = authProvider.currentUser;

    String apartmentId = 'apt_${user?.id ?? 'unknown'}';

    if (votingProvider.hasVoted(apartmentId)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Ya has registrado tu voto'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          String? selectedVote;
          return Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Registrar Voto',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Apartamento: $apartmentId\nEste voto es irrevocable',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                if (votingProvider.activeVotingTitle != null) ...[
                  Text(
                    votingProvider.activeVotingTitle!,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (votingProvider.activeVotingDescription != null)
                    Text(
                      votingProvider.activeVotingDescription!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                ],
                const SizedBox(height: 24),
                Text(
                  'Selecciona tu voto:',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 12),
                _VoteOption(
                  label: 'A favor',
                  icon: Icons.thumb_up_outlined,
                  color: AppColors.success,
                  isSelected: selectedVote == 'inFavor',
                  onTap: () => setModalState(() => selectedVote = 'inFavor'),
                ),
                const SizedBox(height: 8),
                _VoteOption(
                  label: 'En contra',
                  icon: Icons.thumb_down_outlined,
                  color: AppColors.error,
                  isSelected: selectedVote == 'against',
                  onTap: () => setModalState(() => selectedVote = 'against'),
                ),
                const SizedBox(height: 8),
                _VoteOption(
                  label: 'Abstención',
                  icon: Icons.remove_circle_outline,
                  color: AppColors.textSecondary,
                  isSelected: selectedVote == 'abstention',
                  onTap: () => setModalState(() => selectedVote = 'abstention'),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: selectedVote == null
                      ? null
                      : () {
                          VoteStatus vote;
                          switch (selectedVote) {
                            case 'inFavor':
                              vote = VoteStatus.votedInFavor;
                              break;
                            case 'against':
                              vote = VoteStatus.votedAgainst;
                              break;
                            default:
                              vote = VoteStatus.votedAbstention;
                          }

                          bool success = votingProvider.castVote(
                            apartmentId,
                            vote,
                          );
                          Navigator.pop(context);
                          if (success) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Voto registrado correctamente. No podrás cambiarlo.',
                                ),
                                backgroundColor: AppColors.success,
                              ),
                            );
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Error al registrar el voto'),
                                backgroundColor: AppColors.error,
                              ),
                            );
                          }
                        },
                  child: const Text('Confirmar Voto'),
                ),
                const SizedBox(height: 12),
                Text(
                  '⚠️ Una vez confirmado, tu voto no podrá ser modificado',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: AppColors.error),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final votingProvider = context.watch<VotingProvider>();
    final user = authProvider.currentUser;

    bool isAdmin =
        user?.role.toString() == 'UserRole.admin' ||
        user?.role.toString() == 'UserRole.superAdmin';

    String apartmentId = 'apt_${user?.id ?? 'unknown'}';
    bool hasVoted = votingProvider.hasVoted(apartmentId);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Asambleas'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Votación Activa'),
            Tab(text: 'Resultados'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildActiveTab(votingProvider, isAdmin, hasVoted, apartmentId),
          _buildResultsTab(votingProvider),
        ],
      ),
      floatingActionButton: isAdmin
          ? FloatingActionButton.extended(
              onPressed: _showCreateVotingDialog,
              icon: const Icon(Icons.how_to_vote),
              label: const Text('Activar Votación'),
            )
          : !votingProvider.isVotingEnabled
          ? null
          : FloatingActionButton.extended(
              onPressed: hasVoted ? null : _showVoteDialog,
              icon: Icon(hasVoted ? Icons.check : Icons.how_to_vote),
              label: Text(hasVoted ? 'Ya Votaste' : 'Votar'),
              backgroundColor: hasVoted
                  ? AppColors.textSecondary
                  : AppColors.primary,
            ),
    );
  }

  Widget _buildActiveTab(
    VotingProvider votingProvider,
    bool isAdmin,
    bool hasVoted,
    String apartmentId,
  ) {
    if (!votingProvider.isVotingEnabled) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.how_to_vote_outlined,
                size: 80,
                color: AppColors.textSecondary.withValues(alpha: 0.5),
              ),
              const SizedBox(height: 24),
              Text(
                'No hay votaciones activas',
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                isAdmin
                    ? 'Como administrador, puedes activar una nueva votación'
                    : 'Las votaciones son habilitadas por el administrador',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.3),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: const BoxDecoration(
                        color: AppColors.success,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'VOTACIÓN ACTIVA',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  votingProvider.activeVotingTitle ?? 'Sin título',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                if (votingProvider.activeVotingDescription != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    votingProvider.activeVotingDescription!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Estado del voto',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(
                      hasVoted ? Icons.check_circle : Icons.pending,
                      color: hasVoted ? AppColors.success : AppColors.warning,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      hasVoted
                          ? 'Ya has registrado tu voto'
                          : 'Aún no has votado',
                      style: TextStyle(
                        color: hasVoted ? AppColors.success : AppColors.warning,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Apartamento: $apartmentId',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                if (hasVoted) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.lock, color: AppColors.warning, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          'Tu voto está bloqueado y no puede ser modificado',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: AppColors.warning),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),
          if (!hasVoted)
            ElevatedButton.icon(
              onPressed: _showVoteDialog,
              icon: const Icon(Icons.how_to_vote),
              label: const Text('Registrar Mi Voto'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Resultados parciales',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 16),
                  _buildResultBar(
                    'A favor',
                    votingProvider.voteCounts['inFavor'] ?? 0,
                    votingProvider.totalVotes,
                    AppColors.success,
                  ),
                  const SizedBox(height: 8),
                  _buildResultBar(
                    'En contra',
                    votingProvider.voteCounts['against'] ?? 0,
                    votingProvider.totalVotes,
                    AppColors.error,
                  ),
                  const SizedBox(height: 8),
                  _buildResultBar(
                    'Abstención',
                    votingProvider.voteCounts['abstention'] ?? 0,
                    votingProvider.totalVotes,
                    AppColors.textSecondary,
                  ),
                ],
              ),
            ),
          if (isAdmin) ...[
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () {
                votingProvider.disableVoting();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Votación cerrada'),
                    backgroundColor: AppColors.info,
                  ),
                );
              },
              icon: const Icon(Icons.stop),
              label: const Text('Cerrar Votación'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: AppColors.error),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildResultsTab(VotingProvider votingProvider) {
    if (votingProvider.totalVotes == 0) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.bar_chart_outlined,
                size: 80,
                color: AppColors.textSecondary.withValues(alpha: 0.5),
              ),
              const SizedBox(height: 24),
              Text(
                'Sin resultados aún',
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Los resultados aparecerán cuando se registren votos',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text(
                  'Total de Votos',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${votingProvider.totalVotes}',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _buildResultCard(
            'A favor',
            votingProvider.voteCounts['inFavor'] ?? 0,
            votingProvider.totalVotes,
            votingProvider.getPercentage('inFavor'),
            AppColors.success,
          ),
          const SizedBox(height: 12),
          _buildResultCard(
            'En contra',
            votingProvider.voteCounts['against'] ?? 0,
            votingProvider.totalVotes,
            votingProvider.getPercentage('against'),
            AppColors.error,
          ),
          const SizedBox(height: 12),
          _buildResultCard(
            'Abstención',
            votingProvider.voteCounts['abstention'] ?? 0,
            votingProvider.totalVotes,
            votingProvider.getPercentage('abstention'),
            AppColors.textSecondary,
          ),
          const SizedBox(height: 24),
          if (votingProvider.isVotingEnabled)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: AppColors.warning),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'La votación aún está activa. Los resultados son parciales.',
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: AppColors.warning),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildResultBar(String label, int count, int total, Color color) {
    double percentage = total > 0 ? (count / total) : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: TextStyle(color: color)),
            Text('$count'),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percentage,
            backgroundColor: AppColors.border,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 8,
          ),
        ),
      ],
    );
  }

  Widget _buildResultCard(
    String label,
    int count,
    int total,
    double percentage,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '${percentage.toStringAsFixed(0)}%',
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '$count votos',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _VoteOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool isSelected;
  final VoidCallback onTap;

  const _VoteOption({
    required this.label,
    required this.icon,
    required this.color,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected ? color.withValues(alpha: 0.1) : AppColors.background,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? color : AppColors.border,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Icon(icon, color: color),
              const SizedBox(width: 12),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
              const Spacer(),
              if (isSelected) Icon(Icons.check_circle, color: color),
            ],
          ),
        ),
      ),
    );
  }
}
