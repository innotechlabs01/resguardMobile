import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/providers/auth_provider.dart';

class MercadoScreen extends StatefulWidget {
  const MercadoScreen({super.key});

  @override
  State<MercadoScreen> createState() => _MercadoScreenState();
}

class _MercadoScreenState extends State<MercadoScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _listings = [];
  String _selectedCategory = 'Todos';
  String _selectedFilter = 'Todos';
  final List<String> _categories = [
    'Todos',
    'Apartamentos',
    'Muebles',
    'Electrodomésticos',
    'Servicios',
    'Otros',
  ];
  final List<String> _filters = [
    'Todos',
    'Disponibles',
    'Vendidos',
    'Mis Publicaciones',
  ];

  @override
  void initState() {
    super.initState();
    _loadListings();
  }

  Future<void> _loadListings() async {
    setState(() => _isLoading = true);
    try {
      await Future.delayed(const Duration(milliseconds: 500));
      setState(() {
        _listings = [
          {
            'id': '1',
            'title': 'Apartamento 2 habitaciones',
            'description':
                'Hermoso apartamento en el piso 5, con vista al parque. Incluye cocina equipada y 2 baños.',
            'price': 180000000,
            'category': 'Apartamentos',
            'seller': 'Carlos Mendoza',
            'sellerId': 'user_1',
            'imageUrl':
                'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
            'isAvailable': true,
            'createdAt': '2024-01-10',
          },
          {
            'id': '2',
            'title': 'Sofá de 3 plazas',
            'description': 'En buen estado, color gris, semi nuevo.',
            'price': 1500000,
            'category': 'Muebles',
            'seller': 'María López',
            'sellerId': 'user_2',
            'imageUrl':
                'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
            'isAvailable': true,
            'createdAt': '2024-01-12',
          },
          {
            'id': '3',
            'title': 'Lavadora Samsung 7kg',
            'description': 'Funciona perfectamente, garantía hasta 2025.',
            'price': 2500000,
            'category': 'Electrodomésticos',
            'seller': 'Juan Pérez',
            'sellerId': 'user_3',
            'imageUrl':
                'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400',
            'isAvailable': true,
            'createdAt': '2024-01-08',
          },
          {
            'id': '4',
            'title': 'Servicio de mudanzas',
            'description': 'Transporte dentro de la ciudad, precio fijo.',
            'price': 800000,
            'category': 'Servicios',
            'seller': 'Pedro Ramírez',
            'sellerId': 'user_4',
            'imageUrl':
                'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400',
            'isAvailable': true,
            'createdAt': '2024-01-15',
          },
          {
            'id': '5',
            'title': 'Apartamento amueblado',
            'description':
                'Se vende amueblado, listo para habitar. 3 habitaciones.',
            'price': 250000000,
            'category': 'Apartamentos',
            'seller': 'Ana García',
            'sellerId': 'user_5',
            'imageUrl':
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
            'isAvailable': false,
            'createdAt': '2024-01-05',
          },
        ];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  List<Map<String, dynamic>> get _filteredListings {
    var filtered = _listings;

    if (_selectedCategory != 'Todos') {
      filtered = filtered
          .where((l) => l['category'] == _selectedCategory)
          .toList();
    }

    switch (_selectedFilter) {
      case 'Disponibles':
        filtered = filtered.where((l) => l['isAvailable'] == true).toList();
        break;
      case 'Vendidos':
        filtered = filtered.where((l) => l['isAvailable'] == false).toList();
        break;
      case 'Mis Publicaciones':
        filtered = filtered.where((l) => l['sellerId'] == 'user_1').toList();
        break;
    }

    return filtered;
  }

  String _formatPrice(int price) {
    if (price >= 1000000) {
      return '\$${(price / 1000000).toStringAsFixed(1)}M';
    }
    return '\$${price.toStringAsFixed(0)}';
  }

  void _showCreateDialog() {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    final priceController = TextEditingController();
    String selectedCategory = 'Apartamentos';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 20,
            right: 20,
            top: 20,
          ),
          child: SingleChildScrollView(
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Nueva Publicación',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(
                    labelText: 'Título',
                    hintText: 'Ej: Apartamento en venta',
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: selectedCategory,
                  decoration: const InputDecoration(labelText: 'Categoría'),
                  items: _categories
                      .where((c) => c != 'Todos')
                      .map(
                        (category) => DropdownMenuItem(
                          value: category,
                          child: Text(category),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    setModalState(() => selectedCategory = value!);
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: priceController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Precio',
                    hintText: 'Ej: 150000000',
                    prefixText: '\$ ',
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: descriptionController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Descripción',
                    hintText: 'Describe tu producto o servicio',
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    if (titleController.text.isNotEmpty &&
                        priceController.text.isNotEmpty) {
                      final price =
                          int.tryParse(
                            priceController.text.replaceAll(
                              RegExp(r'[^0-9]'),
                              '',
                            ),
                          ) ??
                          0;
                      setState(() {
                        _listings.insert(0, {
                          'id': DateTime.now().millisecondsSinceEpoch
                              .toString(),
                          'title': titleController.text,
                          'description': descriptionController.text,
                          'price': price,
                          'category': selectedCategory,
                          'seller': 'Tú',
                          'sellerId': 'user_1',
                          'imageUrl':
                              'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
                          'isAvailable': true,
                          'createdAt': DateTime.now().toString().split(' ')[0],
                        });
                      });
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Publicación creada exitosamente'),
                          backgroundColor: AppColors.success,
                        ),
                      );
                    }
                  },
                  child: const Text('Publicar'),
                ),
                const SizedBox(height: 12),
                Text(
                  'Nota: Tu publicación será revisada por un administrador antes de ser visible.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showDetailDialog(Map<String, dynamic> listing) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                height: 200,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(20),
                  ),
                ),
                child: Stack(
                  children: [
                    Center(
                      child: Icon(
                        Icons.image_outlined,
                        size: 64,
                        color: AppColors.textSecondary.withValues(alpha: 0.5),
                      ),
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: listing['isAvailable']
                              ? AppColors.success.withValues(alpha: 0.9)
                              : AppColors.error.withValues(alpha: 0.9),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          listing['isAvailable'] ? 'Disponible' : 'Vendido',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            listing['title'],
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _formatPrice(listing['price']),
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.category_outlined,
                            size: 16,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            listing['category'],
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Divider(),
                    const SizedBox(height: 16),
                    Text(
                      'Descripción',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      listing['description'],
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(height: 1.5),
                    ),
                    const SizedBox(height: 20),
                    const Divider(),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 20,
                          backgroundColor: AppColors.primary.withValues(
                            alpha: 0.1,
                          ),
                          child: Text(
                            listing['seller'][0],
                            style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              listing['seller'],
                              style: Theme.of(context).textTheme.titleSmall,
                            ),
                            Text(
                              'Vendedor',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                        const Spacer(),
                        IconButton(
                          icon: Icon(
                            Icons.chat_outlined,
                            color: AppColors.primary,
                          ),
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Contacto abierto')),
                            );
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    if (listing['isAvailable'])
                      ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Interés registrado. El vendedor será notificado.',
                              ),
                              backgroundColor: AppColors.success,
                            ),
                          );
                        },
                        icon: const Icon(Icons.shopping_cart_outlined),
                        label: const Text('Me Interesa'),
                      )
                    else
                      OutlinedButton.icon(
                        onPressed: null,
                        icon: const Icon(Icons.check_circle_outline),
                        label: const Text('Artículo Vendido'),
                      ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.currentUser;
    final isAdmin =
        user?.role.toString() == 'UserRole.admin' ||
        user?.role.toString() == 'UserRole.superAdmin';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Mercado'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadListings),
        ],
      ),
      body: Column(
        children: [
          // Filters
          Container(
            color: AppColors.surface,
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _categories.map((category) {
                      final isSelected = _selectedCategory == category;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(category),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() => _selectedCategory = category);
                          },
                          backgroundColor: AppColors.background,
                          selectedColor: AppColors.primary.withValues(
                            alpha: 0.2,
                          ),
                          checkmarkColor: AppColors.primary,
                          labelStyle: TextStyle(
                            color: isSelected
                                ? AppColors.primary
                                : AppColors.textSecondary,
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                          side: BorderSide(
                            color: isSelected
                                ? AppColors.primary
                                : AppColors.border,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _filters.map((filter) {
                      final isSelected = _selectedFilter == filter;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(filter),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() => _selectedFilter = filter);
                          },
                          backgroundColor: AppColors.background,
                          selectedColor: AppColors.iconPrimary.withValues(
                            alpha: 0.2,
                          ),
                          labelStyle: TextStyle(
                            color: isSelected
                                ? AppColors.iconPrimary
                                : AppColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // Listings count
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text(
                  '${_filteredListings.length} publicaciones',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const Spacer(),
                if (isAdmin)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.admin_panel_settings,
                          size: 14,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Modo Admin',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),

          // Listings
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredListings.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(
                    onRefresh: _loadListings,
                    child: GridView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 12,
                            crossAxisSpacing: 12,
                            childAspectRatio: 0.75,
                          ),
                      itemCount: _filteredListings.length,
                      itemBuilder: (context, index) {
                        final listing = _filteredListings[index];
                        return _ListingCard(
                          listing: listing,
                          onTap: () => _showDetailDialog(listing),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateDialog,
        child: const Icon(Icons.add),
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
              Icons.storefront_outlined,
              size: 64,
              color: AppColors.textSecondary.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'No hay publicaciones',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(color: AppColors.text),
            ),
            const SizedBox(height: 8),
            Text(
              'Sé el primero en publicar algo',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ListingCard extends StatelessWidget {
  final Map<String, dynamic> listing;
  final VoidCallback onTap;

  const _ListingCard({required this.listing, required this.onTap});

  String _formatPrice(int price) {
    if (price >= 1000000) {
      return '\$${(price / 1000000).toStringAsFixed(1)}M';
    }
    return '\$${price.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 3,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    color: AppColors.surface,
                    child: Icon(
                      Icons.image_outlined,
                      size: 48,
                      color: AppColors.textSecondary.withValues(alpha: 0.3),
                    ),
                  ),
                  if (!listing['isAvailable'])
                    Container(
                      color: Colors.black45,
                      child: const Center(
                        child: Text(
                          'VENDIDO',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      listing['title'],
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatPrice(listing['price']),
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      listing['category'],
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
