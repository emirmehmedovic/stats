import json
import sys
from pathlib import Path

from openpyxl import load_workbook
from openpyxl.utils import get_column_letter


def find_header_row(ws):
    for row in range(1, 20):
        values = [ws.cell(row=row, column=col).value for col in range(1, ws.max_column + 1)]
        if "Fee types" in values:
            return row
    return None


def find_label_row(ws, label):
    for row in range(1, ws.max_row + 1):
        cell_value = ws.cell(row=row, column=2).value
        if isinstance(cell_value, str) and label.lower() in cell_value.lower():
            return row
    return None


def find_value_column(ws, row, preferred):
    for col in preferred:
        cell = ws.cell(row=row, column=col)
        if cell.data_type == "f" or isinstance(cell.value, (int, float)):
            return col
    return preferred[0]


def build_header_map(ws, header_row):
    headers = {}
    for col in range(1, ws.max_column + 1):
        val = ws.cell(row=header_row, column=col).value
        if isinstance(val, str):
            headers[val.strip().lower()] = col
    return headers


def scan_service_rows(ws, fee_col, code_col, header_row):
    rows = []
    other_rows = []
    code_rows = {}
    for row in range(header_row + 2, ws.max_row + 1):
        label = ws.cell(row=row, column=fee_col).value
        code = ws.cell(row=row, column=code_col).value
        if isinstance(label, str) and label.strip().lower().startswith("total"):
            break
        if label is None and code is None:
            continue
        rows.append(row)
        if isinstance(label, str) and label.strip().lower().startswith(("other", "ostalo")):
            other_rows.append(row)
        if code:
            code_rows[str(code).strip()] = row
    return rows, other_rows, code_rows


def write_amount_formula(ws, row, price_col, qty_col, amount_col):
    price_letter = get_column_letter(price_col)
    qty_letter = get_column_letter(qty_col)
    ws.cell(row=row, column=amount_col).value = f"={qty_letter}{row}*{price_letter}{row}"


def export_sky_speed(template_path, output_path, carrier_data):
    wb = load_workbook(template_path)
    ws = wb.active

    header_row = find_header_row(ws)
    if header_row is None:
        raise RuntimeError("Missing header row in template")

    headers = build_header_map(ws, header_row)
    fee_col = headers.get("fee types", 2)
    code_col = headers.get("fees code", 3)
    price_col = headers.get("eur", 4)
    qty_col = headers.get("qty", 5)
    amount_col = headers.get("amount", 6)
    valute_col = headers.get("valute", 7)

    rows, other_rows, code_rows = scan_service_rows(ws, fee_col, code_col, header_row)

    for row in rows:
        ws.cell(row=row, column=qty_col).value = 0
        if ws.cell(row=row, column=amount_col).data_type != "f":
            ws.cell(row=row, column=amount_col).value = 0

    other_iter = iter(other_rows)
    used_other = set()

    for service in carrier_data.get("services", []):
        code = str(service.get("code", "")).strip()
        target_row = code_rows.get(code)
        if target_row is None:
            try:
                target_row = next(other_iter)
                used_other.add(target_row)
            except StopIteration:
                continue

        ws.cell(row=target_row, column=fee_col).value = service.get("label") or "Other"
        ws.cell(row=target_row, column=code_col).value = code or ""
        ws.cell(row=target_row, column=price_col).value = float(service.get("price") or 0)
        ws.cell(row=target_row, column=qty_col).value = float(service.get("qty") or 0)
        ws.cell(row=target_row, column=valute_col).value = service.get("currency") or "EUR"
        if service.get("price"):
            write_amount_formula(ws, target_row, price_col, qty_col, amount_col)
        else:
            ws.cell(row=target_row, column=amount_col).value = float(service.get("amountOverride") or 0)

    for row in other_rows:
        if row in used_other:
            continue
        ws.cell(row=row, column=fee_col).value = "Other"
        ws.cell(row=row, column=code_col).value = ""
        ws.cell(row=row, column=price_col).value = 0
        ws.cell(row=row, column=qty_col).value = 0
        ws.cell(row=row, column=amount_col).value = 0

    booking_totals = carrier_data.get("bookings", {}).get("transactions", [])
    total_booking = sum(float(txn.get("amountEur") or 0) for txn in booking_totals)
    booking_row = find_label_row(ws, "booking")
    if booking_row:
        value_col = find_value_column(ws, booking_row, [amount_col, qty_col, price_col])
        ws.cell(row=booking_row, column=value_col).value = total_booking

    wb.save(output_path)


def export_wizz_airport(template_path, output_path, carrier_data, airport_services, adjustments_amount):
    wb = load_workbook(template_path)
    ws = wb.active

    header_row = find_header_row(ws)
    if header_row is None:
        raise RuntimeError("Missing header row in template")

    headers = build_header_map(ws, header_row)
    fee_col = headers.get("fee types", 2)
    code_col = headers.get("fees code", 3)
    charged_col = headers.get("charged", 4)
    price_col = headers.get("eur", 5)
    qty_col = headers.get("qty", 6)
    amount_col = headers.get("amount", 7)
    valute_col = headers.get("valute", 8)

    title_row = header_row - 1
    label = str(carrier_data.get("label") or "AIRLINE").strip()
    ws.cell(row=title_row, column=fee_col).value = f"1. OTHER {label} SERVICES SOLD TO THE PASSENGERS AT AIRPORT"

    rows, other_rows, code_rows = scan_service_rows(ws, fee_col, code_col, header_row)

    for row in rows:
        ws.cell(row=row, column=qty_col).value = 0
        if ws.cell(row=row, column=amount_col).data_type != "f":
            ws.cell(row=row, column=amount_col).value = 0

    other_iter = iter(other_rows)
    used_other = set()

    for service in carrier_data.get("services", []):
        code = str(service.get("code", "")).strip()
        target_row = code_rows.get(code)
        if target_row is None:
            try:
                target_row = next(other_iter)
                used_other.add(target_row)
            except StopIteration:
                continue

        ws.cell(row=target_row, column=fee_col).value = service.get("label") or "Ostalo"
        ws.cell(row=target_row, column=code_col).value = code or ""
        ws.cell(row=target_row, column=charged_col).value = service.get("unit") or ""
        ws.cell(row=target_row, column=price_col).value = float(service.get("price") or 0)
        ws.cell(row=target_row, column=qty_col).value = float(service.get("qty") or 0)
        ws.cell(row=target_row, column=valute_col).value = service.get("currency") or "EUR"
        if service.get("price"):
            write_amount_formula(ws, target_row, price_col, qty_col, amount_col)
        else:
            ws.cell(row=target_row, column=amount_col).value = float(service.get("amountOverride") or 0)

    for row in other_rows:
        if row in used_other:
            continue
        ws.cell(row=row, column=fee_col).value = "Ostalo"
        ws.cell(row=row, column=code_col).value = ""
        ws.cell(row=row, column=charged_col).value = ""
        ws.cell(row=row, column=price_col).value = 0
        ws.cell(row=row, column=qty_col).value = 0
        ws.cell(row=row, column=amount_col).value = 0

    # airport remuneration from bookings
    booking_txns = carrier_data.get("bookings", {}).get("transactions", [])
    total_airport_rem = sum(float(txn.get("airportRemunerationKm") or 0) for txn in booking_txns)
    airport_rem_row = find_label_row(ws, "airport remunerations")
    if airport_rem_row:
        value_col = find_value_column(ws, airport_rem_row, [amount_col, qty_col, price_col])
        ws.cell(row=airport_rem_row, column=value_col).value = total_airport_rem

    # bookings section
    booking_header_row = find_label_row(ws, "bookings sold")
    total_booking_row = find_label_row(ws, "total amount for")
    if booking_header_row and total_booking_row:
        start_row = booking_header_row + 1
        end_row = total_booking_row - 1
        for row in range(start_row, end_row + 1):
            ws.cell(row=row, column=fee_col).value = None
            ws.cell(row=row, column=fee_col + 1).value = None

        total_amount = sum(float(txn.get("amountEur") or 0) for txn in booking_txns)
        total_pax = sum(float(txn.get("pax") or 0) for txn in booking_txns)
        ws.cell(row=start_row, column=fee_col).value = total_amount
        ws.cell(row=start_row, column=fee_col + 1).value = total_pax

        value_col = find_value_column(ws, total_booking_row, [amount_col, qty_col, price_col])
        ws.cell(row=total_booking_row, column=value_col).value = total_amount

    commission_row = find_label_row(ws, "provizija")
    if commission_row:
        total_commission = sum(float(txn.get("commissionKm") or 0) for txn in booking_txns)
        value_col = find_value_column(ws, commission_row, [amount_col, qty_col, price_col])
        ws.cell(row=commission_row, column=value_col).value = total_commission

    # Airport services rows
    service_lookup = {item.get("id"): item for item in airport_services}

    def service_amount(service):
        price = float(service.get("price") or 0)
        qty = float(service.get("qty") or 0)
        if price:
            return price * qty
        return float(service.get("amountOverride") or 0)

    mapping = {
        "pvc zip": "airport_pvc",
        "higijenske": "airport_masks",
        "internet": "airport_internet",
        "dječija": "airport_donation",
        "dodatni aerodromski servis": "airport_total",
    }

    airport_total = 0.0
    for key in ("airport_pvc", "airport_masks", "airport_internet", "airport_donation"):
        svc = service_lookup.get(key)
        if svc:
            airport_total += service_amount(svc)

    for row in range(1, ws.max_row + 1):
        label = ws.cell(row=row, column=fee_col).value
        if not isinstance(label, str):
            continue
        lowered = label.lower()
        for marker, key in mapping.items():
            if marker in lowered:
                if key == "airport_total":
                    value_col = find_value_column(ws, row, [amount_col, qty_col, price_col])
                    ws.cell(row=row, column=value_col).value = airport_total + float(adjustments_amount or 0)
                else:
                    svc = service_lookup.get(key)
                    if not svc:
                        continue
                    if key == "airport_internet":
                        ws.cell(row=row, column=price_col - 1).value = float(svc.get("qty") or 0)
                    value_col = find_value_column(ws, row, [amount_col, qty_col, price_col])
                    ws.cell(row=row, column=value_col).value = service_amount(svc)
                break

    wb.save(output_path)


def export_general(template_path, output_path, report):
    wb = load_workbook(template_path)
    ws = wb.active

    start_row = 4
    row = start_row
    airport_services_total = sum(
        (float(item.get("qty") or 0) * float(item.get("price") or 0)) if item.get("price") else float(item.get("amountOverride") or 0)
        for item in report.get("airportServices", [])
    )
    adjustments = float(report.get("adjustmentsAmount") or 0)

    carriers = report.get("carriers") or {}
    order = report.get("carrierOrder") or list(carriers.keys())

    total_services = total_bookings = total_eur = 0.0
    total_airport_rem = total_commission = 0.0

    for carrier in order:
        carrier_data = carriers.get(carrier)
        if not carrier_data:
            continue
        label = carrier_data.get("label") or carrier
        services_eur = sum(float(s.get("qty") or 0) * float(s.get("price") or 0) if s.get("price") else float(s.get("amountOverride") or 0) for s in carrier_data.get("services", []))
        booking_txns = carrier_data.get("bookings", {}).get("transactions", [])
        bookings_eur = sum(float(txn.get("amountEur") or 0) for txn in booking_txns)
        airport_rem = sum(float(txn.get("airportRemunerationKm") or 0) for txn in booking_txns)
        commission = sum(float(txn.get("commissionKm") or 0) for txn in booking_txns)
        total = services_eur + bookings_eur

        ws.cell(row=row, column=1).value = label
        ws.cell(row=row, column=2).value = services_eur
        ws.cell(row=row, column=3).value = bookings_eur
        ws.cell(row=row, column=4).value = total
        ws.cell(row=row, column=5).value = airport_rem
        ws.cell(row=row, column=6).value = commission
        ws.cell(row=row, column=7).value = 0
        ws.cell(row=row, column=8).value = 0
        ws.cell(row=row, column=9).value = airport_rem + commission
        ws.cell(row=row, column=10).value = 0

        total_services += services_eur
        total_bookings += bookings_eur
        total_eur += total
        total_airport_rem += airport_rem
        total_commission += commission
        row += 1

    ws.cell(row=row, column=1).value = "Airport Tuzla"
    ws.cell(row=row, column=7).value = airport_services_total
    ws.cell(row=row, column=8).value = adjustments
    ws.cell(row=row, column=9).value = airport_services_total + adjustments
    row += 1

    fx_rate = float(report.get("fxRateEurToKm") or 1.95583)
    total_airport_km = total_airport_rem + total_commission + airport_services_total + adjustments
    total_km = total_eur * fx_rate + total_airport_km

    ws.cell(row=row, column=1).value = "Ukupno"
    ws.cell(row=row, column=2).value = total_services
    ws.cell(row=row, column=3).value = total_bookings
    ws.cell(row=row, column=4).value = total_eur
    ws.cell(row=row, column=5).value = total_airport_rem
    ws.cell(row=row, column=6).value = total_commission
    ws.cell(row=row, column=7).value = airport_services_total
    ws.cell(row=row, column=8).value = adjustments
    ws.cell(row=row, column=9).value = total_airport_km
    ws.cell(row=row, column=10).value = total_km

    wb.save(output_path)


def main():
    if len(sys.argv) < 5:
        print("Usage: export_naplate_monthly.py <mode> <input_json> <template_xlsx> <output_xlsx>")
        sys.exit(1)

    mode = sys.argv[1]
    input_path = Path(sys.argv[2])
    template_path = Path(sys.argv[3])
    output_path = Path(sys.argv[4])

    data = json.loads(input_path.read_text(encoding="utf-8"))
    carrier = data.get("carrier")
    report = data.get("report") or {}

    output_path.parent.mkdir(parents=True, exist_ok=True)

    if mode == "sky-speed":
        if not carrier:
            raise RuntimeError("Missing carrier for sky-speed export")
        export_sky_speed(template_path, output_path, report["carriers"][carrier])
    elif mode == "carrier-airport":
        if not carrier:
            raise RuntimeError("Missing carrier for carrier-airport export")
        export_wizz_airport(
            template_path,
            output_path,
            report["carriers"][carrier],
            report.get("airportServices", []),
            report.get("adjustmentsAmount", 0),
        )
    elif mode == "general":
        export_general(template_path, output_path, report)
    else:
        raise RuntimeError("Unknown mode")


if __name__ == "__main__":
    main()
