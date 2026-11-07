// DuraGrit Vitrified — Production HTML Email Templates Hub
// Clean, responsive, RFC 5322 compliant email templates for partner communications

export const EMAIL_TEMPLATES = [
  {
    id: 'verification',
    name: 'Template 1 • Email Verification & Account Activation',
    category: 'Authentication',
    badge: 'MANDATORY',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    subject: 'Verify Your Email — DuraGrit Vitrified Partner Portal',
    description: 'Dispatched immediately when an internal user or contractor registers with an email address. Contains a unique cryptographically signed 1-click verification link and security token.',
    variables: [
      { tag: '{{recipientName}}', label: 'Partner Full Name', sample: 'Rajesh Kumar' },
      { tag: '{{userId}}', label: 'User / Partner ID', sample: 'USR-1082' },
      { tag: '{{mobile}}', label: 'Registered Mobile', sample: '+91 98112 40591' },
      { tag: '{{verifyToken}}', label: 'Security Auth Token', sample: 'DGVT-K8P9Q2-7X4L' },
      { tag: '{{verifyLink}}', label: '1-Click Action URL', sample: 'http://localhost:3000/?verify=DGVT-K8P9Q2-7X4L' },
      { tag: '{{expiryHours}}', label: 'Link Expiry Window', sample: '24' }
    ],
    sampleData: {
      recipientName: 'Rajesh Kumar',
      userId: 'USR-1082',
      mobile: '+91 98112 40591',
      verifyToken: 'DGVT-K8P9Q2-7X4L',
      verifyLink: 'http://localhost:3000/?verify=DGVT-K8P9Q2-7X4L',
      expiryHours: '24'
    },
    generateHtml: (data = {}) => {
      const {
        recipientName = 'Valued Partner',
        userId = 'USR-1082',
        mobile = '+91 98112 40591',
        verifyToken = 'DGVT-K8P9Q2-7X4L',
        verifyLink = 'http://localhost:3000/?verify=DGVT-K8P9Q2-7X4L',
        expiryHours = '24'
      } = data;

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email — DuraGrit Vitrified</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F3EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F4F3EF; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #A62C11 0%, #C84826 100%); padding: 28px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">DURAGRIT VITRIFIED</div>
                    <div style="font-size: 11px; color: #F9CEB8; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">Premium Vitrified Tiles &amp; Pavers • Partner Portal</div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); color: #ffffff; font-size: 10px; font-weight: 800; padding: 4px 10px; rounded-full; border-radius: 20px; text-transform: uppercase;">VERIFICATION</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN BODY -->
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Verify Your Email Address</h1>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                Dear <strong>${recipientName}</strong>,<br>
                Thank you for registering with the <strong>DuraGrit Vitrified Contractor &amp; Partner Network</strong>. To complete your activation and enable high-speed cashback scanner features, please verify your email address.
              </p>

              <!-- USER DETAILS STRIP -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF9F6; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="50%" style="font-size: 12px; color: #64748b; padding-bottom: 6px;">Assigned User ID:</td>
                        <td width="50%" align="right" style="font-size: 13px; font-weight: 700; color: #0f172a; font-family: monospace; padding-bottom: 6px;">${userId}</td>
                      </tr>
                      <tr>
                        <td width="50%" style="font-size: 12px; color: #64748b;">Registered Mobile:</td>
                        <td width="50%" align="right" style="font-size: 13px; font-weight: 700; color: #0f172a; font-family: monospace;">${mobile}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${verifyLink}" target="_blank" style="display: inline-block; background-color: #C84826; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 36px; border-radius: 12px; box-shadow: 0 4px 12px rgba(200, 72, 38, 0.35); letter-spacing: 0.2px;">
                      ✓ Verify Email &amp; Activate Account
                    </a>
                  </td>
                </tr>
              </table>

              <!-- SECURITY TOKEN CALLOUT -->
              <div style="background-color: #FEF2EE; border-left: 4px solid #C84826; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; color: #A62C11; text-transform: uppercase;">Manual Verification Token</div>
                <div style="font-size: 14px; font-family: monospace; font-weight: 800; color: #0f172a; margin-top: 4px; letter-spacing: 1px;">${verifyToken}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Valid for ${expiryHours} hours. If the button above does not work, copy and paste this link into your browser:</div>
                <div style="font-size: 11px; word-break: break-all; color: #C84826; font-family: monospace; margin-top: 4px;">${verifyLink}</div>
              </div>

              <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0;">
                If you did not register for a DuraGrit Vitrified account, you can safely ignore this email. No action will be taken.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #FAF9F6; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.6;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <strong>DuraGrit Vitrified Pvt. Ltd.</strong><br>
                    National Highway 8A, Sartanpar Road, Morbi - 363642, Gujarat, India<br>
                    Support Desk: +91 7303967198 • duragrit07@gmail.com
                  </td>
                  <td align="right" valign="bottom" style="font-family: monospace; font-size: 10px; color: #94a3b8;">
                    SPF: PASS • DKIM: 2048 • TLS 1.3
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }
  },

  {
    id: 'onboarding',
    name: 'Template 2 • Vendor Partner Onboarding Dossier & Credentials',
    category: 'Credentials',
    badge: 'HIGH VALUE',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    subject: 'Welcome to DuraGrit Vitrified — Your Vendor Partner Login Credentials & Mobile App Setup',
    description: 'Dispatched to approved vendors, contractors, dealers, and distributors. Contains their assigned User ID, Temporary Passkey, Allocated Kiln Hub, direct Android Vendor APK download, and iPhone Vendor PWA portal link.',
    variables: [
      { tag: '{{recipientName}}', label: 'Contractor / Partner Name', sample: 'Mahesh Sharma' },
      { tag: '{{userId}}', label: 'Partner Login ID', sample: 'USR-2045' },
      { tag: '{{tempPassword}}', label: 'One-Time Temp Password', sample: 'Dura#8492' },
      { tag: '{{role}}', label: 'Assigned Partner Role', sample: 'Tile Contractor / Mason' },
      { tag: '{{hub}}', label: 'Regional Kiln Hub', sample: 'Morbi Central Kiln Hub' },
      { tag: '{{apkUrl}}', label: 'Android Vendor APK URL', sample: 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-vendor-v2.apk' },
      { tag: '{{pwaUrl}}', label: 'iPhone Safari Vendor Portal URL', sample: 'https://duragrit-virtrified-admin.vercel.app/app/?app=vendor' }
    ],
    sampleData: {
      recipientName: 'Mahesh Sharma',
      userId: 'USR-2045',
      tempPassword: 'Dura#8492',
      role: 'Tile Contractor / Mason',
      hub: 'Morbi Central Kiln Hub',
      apkUrl: 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-vendor-v2.apk',
      pwaUrl: 'https://duragrit-virtrified-admin.vercel.app/app/?app=vendor'
    },
    generateHtml: (data = {}) => {
      const {
        recipientName = 'Valued Partner',
        userId = 'USR-2045',
        tempPassword = 'Dura#8492',
        role = 'Tile Contractor / Mason',
        hub = 'Morbi Central Kiln Hub',
        apkUrl = 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-vendor-v2.apk',
        pwaUrl = 'https://duragrit-virtrified-admin.vercel.app/app/?app=vendor'
      } = data;

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vendor Partner Onboarding Dossier — DuraGrit Vitrified</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F3EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F4F3EF; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #A62C11 0%, #C84826 100%); padding: 28px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">DURAGRIT VITRIFIED</div>
                    <div style="font-size: 11px; color: #F9CEB8; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">Official Vendor Partner Activation Dossier</div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">APPROVED</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN BODY -->
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">Welcome to the DuraGrit Family!</h1>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                Namaste <strong>${recipientName}</strong>,<br>
                Your registration has been approved as an authorized DuraGrit <strong>${role}</strong>. Below are your secure login credentials to access the DuraGrit Vendor Partner Mobile App and start claiming instant UPI cashbacks on genuine DuraGrit tile cartons.
              </p>

              <!-- CREDENTIALS BOX -->
              <div style="background-color: #FEF2EE; border: 2px dashed #C84826; border-radius: 14px; padding: 20px; margin-bottom: 26px;">
                <div style="font-size: 11px; font-weight: 800; color: #A62C11; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; text-align: center;">CONFIDENTIAL VENDOR PARTNER CREDENTIALS</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: #475569;">Partner Login ID:</td>
                    <td align="right" style="padding: 6px 0; font-size: 15px; font-weight: 800; color: #0f172a; font-family: monospace;">${userId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: #475569;">One-Time Passkey:</td>
                    <td align="right" style="padding: 6px 0; font-size: 15px; font-weight: 800; color: #C84826; font-family: monospace; letter-spacing: 1px;">${tempPassword}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: #475569;">Partner Role:</td>
                    <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${role}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: #475569;">Allocated Depot:</td>
                    <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${hub}</td>
                  </tr>
                </table>
              </div>

              <!-- APP DOWNLOAD ACTION -->
              <div style="text-align: center; margin-bottom: 28px;">
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">Step 1: Download &amp; Install the DuraGrit Vendor Partner App</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="50%" align="center" style="padding: 0 6px;">
                      <a href="${apkUrl}" download="duragrit-vendor-v2.apk" style="display: block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; padding: 13px 18px; border-radius: 12px; box-shadow: 0 4px 12px rgba(5,150,105,0.35); text-align: center;">
                        🤖 Download Vendor App (.APK)
                      </a>
                    </td>
                    <td width="50%" align="center" style="padding: 0 6px;">
                      <a href="${pwaUrl}" style="display: block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; padding: 13px 18px; border-radius: 12px; box-shadow: 0 4px 12px rgba(15,23,42,0.35); text-align: center;">
                        📱 iPhone / Web Vendor Portal
                      </a>
                    </td>
                  </tr>
                </table>
                <div style="margin-top: 10px; font-size: 11px; color: #64748b; text-align: center;">
                  Android Package: <a href="${apkUrl}" style="color: #C84826; font-weight: 700; text-decoration: underline;" download="duragrit-vendor-v2.apk">duragrit-vendor-v2.apk (Direct Download)</a> • Web: <a href="${pwaUrl}" style="color: #059669; font-weight: 700; text-decoration: underline;">Open Field Portal</a>
                </div>
              </div>

              <!-- QUICK START STEPS -->
              <div style="background-color: #FAF9F6; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; font-size: 12px; color: #475569; line-height: 1.6;">
                <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 8px;">Vendor Quick-Start Instructions:</strong>
                1. Tap <strong>Download Vendor App (.APK)</strong> on Android, or tap <strong>iPhone / Web Vendor Portal</strong> on iOS Safari.<br>
                2. On Android, tap &ldquo;Download anyway&rdquo; and open the downloaded APK to install the DuraGrit Vendor Partner App.<br>
                3. On iPhone Safari, tap the Share button and select <strong>&ldquo;Add to Home Screen&rdquo;</strong> for 1-tap full-screen access.<br>
                4. Sign in with your <strong>User ID / Mobile</strong> and <strong>Passkey</strong> shown above.<br>
                5. Link your UPI VPA or Bank Account to scan QR codes and receive instant payouts!
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #FAF9F6; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.6;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <strong>DuraGrit Vitrified Pvt. Ltd.</strong> • Sartanpar Road, Morbi, Gujarat<br>
                    Helpline: +91 7303967198 • Email: duragrit07@gmail.com
                  </td>
                  <td align="right" valign="bottom" style="font-family: monospace; font-size: 10px; color: #94a3b8;">
                    Dossier v4.8 • ISO 9001:2015
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }
  },

  {
    id: 'cashback',
    name: 'Template 3 • Instant Cashback Credit & UPI Payout Receipt',
    category: 'Payouts',
    badge: 'FINANCIAL',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    subject: 'Cashback Credit Alert — ₹{{amount}} Credited via UPI (UTR: {{utrNumber}})',
    description: 'Dispatched to the contractor as soon as the Admin approves a cashback claim or releases the UPI payout via the NPCI Gateway. Contains bank UTR number, QR carton serial, and credit confirmation.',
    variables: [
      { tag: '{{recipientName}}', label: 'Contractor Name', sample: 'Suresh Patel' },
      { tag: '{{userId}}', label: 'Contractor ID', sample: 'USR-1042' },
      { tag: '{{amount}}', label: 'Disbursed Amount (₹)', sample: '500' },
      { tag: '{{utrNumber}}', label: 'Bank UTR Reference', sample: '429388102941' },
      { tag: '{{upiId}}', label: 'Contractor UPI VPA', sample: 'suresh.patel@okaxis' },
      { tag: '{{cartonSerial}}', label: 'Carton Serial Hash', sample: 'DG-VTR-2026-B08-8492' },
      { tag: '{{skuName}}', label: 'Tile SKU / Collection', sample: 'Duragrit Royal Onyx 600x1200mm' },
      { tag: '{{scanTimestamp}}', label: 'Claim Scan Time', sample: '04 Nov 2026, 14:32 IST' }
    ],
    sampleData: {
      recipientName: 'Suresh Patel',
      userId: 'USR-1042',
      amount: '500',
      utrNumber: '429388102941',
      upiId: 'suresh.patel@okaxis',
      cartonSerial: 'DG-VTR-2026-B08-8492',
      skuName: 'Duragrit Royal Onyx 600x1200mm',
      scanTimestamp: '04 Nov 2026, 14:32 IST'
    },
    generateHtml: (data = {}) => {
      const {
        recipientName = 'Valued Contractor',
        userId = 'USR-1042',
        amount = '500',
        utrNumber = '429388102941',
        upiId = 'suresh.patel@okaxis',
        cartonSerial = 'DG-VTR-2026-B08-8492',
        skuName = 'Duragrit Royal Onyx 600x1200mm',
        scanTimestamp = '04 Nov 2026, 14:32 IST'
      } = data;

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cashback Credit Receipt — DuraGrit Vitrified</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F3EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F4F3EF; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #065f46 0%, #059669 100%); padding: 28px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">DURAGRIT VITRIFIED</div>
                    <div style="font-size: 11px; color: #A7F3D0; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">NPCI Fast Payout Gateway Receipt</div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(255,255,255,0.2); color: #ffffff; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">PAID VIA UPI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN BODY -->
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              
              <!-- AMOUNT HERO -->
              <div style="text-align: center; margin-bottom: 26px;">
                <div style="font-size: 12px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1px;">Cashback Successfully Disbursed</div>
                <div style="font-size: 42px; font-weight: 900; color: #0f172a; margin: 4px 0;">₹${amount}.00</div>
                <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 12px;">
                  Bank UTR: <span style="font-family: monospace;">${utrNumber}</span>
                </div>
              </div>

              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                Dear <strong>${recipientName}</strong> (${userId}),<br>
                Your QR scan cashback has been credited directly to your registered UPI Virtual Payment Address (VPA).
              </p>

              <!-- TRANSACTION METRICS TABLE -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF9F6; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="40%" style="font-size: 12px; color: #64748b; padding-bottom: 8px;">Credited UPI VPA:</td>
                        <td width="60%" align="right" style="font-size: 13px; font-weight: 700; color: #0f172a; font-family: monospace; padding-bottom: 8px;">${upiId}</td>
                      </tr>
                      <tr>
                        <td width="40%" style="font-size: 12px; color: #64748b; padding-bottom: 8px;">Tile Collection:</td>
                        <td width="60%" align="right" style="font-size: 12px; font-weight: 700; color: #0f172a; padding-bottom: 8px;">${skuName}</td>
                      </tr>
                      <tr>
                        <td width="40%" style="font-size: 12px; color: #64748b; padding-bottom: 8px;">Carton Serial Hash:</td>
                        <td width="60%" align="right" style="font-size: 12px; font-weight: 700; color: #C84826; font-family: monospace; padding-bottom: 8px;">${cartonSerial}</td>
                      </tr>
                      <tr>
                        <td width="40%" style="font-size: 12px; color: #64748b;">Scan Timestamp:</td>
                        <td width="60%" align="right" style="font-size: 12px; font-weight: 600; color: #0f172a;">${scanTimestamp}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px 18px; font-size: 12px; color: #1e40af; line-height: 1.5;">
                <strong>Keep Scanning &amp; Earning!</strong> Scan more DuraGrit Vitrified cartons to unlock higher loyalty slabs, priority kiln dispatches, and quarterly festival gift rewards.
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #FAF9F6; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.6;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <strong>DuraGrit Vitrified Pvt. Ltd.</strong> • Automated NPCI IMPS Gateway<br>
                    Questions? Reach our Disbursal Desk: duragrit07@gmail.com
                  </td>
                  <td align="right" valign="bottom" style="font-family: monospace; font-size: 10px; color: #94a3b8;">
                    UTR Verified • Tax Invoice #DG-2026
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }
  },

  {
    id: 'kyc',
    name: 'Template 4 • KYC Regulatory Verification Approval',
    category: 'Compliance',
    badge: 'SECURITY',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    subject: 'KYC Compliance Approved — Your DuraGrit Contractor Benefits are Unlocked',
    description: 'Dispatched when an administrator verifies the contractor’s Aadhaar, PAN card, or bank passbook documents in Vendor Management. Unlocks higher daily scan limits and instant payouts.',
    variables: [
      { tag: '{{recipientName}}', label: 'Contractor Name', sample: 'Vikram Singh' },
      { tag: '{{userId}}', label: 'Contractor ID', sample: 'USR-3120' },
      { tag: '{{aadhaarMasked}}', label: 'Masked Aadhaar', sample: 'XXXX-XXXX-9182' },
      { tag: '{{panMasked}}', label: 'Masked PAN Card', sample: 'ABCDE****F' },
      { tag: '{{tierName}}', label: 'Approved Contractor Tier', sample: 'Gold Applicator (Tier 1)' },
      { tag: '{{dailyLimit}}', label: 'Daily Scan Limit', sample: '50 Cartons / day' }
    ],
    sampleData: {
      recipientName: 'Vikram Singh',
      userId: 'USR-3120',
      aadhaarMasked: 'XXXX-XXXX-9182',
      panMasked: 'ABCDE****F',
      tierName: 'Gold Applicator (Tier 1)',
      dailyLimit: '50 Cartons / day'
    },
    generateHtml: (data = {}) => {
      const {
        recipientName = 'Valued Partner',
        userId = 'USR-3120',
        aadhaarMasked = 'XXXX-XXXX-9182',
        panMasked = 'ABCDE****F',
        tierName = 'Gold Applicator (Tier 1)',
        dailyLimit = '50 Cartons / day'
      } = data;

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KYC Approval Alert — DuraGrit Vitrified</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F3EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F4F3EF; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 28px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">DURAGRIT VITRIFIED</div>
                    <div style="font-size: 11px; color: #93c5fd; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">Identity &amp; KYC Verification Cell</div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">VERIFIED</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN BODY -->
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">KYC Documents Successfully Verified</h1>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                Dear <strong>${recipientName}</strong> (${userId}),<br>
                Our compliance team has reviewed and approved your identity documents. Your partner tier has been upgraded to <strong>${tierName}</strong>.
              </p>

              <!-- VERIFICATION DETAILS -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF9F6; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="50%" style="font-size: 12px; color: #64748b; padding-bottom: 8px;">Aadhaar Verification:</td>
                        <td width="50%" align="right" style="font-size: 13px; font-weight: 700; color: #059669; font-family: monospace; padding-bottom: 8px;">✓ ${aadhaarMasked}</td>
                      </tr>
                      <tr>
                        <td width="50%" style="font-size: 12px; color: #64748b; padding-bottom: 8px;">PAN Card Status:</td>
                        <td width="50%" align="right" style="font-size: 13px; font-weight: 700; color: #059669; font-family: monospace; padding-bottom: 8px;">✓ ${panMasked}</td>
                      </tr>
                      <tr>
                        <td width="50%" style="font-size: 12px; color: #64748b; padding-bottom: 8px;">Contractor Tier:</td>
                        <td width="50%" align="right" style="font-size: 13px; font-weight: 800; color: #0f172a; padding-bottom: 8px;">${tierName}</td>
                      </tr>
                      <tr>
                        <td width="50%" style="font-size: 12px; color: #64748b;">Daily Scan Allowance:</td>
                        <td width="50%" align="right" style="font-size: 13px; font-weight: 800; color: #C84826;">${dailyLimit}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="background-color: #FEF2EE; border-left: 4px solid #C84826; padding: 14px 18px; border-radius: 0 8px 8px 0;">
                <div style="font-size: 12px; font-weight: 700; color: #A62C11;">Unrestricted Payout Access Enabled</div>
                <div style="font-size: 12px; color: #475569; margin-top: 4px; line-height: 1.5;">
                  Your daily payout threshold is now unlocked with direct 2-step automated releases into your bank or UPI ID.
                </div>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #FAF9F6; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.6;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <strong>DuraGrit Vitrified Pvt. Ltd.</strong> • Regulatory Compliance Cell<br>
                    Morbi - 363642, Gujarat, India • duragrit07@gmail.com
                  </td>
                  <td align="right" valign="bottom" style="font-family: monospace; font-size: 10px; color: #94a3b8;">
                    Audit ID: KYC-OK-2026
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }
  },

  {
    id: 'smtp-test',
    name: 'Template 5 • Live SMTP Gateway Diagnostic Dispatch',
    category: 'Diagnostics',
    badge: 'SYSTEM',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    subject: 'DuraGrit Vitrified — Live SMTP Gateway Test Dispatch (Gmail: duragrit07@gmail.com)',
    description: 'Dispatched during administrator diagnostic testing from System Settings or Email Reports. Proves bidirectional end-to-end delivery from smtp.gmail.com to the recipient inbox.',
    variables: [
      { tag: '{{recipientEmail}}', label: 'Test Recipient', sample: 'duragrit07@gmail.com' },
      { tag: '{{senderEmail}}', label: 'Outbound Gmail Address', sample: 'duragrit07@gmail.com' },
      { tag: '{{smtpHost}}', label: 'SMTP Host', sample: 'smtp.gmail.com' },
      { tag: '{{smtpPort}}', label: 'SMTP Port', sample: '587' },
      { tag: '{{latency}}', label: 'Relay Latency', sample: '1420ms' },
      { tag: '{{timestamp}}', label: 'Dispatch Timestamp', sample: '04 Nov 2026, 22:15 IST' }
    ],
    sampleData: {
      recipientEmail: 'duragrit07@gmail.com',
      senderEmail: 'duragrit07@gmail.com',
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      latency: '1420ms',
      timestamp: '04 Nov 2026, 22:15 IST'
    },
    generateHtml: (data = {}) => {
      const {
        recipientEmail = 'duragrit07@gmail.com',
        senderEmail = 'duragrit07@gmail.com',
        smtpHost = 'smtp.gmail.com',
        smtpPort = '587',
        latency = '1420ms',
        timestamp = new Date().toLocaleString('en-IN')
      } = data;

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SMTP Diagnostic Test — DuraGrit Vitrified</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F3EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F4F3EF; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">DURAGRIT VITRIFIED</div>
                    <div style="font-size: 11px; color: #c4b5fd; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">SMTP Relay Diagnostic Telemetry</div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">250 2.0.0 OK</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN BODY -->
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 56px; height: 56px; border-radius: 50%; background-color: #ecfdf5; border: 2px solid #a7f3d0; margin: 0 auto 12px auto; line-height: 54px; font-size: 28px;">
                  🚀
                </div>
                <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">Live Gmail SMTP Relay Test Succeeded!</h1>
                <p style="font-size: 13px; color: #64748b; margin: 0;">
                  If you are reading this email in your inbox, your Google Gmail SMTP gateway is fully configured and delivering live messages.
                </p>
              </div>

              <!-- TELEMETRY MATRIX -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF9F6; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="45%" style="font-size: 12px; color: #64748b; padding-bottom: 8px;">Sender Account:</td>
                        <td width="55%" align="right" style="font-size: 13px; font-weight: 700; color: #0f172a; font-family: monospace; padding-bottom: 8px;">${senderEmail}</td>
                      </tr>
                      <tr>
                        <td width="45%" style="font-size: 12px; color: #64748b; padding-bottom: 8px;">Recipient:</td>
                        <td width="55%" align="right" style="font-size: 13px; font-weight: 700; color: #0f172a; font-family: monospace; padding-bottom: 8px;">${recipientEmail}</td>
                      </tr>
                      <tr>
                        <td width="45%" style="font-size: 12px; color: #64748b; padding-bottom: 8px;">Relay Host &amp; Port:</td>
                        <td width="55%" align="right" style="font-size: 13px; font-weight: 700; color: #4f46e5; font-family: monospace; padding-bottom: 8px;">${smtpHost}:${smtpPort}</td>
                      </tr>
                      <tr>
                        <td width="45%" style="font-size: 12px; color: #64748b; padding-bottom: 8px;">TLS Round-Trip Latency:</td>
                        <td width="55%" align="right" style="font-size: 13px; font-weight: 800; color: #059669; font-family: monospace; padding-bottom: 8px;">${latency}</td>
                      </tr>
                      <tr>
                        <td width="45%" style="font-size: 12px; color: #64748b;">Timestamp:</td>
                        <td width="55%" align="right" style="font-size: 12px; font-weight: 600; color: #0f172a;">${timestamp}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="background-color: #FEF2EE; border: 1px solid #F9CEB8; border-radius: 12px; padding: 14px 18px; font-size: 12px; color: #A62C11; line-height: 1.5;">
                <strong>All Production Systems Green:</strong> Contractor welcome credentials, instant KYC notifications, and OTPs will now be delivered via this verified Google SMTP connection.
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #FAF9F6; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.6;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <strong>DuraGrit Vitrified Pvt. Ltd.</strong> • Diagnostic Suite 2.0<br>
                    Morbi - 363642, Gujarat, India • Support: +91 7303967198
                  </td>
                  <td align="right" valign="bottom" style="font-family: monospace; font-size: 10px; color: #94a3b8;">
                    RFC 5321 • TLS 1.3
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }
  }
];

export function getTemplateById(id) {
  return EMAIL_TEMPLATES.find(t => t.id === id) || EMAIL_TEMPLATES[0];
}

