#!/bin/bash
echo "==================================="
echo "PRODUCTION ENVIRONMENT CHECK"
echo "==================================="
echo ""

echo "1. Python version:"
python3 --version
echo ""

echo "2. OS Info:"
uname -a
cat /etc/os-release 2>/dev/null || echo "No /etc/os-release file"
echo ""

echo "3. Locale settings:"
locale
echo ""

echo "4. Python packages (openpyxl):"
python3 -m pip list | grep -E "(openpyxl|et-xmlfile)" || pip3 list | grep -E "(openpyxl|et-xmlfile)"
echo ""

echo "5. Python encoding:"
python3 -c "import sys; print('Default encoding:', sys.getdefaultencoding()); print('Filesystem encoding:', sys.getfilesystemencoding())"
echo ""

echo "6. Python site-packages location:"
python3 -c "import site; print(site.getsitepackages())"
echo ""

echo "7. Test openpyxl import:"
python3 -c "import openpyxl; print('openpyxl version:', openpyxl.__version__); print('openpyxl location:', openpyxl.__file__)"
echo ""

echo "8. Check for multiple Python installations:"
which -a python3
echo ""

echo "==================================="
echo "END CHECK"
echo "==================================="
