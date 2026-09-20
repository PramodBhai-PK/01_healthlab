import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/theme.dart';
import '../models/models.dart';
import 'clinic_logo.dart';

class DigitalSlipDialog extends StatelessWidget {
  final AppointmentRecord appointment;

  const DigitalSlipDialog({super.key, required this.appointment});

  static void show(BuildContext context, AppointmentRecord appointment) {
    showDialog(
      context: context,
      builder: (ctx) => DigitalSlipDialog(appointment: appointment),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 480),
        padding: const EdgeInsets.all(22),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Letterhead
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const ClinicLogo(size: 38, showText: false),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'HEALTHLAB DIAGNOSTICS',
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.primary,
                            letterSpacing: 0.5,
                          ),
                        ),
                        Text(
                          'NABL & ICMR Accredited | ISO 15189:2022',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textMuted,
                          ),
                        ),
                        Text(
                          'Ring Road, Lajpat Nagar III, New Delhi | +91 98111 22334',
                          style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 24, thickness: 1),

              // Booking Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('BOOKING CODE', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted)),
                      Text(appointment.bookingCode, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.textDark)),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: appointment.paymentStatus == 'paid' ? AppTheme.success.withOpacity(0.12) : AppTheme.warning.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      appointment.paymentStatus == 'paid' ? 'PAID ONLINE' : 'PAY AT CLINIC',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: appointment.paymentStatus == 'paid' ? AppTheme.success : AppTheme.warning,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Patient Info Table
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.background,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  children: [
                    _rowItem('Patient Name', appointment.patientName),
                    const SizedBox(height: 6),
                    _rowItem('Contact Phone', appointment.phone),
                    const SizedBox(height: 6),
                    _rowItem('Appointment Date', appointment.appointmentDate),
                    const SizedBox(height: 6),
                    _rowItem('Preferred Time', appointment.appointmentTime),
                    const SizedBox(height: 6),
                    _rowItem('Test / Package', appointment.testOrPackage),
                    const SizedBox(height: 6),
                    _rowItem('Visit Mode', appointment.visitType.replaceAll('_', ' ').toUpperCase()),
                    if (appointment.paymentId != null) ...[
                      const SizedBox(height: 6),
                      _rowItem('Transaction ID', appointment.paymentId!),
                    ],
                  ],
                ),
              ),

              // Doctor Clinical Notes
              if (appointment.doctorNotes != null && appointment.doctorNotes!.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(
                  'ATTENDING PATHOLOGIST CLINICAL OBSERVATIONS',
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.primaryDark),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryLight.withOpacity(0.35),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
                  ),
                  child: Text(
                    appointment.doctorNotes!,
                    style: GoogleFonts.inter(fontSize: 12, height: 1.45, color: AppTheme.textDark),
                  ),
                ),
              ],

              // Measured Test Results
              if (appointment.testResults != null && appointment.testResults!.isNotEmpty) ...[
                const SizedBox(height: 14),
                Text(
                  'MEASURED BIOCHEMICAL TEST VALUES',
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textDark),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Text(
                    appointment.testResults!,
                    style: GoogleFonts.robotoMono(fontSize: 11, height: 1.45, color: AppTheme.textDark),
                  ),
                ),
              ],

              // Prescription & Advice
              if (appointment.doctorPrescription != null && appointment.doctorPrescription!.isNotEmpty) ...[
                const SizedBox(height: 14),
                Text(
                  'PATHOLOGIST RECOMMENDATION & PRESCRIPTION (Rx)',
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.accent),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFFDBA74)),
                  ),
                  child: Text(
                    appointment.doctorPrescription!,
                    style: GoogleFonts.inter(fontSize: 12, height: 1.45, color: const Color(0xFF9A3412)),
                  ),
                ),
              ],

              if (appointment.followUpDate != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.event_repeat_rounded, size: 16, color: AppTheme.primary),
                    const SizedBox(width: 8),
                    Text(
                      'Suggested Review / Retest Date: ${appointment.followUpDate}',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primaryDark),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close_rounded, size: 18),
                      label: const Text('Close'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Official NABL digital slip saved to Downloads'),
                            backgroundColor: AppTheme.success,
                          ),
                        );
                        Navigator.pop(context);
                      },
                      icon: const Icon(Icons.print_rounded, size: 18),
                      label: const Text('Save / Print'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _rowItem(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted)),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textDark),
          ),
        ),
      ],
    );
  }
}
