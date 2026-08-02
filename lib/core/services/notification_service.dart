import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/app_config.dart';
import 'api_service.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final ApiService _api = ApiService();
  late SupabaseClient _supabase;

  Function(RemoteMessage)? _onForegroundMessage;
  Function(RemoteMessage)? _onBackgroundMessage;

  Future<void> initialize({
    Function(RemoteMessage)? onForegroundMessage,
    Function(RemoteMessage)? onBackgroundMessage,
  }) async {
    _onForegroundMessage = onForegroundMessage;
    _onBackgroundMessage = onBackgroundMessage;

    if (AppConfig.supabaseUrl.isNotEmpty && AppConfig.supabaseAnonKey.isNotEmpty) {
      _supabase = SupabaseClient(AppConfig.supabaseUrl, AppConfig.supabaseAnonKey);
    }

    await _firebaseMessaging.requestPermission();

    final token = await _getFCMToken();
    debugPrint('FCM Token: $token');

    FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      _saveTokenToSupabase(token);
    });

    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);
  }

  Future<String> _getFCMToken() async {
    final token = await _firebaseMessaging.getToken();
    return token ?? '';
  }

  Future<void> _saveTokenToSupabase(
    String token, {
    String? userId,
    String? role,
  }) async {
    try {
      if (AppConfig.supabaseUrl.isEmpty) return;
      await _supabase.from('device_tokens').upsert({
        'token': token,
        'user_id': userId ?? 'anonymous',
        'role': role,
        'device_type': defaultTargetPlatform == TargetPlatform.iOS
            ? 'ios'
            : 'android',
        'is_active': true,
        'updated_at': DateTime.now().toIso8601String(),
      }, onConflict: 'token');
    } catch (e) {
      debugPrint('Error saving token: $e');
    }
  }

  Future<void> registerToken(String userId, String role) async {
    final token = await _getFCMToken();
    if (token.isNotEmpty) {
      await _saveTokenToSupabase(token, userId: userId, role: role);
    }
  }

  void _handleForegroundMessage(RemoteMessage message) {
    _onForegroundMessage?.call(message);
  }

  @pragma('vm:entry-point')
  Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    _onBackgroundMessage?.call(message);
  }

  Future<void> saveNotificationToDb({
    required String userId,
    required String title,
    required String body,
    String? type,
    Map<String, dynamic>? data,
  }) async {
    try {
      if (AppConfig.supabaseUrl.isEmpty) return;
      await _supabase.from('app_notifications').insert({
        'user_id': userId,
        'title': title,
        'body': body,
        'type': type,
        'data': data != null ? jsonEncode(data) : null,
        'sent_at': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      debugPrint('Error saving notification: $e');
    }
  }

  Future<List<Map<String, dynamic>>> getNotifications(String userId) async {
    try {
      if (AppConfig.supabaseUrl.isEmpty) return [];
      final response = await _supabase
          .from('app_notifications')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      debugPrint('Error getting notifications: $e');
      return [];
    }
  }

  Future<void> markNotificationAsRead(String notificationId) async {
    try {
      if (AppConfig.supabaseUrl.isEmpty) return;
      await _supabase
          .from('app_notifications')
          .update({
            'is_read': true,
            'read_at': DateTime.now().toIso8601String(),
          })
          .eq('id', notificationId);
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
    }
  }

  Future<void> createVigilanteEvent({
    String? organizationId,
    required String eventType,
    String? description,
    String? location,
    String? visitorName,
    String? visitorContact,
    required String createdBy,
  }) async {
    try {
      await _api.post('/api/alerts', body: {
        'building_id': organizationId,
        'type': eventType,
        'description': description,
        'location': location,
        'visitor_name': visitorName,
        'visitor_contact': visitorContact,
        'created_by': createdBy,
        'status': 'pending',
      });
    } catch (e) {
      debugPrint('Error creating vigilante event: $e');
    }
  }

  Future<List<Map<String, dynamic>>> getVigilanteEvents(
    String organizationId,
  ) async {
    try {
      final response = await _api.get(
        '/api/alerts',
        queryParams: {'buildingId': organizationId},
      );
      if (response['alerts'] != null) {
        return List<Map<String, dynamic>>.from(response['alerts']);
      }
      return [];
    } catch (e) {
      debugPrint('Error getting vigilante events: $e');
      return [];
    }
  }

  Future<void> updateVigilanteEventStatus(String eventId, String status) async {
    try {
      await _api.put('/api/alerts', body: {
        'id': eventId,
        'status': status,
      });
    } catch (e) {
      debugPrint('Error updating vigilante event: $e');
    }
  }

  Future<List<String>> getDeviceTokensForRole(
    String role,
    String? organizationId,
  ) async {
    try {
      if (AppConfig.supabaseUrl.isEmpty) return [];
      var query = _supabase
          .from('device_tokens')
          .select('token')
          .eq('role', role)
          .eq('is_active', true);

      if (organizationId != null) {
        query = query.eq('organization_id', organizationId);
      }

      final response = await query;
      return List<String>.from(response.map((e) => e['token']));
    } catch (e) {
      debugPrint('Error getting device tokens: $e');
      return [];
    }
  }
}
