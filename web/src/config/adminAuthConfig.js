// DuraGrit Vitrified — Master Corporate Admin Authentication Configuration
// Stored in localStorage for offline/demo & corporate portal administration

export const ADMIN_CREDENTIALS_KEY = 'duragrit_admin_master_credentials_v1';

export const DEFAULT_ADMIN_CONFIG = {
  email: 'admin@duragrit.com',
  password: 'admin',
  pin: '1234',
  name: 'DuraGrit Principal Admin',
  role: 'Corporate Super Admin',
  mobile: '+91 90000 00000',
  terminalKey: 'DG-SEC-1234-ALPHA',
  hub: 'Morbi Kiln HQ'
};

export const getAdminCredentials = () => {
  try {
    const raw = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
    if (!raw) return DEFAULT_ADMIN_CONFIG;
    return { ...DEFAULT_ADMIN_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_ADMIN_CONFIG;
  }
};

export const saveAdminCredentials = (newCreds) => {
  try {
    localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(newCreds));
    return true;
  } catch (e) {
    return false;
  }
};
