#!/bin/bash
echo "==================================="
echo "FIX openpyxl ON PRODUCTION"
echo "==================================="
echo ""

# Check if we're running from stats directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this from /var/www/statistika/stats directory"
    exit 1
fi

echo "Step 1: Looking for existing virtualenv..."
if [ -d "../venv" ]; then
    echo "✅ Found virtualenv at /var/www/statistika/venv"
    VENV_PATH="../venv"
elif [ -d "./venv" ]; then
    echo "✅ Found virtualenv at /var/www/statistika/stats/venv"
    VENV_PATH="./venv"
elif [ -d "../env" ]; then
    echo "✅ Found virtualenv at /var/www/statistika/env"
    VENV_PATH="../env"
else
    echo "❌ No virtualenv found."
    echo ""
    echo "OPTION 1: Create new virtualenv (RECOMMENDED)"
    echo "-------------------------------------------"
    echo "cd /var/www/statistika"
    echo "python3 -m venv venv"
    echo "source venv/bin/activate"
    echo "pip install openpyxl==3.1.5"
    echo "pip install -r stats/requirements.txt  # if exists"
    echo ""
    echo "Then update pm2 to use venv Python:"
    echo "pm2 delete statisti"
    echo "pm2 start /var/www/statistika/venv/bin/node server.js --name statisti"
    echo ""
    echo "-------------------------------------------"
    echo ""
    echo "OPTION 2: Use --break-system-packages (RISKY)"
    echo "-------------------------------------------"
    echo "sudo pip3 install openpyxl==3.1.5 --break-system-packages --upgrade"
    echo ""
    exit 1
fi

echo ""
echo "Step 2: Checking virtualenv Python version..."
"$VENV_PATH/bin/python" --version

echo ""
echo "Step 3: Checking current openpyxl version in virtualenv..."
"$VENV_PATH/bin/python" -m pip show openpyxl || echo "Not installed in venv"

echo ""
echo "Step 4: Installing openpyxl 3.1.5 in virtualenv..."
"$VENV_PATH/bin/pip" install openpyxl==3.1.5 --upgrade

echo ""
echo "Step 5: Verifying installation..."
"$VENV_PATH/bin/python" -c "import openpyxl; print('openpyxl version:', openpyxl.__version__)"

echo ""
echo "Step 6: Testing Excel creation with new version..."
"$VENV_PATH/bin/python" test_production_excel.py

echo ""
echo "==================================="
echo "✅ DONE!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Make sure pm2 uses virtualenv Python"
echo "2. Restart application: pm2 restart statisti"
echo "3. Test report generation"
echo ""
