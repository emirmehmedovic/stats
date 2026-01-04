# Lokalna statistika - Status

## Stanje
- Generator sada koristi template `izvještaji/10. LOKALNA STATISTIKA - Oktobar 2025.xlsx`.
- Layout izgleda identično screenshotima (template ostaje netaknut).
- Greške sa `MergedCell` su riješene (čišćenje opsega preskače merged ćelije).
- `V43` u "Redovni promet" se čisti (nema `#REF!`).

## Šta radi generator trenutno
- Popunjava datume i dane u "Redovni promet".
- Popunjava "Vanredni promet", "DOMESTIC FLIGHT", "Ostala slijetanja" po dnevnim podacima.
- Popunjava fakturisanje (WZZ/PGT/Ryana/TKJ) koristeći podatke iz baze.

## Šta još treba potvrditi / uraditi
Potrebne su tačne poslovne definicije da se popunjavanje uskladi 1:1 sa očekivanim:

1) **Redovni promet**
- Destinacija: da li uzimamo iz `arrival/departure` aerodroma ili iz `route`?
- Da li se kolona za destinaciju popunjava ako se pojavila u mjesecu ili samo tog dana?
- Potvrditi mapping vrijednosti:
  - Ukrcano = `departurePassengers`
  - INF = `departureInfants`
  - Iskrcano = `arrivalPassengers`
  - INF = `arrivalInfants`

2) **Vanredni promet**
- "Br. operacija" = broj movementa (arrival + departure)?
- "RUTA" = `route` iz baze ili fallback `DEP-ARR`?
- "Tip operacije" = `R/H` (SCHEDULED=R, CHARTER=H, ostalo prvo slovo)?

3) **Fakturisanje**
- Wizz: odvojeno Wizz Hungary + Wizz Malta?
- Pegasus/Ajet: samo odlazni letovi (TZL kao departure)?
- Ryanair: treba i odlazni i dolazni blok?

## Napomena
Generator je u `scripts/generate_local_stats.py`, API endpoint:
- POST `/api/reports/local/generate`
- GET `/api/reports/local/download`
