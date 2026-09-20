import 'dart:io' show Platform, Socket;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  static const int port = 5001;
  // Mac's Wi-Fi IP address on the shared local network
  static const String defaultLanIp = '192.168.31.18';
  static const String _prefKey = 'api_base_url_healthlab';

  static String? _resolvedBaseUrl;

  static Future<String> getBaseUrl() async {
    if (_resolvedBaseUrl != null) {
      return _resolvedBaseUrl!;
    }

    final prefs = await SharedPreferences.getInstance();
    final customUrl = prefs.getString(_prefKey);
    if (customUrl != null && customUrl.trim().isNotEmpty) {
      try {
        final uri = Uri.parse(customUrl.trim());
        final host = uri.host.isNotEmpty ? uri.host : '127.0.0.1';
        final checkPort = uri.port != 0 ? uri.port : port;
        final socket = await Socket.connect(host, checkPort, timeout: const Duration(milliseconds: 1000));
        await socket.close();
        _resolvedBaseUrl = customUrl.trim();
        return _resolvedBaseUrl!;
      } catch (_) {
        // Saved custom URL is unreachable; proceed to auto-detect
      }
    }

    if (kIsWeb) {
      _resolvedBaseUrl = 'http://localhost:$port/api';
      return _resolvedBaseUrl!;
    }

    if (Platform.isAndroid) {
      // 1. Probe 127.0.0.1 via ADB reverse USB tunnel (lightning-fast, 15ms)
      try {
        final socket = await Socket.connect('127.0.0.1', port, timeout: const Duration(milliseconds: 1000));
        await socket.close();
        _resolvedBaseUrl = 'http://127.0.0.1:$port/api';
        return _resolvedBaseUrl!;
      } catch (_) {
        // 2. Fallback to Wi-Fi LAN IP if ADB reverse is not active
        _resolvedBaseUrl = 'http://$defaultLanIp:$port/api';
        return _resolvedBaseUrl!;
      }
    }

    _resolvedBaseUrl = 'http://localhost:$port/api';
    return _resolvedBaseUrl!;
  }

  static Future<void> setBaseUrl(String url) async {
    _resolvedBaseUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, url);
  }

  static void resetCache() {
    _resolvedBaseUrl = null;
  }
}
