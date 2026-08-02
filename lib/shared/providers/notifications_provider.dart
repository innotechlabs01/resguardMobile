import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../../core/services/notification_service.dart';

class NotificationsProvider extends ChangeNotifier {
  final NotificationService _notificationService = NotificationService();

  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = false;
  String? _error;

  List<Map<String, dynamic>> get notifications => _notifications;
  bool get isLoading => _isLoading;
  String? get error => _error;

  int get unreadCount =>
      _notifications.where((n) => n['is_read'] == false).length;

  Future<void> initialize({
    Function(RemoteMessage)? onForegroundMessage,
    Function(RemoteMessage)? onBackgroundMessage,
  }) async {
    await _notificationService.initialize(
      onForegroundMessage: onForegroundMessage,
      onBackgroundMessage: onBackgroundMessage,
    );
  }

  Future<void> registerToken(String userId, String role) async {
    await _notificationService.registerToken(userId, role);
  }

  Future<void> saveNotificationToDb({
    required String userId,
    required String title,
    required String body,
    String? type,
    Map<String, dynamic>? data,
  }) async {
    await _notificationService.saveNotificationToDb(
      userId: userId,
      title: title,
      body: body,
      type: type,
      data: data,
    );
  }

  Future<void> loadNotifications(String userId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _notifications = await _notificationService.getNotifications(userId);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markAsRead(String notificationId) async {
    await _notificationService.markNotificationAsRead(notificationId);

    final index = _notifications.indexWhere((n) => n['id'] == notificationId);
    if (index != -1) {
      _notifications[index]['is_read'] = true;
      _notifications[index]['read_at'] = DateTime.now().toIso8601String();
      notifyListeners();
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
    await _notificationService.createVigilanteEvent(
      organizationId: organizationId,
      eventType: eventType,
      description: description,
      location: location,
      visitorName: visitorName,
      visitorContact: visitorContact,
      createdBy: createdBy,
    );
  }

  Future<List<Map<String, dynamic>>> getVigilanteEvents(
    String organizationId,
  ) async {
    return await _notificationService.getVigilanteEvents(organizationId);
  }

  Future<void> updateEventStatus(String eventId, String status) async {
    await _notificationService.updateVigilanteEventStatus(eventId, status);
  }

  void addNotification(Map<String, dynamic> notification) {
    _notifications.insert(0, notification);
    notifyListeners();
  }
}
