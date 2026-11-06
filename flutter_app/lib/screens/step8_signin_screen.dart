import 'package:flutter/material.dart';
import '../constants/colors.dart';

class Step8SignInScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;
  const Step8SignInScreen({Key? key, required this.onLoginSuccess}) : super(key: key);

  @override
  State<Step8SignInScreen> createState() => _Step8SignInScreenState();
}

class _Step8SignInScreenState extends State<Step8SignInScreen> {
  String _selectedRole = 'Contractor';
  final _phoneController = TextEditingController(text: '9820144521');
  final _pinController = TextEditingController(text: '1234');
  String _selectedDepot = 'Morbi Kiln HQ - GIDC Sector 2';
  bool _isLoading = false;

  void _handleSignIn() {
    setState(() => _isLoading = true);
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        setState(() => _isLoading = false);
        widget.onLoginSuccess();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBFBF9),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Top Bar
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: AppColors.brandRust,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'DG',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('DURAGRIT FIELD', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF44403C))),
                          Text('Vitrified Supply Chain', style: TextStyle(fontSize: 10, color: Color(0xFF78716C))),
                        ],
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.brandRust,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'STEP 08 / 14',
                      style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  )
                ],
              ),
              const SizedBox(height: 24),

              const Text(
                'Mobile Yard Sign In',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 4),
              const Text(
                'Authenticate field operators, applicators, and logistics dispatchers.',
                style: TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
              const SizedBox(height: 20),

              // Role Tabs
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFFE7E5E4),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    _buildRoleTab('Contractor', Icons.construction),
                    _buildRoleTab('Mason', Icons.verified_user_outlined),
                    _buildRoleTab('Logistics', Icons.local_shipping_outlined),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Sign-In Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderLight),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('REGISTERED MOBILE NUMBER', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF44403C))),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        prefixIcon: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                          child: Text('+91', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textMuted)),
                        ),
                        suffixIcon: const Icon(Icons.phone_android, color: Colors.grey, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 16),

                    const Text('4-DIGIT FIELD PIN / OTP', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF44403C))),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _pinController,
                      obscureText: true,
                      maxLength: 4,
                      textAlign: TextAlign.center,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        counterText: '',
                        suffixIcon: const Icon(Icons.lock_outline, color: Colors.grey, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 16),

                    const Text('ASSIGNED YARD / DEPOT', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF44403C))),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey.shade400),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedDepot,
                          isExpanded: true,
                          items: [
                            'Morbi Kiln HQ - GIDC Sector 2',
                            'Ahmedabad Central Logistics Hub',
                            'Surat Ceramic Distribution Yard',
                            'Jaipur Regional Depot #04',
                          ].map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 12)))).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedDepot = val);
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    ElevatedButton(
                      onPressed: _isLoading ? null : _handleSignIn,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.brandRust,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isLoading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Text('Sign In to Mobile Yard', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                                SizedBox(width: 8),
                                Icon(Icons.arrow_forward, size: 16, color: Colors.white),
                              ],
                            ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.shield_outlined, size: 16, color: AppColors.badgeGreen),
                  SizedBox(width: 6),
                  Text('FIPS-140 & RBI Escrow 256-Bit Authentication', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleTab(String role, IconData icon) {
    final active = _selectedRole == role;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedRole = role),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: active ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: active ? [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4)] : null,
          ),
          child: Column(
            children: [
              Icon(icon, size: 16, color: active ? AppColors.brandRust : const Color(0xFF78716C)),
              const SizedBox(height: 4),
              Text(
                role,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: active ? AppColors.brandRust : const Color(0xFF57534E),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
