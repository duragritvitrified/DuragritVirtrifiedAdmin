import 'package:flutter/material.dart';
import '../constants/colors.dart';
import '../services/supabase_service.dart';

class Step12ModerationScreen extends StatefulWidget {
  final VoidCallback onBack;
  const Step12ModerationScreen({Key? key, required this.onBack}) : super(key: key);

  @override
  State<Step12ModerationScreen> createState() => _Step12ModerationScreenState();
}

class _Step12ModerationScreenState extends State<Step12ModerationScreen> {
  final List<Map<String, dynamic>> _pendingClaims = [
    {
      'id': '1',
      'user_name': 'Rameshwar Prasad Sharma',
      'mobile': '+91 9820144521',
      'qr_serial': 'DG-50142-000109',
      'product': 'DuraGrit Tile Adhesive Pro Fix (20kg)',
      'amount': 50.0,
      'vpa': 'rameshwar.tile@okaxis',
      'zone': 'Morbi Hub (Within 250km)',
    },
    {
      'id': '2',
      'user_name': 'Mohammad Aslam Sheikh',
      'mobile': '+91 9712345678',
      'qr_serial': 'DG-50142-000110',
      'product': 'DuraGrit Epoxy Tile Grout EG-100',
      'amount': 100.0,
      'vpa': 'aslam.sheikh@oksbi',
      'zone': 'Surat Textile Zone (Within 250km)',
    },
  ];

  String? _processingId;
  String? _successBanner;

  Future<void> _authorizeClaim(String id) async {
    setState(() => _processingId = id);
    await SupabaseService.approveClaim(id);
    await Future.delayed(const Duration(milliseconds: 500));

    setState(() {
      _processingId = null;
      _pendingClaims.removeWhere((c) => c['id'] == id);
      _successBanner = 'Claim authorized and disbursed via NPCI gateway!';
    });

    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _successBanner = null);
    });
  }

  void _flagClaim(String id) {
    setState(() {
      _pendingClaims.removeWhere((c) => c['id'] == id);
      _successBanner = 'Claim placed on investigative escrow hold.';
    });
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _successBanner = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBFBF9),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton.icon(
                    onPressed: widget.onBack,
                    icon: const Icon(Icons.arrow_back, size: 16, color: Color(0xFF44403C)),
                    label: const Text('Field Dashboard', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF44403C))),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.brandRust,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('STEP 12 / 14', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white)),
                  )
                ],
              ),
              const SizedBox(height: 6),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('Field Admin Moderation', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      Text('Authorize claims & trigger instant UPI payouts.', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                  if (_pendingClaims.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.brandRust,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${_pendingClaims.length} Pending',
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    )
                ],
              ),
              const SizedBox(height: 12),

              if (_successBanner != null)
                Container(
                  padding: const EdgeInsets.all(10),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: AppColors.badgeGreenBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.green.shade300),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, size: 16, color: AppColors.badgeGreen),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(_successBanner!, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.badgeGreen)),
                      ),
                    ],
                  ),
                ),

              Expanded(
                child: _pendingClaims.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.check_circle_outline, size: 48, color: AppColors.badgeGreen),
                            SizedBox(height: 10),
                            Text('Escrow Queue Clear!', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                            SizedBox(height: 4),
                            Text('All field claims have been adjudicated and paid.', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                          ],
                        ),
                      )
                    : ListView.separated(
                        itemCount: _pendingClaims.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final claim = _pendingClaims[index];
                          final id = claim['id'] as String;

                          return Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.borderLight),
                              boxShadow: [
                                BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(claim['user_name'], style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                                        const SizedBox(height: 2),
                                        Text(claim['qr_serial'], style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontFamily: 'monospace')),
                                      ],
                                    ),
                                    Text('₹${claim['amount']}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.brandRust)),
                                  ],
                                ),
                                const SizedBox(height: 10),

                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFBFBF9),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: const Color(0xFFE7E5E4)),
                                  ),
                                  child: Column(
                                    children: [
                                      _buildInfoRow('Product:', claim['product']),
                                      const SizedBox(height: 4),
                                      _buildInfoRow('UPI VPA:', claim['vpa']),
                                      const SizedBox(height: 4),
                                      _buildInfoRow('GPS Check:', claim['zone'], isSuccess: true),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 12),

                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton(
                                        onPressed: () => _flagClaim(id),
                                        style: OutlinedButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(vertical: 10),
                                          side: const BorderSide(color: Color(0xFFD6D3D1)),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        ),
                                        child: const Text('Flag / Hold', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF44403C))),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: ElevatedButton.icon(
                                        onPressed: _processingId == id ? null : () => _authorizeClaim(id),
                                        icon: const Icon(Icons.bolt, size: 14, color: Colors.amber),
                                        label: _processingId == id
                                            ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                            : const Text('Authorize', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppColors.badgeGreen,
                                          padding: const EdgeInsets.symmetric(vertical: 10),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isSuccess = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF78716C))),
        Text(
          value,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: isSuccess ? AppColors.badgeGreen : AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
