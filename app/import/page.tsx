'use client';

import { Wizard } from '@/components/Wizard';
import { RequirePrintifyShop } from '@/components/RequirePrintifyShop';

export default function ImportPage() {
  return (
    <RequirePrintifyShop>
      <Wizard />
    </RequirePrintifyShop>
  );
}

