import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import '../config/theme.dart';
import '../config/api_config.dart';

class HealthToolsScreen extends StatefulWidget {
  const HealthToolsScreen({super.key});

  @override
  State<HealthToolsScreen> createState() => _HealthToolsScreenState();
}

class _HealthToolsScreenState extends State<HealthToolsScreen> {
  final _weightController = TextEditingController(text: '70');
  final _heightController = TextEditingController(text: '172');

  bool _calculating = false;
  Map<String, dynamic>? _bmiResult;
  List<dynamic> _prepGuides = [];
  bool _loadingGuides = true;

  @override
  void initState() {
    super.initState();
    _fetchPrepGuides();
  }

  Future<void> _fetchPrepGuides() async {
    try {
      final base = await ApiConfig.getBaseUrl();
      final res = await http.get(Uri.parse('$base/guides/test-prep')).timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (mounted && data['success'] == true) {
          setState(() {
            _prepGuides = data['guides'] ?? [];
            _loadingGuides = false;
          });
          return;
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingGuides = false);
  }

  Future<void> _calculateBmi() async {
    final weight = _weightController.text.trim();
    final height = _heightController.text.trim();
    if (weight.isEmpty || height.isEmpty) return;

    setState(() => _calculating = true);
    try {
      final base = await ApiConfig.getBaseUrl();
      final res = await http.post(
        Uri.parse('$base/tools/bmi'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'weight_kg': weight, 'height_cm': height}),
      ).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (mounted && data['success'] == true) {
          setState(() {
            _bmiResult = data;
            _calculating = false;
          });
          return;
        }
      }
    } catch (_) {}

    // Fallback calculation if offline
    final w = double.tryParse(weight) ?? 70;
    final h = (double.tryParse(height) ?? 172) / 100;
    final bmi = (w / (h * h)).toStringAsFixed(1);
    if (mounted) {
      setState(() {
        _bmiResult = {
          'bmi': double.parse(bmi),
          'category': 'Normal Weight',
          'risk': 'Low Risk',
          'daily_water_liters': (w * 0.033).toStringAsFixed(1),
          'recommended_tests': ['Complete Blood Count (CBC)', 'Lipid Profile Screen']
        };
        _calculating = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Health Tools & Test Prep', style: GoogleFonts.outfit(fontWeight: FontWeight.w800)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // BMI & Hydration Calculator Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.border),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: AppTheme.primaryLight, borderRadius: BorderRadius.circular(12)),
                        child: const Icon(Icons.calculate_rounded, color: AppTheme.primary, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('BMI & Water Target Calculator', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.textDark)),
                            Text('Personalized diagnostic recommendations', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _weightController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Weight (kg)', prefixIcon: Icon(Icons.fitness_center_rounded, size: 20)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: _heightController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Height (cm)', prefixIcon: Icon(Icons.height_rounded, size: 20)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _calculating ? null : _calculateBmi,
                    style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                    child: _calculating ? const CircularProgressIndicator(color: Colors.white) : const Text('Calculate Health Index'),
                  ),
                  if (_bmiResult != null) ...[
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: AppTheme.primaryLight, borderRadius: BorderRadius.circular(12)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('BMI: ${_bmiResult!['bmi']}', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800, color: AppTheme.primaryDark)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(12)),
                                child: Text(_bmiResult!['category'] ?? 'Normal', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text('Recommended Water Target: ${_bmiResult!['daily_water_liters']} Liters / Day', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textDark)),
                          const SizedBox(height: 8),
                          Text('Suggested Diagnostic Checks:', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textMuted)),
                          const SizedBox(height: 4),
                          ...((_bmiResult!['recommended_tests'] as List? ?? []).map((t) => Padding(
                                padding: const EdgeInsets.only(bottom: 2),
                                child: Row(
                                  children: [
                                    const Icon(Icons.check_circle_rounded, size: 14, color: AppTheme.primary),
                                    const SizedBox(width: 6),
                                    Expanded(child: Text(t.toString(), style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textDark))),
                                  ],
                                ),
                              ))),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Blood Test Preparation Guide Section
            Text('Lab Test Fasting Guidelines', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.textDark)),
            const SizedBox(height: 12),
            if (_loadingGuides)
              const Center(child: CircularProgressIndicator(color: AppTheme.primary))
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _prepGuides.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, idx) {
                  final g = _prepGuides[idx];
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(child: Text(g['title'] ?? '', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark))),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(color: AppTheme.accent.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                              child: Text(g['fasting_hours'] ?? '', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.accent)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(g['instructions'] ?? '', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted, height: 1.3)),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
