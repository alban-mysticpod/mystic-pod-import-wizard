'use client';

import { Wizard } from '@/components/Wizard';

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Import</h1>
        <p className="text-gray-600">Import your designs from Google Drive to Printify</p>
      </div>
      
      <Wizard />
    </div>
  );
}

