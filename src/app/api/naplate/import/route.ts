import { NextRequest, NextResponse } from 'next/server';
import { requireNaplateAccess } from '@/lib/route-guards';
import { parseAccountingExport } from '@/lib/naplate-import';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireNaplateAccess(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Nedostaje fajl' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { report, warnings } = parseAccountingExport(buffer);

    return NextResponse.json({ report, warnings });
  } catch (error) {
    console.error('Billing import error:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju fajla' },
      { status: 500 }
    );
  }
}
