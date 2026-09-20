import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/theme.dart';
import '../services/api_service.dart';

class PaymentResult {
  final bool success;
  final String paymentId;
  final String method;
  final String paymentStatus;

  PaymentResult({
    required this.success,
    required this.paymentId,
    required this.method,
    required this.paymentStatus,
  });
}

class PaymentBottomSheet extends StatefulWidget {
  final double amount;
  final String title;
  final String patientName;
  final String phone;

  const PaymentBottomSheet({
    super.key,
    required this.amount,
    required this.title,
    required this.patientName,
    required this.phone,
  });

  static Future<PaymentResult?> show(
    BuildContext context, {
    required double amount,
    required String title,
    required String patientName,
    required String phone,
  }) {
    return showModalBottomSheet<PaymentResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PaymentBottomSheet(
        amount: amount,
        title: title,
        patientName: patientName,
        phone: phone,
      ),
    );
  }

  @override
  State<PaymentBottomSheet> createState() => _PaymentBottomSheetState();
}

class _PaymentBottomSheetState extends State<PaymentBottomSheet> {
  String _selectedMethod = 'razorpay';
  bool _isProcessing = false;
  String? _statusMessage;

  Future<void> _handlePayment() async {
    if (_selectedMethod == 'offline') {
      Navigator.pop(
        context,
        PaymentResult(
          success: true,
          paymentId: 'OFFLINE-${DateTime.now().millisecondsSinceEpoch}',
          method: 'Pay at Clinic / Cash on Collection',
          paymentStatus: 'unpaid',
        ),
      );
      return;
    }

    setState(() {
      _isProcessing = true;
      _statusMessage = _selectedMethod == 'razorpay'
          ? 'Initializing Razorpay Sandbox...'
          : 'Initializing Cashfree Test Mode...';
    });

    try {
      // 1. Create real backend order
      final orderRes = await ApiService.createPaymentOrder(widget.amount);
      final orderId = orderRes['order']?['id'] ?? 'order_${DateTime.now().millisecondsSinceEpoch}';

      setState(() {
        _statusMessage = 'Processing secure gateway payment...';
      });

      await Future.delayed(const Duration(milliseconds: 1400));

      final testPaymentId = 'pay_test_${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';

      setState(() {
        _statusMessage = 'Verifying signature & settling transaction...';
      });

      // 2. Verify with backend
      await ApiService.verifyPayment(
        orderId: orderId,
        paymentId: testPaymentId,
      );

      setState(() {
        _isProcessing = false;
      });

      if (!mounted) return;

      Navigator.pop(
        context,
        PaymentResult(
          success: true,
          paymentId: testPaymentId,
          method: _selectedMethod == 'razorpay' ? 'Razorpay (Test Mode)' : 'Cashfree (Test Mode)',
          paymentStatus: 'paid',
        ),
      );
    } catch (e) {
      setState(() {
        _isProcessing = false;
        _statusMessage = null;
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Payment Error: $e'),
          backgroundColor: AppTheme.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        left: 20,
        right: 20,
        top: 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 48,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Checkout & Payment',
                    style: GoogleFonts.outfit(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textDark,
                    ),
                  ),
                  Text(
                    widget.title,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.primaryLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '₹${widget.amount.toStringAsFixed(0)}',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Payment Options
          _buildOptionCard(
            id: 'razorpay',
            title: 'Razorpay Test Gateway',
            subtitle: 'Cards, UPI, Netbanking (Sandbox key active)',
            icon: Icons.credit_card_rounded,
            badge: 'Recommended',
          ),
          const SizedBox(height: 10),
          _buildOptionCard(
            id: 'cashfree',
            title: 'Cashfree Test Gateway',
            subtitle: 'Instant QR & Auto-approval simulation',
            icon: Icons.qr_code_rounded,
          ),
          const SizedBox(height: 10),
          _buildOptionCard(
            id: 'offline',
            title: 'Pay at Clinic / Cash on Collection',
            subtitle: 'Pay directly when sample is collected or at reception',
            icon: Icons.account_balance_wallet_rounded,
          ),

          const SizedBox(height: 24),

          if (_isProcessing) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.primaryLight,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: AppTheme.primary),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      _statusMessage ?? 'Processing...',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primaryDark,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            ElevatedButton(
              onPressed: _handlePayment,
              child: Text(
                _selectedMethod == 'offline'
                    ? 'Confirm Booking (Pay Later)'
                    : 'Pay ₹${widget.amount.toStringAsFixed(0)} via ${_selectedMethod.toUpperCase()}',
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildOptionCard({
    required String id,
    required String title,
    required String subtitle,
    required IconData icon,
    String? badge,
  }) {
    final isSelected = _selectedMethod == id;
    return InkWell(
      onTap: _isProcessing ? null : () => setState(() => _selectedMethod = id),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryLight.withOpacity(0.5) : Colors.white,
          border: Border.all(
            color: isSelected ? AppTheme.primary : AppTheme.border,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.primary : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.white : AppTheme.textDark,
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textDark,
                        ),
                      ),
                      if (badge != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.accent,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            badge,
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            Radio<String>(
              value: id,
              groupValue: _selectedMethod,
              activeColor: AppTheme.primary,
              onChanged: _isProcessing ? null : (val) => setState(() => _selectedMethod = val!),
            ),
          ],
        ),
      ),
    );
  }
}
