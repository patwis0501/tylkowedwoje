KUPONY — SERIA I / STRONA v5
================================

Zawartość:
- index.html
- styles.css
- data.js
- initial-state.js
- app.js
- manifest.webmanifest

Najważniejsze zmiany:
- startowy stan gry został ustawiony na podstawie backupu v4 z 18.08.2026;
- zachowane są statusy 205 kuponów, cooldowny, historia, użycia, ofiary i wykorzystane numery Chaotycznego D4;
- dodano pełny panel DEMONIC I-01–I-36;
- dodano I-27 Diabelski Archiwista i I-28 Diabelska Interwencja;
- dodano pełną tabelę d100 80/15/5;
- dodano Cmentarz, licznik historycznych ofiar, Żałownika, In Blanco / ending;
- dodano zapieczętowane kontrakty;
- widok Zuzi nie pokazuje panelu MG, DEMONIC, Cmentarza ani endingów;
- usunięto Service Workera, żeby GitHub Pages nie trzymał starego cache.

WAŻNE:
PIN MG jest zapisany jedynie w postaci SHA-256 po stronie klienta. To blokada wygodnego dostępu,
a nie prawdziwe zabezpieczenie serwerowe. Osoba techniczna nadal może analizować pliki strony.

GitHub Pages:
1. Usuń stare pliki z repozytorium.
2. Wgraj zawartość tego folderu do głównego katalogu repo.
3. NIE wgrywaj starego sw.js.
4. W razie starego cache użyj twardego odświeżenia / wyczyść dane witryny.
