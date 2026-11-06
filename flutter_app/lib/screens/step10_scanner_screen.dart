import 'dart:math';
import 'package:flutter/material.dart';
import '../constants/colors.dart';
import '../services/qr_engine_service.dart';
import '../services/supabase_service.dart';

class Step10ScannerScreen extends StatefulWidget {
  final VoidCallback onBack;
  final VoidCallback onClaimCreated;

  const Step10ScannerScreen({
    Key? key,
    required this.onBack,
    required this.onClaimCreated,
  }) : super(key: key);

  @override
  State<Step10ScannerScreen> createState() => _Step10ScannerScreenState();
}

class _Step10ScannerScreenState extends State<Step10ScannerScreen> with SingleTickerProviderStateMixin {
  String _inputMode = 'camera'; // 'camera' | 'manual'
  final _manualController = TextEditingController(text: 'DG-50142-000109');
  late AnimationController _laserController;
  late Animation<double> _laserAnimation;

  Map<String, dynamic>? _lastResult;
  bool _isProcessing = false;

  final Set<String> _redeemedTokens = {};

  @override
  void initState() {
    super.initState();
    _laserController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _laserAnimation = Tween<double>(begin: 0.15, end: 0.85).animate(
      CurvedAnimation(parent: _laserController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _laserController.dispose();
    _manualController.dispose();
    super.dispose();
  }

  Future<void> _processSerialKey(String key) async {
    final cleanKey = key.trim().toUpperCase();

    if (!QREngineService.validateSerialFormat(cleanKey)) {
      setState(() {
        _lastResult = {
          'success': false,
          'message': 'Invalid Format: Must match DG-[5-digit Lot]-[Unit Identifier]'
        };
      });
      return;
    }

    // Anti-replay check
    if (_redeemedTokens.contains(cleanKey)) {
      setState(() {
        _lastResult = {
          'success': false,
          'message': 'Security Alert: QR Code $cleanKey was already redeemed! Anti-fraud lock triggered.'
        };
      });
      return;
    }

    setState(() => _isProcessing = true);

    try {
      // Ingest into Supabase
      final res = await SupabaseService.submitClaim(
        serialKey: cleanKey,
        userName: 'Rameshwar Prasad Sharma',
        userMobile: '9820144521',
        amount: 50.0,
      );

      _redeemedTokens.add(cleanKey);

      setState(() {
        _lastResult = {
          'success': true,
          'message': 'Claim for ₹50.00 ingested into Escrow Queue!',
          'rrn': res['data']['request_id'] ?? 'CLM-9941',
        };
      });
    } catch (e) {
      setState(() {
        _lastResult = {'success': false, 'message': 'Submission failed: $e'};
      });
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  void _simulateScan() {
    final randUnit = 100 + Random().nextInt(899);
    final key = 'DG-50142-000$randUnit';
    _processSerialKey(key);
  }

  @override
  Widget build(BuildContext context) {
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
                    child: const Text('STEP 10 / 14', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white)),
                  )
                ],
              ),
              const SizedBox(height: 8),

              // Mode Tabs
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFFE7E5E4),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _inputMode = 'camera'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: _inputMode == 'camera' ? AppColors.brandRust : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.camera_alt, size: 14, color: _inputMode == 'camera' ? Colors.white : Colors.black87),
                              const SizedBox(width: 6),
                              Text('Optical Viewfinder', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _inputMode == 'camera' ? Colors.white : Colors.black87)),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _inputMode = 'manual'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: _inputMode == 'manual' ? AppColors.brandRust : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.keyboard, size: 14, color: _inputMode == 'manual' ? Colors.white : Colors.black87),
                              const SizedBox(width: 6),
                              Text('Manual Entry', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _inputMode == 'manual' ? Colors.white : Colors.black87)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              if (_inputMode == 'camera') ...[
                // Viewfinder Container
                Container(
                  height: 320,
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF292524), width: 2),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // HUD Laser
                      AnimatedBuilder(
                        animation: _laserAnimation,
                        builder: (context, child) {
                          return Positioned(
                            top: 320 * _laserAnimation.value,
                            left: 24,
                            right: 24,
                            child: Container(
                              height: 2,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Colors.transparent, AppColors.brandRust, Colors.transparent],
                                ),
                                boxShadow: [
                                  BoxShadow(color: AppColors.brandRust.withOpacity(0.8), blurRadius: 10)
                                ],
                              ),
                            ),
                          );
                        },
                      ),

                      // Reticle Corner Brackets
                      Positioned(
                        top: 40,
                        bottom: 40,
                        left: 40,
                        right: 40,
                        child: Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.white24, width: 1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Stack(
                            children: const [
                              Positioned(top: 0, left: 0, child: _CornerBracket()),
                              Positioned(top: 0, right: 0, child: RotatedBox(quarterTurns: 1, child: _CornerBracket())),
                              Positioned(bottom: 0, right: 0, child: RotatedBox(quarterTurns: 2, child: _CornerBracket())),
                              Positioned(bottom: 0, left: 0, child: RotatedBox(quarterTurns: 3, child: _CornerBracket())),
                            ],
                          ),
                        ),
                      ),

                      // Center HUD Label
                      Positioned(
                        top: 24,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text('TARGET QR CODE FOIL', style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                        ),
                      ),

                      // Bottom action pill
                      Positioned(
                        bottom: 16,
                        left: 16,
                        right: 16,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: Colors.black87,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                children: const [
                                  Icon(Icons.location_on, size: 12, color: AppColors.brandRust),
                                  SizedBox(width: 4),
                                  Text('Morbi Geofence OK', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                            ElevatedButton.icon(
                              onPressed: _isProcessing ? null : _simulateScan,
                              icon: const Icon(Icons.bolt, size: 14, color: Colors.amber),
                              label: const Text('Simulate Scan', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.brandRust,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                // Manual Entry Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.borderLight),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text('ENTER 14-CHAR FOIL SERIAL KEY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF57534E))),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _manualController,
                        textCapitalization: TextCapitalization.characters,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5),
                        decoration: InputDecoration(
                          hintText: 'DG-50142-000109',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _isProcessing ? null : () => _processSerialKey(_manualController.text),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.brandRust,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Verify & Submit Claim', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white)),
                      ),
                    ],
                  ),
                ),
              ],

              // Scan Result Alert
              if (_lastResult != null) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: _lastResult!['success'] ? AppColors.badgeGreenBg : const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: _lastResult!['success'] ? Colors.green.shade300 : Colors.red.shade300),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        _lastResult!['success'] ? Icons.check_circle : Icons.error_outline,
                        color: _lastResult!['success'] ? AppColors.badgeGreen : Colors.red,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _lastResult!['success'] ? 'Claim Authorized!' : 'Scan Rejected',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: _lastResult!['success'] ? AppColors.badgeGreen : Colors.red.shade900),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _lastResult!['message'],
                              style: TextStyle(fontSize: 11, color: _lastResult!['success'] ? Colors.green.shade900 : Colors.red.shade800),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _CornerBracket extends StatelessWidget {
  const _CornerBracket({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 18,
      height: 18,
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(color: AppColors.brandRust, width: 2.5),
          left: BorderSide(color: AppColors.brandRust, width: 2.5),
        ),
      ),
    );
  }
}
