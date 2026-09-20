import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/api_config.dart';
import '../config/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import 'auth_screens.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  PatientProfile? _patient;
  String _currentBaseUrl = '';
  bool _isServerOnline = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
    _checkServer();
  }

  Future<void> _loadProfile() async {
    final p = await AuthService.getCurrentPatient();
    final url = await ApiConfig.getBaseUrl();
    if (mounted) {
      setState(() {
        _patient = p;
        _currentBaseUrl = url;
      });
    }
  }

  Future<void> _checkServer() async {
    final ok = await ApiService.checkHealth();
    if (mounted) setState(() => _isServerOnline = ok);
  }

  Future<void> _makeCall(String number) async {
    final uri = Uri.parse('tel:$number');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _showHostConfigDialog() {
    final controller = TextEditingController(text: _currentBaseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('API Server Endpoint', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Connect to local dev server or custom backend:', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted)),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'Base API URL',
                hintText: 'http://192.168.31.18:5001/api',
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              children: [
                ActionChip(
                  label: const Text('LAN (192.168.31.18)'),
                  onPressed: () => controller.text = 'http://192.168.31.18:5001/api',
                ),
                ActionChip(
                  label: const Text('Emulator (10.0.2.2)'),
                  onPressed: () => controller.text = 'http://10.0.2.2:5001/api',
                ),
                ActionChip(
                  label: const Text('Localhost'),
                  onPressed: () => controller.text = 'http://localhost:5001/api',
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final newUrl = controller.text.trim();
              if (newUrl.isNotEmpty) {
                await ApiConfig.setBaseUrl(newUrl);
                Navigator.pop(ctx);
                _loadProfile();
                _checkServer();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Updated API base URL to $newUrl')),
                );
              }
            },
            child: const Text('Save & Ping'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Clinic Info & Settings')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User Card
            if (_patient != null) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 26,
                        backgroundColor: AppTheme.primary,
                        child: Text(
                          _patient!.patientName.isNotEmpty ? _patient!.patientName[0].toUpperCase() : 'P',
                          style: GoogleFonts.outfit(fontSize: 22, color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_patient!.patientName, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                            Text(_patient!.phone, style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textMuted)),
                            if (_patient!.email.isNotEmpty)
                              Text(_patient!.email, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted)),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.logout_rounded, color: AppTheme.error),
                        onPressed: () async {
                          await AuthService.logout();
                          _loadProfile();
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ] else ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Row(
                    children: [
                      const Icon(Icons.account_circle_outlined, size: 42, color: AppTheme.primary),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Patient Account', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700)),
                            Text('Sign in or create account to sync medical records', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted)),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () async {
                          final loggedIn = await Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const LoginScreen()),
                          );
                          if (loggedIn == true) _loadProfile();
                        },
                        child: const Text('Sign In'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 18),

            // Doctor Lead Profile Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: SizedBox(
                            width: 68,
                            height: 68,
                            child: Image.asset(
                              'assets/images/healthlab_hero_scientist.jpg',
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(color: AppTheme.primaryLight, child: const Icon(Icons.person, color: AppTheme.primary)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Dr. Rajesh Verma', style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.w800, color: AppTheme.textDark)),
                              Text('Chief Pathologist & Lab Director', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primary)),
                              Text('MBBS, MD (Pathology) AIIMS New Delhi', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted)),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.star_rounded, color: Colors.amber, size: 16),
                                  const SizedBox(width: 4),
                                  Text('4.9 (1,840+ reviews) | 18+ Years Exp', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    Text(
                      '"Dedicated to providing rapid, zero-error diagnostic interpretations with full clinical consultation for your family doctors."',
                      style: GoogleFonts.inter(fontSize: 12, fontStyle: FontStyle.italic, color: AppTheme.textMuted, height: 1.4),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Clinic Contact & Timings Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Clinic Location & Hours', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
                    const SizedBox(height: 14),
                    _infoRow(Icons.location_on_outlined, 'Address', 'Ring Road, Lajpat Nagar III, New Delhi 110024'),
                    const SizedBox(height: 12),
                    _infoRow(Icons.access_time_rounded, 'Hours', 'Mon - Sat: 07:00 AM - 08:30 PM\nSunday: 07:00 AM - 02:00 PM'),
                    const SizedBox(height: 12),
                    _infoRow(Icons.phone_outlined, 'Helpline', '+91 98111 22334 (Toll-Free Diagnostics)'),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _makeCall('+919811122334'),
                            icon: const Icon(Icons.call_rounded, size: 18),
                            label: const Text('Call Helpline'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Server & Network Settings Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Backend API Connectivity', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: _isServerOnline ? AppTheme.success.withOpacity(0.12) : AppTheme.error.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              CircleAvatar(radius: 4, backgroundColor: _isServerOnline ? AppTheme.success : AppTheme.error),
                              const SizedBox(width: 6),
                              Text(
                                _isServerOnline ? 'CONNECTED' : 'OFFLINE',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: _isServerOnline ? AppTheme.success : AppTheme.error,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _currentBaseUrl.isNotEmpty ? _currentBaseUrl : 'Loading...',
                      style: GoogleFonts.robotoMono(fontSize: 11, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: _showHostConfigDialog,
                      icon: const Icon(Icons.settings_ethernet_rounded, size: 16),
                      label: const Text('Switch API Host (LAN / Emulator / Local)'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Accreditation Seal
            Center(
              child: Column(
                children: [
                  const Icon(Icons.verified_user_rounded, color: AppTheme.primary, size: 28),
                  const SizedBox(height: 4),
                  Text('HealthLab Precision Diagnostics Mobile App v1.0.0', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted)),
                  Text('ISO 15189:2022 & NABL Medical Laboratory Certified', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.primaryDark)),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String title, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppTheme.primary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted)),
              const SizedBox(height: 2),
              Text(value, style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textDark, height: 1.35)),
            ],
          ),
        ),
      ],
    );
  }
}
