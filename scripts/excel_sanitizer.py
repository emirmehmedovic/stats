#!/usr/bin/env python3
"""
Improved Excel sanitization for all report generators
"""
import re
import unicodedata


def sanitize_text(value):
    """
    Remove ALL characters that can corrupt Excel XML.
    This includes control characters, invalid XML chars, and problematic unicode.
    """
    if value is None:
        return None
    if not isinstance(value, str):
        return value

    # Step 1: Normalize unicode (NFC normalization)
    try:
        value = unicodedata.normalize('NFC', value)
    except Exception:
        pass

    # Step 2: Remove control characters (0x00-0x1F except tab, newline, carriage return)
    # Excel allows: 0x09 (tab), 0x0A (newline), 0x0D (carriage return)
    value = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', value)

    # Step 3: Remove other problematic characters
    # 0x7F (DEL), and C1 control characters (0x80-0x9F)
    value = re.sub(r'[\x7F-\x9F]', '', value)

    # Step 4: Try openpyxl's built-in cleaner if available
    try:
        from openpyxl.utils.cell import ILLEGAL_CHARACTERS_RE
        value = ILLEGAL_CHARACTERS_RE.sub('', value)
    except Exception:
        pass

    # Step 5: Remove null bytes and other problematic chars
    value = value.replace('\x00', '').replace('\ufeff', '')  # BOM

    # Step 6: Ensure it's valid UTF-8
    try:
        value = value.encode('utf-8', errors='ignore').decode('utf-8')
    except Exception:
        pass

    return value


def sanitize_number(value):
    """Sanitize numeric values to ensure they're valid."""
    if value is None:
        return None

    # If it's already a number, return it
    if isinstance(value, (int, float)):
        # Check for NaN or Inf
        if isinstance(value, float):
            import math
            if math.isnan(value) or math.isinf(value):
                return 0
        return value

    # If it's a string that looks like a number, convert it
    if isinstance(value, str):
        try:
            # Try integer first
            return int(value)
        except ValueError:
            try:
                # Try float
                return float(value)
            except ValueError:
                # Not a number, sanitize as text
                return sanitize_text(value)

    return value


def safe_cell_value(value):
    """
    Determine the best way to sanitize a value based on its type.
    """
    if value is None:
        return None

    if isinstance(value, (int, float)):
        return sanitize_number(value)

    if isinstance(value, str):
        return sanitize_text(value)

    if isinstance(value, bool):
        return value

    # For dates/datetimes, return as-is (openpyxl handles these)
    if hasattr(value, 'strftime'):
        return value

    # For anything else, convert to string and sanitize
    return sanitize_text(str(value))
