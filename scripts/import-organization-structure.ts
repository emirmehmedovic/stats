import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rows = [
  {
    "SEKTOR": "UPRAVA",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "",
    "POZICIJA_NAZIV": "",
    "RADNIK": "Direktor Dževad Halilčević"
  },
  {
    "SEKTOR": "UPRAVA",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "",
    "POZICIJA_NAZIV": "",
    "RADNIK": "Izvršni direktor za marketing i razvoj Mirnes Vejzović"
  },
  {
    "SEKTOR": "UPRAVA",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "",
    "POZICIJA_NAZIV": "",
    "RADNIK": "Izvršni direktor za saobraćaj i tehniku Suhdin Đedović"
  },
  {
    "SEKTOR": "UPRAVA",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "",
    "POZICIJA_NAZIV": "",
    "RADNIK": "Izvršni direktor za finansije Melvin Mandalović"
  },
  {
    "SEKTOR": "UPRAVA",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "1.a.",
    "POZICIJA_NAZIV": "Sekretar-Administrator",
    "RADNIK": "Selma Mešić"
  },
  {
    "SEKTOR": "UPRAVA",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "1.b.",
    "POZICIJA_NAZIV": "Stručni saradnik za bezbjednost,sigurnost i usklađenost u zračnom saobraćaju",
    "RADNIK": "Sabina Imamović"
  },
  {
    "SEKTOR": "UPRAVA",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "1.b.",
    "POZICIJA_NAZIV": "Stručni saradnik za bezbjednost,sigurnost i usklađenost u zračnom saobraćaju",
    "RADNIK": "Kenan Idrizović"
  },
  {
    "SEKTOR": "UPRAVA",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "1.b.",
    "POZICIJA_NAZIV": "Stručni saradnik za bezbjednost,sigurnost i usklađenost u zračnom saobraćaju",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "ODJEL ZA INTERNU REVIZIJU   2.",
    "SLU\u017dBA": "Šef odjela za internu reviziju  2.0.",
    "POZICIJA_OZNAKA": "",
    "POZICIJA_NAZIV": "",
    "RADNIK": "Zinka Arapčić"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.1.1.",
    "POZICIJA_NAZIV": "Referent prodaje avio-karata i turističkih usluga",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.1.1.",
    "POZICIJA_NAZIV": "Referent prodaje avio-karata i turističkih usluga",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.1.1.",
    "POZICIJA_NAZIV": "Referent prodaje avio-karata i turističkih usluga",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.1.1.",
    "POZICIJA_NAZIV": "Referent prodaje avio-karata i turističkih usluga",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.1.1.",
    "POZICIJA_NAZIV": "Referent prodaje avio-karata i turističkih usluga",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.1.1.",
    "POZICIJA_NAZIV": "Referent prodaje avio-karata i turističkih usluga",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.1.1.",
    "POZICIJA_NAZIV": "Referent prodaje avio-karata i turističkih usluga",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.1.1.",
    "POZICIJA_NAZIV": "Referent prodaje avio-karata i turističkih usluga",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.1.1.",
    "POZICIJA_NAZIV": "Referent prodaje avio-karata i turističkih usluga",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.3.0.",
    "POZICIJA_NAZIV": "Šef službe prodaje avijacijskih i komplementarnih usluga",
    "RADNIK": "Admir Mujkanović"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.3.0.",
    "POZICIJA_NAZIV": "Šef službe prodaje avijacijskih i komplementarnih usluga",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.3.0.",
    "POZICIJA_NAZIV": "Šef službe prodaje avijacijskih i komplementarnih usluga",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.3.3.",
    "POZICIJA_NAZIV": "Parking inkasant",
    "RADNIK": "Adelisa Šabanović"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.3.3.",
    "POZICIJA_NAZIV": "Parking inkasant",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.4.",
    "POZICIJA_NAZIV": "Služba fakturisanja, naplate i statistike",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.4.",
    "POZICIJA_NAZIV": "Služba fakturisanja, naplate i statistike",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.4.2.",
    "POZICIJA_NAZIV": "Referent za fakturisanje i naplatu",
    "RADNIK": "Eladin Mehić"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.4.2.",
    "POZICIJA_NAZIV": "Referent za fakturisanje i naplatu",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.5.",
    "POZICIJA_NAZIV": "Služba nabavke",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.5.",
    "POZICIJA_NAZIV": "Služba nabavke",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.5.",
    "POZICIJA_NAZIV": "Služba nabavke",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.5.",
    "POZICIJA_NAZIV": "Služba nabavke",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.5.4.",
    "POZICIJA_NAZIV": "Referent za nabavke",
    "RADNIK": "Salko Čerkezović"
  },
  {
    "SEKTOR": "SEKTOR KOMERCIJALE   A",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "A.5.5.",
    "POZICIJA_NAZIV": "Skladištar",
    "RADNIK": "Zihnija Selimović"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.0.",
    "POZICIJA_NAZIV": "Rukovodilac sektora",
    "RADNIK": "Narcisa Arapčić"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.1.0.",
    "POZICIJA_NAZIV": "Šef službe knjigovodstva",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.1.1.",
    "POZICIJA_NAZIV": "Viši stručni saradnik za  praćenje  direktnih i indirektnih poreza",
    "RADNIK": "Merima Čerkezović"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.1.2.",
    "POZICIJA_NAZIV": "Stručni saradnik za praćenje direktnih i indirektnih poreza",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.1.3.",
    "POZICIJA_NAZIV": "Glavni knjigovođa  B.1.3.",
    "RADNIK": "Hasiba Redžić"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.1.4.",
    "POZICIJA_NAZIV": "Finansijski knjigovođa B.1.4.",
    "RADNIK": "Samir Palić"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.1.4.",
    "POZICIJA_NAZIV": "Finansijski knjigovođa B.1.4.",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.1.6.",
    "POZICIJA_NAZIV": "Referent za vođenje stalnih sredstava, sitnog alat i inventara",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.2.0.",
    "POZICIJA_NAZIV": "Šef službe finansijske operative",
    "RADNIK": "Fetiha Vejzović"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.2.1.",
    "POZICIJA_NAZIV": "Blagajnik",
    "RADNIK": "Amela Hasić"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.2.2.",
    "POZICIJA_NAZIV": "Referent za obračun plaća i drugih naknada",
    "RADNIK": "Amela Hodžić"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.2.2.",
    "POZICIJA_NAZIV": "Referent za obračun plaća i drugih naknada",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.3.",
    "POZICIJA_NAZIV": "Služba plana i analize",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.3.",
    "POZICIJA_NAZIV": "Služba plana i analize",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.3.2.",
    "POZICIJA_NAZIV": "Stručni saradnik za poslove plana i analize",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.3.3.",
    "POZICIJA_NAZIV": "Stručni saradnik za praćenje investicija",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "B.4.",
    "POZICIJA_NAZIV": "Služba za pravne, kadrovske i administrativne poslove i poslove javnih nabavki",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "Odjel za javne nabavke",
    "POZICIJA_OZNAKA": "B.4.a.2.",
    "POZICIJA_NAZIV": "Stručni saradnik za javne nabavke B.4.a.2.",
    "RADNIK": "Emina Alić"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "Odjel za javne nabavke",
    "POZICIJA_OZNAKA": "B.4.a.1.",
    "POZICIJA_NAZIV": "Viši stručni saradnik za javne nabavke B.4.a.1.",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "Odjel za administrativne i kadrovske poslove",
    "POZICIJA_OZNAKA": "",
    "POZICIJA_NAZIV": "",
    "RADNIK": "Damir Bukvarević"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "Odjel za administrativne i kadrovske poslove",
    "POZICIJA_OZNAKA": "B.4.b.2.",
    "POZICIJA_NAZIV": "Stručni saradnik za opšte,  kadrovske i obligacione poslove",
    "RADNIK": "Nermina Mujačić"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "Odjel za administrativne i kadrovske poslove",
    "POZICIJA_OZNAKA": "B.4.b.2.",
    "POZICIJA_NAZIV": "Stručni saradnik za opšte,  kadrovske i obligacione poslove",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA FINANSIJE,PRAVNE I KADROVSKE I OPŠTE POSLOVE",
    "SLU\u017dBA": "Odjel za administrativne i kadrovske poslove",
    "POZICIJA_OZNAKA": "B.4.b.3.",
    "POZICIJA_NAZIV": "Administrator-arhivar  B.4.b.3.",
    "RADNIK": "Meho Kamenjaković"
  },
  {
    "SEKTOR": "SEKTOR ZA RAZVOJ, INFORMATIČKE TEHNOLOGIJE I MARKETING",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "C.0.",
    "POZICIJA_NAZIV": "Rukovodilac sektora",
    "RADNIK": "Irena Hudić"
  },
  {
    "SEKTOR": "SEKTOR ZA RAZVOJ, INFORMATIČKE TEHNOLOGIJE I MARKETING",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "C.1.",
    "POZICIJA_NAZIV": "Služba za razvoj aerodroma",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA RAZVOJ, INFORMATIČKE TEHNOLOGIJE I MARKETING",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "C.1.",
    "POZICIJA_NAZIV": "Služba za razvoj aerodroma",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA RAZVOJ, INFORMATIČKE TEHNOLOGIJE I MARKETING",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "C.1.2.",
    "POZICIJA_NAZIV": "Stručni saradnik za praćenje investicija",
    "RADNIK": "Rialda Pajić Gluhić"
  },
  {
    "SEKTOR": "SEKTOR ZA RAZVOJ, INFORMATIČKE TEHNOLOGIJE I MARKETING",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "C.1.2.",
    "POZICIJA_NAZIV": "Stručni saradnik za praćenje investicija",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA RAZVOJ, INFORMATIČKE TEHNOLOGIJE I MARKETING",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "C.1.2.",
    "POZICIJA_NAZIV": "Stručni saradnik za praćenje investicija",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA RAZVOJ, INFORMATIČKE TEHNOLOGIJE I MARKETING",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "C.1.2.",
    "POZICIJA_NAZIV": "Stručni saradnik za praćenje investicija",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA RAZVOJ, INFORMATIČKE TEHNOLOGIJE I MARKETING",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "C.2.",
    "POZICIJA_NAZIV": "Služba za informatičke tehnologije  C.2.",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA RAZVOJ, INFORMATIČKE TEHNOLOGIJE I MARKETING",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "C.2.",
    "POZICIJA_NAZIV": "Služba za informatičke tehnologije  C.2.",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA RAZVOJ, INFORMATIČKE TEHNOLOGIJE I MARKETING",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "C.2.3.",
    "POZICIJA_NAZIV": "Tehničar za telefoniju i radio-komunikacijske uređaje",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA RAZVOJ, INFORMATIČKE TEHNOLOGIJE I MARKETING",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "C.2.3.",
    "POZICIJA_NAZIV": "Tehničar za telefoniju i radio-komunikacijske uređaje",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA RAZVOJ, INFORMATIČKE TEHNOLOGIJE I MARKETING",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "C.3.0.",
    "POZICIJA_NAZIV": "Šef službe za marketing",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA RAZVOJ, INFORMATIČKE TEHNOLOGIJE I MARKETING",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "C.3.1.",
    "POZICIJA_NAZIV": "Stručni saradnik za poslove marketinga",
    "RADNIK": "Mirela Vilić"
  },
  {
    "SEKTOR": "SEKTOR ZA RAZVOJ, INFORMATIČKE TEHNOLOGIJE I MARKETING",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "C.3.1.",
    "POZICIJA_NAZIV": "Stručni saradnik za poslove marketinga",
    "RADNIK": "Iris Pirić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.0.",
    "POZICIJA_NAZIV": "Rukovodilac sektora saobraćaja i usluga u zračnom prometu",
    "RADNIK": "Edina Šišić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.0.",
    "POZICIJA_NAZIV": "Rukovodilac sektora saobraćaja i usluga u zračnom prometu",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.1.0.",
    "POZICIJA_NAZIV": "Šef centra za obuku stručnog osoblja",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.1.0.",
    "POZICIJA_NAZIV": "Šef centra za obuku stručnog osoblja",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.1.0.",
    "POZICIJA_NAZIV": "Šef centra za obuku stručnog osoblja",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.0.",
    "POZICIJA_NAZIV": "Šef službe operativnih poslova",
    "RADNIK": "Sabina Ruščuklić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.1.",
    "POZICIJA_NAZIV": "Šef smjene saobraćaja",
    "RADNIK": "Behadir Kadrić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.1.",
    "POZICIJA_NAZIV": "Šef smjene saobraćaja",
    "RADNIK": "Azur Saletović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.1.",
    "POZICIJA_NAZIV": "Šef smjene saobraćaja",
    "RADNIK": "Mirza Ovčina"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.2.",
    "POZICIJA_NAZIV": "Dispečer saobraćaja",
    "RADNIK": "Mirza Osmanbegović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.2.",
    "POZICIJA_NAZIV": "Dispečer saobraćaja",
    "RADNIK": "Haris Tufekčić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.2.",
    "POZICIJA_NAZIV": "Dispečer saobraćaja",
    "RADNIK": "Sefer Šišić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.2.",
    "POZICIJA_NAZIV": "Dispečer saobraćaja",
    "RADNIK": "Emir Mehmedović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.3.",
    "POZICIJA_NAZIV": "Kontrolor opsluživanja",
    "RADNIK": "Emin Softić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.3.",
    "POZICIJA_NAZIV": "Kontrolor opsluživanja",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.4.",
    "POZICIJA_NAZIV": "Balanser zrakoplova",
    "RADNIK": "Jasmin Tinjić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.4.",
    "POZICIJA_NAZIV": "Balanser zrakoplova",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.5.",
    "POZICIJA_NAZIV": "Stručni saradnik cargo operative",
    "RADNIK": "Semir Bajrić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.6.",
    "POZICIJA_NAZIV": "Referent cargo operative",
    "RADNIK": "Refik Osmanović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.2.6.",
    "POZICIJA_NAZIV": "Referent cargo operative",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.3.0.",
    "POZICIJA_NAZIV": "Šef Službe prihvata i otpreme putnika",
    "RADNIK": "Aldijana Zubčević"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.3.1.",
    "POZICIJA_NAZIV": "Šef smjene Službe prihvata i otpreme putnika",
    "RADNIK": "Lejla Šaretović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.3.1.",
    "POZICIJA_NAZIV": "Šef smjene Službe prihvata i otpreme putnika",
    "RADNIK": "Seudin Trumić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "D.3.1.",
    "POZICIJA_NAZIV": "Šef smjene Službe prihvata i otpreme putnika",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za izgubljeni - nađeni prtljag   D.3.a.1.",
    "POZICIJA_OZNAKA": "",
    "POZICIJA_NAZIV": "",
    "RADNIK": "Almina Smajić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "",
    "POZICIJA_NAZIV": "",
    "RADNIK": "Mediha Husić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "",
    "POZICIJA_NAZIV": "",
    "RADNIK": "Danijela Tadić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "",
    "POZICIJA_NAZIV": "",
    "RADNIK": "Maida Alić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.2.",
    "POZICIJA_NAZIV": "Referent za registraciju putnika i prtljaga",
    "RADNIK": "Almir Nukić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.2.",
    "POZICIJA_NAZIV": "Referent za registraciju putnika i prtljaga",
    "RADNIK": "Šaban Mandalović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.2.",
    "POZICIJA_NAZIV": "Referent za registraciju putnika i prtljaga",
    "RADNIK": "Sanela Turalić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.2.",
    "POZICIJA_NAZIV": "Referent za registraciju putnika i prtljaga",
    "RADNIK": "Ema Durić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.2.",
    "POZICIJA_NAZIV": "Referent za registraciju putnika i prtljaga",
    "RADNIK": "Adelina Aljić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.2.",
    "POZICIJA_NAZIV": "Referent za registraciju putnika i prtljaga",
    "RADNIK": "Tarik Huremović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.2.",
    "POZICIJA_NAZIV": "Referent za registraciju putnika i prtljaga",
    "RADNIK": "Armin Begović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.2.",
    "POZICIJA_NAZIV": "Referent za registraciju putnika i prtljaga",
    "RADNIK": "Fahir Ahmetović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.2.",
    "POZICIJA_NAZIV": "Referent za registraciju putnika i prtljaga",
    "RADNIK": "Sinem Deniz"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.2.",
    "POZICIJA_NAZIV": "Referent za registraciju putnika i prtljaga",
    "RADNIK": "Alma Šljivić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.2.",
    "POZICIJA_NAZIV": "Referent za registraciju putnika i prtljaga",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.3.",
    "POZICIJA_NAZIV": "Referent za prihvat i otpremu putnika",
    "RADNIK": "Medina Jagodić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.3.",
    "POZICIJA_NAZIV": "Referent za prihvat i otpremu putnika",
    "RADNIK": "Armina Ramić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.3.",
    "POZICIJA_NAZIV": "Referent za prihvat i otpremu putnika",
    "RADNIK": "Erna Brčaninović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.3.",
    "POZICIJA_NAZIV": "Referent za prihvat i otpremu putnika",
    "RADNIK": "Enida Čokić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.3.",
    "POZICIJA_NAZIV": "Referent za prihvat i otpremu putnika",
    "RADNIK": "Mediha Mušanović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.3.",
    "POZICIJA_NAZIV": "Referent za prihvat i otpremu putnika",
    "RADNIK": "Nur Ćasurović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.3.",
    "POZICIJA_NAZIV": "Referent za prihvat i otpremu putnika",
    "RADNIK": "Hasan Hrustić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.3.b.3.",
    "POZICIJA_NAZIV": "Referent za prihvat i otpremu putnika",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.4.0.",
    "POZICIJA_NAZIV": "Šef službe ramp handlinga",
    "RADNIK": "Elmedin Mujčić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.4.1.",
    "POZICIJA_NAZIV": "Šef smjene u službi Ramp handlinga",
    "RADNIK": "Mensur Hadžić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.4.1.",
    "POZICIJA_NAZIV": "Šef smjene u službi Ramp handlinga",
    "RADNIK": "Amir Imamović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.4.1.",
    "POZICIJA_NAZIV": "Šef smjene u službi Ramp handlinga",
    "RADNIK": "Mirza Sejdinović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.4.2.",
    "POZICIJA_NAZIV": "Parker - signalista",
    "RADNIK": "Emir Halilović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.4.2.",
    "POZICIJA_NAZIV": "Parker - signalista",
    "RADNIK": "Amir Bjelić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Vođa odjela za registraciju putnika i prtljaga D.3.b.1.",
    "POZICIJA_OZNAKA": "D.4.2.",
    "POZICIJA_NAZIV": "Parker - signalista",
    "RADNIK": "Izet Jukić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "",
    "POZICIJA_NAZIV": "",
    "RADNIK": "Mersudin Imamović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.1.",
    "POZICIJA_NAZIV": "Rukovalac aerodromskom opremom i agregatima",
    "RADNIK": "Imšir Bošnjaković"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.2.",
    "POZICIJA_NAZIV": "Rukovalac agregatima D.4.c.2.",
    "RADNIK": "Semir Jahić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.2.",
    "POZICIJA_NAZIV": "Rukovalac agregatima D.4.c.2.",
    "RADNIK": "Edis Hasić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.2.",
    "POZICIJA_NAZIV": "Rukovalac agregatima D.4.c.2.",
    "RADNIK": "Admir Mušanović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.2.",
    "POZICIJA_NAZIV": "Rukovalac agregatima D.4.c.2.",
    "RADNIK": "Admir Sprečić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.2.",
    "POZICIJA_NAZIV": "Rukovalac agregatima D.4.c.2.",
    "RADNIK": "Elvis Mustafić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.2.",
    "POZICIJA_NAZIV": "Rukovalac agregatima D.4.c.2.",
    "RADNIK": "Armin Kukić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.2.",
    "POZICIJA_NAZIV": "Rukovalac agregatima D.4.c.2.",
    "RADNIK": "Zehudin Alić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.2.",
    "POZICIJA_NAZIV": "Rukovalac agregatima D.4.c.2.",
    "RADNIK": "Samir Dedić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.2.",
    "POZICIJA_NAZIV": "Rukovalac agregatima D.4.c.2.",
    "RADNIK": "Almir Toromanović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.2.",
    "POZICIJA_NAZIV": "Rukovalac agregatima D.4.c.2.",
    "RADNIK": "Hazim Muharemović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.2.",
    "POZICIJA_NAZIV": "Rukovalac agregatima D.4.c.2.",
    "RADNIK": "Lutvo Jukić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.2.",
    "POZICIJA_NAZIV": "Rukovalac agregatima D.4.c.2.",
    "RADNIK": "Mirzet Salihović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.3",
    "POZICIJA_NAZIV": "Rukovalac opremom za vuču / guranje zrakoplova",
    "RADNIK": "Miralem Rakovac"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.3",
    "POZICIJA_NAZIV": "Rukovalac opremom za vuču / guranje zrakoplova",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.4.",
    "POZICIJA_NAZIV": "Transportni radnik",
    "RADNIK": "Mersed Redžić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.4.",
    "POZICIJA_NAZIV": "Transportni radnik",
    "RADNIK": "Muhamed Mandalović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.4.",
    "POZICIJA_NAZIV": "Transportni radnik",
    "RADNIK": "Mirsad Trokić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.4.",
    "POZICIJA_NAZIV": "Transportni radnik",
    "RADNIK": "Selmir Kahrimanović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.4.",
    "POZICIJA_NAZIV": "Transportni radnik",
    "RADNIK": "Edin Begić"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.4.",
    "POZICIJA_NAZIV": "Transportni radnik",
    "RADNIK": "Haris Šaretović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.4.",
    "POZICIJA_NAZIV": "Transportni radnik",
    "RADNIK": "Mehdin Mahmutović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.4.",
    "POZICIJA_NAZIV": "Transportni radnik",
    "RADNIK": "Ensar Mehmedović"
  },
  {
    "SEKTOR": "SEKTOR SAOBRAĆAJA I USLUGA U ZRAČNOM SAOBRAĆAJU  D",
    "SLU\u017dBA": "Šef Odjela za održavanje i manipulaciju aerodromskom opremom i poslovima transporta i prtljaga",
    "POZICIJA_OZNAKA": "D.4.c.4.",
    "POZICIJA_NAZIV": "Transportni radnik",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "E.0.",
    "POZICIJA_NAZIV": "Rukovodilac sektora TiO",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "E.0.",
    "POZICIJA_NAZIV": "Rukovodilac sektora TiO",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "E.1.0.",
    "POZICIJA_NAZIV": "Šef službe održavanja aerodromskih sredstava",
    "RADNIK": "Ahmet Imamović"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "E.1.0.",
    "POZICIJA_NAZIV": "Šef službe održavanja aerodromskih sredstava",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "E.1.2.",
    "POZICIJA_NAZIV": "Automehaničar specijalista",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "E.1.2.",
    "POZICIJA_NAZIV": "Automehaničar specijalista",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "E.1.2.",
    "POZICIJA_NAZIV": "Automehaničar specijalista",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "E.2.0.",
    "POZICIJA_NAZIV": "Šef službe ljetnog i zimskog održavanja aerodromskih površina",
    "RADNIK": "Adnan Balkić"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "",
    "POZICIJA_NAZIV": "",
    "RADNIK": "Ivo Lučić"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "",
    "POZICIJA_NAZIV": "",
    "RADNIK": "Edin Imamović"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "",
    "POZICIJA_NAZIV": "",
    "RADNIK": "Armin Fehrić"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.2.",
    "POZICIJA_NAZIV": "Vozač-rukovalac rotacionim četkama",
    "RADNIK": "Mersudin Alibašić"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.2.",
    "POZICIJA_NAZIV": "Vozač-rukovalac rotacionim četkama",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.3.",
    "POZICIJA_NAZIV": "Vozač-rukovalac snjegobacačima",
    "RADNIK": "Damir Kalajevac"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.3.",
    "POZICIJA_NAZIV": "Vozač-rukovalac snjegobacačima",
    "RADNIK": "Alija Muharemović"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.3.",
    "POZICIJA_NAZIV": "Vozač-rukovalac snjegobacačima",
    "RADNIK": "Juso Kalajevac"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.3.",
    "POZICIJA_NAZIV": "Vozač-rukovalac snjegobacačima",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.4.",
    "POZICIJA_NAZIV": "Vozač-rukovalac odleđivačima površina",
    "RADNIK": "Fahrudin Arslanović"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.4.",
    "POZICIJA_NAZIV": "Vozač-rukovalac odleđivačima površina",
    "RADNIK": "Vlado Babić"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.4.",
    "POZICIJA_NAZIV": "Vozač-rukovalac odleđivačima površina",
    "RADNIK": "Ahmet Vehabović"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.4.",
    "POZICIJA_NAZIV": "Vozač-rukovalac odleđivačima površina",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.5.",
    "POZICIJA_NAZIV": "Transportni radnik u zimskoj službi",
    "RADNIK": "Ibrahim Alibašić"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.5.",
    "POZICIJA_NAZIV": "Transportni radnik u zimskoj službi",
    "RADNIK": "Ilija Pranjić"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.5.",
    "POZICIJA_NAZIV": "Transportni radnik u zimskoj službi",
    "RADNIK": "Jasmin Ćerimović"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.5.",
    "POZICIJA_NAZIV": "Transportni radnik u zimskoj službi",
    "RADNIK": "Mahir Poljaković"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.2.a.5.",
    "POZICIJA_NAZIV": "Transportni radnik u zimskoj službi",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela zimskog i ljetnog održavanja aerodromskih površina",
    "POZICIJA_OZNAKA": "E.3.0.",
    "POZICIJA_NAZIV": "Šef službe održavanja aerodromskih objekata i infrastrukture, elektro-postrojenja i instalacija",
    "RADNIK": "Samir Čičkušić"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Odjel za održavanje aerodromskih objekata i infrastrukture",
    "POZICIJA_OZNAKA": "E.3.a.1.",
    "POZICIJA_NAZIV": "Poslovođa  održavanja  objekata i infrastrukture",
    "RADNIK": "Emir Fejzić"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Odjel za održavanje aerodromskih objekata i infrastrukture",
    "POZICIJA_OZNAKA": "E.3.a.1.",
    "POZICIJA_NAZIV": "Poslovođa  održavanja  objekata i infrastrukture",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Odjel za održavanje aerodromskih objekata i infrastrukture",
    "POZICIJA_OZNAKA": "E.3.a.1.",
    "POZICIJA_NAZIV": "Poslovođa  održavanja  objekata i infrastrukture",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Odjel za održavanje aerodromskih objekata i infrastrukture",
    "POZICIJA_OZNAKA": "E.3.a.1.",
    "POZICIJA_NAZIV": "Poslovođa  održavanja  objekata i infrastrukture",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Odjel za održavanje aerodromskih objekata i infrastrukture",
    "POZICIJA_OZNAKA": "E.3.a.1.",
    "POZICIJA_NAZIV": "Poslovođa  održavanja  objekata i infrastrukture",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Odjel za održavanje aerodromskih objekata i infrastrukture",
    "POZICIJA_OZNAKA": "E.3.a.1.",
    "POZICIJA_NAZIV": "Poslovođa  održavanja  objekata i infrastrukture",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Odjel za održavanje aerodromskih objekata i infrastrukture",
    "POZICIJA_OZNAKA": "E.3.a.5.",
    "POZICIJA_NAZIV": "Domar",
    "RADNIK": "Avdo Kovačević"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Odjel za održavanje aerodromskih objekata i infrastrukture",
    "POZICIJA_OZNAKA": "E.3.a.5.",
    "POZICIJA_NAZIV": "Domar",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Odjel za održavanje aerodromskih objekata i infrastrukture",
    "POZICIJA_OZNAKA": "E.3.a.5.",
    "POZICIJA_NAZIV": "Domar",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Odjel za održavanje aerodromskih objekata i infrastrukture",
    "POZICIJA_OZNAKA": "E.3.a.5.",
    "POZICIJA_NAZIV": "Domar",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela za održavanje elektro-postrojenja",
    "POZICIJA_OZNAKA": "E.3.b.2.",
    "POZICIJA_NAZIV": "Električar specijalista za AGL sisteme  E.3.b.2.",
    "RADNIK": "Asmir Mahmutbegović"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela za održavanje elektro-postrojenja",
    "POZICIJA_OZNAKA": "E.3.b.2.",
    "POZICIJA_NAZIV": "Električar specijalista za AGL sisteme  E.3.b.2.",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela za održavanje elektro-postrojenja",
    "POZICIJA_OZNAKA": "E.3.b.3.",
    "POZICIJA_NAZIV": "Električar specijalista za elektro-energetska postrojenja i instalacije",
    "RADNIK": "Sanel Mušanović"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela za održavanje elektro-postrojenja",
    "POZICIJA_OZNAKA": "E.3.b.3.",
    "POZICIJA_NAZIV": "Električar specijalista za elektro-energetska postrojenja i instalacije",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela za održavanje elektro-postrojenja",
    "POZICIJA_OZNAKA": "E.3.b.3.",
    "POZICIJA_NAZIV": "Električar specijalista za elektro-energetska postrojenja i instalacije",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR TEHNIKE I ODRŽAVANJA    E.",
    "SLU\u017dBA": "Poslovođa odjela za održavanje elektro-postrojenja",
    "POZICIJA_OZNAKA": "E.3.b.3.",
    "POZICIJA_NAZIV": "Električar specijalista za elektro-energetska postrojenja i instalacije",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.0.",
    "POZICIJA_NAZIV": "Rukovodilac sektora",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.0.2.",
    "POZICIJA_NAZIV": "Referent ZNR, ZOP SZ",
    "RADNIK": "Edin Dervišević"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.0.1.",
    "POZICIJA_NAZIV": "Šef službi sigurnosti (Rukovodilac)",
    "RADNIK": "Meris Šabanović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.1.0.",
    "POZICIJA_NAZIV": "Šef službe za fizičku zaštitu",
    "RADNIK": "Muharem Srabović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.1.1.",
    "POZICIJA_NAZIV": "Šef smjene",
    "RADNIK": "Armin Dedić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.1.1.",
    "POZICIJA_NAZIV": "Šef smjene",
    "RADNIK": "Mersed Karić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.1.1.",
    "POZICIJA_NAZIV": "Šef smjene",
    "RADNIK": "Jasmin Bajrić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.1.1.",
    "POZICIJA_NAZIV": "Šef smjene",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.1.2.",
    "POZICIJA_NAZIV": "Vodeći čuvar",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.1.3.",
    "POZICIJA_NAZIV": "Čuvar",
    "RADNIK": "Mirza Malkić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.1.3.",
    "POZICIJA_NAZIV": "Čuvar",
    "RADNIK": "Nedžad Husić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.1.3.",
    "POZICIJA_NAZIV": "Čuvar",
    "RADNIK": "Elvin Alić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.1.3.",
    "POZICIJA_NAZIV": "Čuvar",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.1.3.",
    "POZICIJA_NAZIV": "Čuvar",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.1.3.",
    "POZICIJA_NAZIV": "Čuvar",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "G2",
    "POZICIJA_NAZIV": "Operator na PS i",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "G2",
    "POZICIJA_NAZIV": "Operator na PS i",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.",
    "POZICIJA_NAZIV": "Služba za tehničku zaštitu",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.1.",
    "POZICIJA_NAZIV": "Šef smjene",
    "RADNIK": "Alija Bajrić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.1.",
    "POZICIJA_NAZIV": "Šef smjene",
    "RADNIK": "Juso Glavić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.1.",
    "POZICIJA_NAZIV": "Šef smjene",
    "RADNIK": "Armin Karić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.1.",
    "POZICIJA_NAZIV": "Šef smjene",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.2.",
    "POZICIJA_NAZIV": "Vodeći KD kontrolor",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.3.",
    "POZICIJA_NAZIV": "KD kontrolor",
    "RADNIK": "Osman Suljkanović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.3.",
    "POZICIJA_NAZIV": "KD kontrolor",
    "RADNIK": "Musija Hodžić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.3.",
    "POZICIJA_NAZIV": "KD kontrolor",
    "RADNIK": "Isaid Omerović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.3.",
    "POZICIJA_NAZIV": "KD kontrolor",
    "RADNIK": "Munib Smajlović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.3.",
    "POZICIJA_NAZIV": "KD kontrolor",
    "RADNIK": "Senad Muharemović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.3.",
    "POZICIJA_NAZIV": "KD kontrolor",
    "RADNIK": "Zijad Omerović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.3.",
    "POZICIJA_NAZIV": "KD kontrolor",
    "RADNIK": "Mevludin Sakić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.3.",
    "POZICIJA_NAZIV": "KD kontrolor",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.4.",
    "POZICIJA_NAZIV": "Pomoćni KD kontrolor",
    "RADNIK": "Hazemina Karić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.4.",
    "POZICIJA_NAZIV": "Pomoćni KD kontrolor",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.5.",
    "POZICIJA_NAZIV": "Vodeći Cargo KD kontrolor",
    "RADNIK": "Ismir Bašić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.5.",
    "POZICIJA_NAZIV": "Vodeći Cargo KD kontrolor",
    "RADNIK": "Mahir Hadžić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.5.",
    "POZICIJA_NAZIV": "Vodeći Cargo KD kontrolor",
    "RADNIK": "Alija Alić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.5.",
    "POZICIJA_NAZIV": "Vodeći Cargo KD kontrolor",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.6.",
    "POZICIJA_NAZIV": "Cargo KD kontrolor",
    "RADNIK": "Kemal Noćajević"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.6.",
    "POZICIJA_NAZIV": "Cargo KD kontrolor",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.6.",
    "POZICIJA_NAZIV": "Cargo KD kontrolor",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.6.",
    "POZICIJA_NAZIV": "Cargo KD kontrolor",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.2.9.",
    "POZICIJA_NAZIV": "Operater u DNC-u",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.3.0.",
    "POZICIJA_NAZIV": "Šef službe za održavanje higijene",
    "RADNIK": "Asmira Mustafić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.3.1.",
    "POZICIJA_NAZIV": "Vođa smjene higijeničarki",
    "RADNIK": "Balkić Šaha"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.3.1.",
    "POZICIJA_NAZIV": "Vođa smjene higijeničarki",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.3.1.",
    "POZICIJA_NAZIV": "Vođa smjene higijeničarki",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.3.3.",
    "POZICIJA_NAZIV": "Higijeničar/ka",
    "RADNIK": "Munira Bojagić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.3.3.",
    "POZICIJA_NAZIV": "Higijeničar/ka",
    "RADNIK": "Damira Konjić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.3.3.",
    "POZICIJA_NAZIV": "Higijeničar/ka",
    "RADNIK": "Džemila Halilčević"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.3.3.",
    "POZICIJA_NAZIV": "Higijeničar/ka",
    "RADNIK": "Velida Kalajevac"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.3.3.",
    "POZICIJA_NAZIV": "Higijeničar/ka",
    "RADNIK": "Indira Mandalović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.3.3.",
    "POZICIJA_NAZIV": "Higijeničar/ka",
    "RADNIK": "Samanta Dropić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.3.3.",
    "POZICIJA_NAZIV": "Higijeničar/ka",
    "RADNIK": "Merima Bajrić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.3.3.",
    "POZICIJA_NAZIV": "Higijeničar/ka",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.0.",
    "POZICIJA_NAZIV": "Rukovodilac-koordinator SVJ",
    "RADNIK": "Emir Zenunović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.1.",
    "POZICIJA_NAZIV": "Komandir smjene",
    "RADNIK": "Mersudin Grbić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.1.",
    "POZICIJA_NAZIV": "Komandir smjene",
    "RADNIK": "Nadžmir Omazić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.1.",
    "POZICIJA_NAZIV": "Komandir smjene",
    "RADNIK": "Adnan Muharemagić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.1.",
    "POZICIJA_NAZIV": "Komandir smjene",
    "RADNIK": "Samir Halilović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.1.",
    "POZICIJA_NAZIV": "Komandir smjene",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.2.",
    "POZICIJA_NAZIV": "Vatrogasac-vozač",
    "RADNIK": "Edin Grbić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.2.",
    "POZICIJA_NAZIV": "Vatrogasac-vozač",
    "RADNIK": "Merfid Zulić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.2.",
    "POZICIJA_NAZIV": "Vatrogasac-vozač",
    "RADNIK": "Anđelko Meh"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.2.",
    "POZICIJA_NAZIV": "Vatrogasac-vozač",
    "RADNIK": "Elvir Imamović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.2.",
    "POZICIJA_NAZIV": "Vatrogasac-vozač",
    "RADNIK": "Ahmet Halilović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.2.",
    "POZICIJA_NAZIV": "Vatrogasac-vozač",
    "RADNIK": "Belmin Grbić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.2.",
    "POZICIJA_NAZIV": "Vatrogasac-vozač",
    "RADNIK": "Enes Subašić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.2.",
    "POZICIJA_NAZIV": "Vatrogasac-vozač",
    "RADNIK": "Anel Ahmetović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.2.",
    "POZICIJA_NAZIV": "Vatrogasac-vozač",
    "RADNIK": "Mevludin Musić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.2.",
    "POZICIJA_NAZIV": "Vatrogasac-vozač",
    "RADNIK": "NEPOPUNJENO"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.3.",
    "POZICIJA_NAZIV": "Vatrogasac",
    "RADNIK": "Sead Mustačević"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.3.",
    "POZICIJA_NAZIV": "Vatrogasac",
    "RADNIK": "Elvir Jahić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.3.",
    "POZICIJA_NAZIV": "Vatrogasac",
    "RADNIK": "Šaban Omerović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.3.",
    "POZICIJA_NAZIV": "Vatrogasac",
    "RADNIK": "Asim Nuhanović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.3.",
    "POZICIJA_NAZIV": "Vatrogasac",
    "RADNIK": "Hasan Mehmedović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.3.",
    "POZICIJA_NAZIV": "Vatrogasac",
    "RADNIK": "Senaid Salihović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.3.",
    "POZICIJA_NAZIV": "Vatrogasac",
    "RADNIK": "Suad Selimović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.3.",
    "POZICIJA_NAZIV": "Vatrogasac",
    "RADNIK": "Halil Muharemović"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.3.",
    "POZICIJA_NAZIV": "Vatrogasac",
    "RADNIK": "Enver Rizvić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.3.",
    "POZICIJA_NAZIV": "Vatrogasac",
    "RADNIK": "Ramiz Bojić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.3.",
    "POZICIJA_NAZIV": "Vatrogasac",
    "RADNIK": "Mehmed Umihanić"
  },
  {
    "SEKTOR": "SEKTOR ZA SIGURNOST I ZAŠTITU        F.",
    "SLU\u017dBA": "",
    "POZICIJA_OZNAKA": "F.4.3.",
    "POZICIJA_NAZIV": "Vatrogasac",
    "RADNIK": "NEPOPUNJENO"
  }
] as const;

const reportDate = new Date('2026-01-15T00:00:00.000Z');

const makeEmployeeNumber = (index: number) => `EMP-${String(index).padStart(3, '0')}`;
const makeEmail = (firstName: string, lastName: string) => {
  const slug = `${firstName}.${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');
  return `${slug}@tuzla-airport.ba`;
};

const codeToken = /^(?:[A-Z](?:\.\d+)*\.?|\d+(?:\.\d+)*\.?|\d+\.[a-zA-Z]\.?)$/;

const splitCode = (value: string) => {
  const cleaned = value.trim().replace(/\s+/g, ' ');
  const parts = cleaned.split(' ');
  const last = parts[parts.length - 1];
  if (codeToken.test(last)) {
    return { code: last, name: parts.slice(0, -1).join(' ') };
  }
  return { code: null, name: cleaned };
};

const splitNameFromTrailing = (value: string) => {
  const cleaned = value.trim().replace(/\s+/g, ' ');
  const parts = cleaned.split(' ');
  if (parts.length < 2) {
    return { firstName: cleaned, lastName: cleaned, position: '' };
  }
  const lastName = parts[parts.length - 1];
  const firstName = parts[parts.length - 2];
  const position = parts.slice(0, -2).join(' ');
  return { firstName, lastName, position };
};

async function main() {
  const sectorMap = new Map<string, string>();
  const serviceMap = new Map<string, string>();
  const positionMap = new Map<string, string>();

  const sectors = new Map<string, { name: string; code: string | null }>();
  const services = new Map<string, { sector: string; name: string; code: string | null }>();
  const positions = new Map<string, { sector: string; service: string | null; name: string; code: string | null }>();
  const employees: Array<{
    sector: string;
    service: string | null;
    position: string;
    firstName: string;
    lastName: string;
  }> = [];

  let currentSector = '';
  let currentService: string | null = null;

  for (const row of rows) {
    const sectorRaw = row['SEKTOR']?.trim();
    if (!sectorRaw) continue;
    const sectorSplit = splitCode(sectorRaw);
    sectors.set(sectorSplit.name, { name: sectorSplit.name, code: sectorSplit.code });

    if (sectorSplit.name !== currentSector) {
      currentSector = sectorSplit.name;
      currentService = null;
    }

    const serviceRaw = row['SLUŽBA']?.trim() || '';
    const positionRaw = row['POZICIJA_NAZIV']?.trim() || '';
    const positionCodeRaw = row['POZICIJA_OZNAKA']?.trim() || '';
    const employeeRaw = row['RADNIK']?.trim() || '';

    const hasEmployee = Boolean(employeeRaw) && employeeRaw.toUpperCase() !== 'NEPOPUNJENO';

    const isServiceFromPosition = Boolean(positionRaw)
      && /^(Služba|Sluzba|Poslovna jedinica)/i.test(positionRaw)
      && !hasEmployee;
    const isServiceFromSluzba = Boolean(serviceRaw)
      && /^(Odjel|Služba|Sluzba|Poslovna jedinica)/i.test(serviceRaw);

    let serviceName: string | null = null;
    let serviceCode: string | null = null;

    if (isServiceFromPosition) {
      const split = splitCode(positionRaw);
      serviceName = split.name;
      serviceCode = positionCodeRaw || split.code || null;
      currentService = serviceName;
    } else if (isServiceFromSluzba) {
      const split = splitCode(serviceRaw);
      serviceName = split.name;
      serviceCode = split.code || null;
      currentService = serviceName;
    } else if (currentService) {
      serviceName = currentService;
    }

    if (serviceName) {
      const key = `${sectorSplit.name}::${serviceName}`;
      if (!services.has(key)) {
        services.set(key, { sector: sectorSplit.name, name: serviceName, code: serviceCode });
      }
    }

    let positionName = '';
    let positionCode: string | null = positionCodeRaw || null;

    if (positionRaw && !isServiceFromPosition) {
      const split = splitCode(positionRaw);
      positionName = split.name;
      positionCode = positionCode || split.code || null;
    } else if (!positionRaw && serviceRaw && !isServiceFromSluzba) {
      const split = splitCode(serviceRaw);
      positionName = split.name;
      positionCode = positionCode || split.code || null;
    }

    if (!positionName && employeeRaw) {
      const parsed = splitNameFromTrailing(employeeRaw);
      if (parsed.position) {
        const split = splitCode(parsed.position);
        positionName = split.name;
        positionCode = positionCode || split.code || null;
      }
    }

    if (positionName) {
      const key = `${sectorSplit.name}::${serviceName ?? ''}::${positionName}`;
      positions.set(key, {
        sector: sectorSplit.name,
        service: serviceName,
        name: positionName,
        code: positionCode,
      });
    }

    if (hasEmployee && employeeRaw) {
      let firstName = '';
      let lastName = '';
      if (positionRaw) {
        const parts = employeeRaw.split(' ').filter(Boolean);
        lastName = parts.pop() || '';
        firstName = parts.join(' ');
      } else {
        const parsed = splitNameFromTrailing(employeeRaw);
        firstName = parsed.firstName;
        lastName = parsed.lastName;
        if (!positionName && parsed.position) {
          positionName = parsed.position;
        }
      }
      employees.push({
        sector: sectorSplit.name,
        service: serviceName,
        position: positionName || 'N/A',
        firstName: firstName || employeeRaw,
        lastName: lastName || employeeRaw,
      });
    }
  }

  for (const sector of sectors.values()) {
    const record = await prisma.sector.upsert({
      where: { name: sector.name },
      update: { code: sector.code ?? undefined, isActive: true },
      create: { name: sector.name, code: sector.code ?? null, isActive: true },
    });
    sectorMap.set(sector.name, record.id);
  }

  for (const service of services.values()) {
    const sectorId = sectorMap.get(service.sector);
    if (!sectorId) continue;
    const existing = await prisma.service.findFirst({
      where: { name: service.name, sectorId },
    });
    const record = existing
      ? await prisma.service.update({
          where: { id: existing.id },
          data: { code: service.code ?? null },
        })
      : await prisma.service.create({
          data: {
            name: service.name,
            code: service.code ?? null,
            sectorId,
          },
        });
    serviceMap.set(`${service.sector}::${service.name}`, record.id);
  }

  for (const position of positions.values()) {
    const sectorId = sectorMap.get(position.sector);
    if (!sectorId) continue;
    const serviceId = position.service
      ? serviceMap.get(`${position.sector}::${position.service}`)
      : null;

    const existing = await prisma.position.findFirst({
      where: { name: position.name, sectorId, serviceId },
    });

    const record = existing
      ? await prisma.position.update({
          where: { id: existing.id },
          data: { code: position.code ?? null },
        })
      : await prisma.position.create({
          data: {
            name: position.name,
            code: position.code ?? null,
            sectorId,
            serviceId: serviceId ?? null,
          },
        });

    positionMap.set(`${position.sector}::${position.service ?? ''}::${position.name}`, record.id);
  }

  let counter = 1;
  for (const employee of employees) {
    const sectorId = employee.sector ? sectorMap.get(employee.sector) : null;
    const serviceId = employee.service
      ? serviceMap.get(`${employee.sector}::${employee.service}`)
      : null;
    const jobPositionId = employee.position
      ? positionMap.get(`${employee.sector}::${employee.service ?? ''}::${employee.position}`)
      : null;

    const employeeNumber = makeEmployeeNumber(counter);
    const email = makeEmail(employee.firstName, employee.lastName);
    counter += 1;

    await prisma.employee.upsert({
      where: { employeeNumber },
      update: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email,
        position: employee.position,
        sectorId: sectorId ?? null,
        serviceId: serviceId ?? null,
        jobPositionId: jobPositionId ?? null,
        status: 'ACTIVE',
      },
      create: {
        employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email,
        hireDate: reportDate,
        position: employee.position,
        sectorId: sectorId ?? null,
        serviceId: serviceId ?? null,
        jobPositionId: jobPositionId ?? null,
        status: 'ACTIVE',
      },
    });
  }

  console.log(`Imported ${sectors.size} sectors, ${services.size} services, ${positions.size} positions, ${employees.length} employees.`);
}

main()
  .catch((error) => {
    console.error('Import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
