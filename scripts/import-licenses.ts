/**
 * License Import Script
 *
 * Imports licenses from folder structure:
 * /licence/[LICENSE_TYPE]/[SERVICE]/[EMPLOYEE_NAME].pdf
 *
 * Usage: npx ts-node scripts/import-licenses.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Configuration
const LICENSE_FOLDER = '/Users/emir_mw/Desktop/DOKUMENTI/licence';
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents');
const DRY_RUN = process.argv.includes('--dry-run');

// Stats
const stats = {
  licenseFoldersProcessed: 0,
  pdfFilesFound: 0,
  employeesMatched: 0,
  employeesCreated: 0,
  licensesCreated: 0,
  documentsUploaded: 0,
  errors: [] as string[],
  skipped: [] as string[],
};

// Normalize string for matching (remove diacritics, lowercase)
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[đ]/g, 'd')
    .replace(/[Đ]/g, 'd')
    .replace(/[č]/g, 'c')
    .replace(/[ć]/g, 'c')
    .replace(/[ž]/g, 'z')
    .replace(/[š]/g, 's')
    .trim();
}

// Extract employee name from PDF filename
function extractNameFromFilename(filename: string): { firstName: string; lastName: string } | null {
  // Remove .pdf extension
  let name = filename.replace(/\.pdf$/i, '');

  // Remove common suffixes like "PARKER", "RADIO VEZA", "DGR", "OPŠTI PROGRAM OBUKE", etc.
  const suffixesToRemove = [
    'PARKER', 'RADIO VEZA', 'DGR', 'OPŠTI PROGRAM OBUKE',
    'WILDLIFE', 'KONTROLA PTICA', 'OPERATOR', 'KONTROLOR',
    'L20', 'L30', 'KONT', 'SVJ', 'STW', 'RAMP'
  ];

  for (const suffix of suffixesToRemove) {
    name = name.replace(new RegExp(`\\s*${suffix}\\s*`, 'gi'), ' ');
  }

  // Clean up multiple spaces
  name = name.replace(/\s+/g, ' ').trim();

  // Split into parts
  const parts = name.split(' ').filter(p => p.length > 0);

  if (parts.length < 2) {
    return null;
  }

  // Usually format is "PREZIME IME" (LASTNAME FIRSTNAME)
  // But sometimes it's "IME PREZIME"
  // We'll try both when matching
  return {
    lastName: parts[0],
    firstName: parts.slice(1).join(' '),
  };
}

// Fuzzy match employee by name
async function findEmployee(firstName: string, lastName: string): Promise<{ id: string; firstName: string; lastName: string } | null> {
  const normalizedFirst = normalize(firstName);
  const normalizedLast = normalize(lastName);

  // Try exact match first
  let employee = await prisma.employee.findFirst({
    where: {
      AND: [
        { firstName: { equals: firstName, mode: 'insensitive' } },
        { lastName: { equals: lastName, mode: 'insensitive' } },
      ],
    },
    select: { id: true, firstName: true, lastName: true },
  });

  if (employee) return employee;

  // Try swapped (in case format is reversed)
  employee = await prisma.employee.findFirst({
    where: {
      AND: [
        { firstName: { equals: lastName, mode: 'insensitive' } },
        { lastName: { equals: firstName, mode: 'insensitive' } },
      ],
    },
    select: { id: true, firstName: true, lastName: true },
  });

  if (employee) return employee;

  // Try fuzzy match with all employees
  const allEmployees = await prisma.employee.findMany({
    select: { id: true, firstName: true, lastName: true },
  });

  for (const emp of allEmployees) {
    const empFirst = normalize(emp.firstName);
    const empLast = normalize(emp.lastName);

    // Check if normalized names match (handles diacritics)
    if (
      (empFirst === normalizedFirst && empLast === normalizedLast) ||
      (empFirst === normalizedLast && empLast === normalizedFirst)
    ) {
      return emp;
    }

    // Check partial match (first name contains or last name contains)
    if (
      (empFirst.includes(normalizedFirst) || normalizedFirst.includes(empFirst)) &&
      (empLast.includes(normalizedLast) || normalizedLast.includes(empLast))
    ) {
      return emp;
    }

    // Swapped partial match
    if (
      (empFirst.includes(normalizedLast) || normalizedLast.includes(empFirst)) &&
      (empLast.includes(normalizedFirst) || normalizedFirst.includes(empLast))
    ) {
      return emp;
    }
  }

  return null;
}

// Find or create license type by folder name
async function findOrCreateLicenseType(folderName: string): Promise<{ id: string; name: string; validityPeriodMonths: number | null } | null> {
  const normalizedFolder = normalize(folderName);

  // Get all license types
  const licenseTypes = await prisma.licenseType.findMany({
    select: { id: true, name: true, code: true, validityPeriodMonths: true },
  });

  // Try exact match
  for (const lt of licenseTypes) {
    if (normalize(lt.name) === normalizedFolder || (lt.code && normalize(lt.code) === normalizedFolder)) {
      return lt;
    }
  }

  // Try partial match
  for (const lt of licenseTypes) {
    const normalizedName = normalize(lt.name);
    if (normalizedName.includes(normalizedFolder) || normalizedFolder.includes(normalizedName)) {
      return lt;
    }
  }

  // No match found - create new license type
  console.log(`  [NEW LICENSE TYPE] Creating: ${folderName}`);

  if (DRY_RUN) {
    return { id: 'dry-run-id', name: folderName, validityPeriodMonths: 12 };
  }

  const newLicenseType = await prisma.licenseType.create({
    data: {
      name: folderName,
      code: folderName.substring(0, 20).toUpperCase().replace(/\s+/g, '_'),
      validityPeriodMonths: 12, // Default 1 year
      requiresRenewal: true,
      isActive: true,
      category: 'Operations',
    },
    select: { id: true, name: true, validityPeriodMonths: true },
  });

  return newLicenseType;
}

// Create employee if not exists
async function createEmployee(firstName: string, lastName: string, service?: string): Promise<{ id: string; firstName: string; lastName: string }> {
  const employeeNumber = `AUTO-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const email = `${normalize(firstName)}.${normalize(lastName)}@placeholder.local`;

  console.log(`  [NEW EMPLOYEE] Creating: ${firstName} ${lastName}`);
  stats.employeesCreated++;

  if (DRY_RUN) {
    return { id: 'dry-run-id', firstName, lastName };
  }

  const employee = await prisma.employee.create({
    data: {
      employeeNumber,
      firstName,
      lastName,
      email,
      position: 'N/A',
      hireDate: new Date(),
      status: 'ACTIVE',
    },
    select: { id: true, firstName: true, lastName: true },
  });

  return employee;
}

// Copy file to uploads directory
async function copyFileToUploads(sourcePath: string, filename: string): Promise<string> {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const newFilename = `${timestamp}_${sanitizedFilename}`;
  const destPath = path.join(UPLOADS_DIR, newFilename);

  if (!DRY_RUN) {
    // Ensure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    fs.copyFileSync(sourcePath, destPath);
  }

  return `/uploads/documents/${newFilename}`;
}

// Create license with document
async function createLicenseWithDocument(
  employeeId: string,
  licenseTypeId: string,
  pdfPath: string,
  pdfFilename: string,
  validityMonths: number | null
): Promise<void> {
  const issuedDate = new Date();
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + (validityMonths || 12));

  const licenseNumber = `LIC-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create license ${licenseNumber} and upload ${pdfFilename}`);
    stats.licensesCreated++;
    stats.documentsUploaded++;
    return;
  }

  // Copy file
  const filePath = await copyFileToUploads(pdfPath, pdfFilename);
  const fileStats = fs.statSync(pdfPath);

  // Create license with document
  const license = await prisma.license.create({
    data: {
      employeeId,
      licenseTypeId,
      licenseNumber,
      issuedDate,
      expiryDate,
      issuer: 'Auto-imported',
      status: 'ACTIVE',
      documents: {
        create: {
          fileName: pdfFilename,
          filePath,
          fileType: 'application/pdf',
          fileSize: fileStats.size,
        },
      },
    },
  });

  stats.licensesCreated++;
  stats.documentsUploaded++;
  console.log(`  [OK] Created license ${license.licenseNumber}`);
}

// Process a single PDF file
async function processPdfFile(
  pdfPath: string,
  licenseType: { id: string; name: string; validityPeriodMonths: number | null },
  serviceName?: string
): Promise<void> {
  const filename = path.basename(pdfPath);
  stats.pdfFilesFound++;

  console.log(`\n  Processing: ${filename}`);

  // Extract name from filename
  const nameInfo = extractNameFromFilename(filename);
  if (!nameInfo) {
    stats.skipped.push(`${filename}: Could not extract name`);
    console.log(`  [SKIP] Could not extract name from filename`);
    return;
  }

  console.log(`  Extracted: ${nameInfo.firstName} ${nameInfo.lastName}`);

  // Find or create employee
  let employee = await findEmployee(nameInfo.firstName, nameInfo.lastName);

  if (employee) {
    stats.employeesMatched++;
    console.log(`  [MATCH] Found employee: ${employee.firstName} ${employee.lastName}`);
  } else {
    // Create new employee
    employee = await createEmployee(nameInfo.firstName, nameInfo.lastName, serviceName);
  }

  // Check if license already exists
  const existingLicense = await prisma.license.findFirst({
    where: {
      employeeId: employee.id,
      licenseTypeId: licenseType.id,
    },
  });

  if (existingLicense) {
    stats.skipped.push(`${filename}: License already exists for ${employee.firstName} ${employee.lastName}`);
    console.log(`  [SKIP] License already exists`);
    return;
  }

  // Create license with document
  await createLicenseWithDocument(
    employee.id,
    licenseType.id,
    pdfPath,
    filename,
    licenseType.validityPeriodMonths
  );
}

// Process a service/department folder
async function processServiceFolder(
  folderPath: string,
  licenseType: { id: string; name: string; validityPeriodMonths: number | null }
): Promise<void> {
  const serviceName = path.basename(folderPath);
  const items = fs.readdirSync(folderPath);

  for (const item of items) {
    const itemPath = path.join(folderPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isFile() && item.toLowerCase().endsWith('.pdf')) {
      try {
        await processPdfFile(itemPath, licenseType, serviceName);
      } catch (error) {
        const errorMsg = `${item}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        stats.errors.push(errorMsg);
        console.log(`  [ERROR] ${errorMsg}`);
      }
    }
  }
}

// Process a license type folder
async function processLicenseTypeFolder(folderPath: string): Promise<void> {
  const folderName = path.basename(folderPath);
  stats.licenseFoldersProcessed++;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`LICENSE TYPE: ${folderName}`);
  console.log('='.repeat(60));

  // Find or create license type
  const licenseType = await findOrCreateLicenseType(folderName);
  if (!licenseType) {
    stats.errors.push(`${folderName}: Could not find or create license type`);
    return;
  }

  console.log(`Matched to: ${licenseType.name} (validity: ${licenseType.validityPeriodMonths} months)`);

  const items = fs.readdirSync(folderPath);

  for (const item of items) {
    if (item.startsWith('.')) continue; // Skip hidden files

    const itemPath = path.join(folderPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // This is a service/department subfolder
      console.log(`\n  SERVICE: ${item}`);
      await processServiceFolder(itemPath, licenseType);
    } else if (stat.isFile() && item.toLowerCase().endsWith('.pdf')) {
      // PDF directly in license type folder (no service subfolder)
      try {
        await processPdfFile(itemPath, licenseType);
      } catch (error) {
        const errorMsg = `${item}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        stats.errors.push(errorMsg);
        console.log(`  [ERROR] ${errorMsg}`);
      }
    }
  }
}

// Main function
async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           LICENSE IMPORT SCRIPT                            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ Source: ${LICENSE_FOLDER}`);
  console.log(`║ Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (will make changes)'}`);
  console.log('╚════════════════════════════════════════════════════════════╝');

  if (!fs.existsSync(LICENSE_FOLDER)) {
    console.error(`ERROR: License folder not found: ${LICENSE_FOLDER}`);
    process.exit(1);
  }

  // Get all license type folders
  const items = fs.readdirSync(LICENSE_FOLDER);

  for (const item of items) {
    if (item.startsWith('.')) continue; // Skip hidden files

    const itemPath = path.join(LICENSE_FOLDER, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      await processLicenseTypeFolder(itemPath);
    }
  }

  // Print summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                       SUMMARY                              ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ License type folders processed: ${stats.licenseFoldersProcessed}`);
  console.log(`║ PDF files found: ${stats.pdfFilesFound}`);
  console.log(`║ Employees matched: ${stats.employeesMatched}`);
  console.log(`║ Employees created: ${stats.employeesCreated}`);
  console.log(`║ Licenses created: ${stats.licensesCreated}`);
  console.log(`║ Documents uploaded: ${stats.documentsUploaded}`);
  console.log(`║ Skipped: ${stats.skipped.length}`);
  console.log(`║ Errors: ${stats.errors.length}`);
  console.log('╚════════════════════════════════════════════════════════════╝');

  if (stats.skipped.length > 0) {
    console.log('\nSKIPPED:');
    stats.skipped.forEach(s => console.log(`  - ${s}`));
  }

  if (stats.errors.length > 0) {
    console.log('\nERRORS:');
    stats.errors.forEach(e => console.log(`  - ${e}`));
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
