import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/models.dart';

class ApiService {
  static Future<Map<String, String>> _headers({String? token}) async {
    final headers = {'Content-Type': 'application/json'};
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<bool> checkHealth() async {
    try {
      final base = await ApiConfig.getBaseUrl();
      final res = await http.get(Uri.parse('$base/health')).timeout(const Duration(seconds: 4));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<List<TestItem>> fetchTests() async {
    final base = await ApiConfig.getBaseUrl();
    http.Response res;
    try {
      res = await http.get(Uri.parse('$base/tests')).timeout(const Duration(seconds: 8));
      if (res.statusCode != 200) {
        res = await http.get(Uri.parse('$base/services')).timeout(const Duration(seconds: 8));
      }
    } catch (_) {
      res = await http.get(Uri.parse('$base/services')).timeout(const Duration(seconds: 8));
    }
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      if (data is List) {
        return data.map((x) => TestItem.fromJson(x)).toList();
      }
    }
    throw Exception('Failed to load lab tests: ${res.statusCode}');
  }

  static Future<List<HealthPackage>> fetchPackages() async {
    final base = await ApiConfig.getBaseUrl();
    final res = await http.get(Uri.parse('$base/packages')).timeout(const Duration(seconds: 8));
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      if (data is List) {
        return data.map((x) => HealthPackage.fromJson(x)).toList();
      }
    }
    throw Exception('Failed to load health packages: ${res.statusCode}');
  }

  static Future<List<AppointmentRecord>> trackAppointments(String query) async {
    final base = await ApiConfig.getBaseUrl();
    final url = Uri.parse('$base/appointments/track?query=${Uri.encodeComponent(query)}');
    final res = await http.get(url).timeout(const Duration(seconds: 8));
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final list = (data['appointments'] ?? data['bookings']) as List?;
      if (list != null) {
        return list.map((x) => AppointmentRecord.fromJson(x)).toList();
      }
      return [];
    }
    final errData = jsonDecode(res.body);
    throw Exception(errData['error'] ?? 'Booking not found');
  }

  static Future<Map<String, dynamic>> createBooking({
    required String patientName,
    required String phone,
    String? email,
    required String appointmentDate,
    required String appointmentTime,
    required String visitType,
    required String testOrPackage,
    String? address,
    String? notes,
    String? paymentId,
    String? paymentStatus,
  }) async {
    final base = await ApiConfig.getBaseUrl();
    final body = {
      'patient_name': patientName,
      'phone': phone,
      'email': email ?? '',
      'appointment_date': appointmentDate,
      'appointment_time': appointmentTime,
      'visit_type': visitType,
      'test_or_package': testOrPackage,
      'address': address ?? '',
      'notes': notes ?? '',
      'payment_id': paymentId,
      'payment_status': paymentStatus ?? (paymentId != null ? 'paid' : 'unpaid'),
    };

    final res = await http.post(
      Uri.parse('$base/bookings'),
      headers: await _headers(),
      body: jsonEncode(body),
    ).timeout(const Duration(seconds: 10));

    if (res.statusCode == 201 || res.statusCode == 200) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    final err = jsonDecode(res.body);
    throw Exception(err['error'] ?? 'Failed to submit booking');
  }

  static Future<Map<String, dynamic>> createPaymentOrder(double amount) async {
    final base = await ApiConfig.getBaseUrl();
    final res = await http.post(
      Uri.parse('$base/payments/create-order'),
      headers: await _headers(),
      body: jsonEncode({'amount': amount, 'currency': 'INR'}),
    ).timeout(const Duration(seconds: 6));

    if (res.statusCode == 200) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to initialize payment gateway order');
  }

  static Future<Map<String, dynamic>> verifyPayment({
    required String orderId,
    required String paymentId,
    String? bookingCode,
    int? bookingId,
  }) async {
    final base = await ApiConfig.getBaseUrl();
    final res = await http.post(
      Uri.parse('$base/payments/verify'),
      headers: await _headers(),
      body: jsonEncode({
        'razorpay_order_id': orderId,
        'razorpay_payment_id': paymentId,
        'booking_code': bookingCode,
        'booking_id': bookingId,
      }),
    ).timeout(const Duration(seconds: 6));

    if (res.statusCode == 200) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Payment verification failed');
  }

  static Future<Map<String, dynamic>> loginPatient(String identifier, String password) async {
    final base = await ApiConfig.getBaseUrl();
    final res = await http.post(
      Uri.parse('$base/patients/login'),
      headers: await _headers(),
      body: jsonEncode({'identifier': identifier, 'password': password}),
    ).timeout(const Duration(seconds: 8));

    final data = jsonDecode(res.body);
    if (res.statusCode == 200 && data['success'] == true) {
      return data;
    }
    throw Exception(data['error'] ?? 'Invalid credentials');
  }

  static Future<Map<String, dynamic>> registerPatient({
    required String name,
    required String phone,
    String? email,
    required String password,
  }) async {
    final base = await ApiConfig.getBaseUrl();
    final res = await http.post(
      Uri.parse('$base/patients/register'),
      headers: await _headers(),
      body: jsonEncode({
        'patient_name': name,
        'phone': phone,
        'email': email ?? '',
        'password': password,
      }),
    ).timeout(const Duration(seconds: 8));

    final data = jsonDecode(res.body);
    if (res.statusCode == 200 && data['success'] == true) {
      return data;
    }
    throw Exception(data['error'] ?? 'Registration failed');
  }

  static Future<List<AppointmentRecord>> fetchPatientBookings(String token) async {
    final base = await ApiConfig.getBaseUrl();
    final res = await http.get(
      Uri.parse('$base/patients/appointments'),
      headers: await _headers(token: token),
    ).timeout(const Duration(seconds: 8));

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final list = (data['appointments'] ?? data['bookings']) as List?;
      if (list != null) {
        return list.map((x) => AppointmentRecord.fromJson(x)).toList();
      }
      return [];
    }
    throw Exception('Failed to load appointments');
  }
}
