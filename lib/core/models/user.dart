import 'package:equatable/equatable.dart';

enum UserRole { superAdmin, admin, vigilante, resident }

class User extends Equatable {
  final String id;
  final String email;
  final String displayName;
  final UserRole role;
  final String? buildingId;
  final String? unit;
  final String? buildingName;

  const User({
    required this.id,
    required this.email,
    required this.displayName,
    required this.role,
    this.buildingId,
    this.unit,
    this.buildingName,
  });

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'] ?? '',
      email: map['email'] ?? '',
      displayName: map['display_name'] ?? map['displayName'] ?? '',
      role: _parseRole(map['role'] ?? 'resident'),
      buildingId: map['building_id'] ?? map['buildingId'],
      unit: map['unit'],
      buildingName: map['building_name'] ?? map['buildingName'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'email': email,
      'display_name': displayName,
      'role': role.name,
      'building_id': buildingId,
      'unit': unit,
    };
  }

  static UserRole _parseRole(String role) {
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

  @override
  List<Object?> get props => [id, email, displayName, role, buildingId, unit];
}
