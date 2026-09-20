import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../config/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/payment_sheet.dart';
import '../widgets/digital_slip_dialog.dart';

class BookingScreen extends StatefulWidget {
  final String? initialTestOrPackage;
  final double? initialPrice;

  const BookingScreen({
    super.key,
    this.initialTestOrPackage,
    this.initialPrice,
  });

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _notesController = TextEditingController();

  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String _selectedTimeSlot = '08:30 AM';
  String _visitType = 'home_collection';
  late String _selectedTest;
  late double _currentPrice;
  bool _isSubmitting = false;

  final List<String> _timeSlots = [
    '07:30 AM', '08:30 AM', '09:30 AM', '10:30 AM', '11:30 AM', '01:00 PM', '03:30 PM', '05:00 PM'
  ];

  final List<Map<String, dynamic>> _availableTests = [
    {'name': 'Full Body Health Checkup (Comprehensive)', 'price': 999.0},
    {'name': 'Complete Blood Count (CBC)', 'price': 350.0},
    {'name': 'Lipid Profile (Cholesterol & Triglycerides)', 'price': 650.0},
    {'name': 'Thyroid Profile Total (T3, T4, TSH)', 'price': 550.0},
    {'name': 'Diabetes Fasting Blood Sugar & HbA1c', 'price': 499.0},
    {'name': 'Liver Function Test (LFT Complete)', 'price': 750.0},
    {'name': 'Kidney Function Test (KFT / RFT)', 'price': 700.0},
    {'name': 'Vitamin D & B12 Advanced Duo', 'price': 1200.0},
    {'name': 'Senior Citizen Special Care Profile', 'price': 1499.0},
  ];

  @override
  void initState() {
    super.initState();
    final initName = widget.initialTestOrPackage ?? _availableTests[0]['name'] as String;
    final initPrice = widget.initialPrice ?? _availableTests[0]['price'] as double;

    if (!_availableTests.any((x) => x['name'] == initName)) {
      _availableTests.insert(0, {'name': initName, 'price': initPrice});
    }

    _selectedTest = initName;
    _currentPrice = initPrice;
    _prefillUser();
    _loadLiveItems();
  }

  Future<void> _loadLiveItems() async {
    try {
      final packages = await ApiService.fetchPackages();
      final tests = await ApiService.fetchTests();
      if (!mounted) return;
      setState(() {
        for (final p in packages) {
          if (!_availableTests.any((x) => x['name'] == p.name)) {
            _availableTests.add({'name': p.name, 'price': p.price});
          }
        }
        for (final t in tests) {
          if (!_availableTests.any((x) => x['name'] == t.name)) {
            _availableTests.add({'name': t.name, 'price': t.price});
          }
        }
      });
    } catch (_) {}
  }

  Future<void> _prefillUser() async {
    final patient = await AuthService.getCurrentPatient();
    if (patient != null && mounted) {
      _nameController.text = patient.patientName;
      _phoneController.text = patient.phone;
      _emailController.text = patient.email;
    }
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 60)),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _handleProceedToPayment() async {
    if (!_formKey.currentState!.validate()) return;

    if (_visitType == 'home_collection' && _addressController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your home address for sample collection')),
      );
      return;
    }

    // Open Razorpay / Cashfree Testing Payment Modal
    final paymentResult = await PaymentBottomSheet.show(
      context,
      amount: _currentPrice,
      title: _selectedTest,
      patientName: _nameController.text.trim(),
      phone: _phoneController.text.trim(),
    );

    if (paymentResult == null || !paymentResult.success) return;

    setState(() => _isSubmitting = true);
    try {
      final formattedDate = DateFormat('yyyy-MM-dd').format(_selectedDate);

      final bookingRes = await ApiService.createBooking(
        patientName: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        email: _emailController.text.trim(),
        appointmentDate: formattedDate,
        appointmentTime: _selectedTimeSlot,
        visitType: _visitType,
        testOrPackage: _selectedTest,
        address: _addressController.text.trim(),
        notes: _notesController.text.trim(),
        paymentId: paymentResult.paymentId,
        paymentStatus: paymentResult.paymentStatus,
      );

      final bookingCode = bookingRes['booking']?['booking_code'] ?? 'HL-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

      if (!mounted) return;
      setState(() => _isSubmitting = false);

      _showSuccessDialog(bookingCode, paymentResult);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Submission error: $e'), backgroundColor: AppTheme.error),
      );
    }
  }

  void _showSuccessDialog(String bookingCode, PaymentResult payment) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: AppTheme.success, size: 28),
            const SizedBox(width: 10),
            Text('Booking Confirmed!', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Your diagnostic test has been successfully booked with HealthLab.', style: GoogleFonts.inter(fontSize: 13)),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primaryLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('BOOKING REFERENCE', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.primaryDark)),
                  Text(bookingCode, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                  const SizedBox(height: 4),
                  Text('Payment: ${payment.paymentStatus.toUpperCase()} (${payment.method})', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted)),
                  if (payment.paymentId.isNotEmpty)
                    Text('TXN ID: ${payment.paymentId}', style: GoogleFonts.robotoMono(fontSize: 10, color: AppTheme.textMuted)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context, true);
            },
            child: const Text('Done'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context, true);
              // Open slip
              DigitalSlipDialog.show(
                context,
                AppointmentRecord(
                  id: 0,
                  bookingCode: bookingCode,
                  patientName: _nameController.text.trim(),
                  phone: _phoneController.text.trim(),
                  email: _emailController.text.trim(),
                  appointmentDate: DateFormat('yyyy-MM-dd').format(_selectedDate),
                  appointmentTime: _selectedTimeSlot,
                  visitType: _visitType,
                  testOrPackage: _selectedTest,
                  address: _addressController.text.trim(),
                  notes: _notesController.text.trim(),
                  status: 'pending',
                  paymentId: payment.paymentId,
                  paymentStatus: payment.paymentStatus,
                ),
              );
            },
            child: const Text('View Slip'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('EEE, d MMM yyyy').format(_selectedDate);

    return Scaffold(
      appBar: AppBar(title: const Text('Schedule Test Booking')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Test Selection Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Selected Diagnostic Package', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textMuted)),
                    const SizedBox(height: 8),
                    Builder(
                      builder: (context) {
                        final uniqueTests = <Map<String, dynamic>>[];
                        final seen = <String>{};

                        if (_selectedTest.trim().isNotEmpty) {
                          uniqueTests.add({
                            'name': _selectedTest.trim(),
                            'price': _currentPrice,
                          });
                          seen.add(_selectedTest.trim());
                        }

                        for (final t in _availableTests) {
                          final name = (t['name'] ?? '').toString().trim();
                          if (name.isNotEmpty && seen.add(name)) {
                            final price = (t['price'] is num) ? (t['price'] as num).toDouble() : 499.0;
                            uniqueTests.add({'name': name, 'price': price});
                          }
                        }

                        final currentValue = _selectedTest.trim().isNotEmpty
                            ? _selectedTest.trim()
                            : (uniqueTests.isNotEmpty ? uniqueTests.first['name'] as String : null);

                        return DropdownButtonFormField<String>(
                          value: currentValue,
                          isExpanded: true,
                          decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10)),
                          items: uniqueTests.map((t) {
                            final name = t['name'] as String;
                            final price = (t['price'] is num) ? (t['price'] as num).toDouble() : 0.0;
                            return DropdownMenuItem<String>(
                              value: name,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(name, overflow: TextOverflow.ellipsis, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                                  ),
                                  Text('₹${price.toStringAsFixed(0)}', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: AppTheme.primary)),
                                ],
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              final match = uniqueTests.firstWhere(
                                (x) => x['name'] == val,
                                orElse: () => {'name': val, 'price': _currentPrice},
                              );
                              setState(() {
                                _selectedTest = val;
                                _currentPrice = (match['price'] is num) ? (match['price'] as num).toDouble() : 499.0;
                              });
                            }
                          },
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Visit Mode
              Text('Sample Collection Mode', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _modeTile(
                      id: 'home_collection',
                      title: 'Home Collection',
                      subtitle: 'Free phlebotomist visit',
                      icon: Icons.home_rounded,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _modeTile(
                      id: 'lab_visit',
                      title: 'Walk-in Clinic',
                      subtitle: 'Lajpat Nagar III Lab',
                      icon: Icons.local_hospital_rounded,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Date & Time
              Text('Preferred Date & Time', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
              const SizedBox(height: 8),
              InkWell(
                onTap: _selectDate,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_month_rounded, color: AppTheme.primary),
                      const SizedBox(width: 12),
                      Text(dateStr, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                      const Spacer(),
                      Text('Change', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _timeSlots.map((slot) {
                  final isSel = _selectedTimeSlot == slot;
                  return ChoiceChip(
                    label: Text(slot),
                    selected: isSel,
                    selectedColor: AppTheme.primary,
                    labelStyle: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isSel ? Colors.white : AppTheme.textDark,
                    ),
                    backgroundColor: Colors.white,
                    side: BorderSide(color: isSel ? AppTheme.primary : AppTheme.border),
                    onSelected: (_) => setState(() => _selectedTimeSlot = slot),
                  );
                }).toList(),
              ),
              const SizedBox(height: 18),

              // Patient Details
              Text('Patient Information', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Patient Full Name *', prefixIcon: Icon(Icons.person_outline_rounded)),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Please enter patient name' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(labelText: 'Mobile Number *', prefixIcon: Icon(Icons.phone_outlined)),
                keyboardType: TextInputType.phone,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Please enter contact number' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email Address (Optional)', prefixIcon: Icon(Icons.email_outlined)),
                keyboardType: TextInputType.emailAddress,
              ),

              if (_visitType == 'home_collection') ...[
                const SizedBox(height: 12),
                TextFormField(
                  controller: _addressController,
                  decoration: const InputDecoration(
                    labelText: 'Home / Sample Collection Address *',
                    prefixIcon: Icon(Icons.location_on_outlined),
                    hintText: 'House/Flat No, Landmark, City, Pincode',
                  ),
                  maxLines: 2,
                ),
              ],

              const SizedBox(height: 12),
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Special Notes / Symptoms (Optional)',
                  prefixIcon: Icon(Icons.notes_rounded),
                ),
              ),

              const SizedBox(height: 24),

              // Price Breakdown Bar
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.primaryLight,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Total Amount Payable', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.primaryDark)),
                        Text('₹${_currentPrice.toStringAsFixed(0)}', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                      ],
                    ),
                    ElevatedButton(
                      onPressed: _isSubmitting ? null : _handleProceedToPayment,
                      child: _isSubmitting
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Proceed to Pay'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _modeTile({required String id, required String title, required String subtitle, required IconData icon}) {
    final isSel = _visitType == id;
    return InkWell(
      onTap: () => setState(() => _visitType = id),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSel ? AppTheme.primaryLight.withOpacity(0.5) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSel ? AppTheme.primary : AppTheme.border, width: isSel ? 2 : 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: isSel ? AppTheme.primary : AppTheme.textMuted, size: 22),
            const SizedBox(height: 6),
            Text(title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
            Text(subtitle, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted)),
          ],
        ),
      ),
    );
  }
}
