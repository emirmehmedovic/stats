import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dateOnlyToUtc } from '@/lib/dates';
import { createEmployeeSchema } from '@/lib/validators/employee';
import { z } from 'zod';

// GET /api/employees - Lista radnika sa filterima
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const sectorId = searchParams.get('sectorId') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Build WHERE clause
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (department) {
      where.department = department;
    }

    if (sectorId) {
      where.sectorId = sectorId;
    }

    if (status) {
      where.status = status;
    }

    // Fetch employees
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sector: true,
          licenses: {
            select: {
              id: true,
              licenseType: true,
              licenseNumber: true,
              expiryDate: true,
              status: true,
            },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Employees GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST /api/employees - Kreiranje novog radnika
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validacija
    const validated = createEmployeeSchema.parse(body);

    // Provera da li već postoji employee sa istim brojem ili email-om
    const existing = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeNumber: validated.employeeNumber },
          { email: validated.email },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { 
          error: existing.employeeNumber === validated.employeeNumber
            ? 'Employee number already exists'
            : 'Email already exists'
        },
        { status: 400 }
      );
    }

    // Kreiranje employee-a
    const employee = await prisma.employee.create({
      data: {
        employeeNumber: validated.employeeNumber,
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        phone: validated.phone || null,
        nationalId: validated.nationalId || null,
        dateOfBirth: validated.dateOfBirth ? dateOnlyToUtc(validated.dateOfBirth) : null,
        hireDate: dateOnlyToUtc(validated.hireDate),
        position: validated.position,
        department: validated.department || null,
        status: validated.status,
      },
      include: {
        licenses: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: employee,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Employee POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
