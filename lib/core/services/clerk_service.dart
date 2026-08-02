import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/foundation.dart';
import '../constants/app_config.dart';

class ClerkService {
  static final ClerkService _instance = ClerkService._internal();
  factory ClerkService() => _instance;
  ClerkService._internal();

  String? _publishableKey;

  Future<void> initialize() async {
    _publishableKey = AppConfig.clerkPublishableKey;
    if (_publishableKey == null || _publishableKey!.isEmpty) {
      debugPrint('Clerk publishable key not configured');
    }
  }

  String? get publishableKey => _publishableKey;
  bool get isConfigured => _publishableKey != null && _publishableKey!.isNotEmpty;
}
