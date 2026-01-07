#!/usr/bin/env ts-node

/**
 * Cleanup Unnecessary Files Script
 *
 * Ovaj script briše nepotrebne Excel fajlove iz foldera 2023-2026.
 * Zadržava SAMO "Dnevni izvještaj o saobraćaju" fajlove.
 *
 * Nepotrebni fajlovi:
 * - Wizz Air Daily Performance Table
 * - BHANSA - Izvještaj o prometu
 * - LOKALNA STATISTIKA
 * - EUROSTAT podaci
 * - Godišnji izvještaji (BHDCA i FEDCAD)
 * - Ostali izvještaji
 *
 * Usage:
 *   ts-node cleanup-unnecessary-files.ts --dry-run    # Preview (ne briše)
 *   ts-node cleanup-unnecessary-files.ts              # Stvarno briše
 */

import * as fs from 'fs';
import * as path from 'path';

// Konfiguracija
const STATS_DIR = '/Users/emir_mw/stats/STATS';
const YEARS_TO_CLEAN = ['2023', '2024', '2025', '2026'];

// Fajlovi koji treba DA OSTANU (regex patterns)
const KEEP_PATTERNS = [
  /Dnevni izvještaj o saobraćaju.*\.xlsx?$/i,  // Dnevni izvještaj o saobraćaju - <mjesec> 2025.xlsx
  /^\d{2}\. [A-Z]+ \d{4}\.xlsx?$/i,            // 09. SEPTEMBAR 2023.xlsx
];

// Fajlovi koji treba DA SE OBRIŠU (regex patterns)
const DELETE_PATTERNS = [
  /Wizz Air Daily Performance Table/i,
  /BHANSA.*Izvještaj/i,
  /LOKALNA STATISTIKA/i,
  /EUROSTAT/i,
  /BHDCA.*FEDCAD.*godišnji/i,
  /Izvještaj-putnici-roba/i,
  /TZL Summarized statement/i,
  /Izvještaj o prometu na aerodromu/i,
  /^\d{2}\.?\s*BHDCA/i,                // 12. BHDCA DECEMBAR, 04 BHDCA APRIL
  /STATISTIKA.*\d{4}/i,                 // STATISTIKA APRIL 2024, STATISTIKA AUGUST 2024
  /Statistika za carinu/i,              // Statistika za carinu mjesec APRIL
  /B_SA-AER-[MA]/i,                     // B_SA-AER-M-2024.xlsx, B_SA-AER-A-2025.xlsx
  /SA-AER-T_/i,                         // SA-AER-T_bos.xlsx
  /carina\.xlsx$/i,                     // 12. DECEMBAR 2023 - carina.xlsx
  /za direktora/i,                      // April -za direktora.xlsx, JANUAR-za direktora.xlsx
  /^\w+ \d{4}\.xlsx$/i,                 // Maj 2025.xlsx, Novembar 2025.xlsx
  /kopija|backup/i,                     // Decembar 2025 za direktora - kopija-backup.xlsx
];

interface FileAction {
  path: string;
  action: 'KEEP' | 'DELETE' | 'UNKNOWN';
  reason: string;
}

/**
 * Rekurzivno skenira folder i vraća sve Excel fajlove
 */
function scanDirectory(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && /\.xlsx?$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Odluči akciju za fajl (KEEP ili DELETE)
 */
function determineAction(filePath: string): FileAction {
  const fileName = path.basename(filePath);

  // Provjeri da li treba zadržati
  for (const pattern of KEEP_PATTERNS) {
    if (pattern.test(fileName)) {
      return {
        path: filePath,
        action: 'KEEP',
        reason: `Matches KEEP pattern: ${pattern}`,
      };
    }
  }

  // Provjeri da li treba obrisati
  for (const pattern of DELETE_PATTERNS) {
    if (pattern.test(fileName)) {
      return {
        path: filePath,
        action: 'DELETE',
        reason: `Matches DELETE pattern: ${pattern}`,
      };
    }
  }

  // Ako nije ni jedno ni drugo, označimo kao UNKNOWN
  return {
    path: filePath,
    action: 'UNKNOWN',
    reason: 'Does not match any pattern - manual review needed',
  };
}

/**
 * Grupiši fajlove po akcijama
 */
function analyzeFiles(files: string[]): {
  keep: FileAction[];
  delete: FileAction[];
  unknown: FileAction[];
} {
  const keep: FileAction[] = [];
  const deleteFiles: FileAction[] = [];
  const unknown: FileAction[] = [];

  for (const file of files) {
    const action = determineAction(file);

    switch (action.action) {
      case 'KEEP':
        keep.push(action);
        break;
      case 'DELETE':
        deleteFiles.push(action);
        break;
      case 'UNKNOWN':
        unknown.push(action);
        break;
    }
  }

  return { keep, delete: deleteFiles, unknown };
}

/**
 * Prikaži izvještaj
 */
function printReport(analysis: ReturnType<typeof analyzeFiles>) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 CLEANUP ANALYSIS REPORT');
  console.log('='.repeat(80) + '\n');

  console.log(`✅ Files to KEEP: ${analysis.keep.length}`);
  console.log(`❌ Files to DELETE: ${analysis.delete.length}`);
  console.log(`❓ Files UNKNOWN: ${analysis.unknown.length}`);
  console.log();

  // Prikaži fajlove koje ćemo zadržati
  if (analysis.keep.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('✅ FILES TO KEEP:');
    console.log('-'.repeat(80));
    analysis.keep.forEach((f, i) => {
      console.log(`${i + 1}. ${path.basename(f.path)}`);
      console.log(`   Path: ${f.path}`);
      console.log();
    });
  }

  // Prikaži fajlove koje ćemo obrisati
  if (analysis.delete.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('❌ FILES TO DELETE:');
    console.log('-'.repeat(80));
    analysis.delete.forEach((f, i) => {
      console.log(`${i + 1}. ${path.basename(f.path)}`);
      console.log(`   Path: ${f.path}`);
      console.log(`   Reason: ${f.reason}`);
      console.log();
    });
  }

  // Prikaži nepoznate fajlove
  if (analysis.unknown.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('❓ UNKNOWN FILES (Manual Review Needed):');
    console.log('-'.repeat(80));
    analysis.unknown.forEach((f, i) => {
      console.log(`${i + 1}. ${path.basename(f.path)}`);
      console.log(`   Path: ${f.path}`);
      console.log();
    });
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Obriši fajlove
 */
function deleteFiles(files: FileAction[], dryRun: boolean): void {
  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No files will be deleted');
    return;
  }

  console.log('\n🗑️  DELETING FILES...\n');

  let deleted = 0;
  let errors = 0;

  for (const file of files) {
    try {
      fs.unlinkSync(file.path);
      console.log(`✅ Deleted: ${path.basename(file.path)}`);
      deleted++;
    } catch (error) {
      const err = error as Error;
      console.error(`❌ Error deleting ${path.basename(file.path)}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Successfully deleted: ${deleted} files`);
  if (errors > 0) {
    console.log(`❌ Errors: ${errors} files`);
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('🧹 Cleanup Unnecessary Files Script');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (Preview Only)' : '🗑️  DELETE MODE'}`);
  console.log();

  // Skeniraj sve godine
  const allFiles: string[] = [];

  for (const year of YEARS_TO_CLEAN) {
    const yearDir = path.join(STATS_DIR, year);

    if (!fs.existsSync(yearDir)) {
      console.log(`⚠️  Year ${year} not found, skipping...`);
      continue;
    }

    console.log(`📂 Scanning ${year}...`);
    const files = scanDirectory(yearDir);
    allFiles.push(...files);
  }

  console.log(`\n📁 Total Excel files found: ${allFiles.length}`);

  // Analiziraj fajlove
  const analysis = analyzeFiles(allFiles);

  // Prikaži izvještaj
  printReport(analysis);

  // Obriši fajlove (ako nije dry-run)
  if (!dryRun) {
    console.log('\n⚠️  WARNING: This will DELETE files permanently!');
    console.log('Press Ctrl+C to cancel or wait 5 seconds to continue...');

    // Countdown
    for (let i = 5; i > 0; i--) {
      process.stdout.write(`\r⏳ Deleting in ${i} seconds... `);
      // Sync sleep
      const start = Date.now();
      while (Date.now() - start < 1000) {}
    }
    console.log('\n');

    deleteFiles(analysis.delete, false);
  } else {
    console.log('\n💡 To actually delete files, run without --dry-run flag:');
    console.log('   ts-node cleanup-unnecessary-files.ts');
  }
}

// Run
main();
