import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://loan-management-system.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: [
        '/api/',
        '/dashboard',
        '/dashboard/',
        '/customers',
        '/customers/',
        '/loans',
        '/loans/',
        '/applications',
        '/applications/',
        '/repayments',
        '/repayments/',
        '/sanctions',
        '/disbursements',
        '/recovery',
        '/restructuring',
        '/admin',
        '/admin/',
        '/settings',
        '/settings/',
        '/audit',
        '/audit/',
        '/reports',
        '/reports/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
