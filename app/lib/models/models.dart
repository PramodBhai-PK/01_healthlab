class TestItem {
  final int id;
  final String name;
  final String category;
  final double price;
  final String turnaround;
  final bool fastingRequired;
  final String description;
  final int parametersCount;

  TestItem({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.turnaround,
    required this.fastingRequired,
    required this.description,
    this.parametersCount = 1,
  });

  factory TestItem.fromJson(Map<String, dynamic> json) {
    return TestItem(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['test_name'] ?? json['name'] ?? '',
      category: json['category'] ?? 'General Pathology',
      price: (json['price'] != null)
          ? (double.tryParse(json['price'].toString()) ?? 0.0)
          : 0.0,
      turnaround: json['turnaround_time'] ?? json['turnaround'] ?? '24 Hours',
      fastingRequired: json['fasting_required'] == 1 || json['fasting_required'] == true || json['fasting_required'] == '1',
      description: json['description'] ?? '',
      parametersCount: json['parameters_count'] is int ? json['parameters_count'] : int.tryParse(json['parameters_count']?.toString() ?? '1') ?? 1,
    );
  }
}

class HealthPackage {
  final int id;
  final String name;
  final double price;
  final double originalPrice;
  final String description;
  final String testsIncluded;
  final bool fastingRequired;

  HealthPackage({
    required this.id,
    required this.name,
    required this.price,
    required this.originalPrice,
    required this.description,
    required this.testsIncluded,
    required this.fastingRequired,
  });

  factory HealthPackage.fromJson(Map<String, dynamic> json) {
    return HealthPackage(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['package_name'] ?? json['name'] ?? '',
      price: (json['price'] != null)
          ? (double.tryParse(json['price'].toString()) ?? 0.0)
          : (json['discounted_price'] != null)
              ? (double.tryParse(json['discounted_price'].toString()) ?? 0.0)
              : 0.0,
      originalPrice: (json['original_price'] != null)
          ? (double.tryParse(json['original_price'].toString()) ?? 0.0)
          : 0.0,
      description: json['description'] ?? '',
      testsIncluded: json['tests_included']?.toString() ?? '',
      fastingRequired: json['fasting_required'] == 1 || json['fasting_required'] == true || json['fasting_required'] == '1',
    );
  }
}

class AppointmentRecord {
  final int id;
  final String bookingCode;
  final String patientName;
  final String phone;
  final String email;
  final String appointmentDate;
  final String appointmentTime;
  final String visitType;
  final String testOrPackage;
  final String? address;
  final String? notes;
  final String? doctorNotes;
  final String? testResults;
  final String? doctorPrescription;
  final String? followUpDate;
  final String status;
  final String? paymentId;
  final String paymentStatus;
  final String? createdAt;

  AppointmentRecord({
    required this.id,
    required this.bookingCode,
    required this.patientName,
    required this.phone,
    required this.email,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.visitType,
    required this.testOrPackage,
    this.address,
    this.notes,
    this.doctorNotes,
    this.testResults,
    this.doctorPrescription,
    this.followUpDate,
    required this.status,
    this.paymentId,
    this.paymentStatus = 'unpaid',
    this.createdAt,
  });

  factory AppointmentRecord.fromJson(Map<String, dynamic> json) {
    return AppointmentRecord(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      bookingCode: json['booking_code'] ?? '',
      patientName: json['patient_name'] ?? '',
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      appointmentDate: json['appointment_date'] != null ? json['appointment_date'].toString().split('T')[0] : '',
      appointmentTime: json['appointment_time'] ?? '',
      visitType: json['visit_type'] ?? 'lab_visit',
      testOrPackage: json['test_or_package'] ?? json['service_name'] ?? json['health_concern'] ?? '',
      address: json['address'],
      notes: json['notes'],
      doctorNotes: json['doctor_notes'],
      testResults: json['test_results'],
      doctorPrescription: json['doctor_prescription'],
      followUpDate: json['follow_up_date'] != null ? json['follow_up_date'].toString().split('T')[0] : null,
      status: json['status'] ?? 'pending',
      paymentId: json['payment_id'],
      paymentStatus: json['payment_status'] ?? 'unpaid',
      createdAt: json['created_at'],
    );
  }
}

class PatientProfile {
  final int id;
  final String patientName;
  final String phone;
  final String email;
  final String? token;

  PatientProfile({
    required this.id,
    required this.patientName,
    required this.phone,
    required this.email,
    this.token,
  });

  factory PatientProfile.fromJson(Map<String, dynamic> json, {String? token}) {
    return PatientProfile(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      patientName: json['patient_name'] ?? json['name'] ?? '',
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      token: token ?? json['token'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'patient_name': patientName,
    'phone': phone,
    'email': email,
    'token': token,
  };
}
