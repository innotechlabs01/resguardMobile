import 'package:flutter/foundation.dart';

class AppConfig {
  static const String appName = 'ResGuard';
  static const String appVersion = '1.0.0';

  static const String appScope = String.fromEnvironment(
    'APP_SCOPE',
    defaultValue: 'development',
  );

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

  static const String clerkPublishableKey = String.fromEnvironment(
    'CLERK_PUBLISHABLE_KEY',
    defaultValue: '',
  );

  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  static bool get isDevelopment => appScope == 'development';
  static bool get isProduction => appScope == 'production';
}
