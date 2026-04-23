import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: 'Sistema de seguimiento automático de guías TCC',
  robots: 'noindex,nofollow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
