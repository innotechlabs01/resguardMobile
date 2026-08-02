import 'package:flutter/material.dart';

enum Permission {
  createCommunications,
  createMarketplace,
  createReservations,
  createPayments,
  participateInVoting,
  manageAssemblies,
  manageUsers,
  manageSettings,
}

class PermissionsProvider extends ChangeNotifier {
  Map<Permission, bool> _permissions = {
    Permission.createCommunications: true,
    Permission.createMarketplace: false,
    Permission.createReservations: true,
    Permission.createPayments: false,
    Permission.participateInVoting: false,
    Permission.manageAssemblies: false,
    Permission.manageUsers: false,
    Permission.manageSettings: false,
  };

  bool _isAdminModeEnabled = false;

  Map<Permission, bool> get permissions => _permissions;
  bool get isAdminModeEnabled => _isAdminModeEnabled;

  bool hasPermission(Permission permission) {
    return _permissions[permission] ?? false;
  }

  bool get canCreateCommunications =>
      hasPermission(Permission.createCommunications);
  bool get canCreateMarketplace => hasPermission(Permission.createMarketplace);
  bool get canCreateReservations =>
      hasPermission(Permission.createReservations);
  bool get canParticipateInVoting =>
      hasPermission(Permission.participateInVoting);

  void updatePermission(Permission permission, bool value) {
    _permissions[permission] = value;
    notifyListeners();
  }

  void enableAdminMode() {
    _isAdminModeEnabled = true;
    _permissions = {
      Permission.createCommunications: true,
      Permission.createMarketplace: true,
      Permission.createReservations: true,
      Permission.createPayments: true,
      Permission.participateInVoting: true,
      Permission.manageAssemblies: true,
      Permission.manageUsers: true,
      Permission.manageSettings: true,
    };
    notifyListeners();
  }

  void disableAdminMode() {
    _isAdminModeEnabled = false;
    _permissions = {
      Permission.createCommunications: true,
      Permission.createMarketplace: false,
      Permission.createReservations: true,
      Permission.createPayments: false,
      Permission.participateInVoting: false,
      Permission.manageAssemblies: false,
      Permission.manageUsers: false,
      Permission.manageSettings: false,
    };
    notifyListeners();
  }

  void resetToDefaults() {
    _isAdminModeEnabled = false;
    _permissions = {
      Permission.createCommunications: true,
      Permission.createMarketplace: false,
      Permission.createReservations: true,
      Permission.createPayments: false,
      Permission.participateInVoting: false,
      Permission.manageAssemblies: false,
      Permission.manageUsers: false,
      Permission.manageSettings: false,
    };
    notifyListeners();
  }

  String getPermissionName(Permission permission) {
    switch (permission) {
      case Permission.createCommunications:
        return 'Crear Comunicados';
      case Permission.createMarketplace:
        return 'Publicar en Mercado';
      case Permission.createReservations:
        return 'Crear Reservas';
      case Permission.createPayments:
        return 'Realizar Pagos';
      case Permission.participateInVoting:
        return 'Participar en Votaciones';
      case Permission.manageAssemblies:
        return 'Gestionar Asambleas';
      case Permission.manageUsers:
        return 'Gestionar Usuarios';
      case Permission.manageSettings:
        return 'Configurar Sistema';
    }
  }
}
