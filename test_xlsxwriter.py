#!/usr/bin/env python3
"""
Test alternative: xlsxwriter library instead of openpyxl
"""
try:
    import xlsxwriter
    from pathlib import Path

    OUTPUT_DIR = Path("izvještaji/generated")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Creating Excel with xlsxwriter library...")

    # Create workbook
    wb = xlsxwriter.Workbook(str(OUTPUT_DIR / "test_xlsxwriter.xlsx"))
    ws = wb.add_worksheet("Test Report")

    # Formats
    title_format = wb.add_format({
        'bold': True,
        'font_size': 14,
        'align': 'center',
        'valign': 'vcenter'
    })

    header_format = wb.add_format({
        'bold': True,
        'font_size': 10,
        'align': 'center',
        'valign': 'vcenter',
        'bg_color': '#CCCCCC',
        'border': 1
    })

    # Title (merged)
    ws.merge_range('A1:E1', 'TEST REPORT TITLE', title_format)

    # Headers
    headers = ['ID', 'Name', 'Value', 'Date', 'Status']
    for col_idx, header in enumerate(headers):
        ws.write(1, col_idx, header, header_format)

    # Data
    for row_idx in range(7):
        ws.write(row_idx + 2, 0, row_idx + 1)
        ws.write(row_idx + 2, 1, f"Item {row_idx + 1}")
        ws.write(row_idx + 2, 2, 100 + row_idx)
        ws.write(row_idx + 2, 3, "2026-01-01")
        ws.write(row_idx + 2, 4, "OK")

    # Column widths
    ws.set_column('A:A', 5)
    ws.set_column('B:B', 20)
    ws.set_column('C:C', 10)
    ws.set_column('D:D', 12)
    ws.set_column('E:E', 10)

    wb.close()
    print("✅ Created: test_xlsxwriter.xlsx")
    print("\nOtvorite ovaj fajl i provjerite da li ima corruption warning!")
    print("Ako NEMA warning, možemo preći na xlsxwriter biblioteku.")

except ImportError:
    print("❌ xlsxwriter nije instaliran")
    print("Instalirajte sa: pip install xlsxwriter")
