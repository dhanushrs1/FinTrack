import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Advanced Expense Tracker',
  description: 'Track your expenses and income with charts and analytics.',
  icons: {
    icon: [{ url: '/fintrack-icon.svg', type: 'image/svg+xml' }],
    shortcut: '/fintrack-icon.svg',
    apple: '/fintrack-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased bg-white text-gray-900 pb-20 md:pb-0"
        suppressHydrationWarning
      >
        <div className="min-h-screen flex flex-col">
          <Header />
          
          {/* Main Content */}
          <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
