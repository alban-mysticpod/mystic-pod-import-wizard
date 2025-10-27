import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WeScale - Import Wizard',
  description: 'Import your designs from Google Drive to Printify seamlessly',
  keywords: ['printify', 'google drive', 'print on demand', 'design import'],
  authors: [{ name: 'WeScale' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gray-50">
          {/* Sidebar */}
          <Sidebar 
            userName="John Doe" 
            userEmail="john@example.com"
          />
          
          {/* Main Content */}
          <main className="flex-1 lg:ml-72">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
