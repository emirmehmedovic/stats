# Komande za testiranje na produkciji

## 1. Konektuj se na produkciju
```bash
ssh user@your-production-server
```

## 2. Idi u stats direktorijum
```bash
cd /var/www/statistika/stats
```

## 3. Pull najnovije promjene
```bash
git pull
```

## 4. Provjeri okruženje
```bash
bash check_production_env.sh
```

**VAŽNO:** Kopiraj cijeli output i pošalji mi ga!

---

## 5. Testiraj kreiranje Excel fajla na produkciji
```bash
python3 test_production_excel.py
```

**VAŽNO:** Kopiraj cijeli output!

---

## 6. Skini test fajlove i otvori ih na svom Mac-u

### Opcija A: Ako imaš direktan pristup fajlovima kroz web:
```
http://your-domain/izvještaji/generated/prod_test_minimal.xlsx
http://your-domain/izvještaji/generated/prod_test_styled.xlsx
```

### Opcija B: SCP sa produkcije na tvoj Mac:
```bash
# Pokreni ovo sa svog Mac-a (NE na produkciji)
scp user@production-server:/var/www/statistika/stats/izvještaji/generated/prod_test_minimal.xlsx ~/Downloads/
scp user@production-server:/var/www/statistika/stats/izvještaji/generated/prod_test_styled.xlsx ~/Downloads/
```

---

## 7. Uporedi verzije Python-a i openpyxl-a

### Na DEV-u (tvoj Mac):
```bash
python3 --version
python3 -m pip show openpyxl
```

### Na PRODUKCIJI:
```bash
python3 --version
python3 -m pip show openpyxl
# ili ako to ne radi:
pip3 show openpyxl
```

---

## 8. Ako su verzije RAZLIČITE, instaliraj istu verziju kao na dev-u

### Na produkciji:
```bash
# Prvo provjeri trenutnu verziju
python3 -m pip show openpyxl

# Ako je različita od 3.1.5, instaliraj 3.1.5
python3 -m pip install openpyxl==3.1.5 --upgrade

# Ili probaj downgrade na poznatu stabilnu verziju
python3 -m pip install openpyxl==3.0.10 --force-reinstall

# Restartuj aplikaciju
pm2 restart statisti
```

---

## 9. Ako je problem u locale/encoding settings-ima

### Provjeri locale na produkciji:
```bash
locale
```

### Ako locale nije UTF-8, setuj ga:
```bash
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

# Restartuj aplikaciju
pm2 restart statisti
```

### Da bude trajno, dodaj u ~/.bashrc ili /etc/environment:
```bash
echo 'export LC_ALL=en_US.UTF-8' >> ~/.bashrc
echo 'export LANG=en_US.UTF-8' >> ~/.bashrc
source ~/.bashrc
```

---

## 10. Testiranje specifično za BHANSA izvještaj

### Generiši BHANSA na produkciji:
```bash
cd /var/www/statistika/stats
python3 scripts/generate_bhansa_report.py 2026 1
```

### Skini generisani fajl:
```bash
# Sa tvog Mac-a:
scp user@production:/var/www/statistika/stats/izvještaji/generated/BHANSA_Januar_2026.xlsx ~/Downloads/prod_bhansa.xlsx
```

### Uporedi sa dev verzijom:
```bash
# Na dev-u (tvoj Mac):
cd /Users/emir_mw/stats
# (Provjeri da li imaš DATABASE_URL setovan)
python3 scripts/generate_bhansa_report.py 2026 1
```

Otvori oba fajla (dev i prod) i uporedi.

---

## 🎯 ŠTA TRAŽIMO:

1. **Python verzija** - Da li je ista na dev i prod?
2. **openpyxl verzija** - Da li je ista?
3. **Locale/encoding** - Da li je UTF-8 na oba?
4. **OS** - macOS vs Linux može uticati
5. **Test fajlovi** - Da li test fajlovi sa produkcije imaju corruption warning?

---

## 📝 JAVI MI:

Kopiraj i pošalji mi output od:
1. `bash check_production_env.sh`
2. `python3 test_production_excel.py`
3. Da li test fajlovi sa produkcije imaju warning kada ih otvoriš na Mac-u
4. Python i openpyxl verzije sa oba okruženja
