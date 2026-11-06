import 'package:flutter/material.dart';
import 'constants/colors.dart';
import 'services/supabase_service.dart';
import 'screens/step8_signin_screen.dart';
import 'screens/step9_dashboard_screen.dart';
import 'screens/step10_scanner_screen.dart';
import 'screens/step11_requests_screen.dart';
import 'screens/step12_moderation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseService.initialize();
  runApp(const DuraGritApp());
}

class DuraGritApp extends StatelessWidget {
  const DuraGritApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DuraGrit Mobile Retail Portal',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'Inter',
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.brandRust,
          primary: AppColors.brandRust,
        ),
        scaffoldBackgroundColor: const Color(0xFFFBFBF9),
        useMaterial3: true,
      ),
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({Key? key}) : super(key: key);

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0; // 0: Dashboard, 1: Scanner, 2: Requests, 3: Moderation
  bool _signedIn = true;

  @override
  Widget build(BuildContext context) {
    if (!_signedIn) {
      return Step8SignInScreen(onLoginSuccess: () => setState(() => _signedIn = true));
    }

    final screens = [
      Step9DashboardScreen(
        onNavigateScan: () => setState(() => _currentIndex = 1),
        onNavigateRequests: () => setState(() => _currentIndex = 2),
      ),
      Step10ScannerScreen(
        onBack: () => setState(() => _currentIndex = 0),
        onClaimCreated: () => setState(() => _currentIndex = 2),
      ),
      Step11RequestsScreen(
        onBack: () => setState(() => _currentIndex = 0),
        onNavigateScan: () => setState(() => _currentIndex = 1),
      ),
      Step12ModerationScreen(
        onBack: () => setState(() => _currentIndex = 0),
      ),
    ];

    return Scaffold(
      body: screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.grey.shade200)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, -2))
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: AppColors.brandRust,
          unselectedItemColor: const Color(0xFF78716C),
          selectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
          unselectedLabelStyle: const TextStyle(fontSize: 10),
          items: [
            const BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: AppColors.brandRust,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 20),
              ),
              label: 'Scan',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.receipt_long_outlined),
              activeIcon: Icon(Icons.receipt_long),
              label: 'Claims',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.shield_outlined),
              activeIcon: Icon(Icons.shield),
              label: 'Admin',
            ),
          ],
        ),
      ),
    );
  }
}
