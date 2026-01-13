# Plan rješavanja problema sa Excel izvještajima

## Datum kreiranja: 13. Januar 2026

## Identifikovani problemi

### 1. BHDCA izvještaj - MergedCell greška
**Greška:** `'MergedCell' object attribute 'value' is read-only`

**Lokacija:** `scripts/generate_bhdca_report.py:336`

**Uzrok:**
- Funkcija `write_city_pairs_sheet` pokušava da setuje vrednost na merged cell direktno
- U openpyxl-u, merged cells su read-only osim za top-left ćeliju
- Template fajl `izvještaji/09. BHDCA Septembar 2025.xlsx` verovatno ima merged cells u redovima 23-35

**Linija koda koja izaziva problem:**
```python
ws.cell(row=row, column=4).value = None  # Linija 336
```

**Dodatni problemi:**
- City-pair parsing ne radi pravilno - vraća 0 city pairs
- `departure_airport_iata` i `arrival_airport_iata` su `None` u bazi
- Route parsing iz string-a ne uspeva da parsuje aerodrome

### 2. BHANSA izvještaj - Excel corruption
**Greška:** "We found a problem with some content in 'BHANSA_Januar_2026.xlsx'"

**Mogući uzroci:**
- Merged cells nisu pravilno formatirani
- Nevalidni karakteri u ćelijama (iako postoji `create_merged_cell` helper)
- Problem sa formatiranjem title reda (red 1)

### 3. Ostali izvještaji - Excel corruption
**Pogođeni izvještaji:**
- Statistika za carinu
- Statistika za direktora
- WizzAir Performance
- Custom izvještaj

**Zajednički uzrok:**
- Svi koriste `create_merged_cell` funkciju koja PRAVILNO formatira merged cells
- Problem verovatno dolazi od POSTOJEĆIH merged cells koji nisu pravilno očišćeni
- Ili se merged cells kreiraju, a NAKON toga se opet pokušava setovanje vrednosti

---

## Plan rješavanja

### Faza 1: Rješavanje BHDCA izvještaja ⚠️ PRIORITET

#### 1.1. Dodati `create_merged_cell` helper funkciju
Kopirati funkciju iz drugih skripti (BHANSA, Customs, Director) koja pravilno kreira merged cells.

#### 1.2. Popraviti `write_city_pairs_sheet` funkciju
Umjesto direktnog setovanja vrednosti na merged cells:

**POSTOJEĆI KOD (POGREŠAN):**
```python
for row in range(start_row, end_row + 1):
    ws.cell(row=row, column=4).value = None  # ❌ MergedCell error
    ws.cell(row=row, column=5).value = None
    # ...
```

**NOVO RJEŠENJE - Opcija A (Unmerge → Clear → Write):**
```python
# 1. Unmerge sve merged cells u range-u
for merged_range in list(ws.merged_cells.ranges):
    if merged_range.min_row >= start_row and merged_range.max_row <= end_row:
        ws.unmerge_cells(str(merged_range))

# 2. Clear values
for row in range(start_row, end_row + 1):
    ws.cell(row=row, column=4).value = None
    ws.cell(row=row, column=5).value = None
    # ...

# 3. Write new values
for row_num, (from_airport, to_airport, data) in enumerate(outbound + inbound, start=start_row):
    ws.cell(row=row_num, column=4).value = from_airport
    # ...
```

**NOVO RJEŠENJE - Opcija B (Kreirati Excel od nule bez template-a):**
Kao što BHANSA skripta radi - kreirati novi workbook bez template-a i izbjeći probleme sa postojećim merged cells.

#### 1.3. Popraviti city-pair parsing problem
Problem: `departure_airport_iata` i `arrival_airport_iata` su `None` u bazi

**Analiza:**
```python
# DEBUG OUTPUT pokazuje:
# departure_airport_iata (from DB): None
# arrival_airport_iata (from DB): None
# Parsed from route: None -> None
```

**Uzrok:** Route format u bazi je "TZL-DTM-TZL" (round-trip), ali `parse_route` funkcija ne može da ga parsuje pravilno.

**Rješenje:**
```python
def parse_route_bidirectional(route_str):
    """
    Parse route string for round-trip flights.
    Route format: "TZL-DTM-TZL" or "DTM-TZL-DTM"
    Returns: (departure_iata, arrival_iata) for each leg
    """
    if not route_str or '-' not in route_str:
        return None, None

    parts = [p.strip() for p in route_str.split('-') if p.strip()]

    if len(parts) == 2:
        # Simple one-way: "TZL-DTM"
        return parts[0], parts[1]
    elif len(parts) == 3:
        # Round-trip: "TZL-DTM-TZL" ili "DTM-TZL-DTM"
        # Outbound leg: parts[0] → parts[1]
        # Inbound leg: parts[1] → parts[2]
        return parts[0], parts[1]  # Return first leg

    return None, None
```

### Faza 2: Rješavanje BHANSA izvještaja

#### 2.1. Analiza problema
- Skripta već koristi `create_merged_cell` funkciju
- Treba provjeriti da li se nakon merge-a pokušava setovanje vrednosti

#### 2.2. Provjeriti merged cell kreiranje
Provjeriti da li se title (red 1) pravilno kreira:
```python
# Linija 234-239
create_merged_cell(
    ws, 1, 'A', 'N',
    f"AERODROM TUZLA                    RIJD {MONTH_NAMES_UPPER[month]} {year}",
    font=title_font,
    alignment=center_align
)
```

#### 2.3. Dodati validaciju karaktera
Dodati `sanitize_text` funkciju kao u WizzAir skripti:
```python
def sanitize_text(value):
    """Remove control characters that can corrupt Excel XML."""
    if value is None:
        return None
    if not isinstance(value, str):
        return value
    try:
        from openpyxl.utils.cell import ILLEGAL_CHARACTERS_RE
        value = ILLEGAL_CHARACTERS_RE.sub('', value)
    except Exception:
        value = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', value)
    return value
```

### Faza 3: Rješavanje ostalih izvještaja

#### 3.1. Customs izvještaj
- Provjeriti `create_merged_cell` pozive
- Dodati `sanitize_text` za sve string vrednosti

#### 3.2. Director izvještaj
- Provjeriti `create_merged_cell` pozive
- Dodati `sanitize_text` za sve string vrednosti

#### 3.3. WizzAir Performance izvještaj
- Već ima `sanitize_text` funkciju ✅
- Provjeriti da li se pravilno koristi na svim mestima

#### 3.4. Custom izvještaj
- Već ima `create_merged_cell` funkciju ✅
- Dodati `sanitize_text` za sve string vrednosti

### Faza 4: Univerzalno rješenje - Centralizovana helper funkcija

#### 4.1. Kreirati `scripts/excel_helpers.py`
Centralizovati sve helper funkcije na jednom mjestu:

```python
#!/usr/bin/env python3
"""
Excel helper functions for report generation
Centralizovane funkcije za rad sa Excel fajlovima
"""

import re
import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill


def sanitize_text(value):
    """
    Remove control characters that can corrupt Excel XML.
    Uklanja kontrolne karaktere koji mogu oštetiti Excel XML.
    """
    if value is None:
        return None
    if not isinstance(value, str):
        return value
    try:
        from openpyxl.utils.cell import ILLEGAL_CHARACTERS_RE
        value = ILLEGAL_CHARACTERS_RE.sub('', value)
    except Exception:
        value = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', value)
    return value


def create_merged_cell(ws, row, start_col, end_col, value, font=None, fill=None, alignment=None, border=None):
    """
    Helper function to properly create merged cells with consistent formatting.
    Applies formatting to ALL cells in the range before merging to avoid Excel corruption.

    VAŽNO: Formatting se mora aplicirati na SVE ćelije PRIJE merge-a!
    """
    # Convert column letters to numbers if needed
    if isinstance(start_col, str):
        start_col = openpyxl.utils.column_index_from_string(start_col)
    if isinstance(end_col, str):
        end_col = openpyxl.utils.column_index_from_string(end_col)

    # Apply formatting to ALL cells in range BEFORE merging
    for col in range(start_col, end_col + 1):
        cell = ws.cell(row=row, column=col)

        # Set value only in first cell
        if col == start_col and value is not None:
            cell.value = sanitize_text(value) if isinstance(value, str) else value

        # Apply formatting to ALL cells
        if font:
            cell.font = font
        if fill:
            cell.fill = fill
        if alignment:
            cell.alignment = alignment
        if border:
            cell.border = border

    # Merge cells AFTER formatting
    if start_col != end_col:
        ws.merge_cells(start_row=row, start_column=start_col, end_row=row, end_column=end_col)


def clear_merged_cell_range(ws, start_row, end_row, columns):
    """
    Safely clear values in a range that may contain merged cells.

    Args:
        ws: Worksheet object
        start_row: First row to clear
        end_row: Last row to clear
        columns: List of column numbers to clear
    """
    # Step 1: Unmerge all cells in the range
    merged_ranges_to_unmerge = []
    for merged_range in ws.merged_cells.ranges:
        # Check if this merged range intersects with our target range
        if (merged_range.min_row >= start_row and merged_range.max_row <= end_row):
            # Check if any of the columns intersect
            for col in columns:
                if col >= merged_range.min_col and col <= merged_range.max_col:
                    merged_ranges_to_unmerge.append(str(merged_range))
                    break

    # Unmerge (need to create a copy of list because we're modifying during iteration)
    for merged_range_str in merged_ranges_to_unmerge:
        ws.unmerge_cells(merged_range_str)

    # Step 2: Clear values
    for row in range(start_row, end_row + 1):
        for col in columns:
            ws.cell(row=row, column=col).value = None


def write_cell_safely(ws, row, col, value):
    """
    Safely write value to a cell, handling merged cells.
    If cell is part of a merged range, unmerge first.
    """
    cell = ws.cell(row=row, column=col)

    # Check if this cell is part of a merged range
    for merged_range in ws.merged_cells.ranges:
        if row >= merged_range.min_row and row <= merged_range.max_row:
            if col >= merged_range.min_col and col <= merged_range.max_col:
                # Cell is merged, unmerge it first
                ws.unmerge_cells(str(merged_range))
                break

    # Now safe to write
    cell.value = sanitize_text(value) if isinstance(value, str) else value
```

#### 4.2. Refaktorisati sve skripte da koriste centralizovanu funkciju
```python
from excel_helpers import create_merged_cell, sanitize_text, clear_merged_cell_range
```

---

## Redosled implementacije

### 1. PRIORITET - BHDCA izvještaj (1-2 sata)
- [ ] Dodati `create_merged_cell` funkciju
- [ ] Popraviti `write_city_pairs_sheet` da koristi `clear_merged_cell_range`
- [ ] Popraviti route parsing za round-trip letove
- [ ] Testirati generisanje izvještaja za Januar 2026

### 2. BHANSA izvještaj (30 min)
- [ ] Dodati `sanitize_text` funkciju
- [ ] Aplicirati sanitization na sve string vrednosti
- [ ] Testirati generisanje izvještaja za Januar 2026

### 3. Ostali izvještaji (1 sat)
- [ ] Customs - dodati `sanitize_text`
- [ ] Director - dodati `sanitize_text`
- [ ] WizzAir - provjeriti da li se `sanitize_text` koristi svuda
- [ ] Custom - dodati `sanitize_text`

### 4. Centralizacija (optional, 1 sat)
- [ ] Kreirati `excel_helpers.py`
- [ ] Refaktorisati sve skripte da koriste centralizovanu funkciju

### 5. Testiranje (1 sat)
- [ ] Testirati sve izvještaje za Januar 2026
- [ ] Provjeriti da se Excel fajlovi otvaraju bez grešaka
- [ ] Provjeriti da podaci izgledaju ispravno

---

## Očekivani rezultati

Nakon implementacije:
1. ✅ BHDCA izvještaj se generiše bez MergedCell greške
2. ✅ City-pair podaci se pravilno prikazuju
3. ✅ Svi izvještaji se generišu bez Excel corruption greške
4. ✅ Excel fajlovi se otvaraju bez "We found a problem" upozorenja
5. ✅ Svi string podaci su sanitizovani i ne sadrže nevalidne karaktere

---

## Napomene

### Zašto se dešava Excel corruption?
Excel fajlovi su zapravo ZIP arhive sa XML fajlovima unutra. Ako XML nije 100% validan:
- Nevalidni kontrolni karakteri (`\x00-\x1F`) u string-ovima
- Merged cells bez pravilnog formatting-a na SVIM ćelijama
- Pokušaj pisanja u merged cell (umjesto top-left cell)

Excel tada pokušava "recovery" i prikazuje upozorenje.

### Best practices za openpyxl
1. **Uvijek sanitizuj string-ove** pre pisanja u ćelije
2. **Merged cells**: Formatting mora biti apliciran na SVE ćelije PRIJE merge-a
3. **Pisanje u merged cells**: Samo top-left ćelija je writable
4. **Unmerge prije clear-a**: Ako želiš da očistiš merged cells, prvo ih unmerge
5. **Koristi helper funkcije**: Ne ponavljaj kod, centralizuj

### Template vs Od-nule?
- **Template approach** (BHDCA): Brži setup, ali problemi sa postojećim merged cells
- **Od-nule approach** (BHANSA): Više kontrole, nema problema sa postojećim formatting-om

Za BHDCA izvještaj preporučujem **hybrid approach**:
- Zadrži template za header informacije i formatiranje
- Ali očisti sve merged cells u data range-u PRIJE pisanja

---

## Kontakt za pitanja
Ako se pojave dodatni problemi, provjerite:
1. openpyxl verziju: `pip show openpyxl`
2. Excel verziju koja se koristi za otvaranje fajlova
3. Log output iz Python skripti
