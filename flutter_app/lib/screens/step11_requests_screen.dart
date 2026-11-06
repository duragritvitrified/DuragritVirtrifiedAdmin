import 'package:flutter/material.dart';
import '../constants/colors.dart';
import '../services/supabase_service.dart';

class Step11RequestsScreen extends StatefulWidget {
  final VoidCallback onBack;
  final VoidCallback onNavigateScan;

  const Step11RequestsScreen({
    Key? key,
    required this.onBack,
    required this.onNavigateScan,
  }) : super(key: key);

  @override
  State<Step11RequestsScreen> createState() => _Step11RequestsScreenState();
}

class _Step11RequestsScreenState extends State<Step11RequestsScreen> {
  String _activeTab = 'All';

  // Demo fallback items
  final List<Map<String, dynamic>> _demoClaims = [
    {
      'id': '1',
      'qr_serial': 'DG-50142-000101',
      'product': 'DuraGrit Tile Adhesive Pro Fix',
      'claim_value': 50.0,
      'status': 'Disbursed',
      'date': 'Today, 05:14 PM',
    },
    {
      'id': '2',
      'qr_serial': 'DG-50142-000102',
      'product': 'DuraGrit Epoxy Grout EG-100',
      'claim_value': 100.0,
      'status': 'Pending',
      'date': 'Today, 04:45 PM',
    },
    {
      'id': '3',
      'qr_serial': 'DG-50142-000098',
      'product': 'DuraGrit Ultra-Bond Primer',
      'claim_value': 75.0,
      'status': 'Disbursed',
      'date': 'Yesterday',
    },
  ];

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
                    label: const Text('Dashboard', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF44403C))),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.brandRust,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('STEP 11 / 14', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white)),
                  )
                ],
              ),
              const SizedBox(height: 6),

              const Text('My Cashback Requests', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              const SizedBox(height: 2),
              const Text('Track real-time escrow authorizations and UPI payouts.', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
              const SizedBox(height: 14),

              // KPI Summary
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.borderLight),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('PAID TO UPI', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF78716C))),
                          SizedBox(height: 4),
                          Text('₹ 48,250', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.badgeGreen)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.borderLight),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('IN ESCROW', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF78716C))),
                          SizedBox(height: 4),
                          Text('₹ 1,750', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.badgeAmber)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Filter Tabs
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['All', 'Pending', 'Disbursed', 'Flagged'].map((tab) {
                    final active = _activeTab == tab;
                    return Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: ChoiceChip(
                        label: Text(tab, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: active ? Colors.white : const Color(0xFF44403C))),
                        selected: active,
                        selectedColor: AppColors.brandRust,
                        backgroundColor: Colors.white,
                        onSelected: (_) => setState(() => _activeTab = tab),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 10),

              // Live Claims List
              Expanded(
                child: StreamBuilder<List<Map<String, dynamic>>>(
                  stream: SupabaseService.claimsStream,
                  builder: (context, snapshot) {
                    final List<Map<String, dynamic>> claimsList = (snapshot.hasData && snapshot.data!.isNotEmpty)
                        ? snapshot.data!
                        : _demoClaims;

                    final filtered = claimsList.where((c) {
                      if (_activeTab == 'All') return true;
                      return (c['status'] ?? '') == _activeTab;
                    }).toList();

                    if (filtered.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.receipt_long, size: 40, color: Colors.grey),
                            const SizedBox(height: 8),
                            const Text('No claims found in this view', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF57534E))),
                            const SizedBox(height: 8),
                            ElevatedButton(
                              onPressed: widget.onNavigateScan,
                              style: ElevatedButton.styleFrom(backgroundColor: AppColors.brandRust),
                              child: const Text('Scan New Bag', style: TextStyle(fontSize: 11, color: Colors.white)),
                            )
                          ],
                        ),
                      );
                    }

                    return ListView.separated(
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final item = filtered[index];
                        final status = item['status'] ?? 'Pending';
                        final isDisbursed = status == 'Disbursed';

                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.borderLight),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    item['qr_serial'] ?? item['request_id'] ?? 'DG-XXXXX',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary),
                                  ),
                                  Text(
                                    '₹${item['claim_value'] ?? 50}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.brandRust),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(item['product'] ?? 'DuraGrit Pro Fix (Type 2)', style: const TextStyle(fontSize: 11, color: Color(0xFF78716C))),
                              const Divider(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(item['date'] ?? 'Today', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: isDisbursed ? AppColors.badgeGreenBg : AppColors.badgeAmberBg,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      status,
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: isDisbursed ? AppColors.badgeGreen : AppColors.badgeAmber,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
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
}
