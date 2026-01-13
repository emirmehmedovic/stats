import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { ReportMetadata } from '@/lib/report-metadata';

export async function GET() {
  try {
    const generatedDir = path.join(process.cwd(), 'izvještaji', 'generated');
    let entries: Array<{
      fileName: string;
      size: number;
      updatedAt: string;
      generatedAt: string | null;
      generatedBy: string | null;
    }> = [];

    try {
      const dirEntries = await fs.readdir(generatedDir, { withFileTypes: true });
      const files = dirEntries.filter((entry) => entry.isFile() && entry.name.endsWith('.xlsx'));
      entries = await Promise.all(
        files.map(async (entry) => {
          const filePath = path.join(generatedDir, entry.name);
          const stat = await fs.stat(filePath);
          let meta: ReportMetadata | null = null;
          try {
            const metaRaw = await fs.readFile(`${filePath}.meta.json`, 'utf-8');
            meta = JSON.parse(metaRaw) as ReportMetadata;
          } catch (error: any) {
            if (error?.code !== 'ENOENT') {
              console.warn('Report metadata parse error:', entry.name);
            }
          }
          return {
            fileName: entry.name,
            size: stat.size,
            updatedAt: stat.mtime.toISOString(),
            generatedAt: meta?.generatedAt || null,
            generatedBy: meta?.generatedBy?.name || meta?.generatedBy?.email || null,
          };
        })
      );
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }

    entries.sort((a, b) => (b.generatedAt || b.updatedAt).localeCompare(a.generatedAt || a.updatedAt));

    return NextResponse.json({ success: true, data: entries });
  } catch (error: any) {
    console.error('Error listing generated reports:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri učitavanju izvještaja' },
      { status: 500 }
    );
  }
}
