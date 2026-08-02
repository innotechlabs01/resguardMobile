import '../../core/services/api_service.dart';

class DatabaseService {
  final ApiService _api = ApiService();

  static final DatabaseService _instance = DatabaseService._internal();
  factory DatabaseService() => _instance;
  DatabaseService._internal();

  Future<Map<String, dynamic>?> getUser(String clerkUserId) async {
    try {
      final response = await _api.get('/api/users', queryParams: {
        'clerk_user_id': clerkUserId,
      });
      if (response['users'] != null &&
          (response['users'] as List).isNotEmpty) {
        return response['users'][0] as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<void> syncUser(
    String clerkUserId,
    String email,
    String displayName,
  ) async {
    try {
      final existing = await getUser(clerkUserId);

      if (existing != null) {
        await _api.put('/api/users', body: {
          'id': existing['id'],
          'email': email,
          'display_name': displayName,
        });
      } else {
        await _api.post('/api/users', body: {
          'clerk_user_id': clerkUserId,
          'email': email,
          'display_name': displayName,
          'role': 'resident',
        });
      }
    } catch (e) {
      // Ignore sync errors
    }
  }

  Future<List<Map<String, dynamic>>> getPayments(String userId) async {
    try {
      final response = await _api.get('/api/payments');
      if (response['payments'] != null) {
        return List<Map<String, dynamic>>.from(response['payments']);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getReservations(String userId) async {
    return [];
  }

  Future<List<Map<String, dynamic>>> getParkingRequests(String userId) async {
    try {
      final response = await _api.get('/api/parking');
      if (response['parking_requests'] != null) {
        return List<Map<String, dynamic>>.from(response['parking_requests']);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getCommunications(
    String buildingId,
  ) async {
    try {
      final response = await _api.get(
        '/api/communications',
        queryParams: {'buildingId': buildingId},
      );
      if (response['communications'] != null) {
        return List<Map<String, dynamic>>.from(response['communications']);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getAssemblies(String buildingId) async {
    try {
      final response = await _api.get(
        '/api/assemblies',
        queryParams: {'buildingId': buildingId},
      );
      if (response['assemblies'] != null) {
        return List<Map<String, dynamic>>.from(response['assemblies']);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<bool> updateUserRole(String clerkUserId, String role) async {
    try {
      final user = await getUser(clerkUserId);
      if (user == null) return false;

      await _api.put('/api/users', body: {
        'id': user['id'],
        'role': role,
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateUserBuilding(
    String clerkUserId,
    String buildingId,
  ) async {
    try {
      final user = await getUser(clerkUserId);
      if (user == null) return false;

      await _api.put('/api/users', body: {
        'id': user['id'],
        'building_id': buildingId,
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}
