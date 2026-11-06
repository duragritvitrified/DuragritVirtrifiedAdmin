import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';

class QREngineService {
  static const String salt = 'DURAGRIT_VITRIFIED_IND_2026_PROD';
  static const double hqLat = 22.8173; // Morbi HQ
  static const double hqLng = 70.8317;

  // Validate serial format: DG-XXXXX-XXXXXX
  static bool validateSerialFormat(String key) {
    if (key.isEmpty) return false;
    final regex = RegExp(r'^[A-Z]{2,4}-\d{5}-\d{5,6}$');
    return regex.hasMatch(key.trim().toUpperCase());
  }

  // Derive Dual 128-bit SHA Hash
  static Map<String, String> generateDualHash(String serialKey, String lotNumber) {
    // Stage 1
    final stage1Input = utf8.encode('$serialKey::$salt');
    final stage1Full = sha256.convert(stage1Input).toString();
    final stage1_128 = stage1Full.substring(0, 32);

    // Stage 2
    final stage2Input = utf8.encode('$stage1_128::LOT_${lotNumber}::STAGE2');
    final stage2Full = sha256.convert(stage2Input).toString();
    final stage2_128 = stage2Full.substring(0, 32);

    return {
      'stage1': stage1_128,
      'stage2': stage2_128,
      'dualSha128': '$stage1_128-$stage2_128',
    };
  }

  // Haversine GPS distance
  static Map<String, dynamic> validateGeoFence(double? userLat, double? userLng, {double maxRadiusKm = 250}) {
    if (userLat == null || userLng == null) {
      return {'valid': true, 'distanceKm': null, 'flagged': true, 'reason': 'GPS unavailable'};
    }

    const double earthRadiusKm = 6371.0;
    final double dLat = (userLat - hqLat) * pi / 180.0;
    final double dLng = (userLng - hqLng) * pi / 180.0;

    final double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(hqLat * pi / 180.0) * cos(userLat * pi / 180.0) * sin(dLng / 2) * sin(dLng / 2);
    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    final double distanceKm = earthRadiusKm * c;

    return {
      'valid': distanceKm <= maxRadiusKm,
      'distanceKm': double.parse(distanceKm.toStringAsFixed(1)),
      'flagged': distanceKm > maxRadiusKm,
    };
  }

  // Section 194C TDS calculation
  static Map<String, dynamic> calculateTDS(double grossAmount, {bool hasPAN = true}) {
    if (grossAmount <= 500) {
      return {
        'grossAmount': grossAmount,
        'tdsRate': 0.0,
        'tdsAmount': 0.0,
        'netAmount': grossAmount,
        'section': 'Sec 194C (Exempt <= 500)'
      };
    }

    final double rate = hasPAN ? 0.01 : 0.20;
    final double tds = (grossAmount * rate * 100).round() / 100.0;
    final double net = ((grossAmount - tds) * 100).round() / 100.0;

    return {
      'grossAmount': grossAmount,
      'tdsRate': rate,
      'tdsAmount': tds,
      'netAmount': net,
      'section': hasPAN ? 'Section 194C (1% Individual)' : 'Section 206AA (20% PAN Absent)'
    };
  }
}
