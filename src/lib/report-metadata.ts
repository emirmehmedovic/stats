import fs from 'fs/promises';
import type { AuthUser } from '@/lib/auth-utils';

export type ReportMetadata = {
  generatedAt: string;
  generatedBy: {
    id: string;
    name: string | null;
    email: string;
    role: AuthUser['role'];
  } | null;
};

export async function writeReportMetadata(filePath: string, user: AuthUser | null) {
  const metadata: ReportMetadata = {
    generatedAt: new Date().toISOString(),
    generatedBy: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      : null,
  };

  const metaPath = `${filePath}.meta.json`;
  await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
}
