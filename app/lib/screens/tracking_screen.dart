import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/digital_slip_dialog.dart';
import 'auth_screens.dart';

class TrackingScreen extends StatefulWidget {
  final String? initialQuery;

  const TrackingScreen({super.key, this.initialQuery});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  final TextEditingController _queryController = TextEditingController();
  List<AppointmentRecord> _results = [];
  bool _isLoading = false;
  String? _error;
  PatientProfile? _currentPatient;

  @override
  void initState() {
    super.initState();
    _checkAuth();
    if (widget.initialQuery != null && widget.initialQuery!.isNotEmpty) {
      _queryController.text = widget.initialQuery!;
      _performSearch(widget.initialQuery!);
    }
  }

  Future<void> _checkAuth() async {
    final patient = await AuthService.getCurrentPatient();
    if (mounted) {
      setState(() => _currentPatient = patient);
      if (patient != null && _queryController.text.isEmpty) {
        _queryController.text = patient.phone;
        _performSearch(patient.phone);
      }
    }
  }

  Future<void> _performSearch(String query) async {
    final clean = query.trim();
    if (clean.isEmpty) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final list = await ApiService.trackAppointments(clean);
      if (!mounted) return;
      setState(() {
        _results = list;
        _isLoading = false;
        if (list.isEmpty) {
          _error = 'No appointments found for "$clean". Please check the code or phone number.';
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Patient Portal & Records'),
        actions: [
          if (_currentPatient != null)
            IconButton(
              icon: const Icon(Icons.logout_rounded),
              tooltip: 'Sign Out',
              onPressed: () async {
                await AuthService.logout();
                if (mounted) {
                  setState(() {
                    _currentPatient = null;
                    _results.clear();
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Signed out successfully')),
                  );
                }
              },
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User Header / Login Prompt Card
            if (_currentPatient != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF004D40), Color(0xFF00796B)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: Colors.white24,
                      radius: 22,
                      child: Text(
                        _currentPatient!.patientName.isNotEmpty ? _currentPatient!.patientName[0].toUpperCase() : 'P',
                        style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Logged in Patient Profile', style: GoogleFonts.inter(color: Colors.white70, fontSize: 11)),
                          Text(
                            _currentPatient!.patientName,
                            style: GoogleFonts.outfit(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700),
                          ),
                          Text(_currentPatient!.phone, style: GoogleFonts.inter(color: Colors.white70, fontSize: 12)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh_rounded, color: Colors.white),
                      onPressed: () => _performSearch(_currentPatient!.phone),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
            ] else ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.primaryLight,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.account_circle_outlined, size: 36, color: AppTheme.primary),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Have an Account?', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
                          Text('Sign in to view full medical history and lab reports.', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted)),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () async {
                        final loggedIn = await Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const LoginScreen()),
                        );
                        if (loggedIn == true) _checkAuth();
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      ),
                      child: const Text('Sign In'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
            ],

            // Quick Tracking Input Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Quick Track without Password', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
                    const SizedBox(height: 4),
                    Text('Enter your Booking Reference Code or registered Mobile Number:', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _queryController,
                            decoration: const InputDecoration(
                              hintText: 'e.g. HL-2026-001 or 9811122334',
                              prefixIcon: Icon(Icons.search_rounded),
                              contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            ),
                            onSubmitted: _performSearch,
                          ),
                        ),
                        const SizedBox(width: 10),
                        ElevatedButton(
                          onPressed: _isLoading ? null : () => _performSearch(_queryController.text),
                          child: _isLoading
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Text('Track'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      children: [
                        ActionChip(
                          label: const Text('Demo: HL-2026-001'),
                          backgroundColor: AppTheme.primaryLight,
                          labelStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primaryDark),
                          onPressed: () {
                            _queryController.text = 'HL-2026-001';
                            _performSearch('HL-2026-001');
                          },
                        ),
                        ActionChip(
                          label: const Text('Demo Phone: 9811122334'),
                          backgroundColor: AppTheme.primaryLight,
                          labelStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primaryDark),
                          onPressed: () {
                            _queryController.text = '9811122334';
                            _performSearch('9811122334');
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Results Section
            if (_isLoading) ...[
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(color: AppTheme.primary),
                ),
              ),
            ] else if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline_rounded, color: AppTheme.error),
                    const SizedBox(width: 12),
                    Expanded(child: Text(_error!, style: GoogleFonts.inter(fontSize: 13, color: AppTheme.error))),
                  ],
                ),
              ),
            ] else if (_results.isNotEmpty) ...[
              Text(
                'Found ${_results.length} Booking Record(s)',
                style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.w700, color: AppTheme.textDark),
              ),
              const SizedBox(height: 12),
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _results.length,
                separatorBuilder: (_, __) => const SizedBox(height: 14),
                itemBuilder: (context, idx) {
                  final item = _results[idx];
                  return _buildAppointmentCard(item);
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentCard(AppointmentRecord item) {
    Color statusColor;
    switch (item.status.toLowerCase()) {
      case 'completed':
        statusColor = AppTheme.success;
        break;
      case 'confirmed':
      case 'sample_collected':
        statusColor = AppTheme.primary;
        break;
      case 'cancelled':
        statusColor = AppTheme.error;
        break;
      default:
        statusColor = AppTheme.warning;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('BOOKING CODE', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted)),
                    Text(item.bookingCode, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    item.status.replaceAll('_', ' ').toUpperCase(),
                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: statusColor),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            Text(item.testOrPackage, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
            const SizedBox(height: 6),

            Row(
              children: [
                const Icon(Icons.person_outline_rounded, size: 15, color: AppTheme.textMuted),
                const SizedBox(width: 6),
                Text(item.patientName, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(width: 14),
                const Icon(Icons.phone_outlined, size: 15, color: AppTheme.textMuted),
                const SizedBox(width: 6),
                Text(item.phone, style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textMuted)),
              ],
            ),
            const SizedBox(height: 6),

            Row(
              children: [
                const Icon(Icons.calendar_month_outlined, size: 15, color: AppTheme.textMuted),
                const SizedBox(width: 6),
                Text('${item.appointmentDate} at ${item.appointmentTime}', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textMuted)),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: item.paymentStatus == 'paid' ? AppTheme.success.withOpacity(0.12) : AppTheme.warning.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    item.paymentStatus == 'paid' ? 'PAID' : 'PAYMENT PENDING',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: item.paymentStatus == 'paid' ? AppTheme.success : AppTheme.warning,
                    ),
                  ),
                ),
              ],
            ),

            // Doctor remarks preview
            if (item.doctorNotes != null && item.doctorNotes!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.primaryLight.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.medical_services_outlined, size: 16, color: AppTheme.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Dr. Verma: ${item.doctorNotes}',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textDark),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => DigitalSlipDialog.show(context, item),
                icon: const Icon(Icons.receipt_long_rounded, size: 18),
                label: const Text('View Official Consultation Slip & Report'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
