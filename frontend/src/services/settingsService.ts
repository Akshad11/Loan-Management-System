// Settings service — fetches and updates application settings from the DB API.
// All components should use this instead of hardcoded strings.

export type AppSettingKey =
  | 'application.name'
  | 'application.shortName'
  | 'application.version'
  | 'application.supportEmail'
  | 'application.supportPhone'
  | 'application.website'
  | 'company.name'
  | 'company.legalName'
  | 'company.registrationNumber'
  | 'company.gstNumber'
  | 'company.panNumber'
  | 'company.email'
  | 'company.phone'
  | 'company.addressLine1'
  | 'company.addressLine2'
  | 'company.city'
  | 'company.state'
  | 'company.pincode'
  | 'company.country'
  | 'branding.logo'
  | 'branding.favicon'
  | 'branding.primaryColor'
  | 'branding.loginTagline'
  | 'localization.currency'
  | 'localization.currencySymbol'
  | 'localization.timezone'
  | 'localization.dateFormat'
  | 'localization.language'
  | 'security.sessionTimeoutMinutes'
  | 'security.maxFailedLogins'
  | 'security.passwordMinLength'
  | 'security.requireMfa'
  | string; // extensible

const FALLBACK_SETTINGS: Record<string, string> = {
  'application.name': 'Loan Management System',
  'application.shortName': 'LMS',
  'company.name': 'ABC Finance Pvt Ltd',
  'branding.primaryColor': '#2563eb',
  'branding.loginTagline': 'Empowering Financial Decisions',
  'localization.currency': 'INR',
  'localization.currencySymbol': '₹',
};

let publicSettingsCache: Record<string, string> | null = null;
let publicSettingsFetchedAt: number | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches public settings (no auth required).
 * Results are cached for 5 minutes client-side.
 */
export async function fetchPublicSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  if (
    publicSettingsCache &&
    publicSettingsFetchedAt &&
    now - publicSettingsFetchedAt < CACHE_TTL_MS
  ) {
    return publicSettingsCache;
  }

  try {
    const response = await fetch('/api/settings/public', { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch public settings');
    const data = await response.json();
    publicSettingsCache = { ...FALLBACK_SETTINGS, ...data };
    publicSettingsFetchedAt = now;
    return publicSettingsCache || FALLBACK_SETTINGS;
  } catch {
    return FALLBACK_SETTINGS;
  }
}

/**
 * Fetches all settings (requires authenticated user with x-user-id header).
 */
export async function fetchAllSettings(
  userId: string
): Promise<{ settings: Record<string, any[]>; flat: any[] }> {
  const response = await fetch('/api/settings', {
    headers: { 'x-user-id': userId },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Failed to fetch settings');
  return response.json();
}

/**
 * Updates multiple settings at once.
 * Requires authenticated user with admin permissions.
 */
export async function updateSettings(
  userId: string,
  updates: Record<AppSettingKey, string>
): Promise<void> {
  const response = await fetch('/api/settings', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({ updates }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to update settings');
  }

  // Invalidate cache so next read reflects updated values
  publicSettingsCache = null;
  publicSettingsFetchedAt = null;
}

/**
 * Invalidates the public settings cache.
 * Call this after any settings update to force a fresh fetch.
 */
export function invalidateSettingsCache() {
  publicSettingsCache = null;
  publicSettingsFetchedAt = null;
}
