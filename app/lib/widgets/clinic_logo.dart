import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/theme.dart';

class ClinicLogo extends StatelessWidget {
  final double size;
  final bool showText;
  final bool isDark;

  const ClinicLogo({
    super.key,
    this.size = 48,
    this.showText = true,
    this.isDark = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF00BFA5), Color(0xFF00897B), Color(0xFF004D40)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(size * 0.28),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primary.withOpacity(0.35),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Center(
            child: Icon(
              Icons.biotech_rounded,
              color: Colors.white,
              size: size * 0.58,
            ),
          ),
        ),
        if (showText) ...[
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Text(
                    'Health',
                    style: GoogleFonts.outfit(
                      fontSize: size * 0.42,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDark,
                      letterSpacing: -0.5,
                    ),
                  ),
                  Text(
                    'Lab',
                    style: GoogleFonts.outfit(
                      fontSize: size * 0.42,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.primary,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
              Text(
                'DIAGNOSTIC & PATHOLOGY',
                style: GoogleFonts.inter(
                  fontSize: size * 0.18,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white70 : AppTheme.textMuted,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
