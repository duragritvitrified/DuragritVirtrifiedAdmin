import 'package:flutter/material.dart';
import '../constants/colors.dart';

class Step9DashboardScreen extends StatelessWidget {
  final VoidCallback onNavigateScan;
  final VoidCallback onNavigateRequests;

  const Step9DashboardScreen({
    Key? key,
    required this.onNavigateScan,
    required this.onNavigateRequests,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    const double approvedAmount = 48250.0;
    const double pendingAmount = 1750.0;
    const int totalPoints = 193000;

    return Scaffold(
      backgroundColor: const Color(0xFFFBFBF9),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Top Bar
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Text('DG FIELD', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF44403C))),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFEDD5),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('STEP 09 / 14', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppColors.brandRust)),
                      ),
                    ],
                  ),
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFF292524),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    alignment: Alignment.center,
                    child: const Text('RS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Greeting
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.brandRust,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: const Text('DG', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('Hello, Rameshwar Prasad', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      Text('Contractor • Morbi Central Zone', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Total Reward Balance Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderLight),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 6, offset: const Offset(0, 2))
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.account_balance_wallet_outlined, size: 16, color: AppColors.brandRust),
                            SizedBox(width: 6),
                            Text('TOTAL REWARD BALANCE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF57534E))),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.badgeGreenBg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.green.shade200),
                          ),
                          child: Row(
                            children: const [
                              CircleAvatar(radius: 3, backgroundColor: AppColors.badgeGreen),
                              SizedBox(width: 4),
                              Text('Active Status', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.badgeGreen)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: const [
                        Text('193,000', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                        SizedBox(width: 6),
                        Text('Points', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textMuted)),
                      ],
                    ),
                    const SizedBox(height: 2),
                    const Text('Equivalent to ₹ 48,250.00 (1 Pt = ₹0.25)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF44403C))),
                    const Divider(height: 24, color: Color(0xFFF5F5F4)),

                    // 3-Col Metric Grid
                    Row(
                      children: [
                        _buildMetricBox('Pending', '₹ 1,750', AppColors.badgeAmber),
                        const SizedBox(width: 8),
                        _buildMetricBox('Approved/Paid', '₹ 48,250', AppColors.badgeGreen),
                        const SizedBox(width: 8),
                        _buildMetricBox('Total Scans', '164 Bags', const Color(0xFF292524)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: onNavigateScan,
                      icon: const Icon(Icons.qr_code_scanner, size: 16, color: Colors.white),
                      label: const Text('Scan QR & Claim', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.brandRust,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onNavigateRequests,
                      icon: const Icon(Icons.receipt_long, size: 16, color: Color(0xFF44403C)),
                      label: const Text('View Request List', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF44403C))),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        side: const BorderSide(color: Color(0xFFD6D3D1)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Profile Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.shield_outlined, size: 16, color: AppColors.badgeGreen),
                            SizedBox(width: 6),
                            Text('Profile & Account Credentials', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text('TIER 2 GOLD', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF92400E))),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    _buildProfileRow('Mobile Identifier', '+91 9820144521'),
                    const SizedBox(height: 8),
                    _buildProfileRow('KYC Compliance', 'UIDAI Aadhaar Verified', isSuccess: true),
                    const SizedBox(height: 8),
                    _buildProfileRow('Primary UPI VPA', 'rameshwar.tile@okaxis'),
                    const SizedBox(height: 8),
                    _buildProfileRow('Allocated Kiln Depot', 'Morbi Central Kiln HQ'),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricBox(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFFBFBF9),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFE7E5E4)),
        ),
        child: Column(
          children: [
            Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF78716C))),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileRow(String label, String value, {bool isSuccess = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF78716C))),
        Text(
          value,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: isSuccess ? AppColors.badgeGreen : AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
