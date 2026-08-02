import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../core/models/user.dart';
import '../../core/services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _currentUser;
  bool _isLoading = true;
  bool _isAuthenticated = false;
  String? _error;
  final _storage = const FlutterSecureStorage();
  final _apiService = ApiService();

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get error => _error;

  AuthProvider() {
    _initializeAuth();
  }

  Future<void> _initializeAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _loadSavedSession();
    } catch (e) {
      _currentUser = null;
      _isAuthenticated = false;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> _loadSavedSession() async {
    final token = await _storage.read(key: 'auth_token');
    if (token == null) {
      _currentUser = null;
      _isAuthenticated = false;
      return;
    }

    _apiService.setAuthToken(token);

    try {
      final response = await _apiService.get('/api/user/profile');
      final userId = response['userId'] ?? '';
      final savedEmail = await _storage.read(key: 'user_email');
      final savedName = await _storage.read(key: 'user_name');
      final savedRole = await _storage.read(key: 'user_role');

      _currentUser = User(
        id: userId,
        email: savedEmail ?? '',
        displayName: savedName ?? 'Usuario',
        role: _parseRole(savedRole),
      );
      _isAuthenticated = true;
    } catch (e) {
      _currentUser = null;
      _isAuthenticated = false;
      await _storage.delete(key: 'auth_token');
    }
  }

  UserRole _parseRole(String? role) {
    switch (role) {
      case 'super_admin':
        return UserRole.superAdmin;
      case 'admin':
        return UserRole.admin;
      case 'vigilante':
        return UserRole.vigilante;
      default:
        return UserRole.resident;
    }
  }

  Future<void> signIn(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      if (password.length < 4) {
        throw Exception('Credenciales inválidas');
      }

      await _storage.write(key: 'user_email', value: email);
      await _storage.write(key: 'user_name', value: _extractDisplayName(email));

      _isAuthenticated = true;
      _error = null;
    } catch (e) {
      _error = 'Error al iniciar sesión';
      _isLoading = false;
      notifyListeners();
      rethrow;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> setAuthToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
    _apiService.setAuthToken(token);
  }

  Future<void> setUserRole(String role) async {
    await _storage.write(key: 'user_role', value: role);
    if (_currentUser != null) {
      _currentUser = User(
        id: _currentUser!.id,
        email: _currentUser!.email,
        displayName: _currentUser!.displayName,
        role: _parseRole(role),
        buildingId: _currentUser!.buildingId,
        unit: _currentUser!.unit,
        buildingName: _currentUser!.buildingName,
      );
      notifyListeners();
    }
  }

  String _extractDisplayName(String email) {
    final parts = email.split('@');
    if (parts.isNotEmpty) {
      final name = parts[0];
      return name
          .replaceAll(RegExp(r'[._]'), ' ')
          .split(' ')
          .map(
            (word) => word.isNotEmpty
                ? '${word[0].toUpperCase()}${word.substring(1).toLowerCase()}'
                : '',
          )
          .join(' ');
    }
    return 'Usuario';
  }

  Future<void> signOut() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _storage.delete(key: 'auth_token');
      await _storage.delete(key: 'user_email');
      await _storage.delete(key: 'user_name');
      await _storage.delete(key: 'user_role');

      _apiService.setAuthToken(null);
      _currentUser = null;
      _isAuthenticated = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateProfile({String? displayName, String? email}) async {
    if (_currentUser == null) return;

    _currentUser = User(
      id: _currentUser!.id,
      email: email ?? _currentUser!.email,
      displayName: displayName ?? _currentUser!.displayName,
      role: _currentUser!.role,
      buildingId: _currentUser!.buildingId,
      unit: _currentUser!.unit,
      buildingName: _currentUser!.buildingName,
    );

    if (displayName != null) {
      await _storage.write(key: 'user_name', value: displayName);
    }
    if (email != null) {
      await _storage.write(key: 'user_email', value: email);
    }

    notifyListeners();
  }
}
