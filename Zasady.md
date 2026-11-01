# DALE — Zasady projektu strony WWW

Dokument roboczy dla strony internetowej DALE. Zbiera najważniejsze ustalenia z dwóch pakietów źródłowych:

- `DALE_Brandbook_v1_10/` — brandbook v1.10 (35 stron PDF, 29.10.2026) i wszystkie zatwierdzone materiały,
- `DALE_Motion_Approved_v7/` — zatwierdzone animacje logo (v7).

W razie wątpliwości rozstrzyga `DALE_Brandbook_v1_10/DALE_Brandbook_v1_10.pdf`.

> **Nowe okno / nowa sesja:** zacznij od **§16 „Stan prac”** na końcu pliku — tam jest wszystko, co już zrobiono, jak to uruchomić i co czeka na decyzję.

---

## 1. Marka w skrócie

| | |
|---|---|
| Nazwa | **DALE** |
| Opis działalności | PRODUCT DEVELOPMENT / DESIGN & ENGINEERING |
| Hasło | **FROM CONCEPT TO PRODUCTION.** |
| Tekst wprowadzający | *Independent product development for ambitious businesses. Design, engineering and implementation – connected.* |
| Osoba | Piotr Dalewski, Product Development Engineer |
| Kontakt | piotr@dale.com · https://dale.com |
| Telefon | +48 573 826 419 — **numer przykładowy, niepotwierdzony, do podmiany** |
| Język materiałów | angielski (nawigacja ma przełącznik języka „ENGLISH”) |

Charakter: inżynierski, precyzyjny, spokojny. Ciemna baza, dużo przestrzeni, produkt na pierwszym planie, jeden mocny akcent kolorystyczny.

---

## 2. Kolorystyka

### Paleta główna (sRGB)

| Nazwa | HEX | RGB | Rola |
|---|---|---|---|
| **Carbon** | `#060504` | 6 / 5 / 4 | Główna ciemna baza, tło strony |
| **Paper Grey** | `#EFEEEE` | 239 / 238 / 238 | Jasne tła i przestrzeń, sekcje opisowe |
| **Intense Lime** | `#C6FF33` | 198 / 255 / 51 | Sygnał: przyciski, elementy aktywne, wyróżnione karty, indeksy |
| **Deep Olive** | `#373008` | 55 / 48 / 8 | Kolor pomocniczy, używany oszczędnie |
| White | `#FFFFFF` | 255 / 255 / 255 | Tekst i logo na ciemnym tle |

### Kolory pomocnicze (z plików źródłowych)

| HEX | Skąd | Zastosowanie |
|---|---|---|
| `#CFD3D0` | `dale-icons.css` | Kontur ikon w stanie spoczynku (jasnoszary) |
| `#969DA1` | kod animacji | Linie konstrukcyjne w animacji Blueprint |
| ok. `#1C1D1D` | brandbook s. 06 (odczyt z podglądu) | Ciemne panele/karty na tle Carbon — **wartość przybliżona, do potwierdzenia** |

### Zasady użycia koloru

- **Lime skupia uwagę.** Ciemna i jasna baza budują kompozycję i hierarchię treści.
- **Carbon na Lime** — przyciski, elementy aktywne, wyróżnione karty.
- **Carbon na Paper Grey** — tekst podstawowy, opisy usług, informacje techniczne.
- **Light on dark** — jasne nagłówki Domus na ciemnych panelach.
- **Nie stosujemy białego tekstu na Lime.** Przy drobnym tekście na Lime używamy Carbon.
- **Nie stosujemy Lime jako koloru długich akapitów** na jasnym tle.
- Lime to sygnał — **bez przypadkowych dodatkowych akcentów**. Kolor nie zastępuje hierarchii i czytelności.
- Na wykresach Lime wyróżnia serię; samo użycie koloru nie oznacza zatwierdzenia ani wyniku oceny.
- Na zdjęciach produktu nie ma zielonego zafarbu — Lime pojawia się tylko w grafice i oznaczeniach.

### Tokeny CSS (propozycja)

```css
:root {
  --dale-carbon: #060504;
  --dale-paper: #EFEEEE;
  --dale-lime: #C6FF33;
  --dale-olive: #373008;
  --dale-white: #FFFFFF;
  --dale-icon-grey: #CFD3D0;
  --dale-line-grey: #969DA1;
  --dale-panel: #1C1D1D; /* do potwierdzenia */
}
```

---

## 3. Typografia

| Krój | Zastosowanie |
|---|---|
| **Domus Titling Extralight** | Duże hasła i nagłówki (np. FROM CONCEPT TO PRODUCTION.) |
| **Domus Titling Light** | Podpis sygnatury, nawigacja, mniejsze nagłówki, nazwy sekcji, krótkie etykiety, nazwy usług |
| **DINOT Regular** | Tekst podstawowy, opisy, informacje techniczne, dane |

- Domus to krój tytułowy — **wersaliki**.
- Nie zastępujemy krojów podobnymi.
- Hasło w zwartym układzie: interlinia ≈ stopień pisma (wzorzec: stopień 62, odstęp wierszy 62). Zwarty układ zachowujemy przy skalowaniu.
- Pliki fontów: `DALE_Brandbook_v1_10/00_FONTS/` (`DINOT.ttf`, `fonnts.com-Domus_Titling_Extralight(2).otf`, `fonnts.com-Domus_Titling_Light(1).otf`). Na potrzeby strony warto skopiować je do katalogu projektu pod prostymi nazwami i przekonwertować do WOFF2.

**Uwagi i ryzyka:**

- ⚠️ **Dostarczony DINOT nie ma pełnego zestawu polskich znaków.** Polska wersja strony wymaga odmiany z kompletem znaków lub zatwierdzonego kroju zastępczego.
- ⚠️ Fonty pochodzą od użytkownika (`fonnts.com`). **Przed publikacją trzeba sprawdzić licencję webfont** na Domus Titling i DINOT.

---

## 4. Logo

### Warianty (`DALE_Brandbook_v1_10/01_LOGO_VECTOR/`)

| Wariant | Opis | Pliki |
|---|---|---|
| **Primary Logo** | Sam znak DALE z ukośną przerwą w prawym ramieniu A | `DALE_Primary_*.svg / .pdf / _6144.png` |
| **Extended Signature** | Znak + pionowy separator + dwa wiersze PRODUCT DEVELOPMENT / DESIGN & ENGINEERING (Domus Titling Light, na krzywych) | `DALE_Extended_Signature_*.svg / .pdf / _6144.png` |

Każdy w trzech wersjach: `white_on_black`, `white_transparent` (wymaga ciemnego tła), `black_transparent`. Na stronie używamy **SVG**.

### Pole ochronne

- **2x** wokół znaku, gdzie **x = grubość górnego poziomego ramienia E**.
- Sygnatura: wspólne pole 2x obejmuje cały układ (znak, separator, oba wiersze).
- W polu ochronnym nie ma tekstu, innych znaków ani krawędzi kadru. Mierzymy od widocznego konturu, nie od brzegu pliku.

### Rozmiary minimalne (szerokość widocznego znaku)

| | Ekran min. | Ekran zalecane | Druk min. |
|---|---|---|---|
| Primary Logo | 100 px | 140 px+ | 18 mm |
| Extended Signature | 560 px | 720 px+ | 110 mm |

- Sygnatura 560 px potrzebuje ok. **604 px** miejsca z polem ochronnym. Przy mniejszej przestrzeni stosujemy **samo DALE**, a opis działalności przenosimy do treści strony.
- Mobile: Primary Logo ok. **120 px** szerokości przy widoku 390 px.
- Wyjątek: stopka e-mail (sygnatura 280 px) — tej skali nie przenosimy do innych materiałów.

### Zakazy

- Bez rozciągania, zmiany konturów, obrysów i cieni.
- Bez zmiany separatora, odstępu wierszy i wzajemnej skali elementów sygnatury. Skalujemy całą sygnaturę.
- Podpisu nie przestawiamy i nie zwiększamy interlinii.

---

## 5. Układ strony — „Product Platform B v4”

Zatwierdzony układ aplikacyjny (brandbook s. 09–12).

### Nagłówek / nawigacja (desktop)

- Tło Carbon. Po lewej **Extended Signature** (biała).
- Menu w **Domus Titling Light**, kolejność: **ABOUT · SERVICES · DEVELOPMENT PROCESS · CONTACT**.
- Na końcu przełącznik języka: ikona globusa + „ENGLISH” + strzałka, w ciemnej zaokrąglonej pigułce.
- Proporcje paska i podpisu przeniesione bez zmian z makiety.

### Hero

1. **Najpierw ilustracja** — duże pole zdjęcia produktu **bez nakładki tekstowej**, zaokrąglone narożniki, na jasnym tle (Paper Grey).
2. **Pod nią szeroki czarny podpis** (karta Carbon na pełną szerokość pola ilustracji, zaokrąglona):
   - mała etykieta `DALE / PRODUCT DEVELOPMENT`,
   - hasło **FROM CONCEPT TO PRODUCTION.** (Domus Extralight),
   - tekst wprowadzający (DINOT),
   - przycisk **LET'S TALK +** — tło Lime, tekst Carbon, kształt pigułki, „+” po prawej.

### Karty i komponenty

- Karty, zaokrąglenia i duże odstępy zgodne z makietą.
- Usługi: siatka **3 × 2** równych pól — zielony numer (01–06), nazwa w Domus Light, krótki opis w DINOT. Cienka ramka na ciemnym tle.
- Proces: **cztery etapy w osobnych wierszach** — numer, nazwa, zakres pracy, rezultat; poziome linie wspierają czytanie.
- Wyróżniona (pierwsza) karta może mieć tło Lime z tekstem Carbon.
- Indeksy/numery w kwadratowych polach Lime nad nazwami etapów lub w rogu zdjęć.

### Sekcje ciemne vs jasne

- **Ciemne (Carbon)** — prezentacja produktu, otwarcia sekcji.
- **Jasne (Paper Grey)** — opisy, zakres, informacje do porównania.
- Utrzymujemy osie wyrównania, zwarty układ i czytelne odstępy.

### Mobile

- Jedna kolumna, ten sam język wizualny.
- W nagłówku **Primary Logo (~120 px)** + ikona hamburgera. Pełną sygnaturę zastępuje sam znak.
- Ilustracja nad ciemnym podpisem; karty usług jedna pod drugą; Lime wyróżnia przycisk i pierwszą kartę.
- **Menu otwarte:** Primary Logo + „×”, mała etykieta `MENU` w Lime, pozycje w Domus Light oddzielone cienkimi liniami (kolejność jak na desktopie), pigułka języka, na dole PRODUCT DEVELOPMENT / DESIGN & ENGINEERING.
- Pole ochronne i marginesy zachowujemy również na małych ekranach.
- Wzorcowa makieta mobile: 390 × 1620 px.

---

## 6. Key Visual — Focus C3.2

Wzorzec prezentacji produktu (brandbook s. 13–14, parametry dla formatu 1600 × 1100, skalowane proporcjonalnie):

- **01 OVERVIEW** — duży widok produktu jako punkt wyjścia. Indeks: stopień 42, pole 67 × 56, zaokrąglenie 10.
- **02 DETAIL / 03 INTEGRATION** — dwa zbliżenia obok. Indeksy: stopień 34, pole 56 × 46, zaokrąglenie 9.
- Pozioma linia Lime: grubość 6. Obramowania detali Lime: grubość 3. **Zielone ramki nie zasłaniają produktu.**
- Pod spodem hasło (Domus Extralight) i karta Lime z opisem projektu.
- Nie powiększamy numerów i linii niezależnie od reszty kompozycji.

Case study na stronie: sekcje 01–06 szablonu (`09_CASE_STUDIES`) to kolejność narracji podstrony projektu — Otwarcie → Wyzwanie → Proces → Rozwiązanie → Solution Explained → Specyfikacja. Na telefonie zdjęcia detali pod widokiem głównym, kryteria i wyniki pionowo.

---

## 7. Ikony (`DALE_Brandbook_v1_10/10_ICON_SYSTEM/`)

16 zatwierdzonych ikon v12, każda w stanie Default i Hover:

01 Requirements · 02 Design / CAD · 03 Engineering · 04 3D Printing · 05 Validation · 06 Production Support · 07 Simulations · 08 Optimization · 09 Assembly · 10 Documentation · 11 Presentation · 12 Supplier Sourcing · 13 Strategy & Planning · 14 Virtual Reality · 15 Injection Mould · 16 Strategy & Goals

- Kontur `#CFD3D0`, akcent `#C6FF33`. Siatka 48 × 48, grubość 1,5. Linie wymiarowe celowo cieńsze.
- Na hover/focus zmienia się **tylko wybrany detal** na Lime — bez zmiany geometrii, grubości i pozycji.
- Na stronie: `dale-icons.css` + `dale-icons-sprite.svg`:

```html
<button class="dale-icon-trigger" aria-label="Engineering">
  <svg class="dale-icon" aria-hidden="true"><use href="dale-icons-sprite.svg#dale-03_engineering"></use></svg>
  ENGINEERING
</button>
```

- SVG musi być wewnątrz elementu `.dale-icon-trigger` (z widoczną nazwą lub `aria-label`). Hover i fokus klawiatury dają ten sam akcent; na dotyku stan aktywuje dotknięcie (`.is-active`).
- Ikony są znakami pomocniczymi — **zawsze z etykietą**, dobierane do rzeczywistego zakresu DALE.

---

## 8. Zdjęcia produktu (`12_PRODUCT_IMAGERY`, `13_STUDIO_HDRI`)

Dwa zatwierdzone kierunki, dobierane do projektu:

| Kierunek | Charakter | Zastosowanie |
|---|---|---|
| **Carbon Studio** (`A_Carbon_Studio.png`) | Ciemne tło, naturalny metal, wyraźne odbicia | Główne ujęcia produktu, otwarcia case study, prezentacja bryły |
| **Light Studio** (`B_Light_Studio.png`) | Jasne tło, miękkie światło | Konstrukcja, materiały, detale, ilustracje przy danych technicznych |

- Zdjęcia w zaokrąglonych kadrach, opcjonalnie z cienką zieloną ramką.
- W serii zdjęć zachowujemy jeden kierunek, skalę produktu i balans bieli.
- Tło renderu: `#EFEEEE` lub biel dla Light Studio, `#060504` dla Carbon Studio.
- Signal Clay **nie** został wybrany.
- ⚠️ **Obrazy AI to przykłady stylistyki, nie dokumentacja realizacji DALE.** Na stronie nie wolno przedstawiać ich jako projektów klientów.

---

## 9. Grafiki techniczne (`16_TECHNICAL_GRAPHICS`)

- Tło Carbon, białe opisy, akcent Lime, szarości pomocnicze; cienkie siatki, kontury i linie odnośników.
- Najpierw wynik lub decyzja, potem warunki porównania i źródła.
- Serie liniowe podpisane przy ostatnich punktach (bez legendy), różne znaczniki. Słupki od zera.
- Dane tabel: czarny tekst na białym tle, ciemny nagłówek.
- Ilustracja i powiększenie tego samego detalu mają wspólny numer.
- Dane w CSV i na grafikach są **wymyślone** — do podmiany.

---

## 10. Animacja (`DALE_Motion_Approved_v7/`)

**Aktywny kierunek: Blueprint to Object** z efektem Mikroimpulsy (wypalanie 1,0 s, od prawej do lewej). Lime Cut to wcześniejsza alternatywa, zachowana bez rozwoju.

| Plik | Format | Czas | Zastosowanie |
|---|---|---|---|
| `00_Header_Banner/DALE_Header_Banner_v1_1920x288.mp4` | 1920 × 288 (20:3) | 7,5 s | **Belka nagłówka strony** — gotowa do osadzenia |
| `01_Blueprint_to_Object/…_1080p.mp4` | 1920 × 1080 | 7,5 s | Pełna animacja (np. intro, sekcja hero) |
| `02_Microimpulses_Fragment/…_1080p.mp4` | 1920 × 1080 | 1,4 s | Sam efekt wypalania |
| `03_Lime_Cut/…_1080p.mp4` | 1920 × 1080 | 4,2 s | Alternatywa — nieużywana |

Kolory animacji: Carbon `#060504`, White `#FFFFFF`, Lime `#C6FF33`, linie konstrukcyjne `#969DA1`, lokalne ciepłe rozświetlenie mikroimpulsów.

Osadzenie belki (wg `DALE_Header_Embed.html`):

- `<video muted playsinline preload="metadata">` z `poster` = `DALE_Header_Banner_v1_Poster.png`.
- Kontener `width:100%; height:auto; aspect-ratio:20/3`, tło `#060504`. **Nie rozciągamy osobno w pionie ani w poziomie.**
- Wideo odtwarza się **raz** i zostaje na klatce końcowej.
- Przy `prefers-reduced-motion: reduce` — tylko statyczny poster.
- Przy 800 px szerokości belka ma 120 px wysokości, przy 600 px — 90 px. Na małej nawigacji mobilnej używamy Primary Logo.

---

## 11. Favicon (`15_FAVICON`)

Białe **D** z oryginalnego logo na tle Carbon (`#FFFFFF` / `#060504`), wycentrowane według obrysu litery. Pliki: `favicon.svg`, `favicon.ico` (16/32/48), PNG 16/32/48/64/256/512.

```html
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="icon" href="favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="favicon-256.png">
```

---

## 12. Treści — co jest przykładowe

Przed publikacją trzeba zweryfikować lub podmienić:

- numer telefonu +48 573 826 419,
- nazwy i opisy usług (robocza propozycja; każda oferta wymaga potwierdzenia rzeczywistego zakresu DALE),
- wszystkie dane liczbowe, parametry, wyniki, harmonogramy,
- ilustracje mechanizmu (koncepcja AI, nie realizacja klienta) — w materiałach oznaczane np. `ILLUSTRATIVE CONCEPT` / `CONCEPT SAMPLE`.

Wyniki liczbowe wymagają źródła, jednostki, daty i podstawy porównania.

---

## 13. Pięć zasad spójności (brandbook s. 15)

| | | |
|---|---|---|
| 01 | **Logo** | Bez rozciągania, zmiany konturów, obrysów i cieni. |
| 02 | **Signature** | Bez zmiany separatora, odstępu wierszy i wzajemnej skali elementów. |
| 03 | **Colour** | Lime jako sygnał. Bez przypadkowych dodatkowych akcentów. |
| 04 | **Type** | Domus w nagłówkach, DINOT w opisach. Bez zastępowania krojów podobnymi. |
| 05 | **Space** | Pole ochronne i marginesy zachowujemy również na małych ekranach. |

---

## 14. Strona WWW — ustalenia techniczne

- **Języki: angielski (domyślny), polski, niemiecki.** Adresy: `/about` (EN), `/pl/about`, `/de/about`. Przełącznik w nagłówku (globus) zachowuje bieżącą podstronę i zapamiętuje wybór; wejście na `/` przenosi na ostatnio wybrany język.
- Teksty wszystkich języków: `dale-web/src/i18n/en.ts`, `pl.ts`, `de.ts` (ta sama struktura). Tłumaczenia PL/DE są robocze — do sprawdzenia.
- Polskie litery ą ć ę ń ś ź ż, których brakuje w DINOT, uzupełnia Barlow (licencja OFL, krój w stylu DIN) — tylko te znaki. Domus Titling ma komplet znaków PL i DE.
- Logo i sygnatura (PRODUCT DEVELOPMENT / DESIGN & ENGINEERING) zostają po angielsku we wszystkich wersjach.
- Projekt: `dale-web/` — Vite + React + TypeScript, animacje: Motion (`motion/react`), płynne przewijanie: Lenis.
- Uruchomienie: dwuklik **`Start.bat`** (folder Piotr) = `npm run dev` → http://localhost:5173 (strona + API + panel w jednym procesie). Produkcja: `npm run build`, potem `npm start` (serwer Node, port 8080). Dopisek `?nointro` w adresie pomija intro.
- Logo na stronie jest rysowane z **tych samych konturów co animacje** (`src/brand/logoPaths.ts`, wyciągnięte z kodu Blueprint v6).

### Podstrony

| Adres | Zawartość |
|---|---|
| `/` | Hero (Product Platform B) · lista podstron · hasło · pasek CTA Lime |
| `/about` | About + Key Visual C3.2 · Engineering in the detail (odnośniki) · „Next: Services” |
| `/services` | 6 usług · Engineering toolkit (ikony) · „Next: Development process” |
| `/projects` | Lista projektów z panelu admina (pierwszy szeroki, reszta w 2 kolumnach) |
| `/projects/<adres>` | Projekt: tytuł, opis, dane (klient/rok/kategoria), okładka z wypalaniem Microimpulses, tekst, galeria |
| `/process` | 4 etapy z review gate · hasło · pasek CTA |
| `/contact` | Lime Cut → panel kontaktowy |

Przejście między podstronami: ukośna kurtyna Lime + Carbon pod nagłówkiem. Intro odtwarza się tylko przy wejściu na stronę główną. Strona wymaga serwera Node (`npm start`), bo projekty pochodzą z bazy — zwykły hosting plików statycznych już nie wystarczy.

### Mapa animacji

| Zatwierdzona animacja | Gdzie na stronie |
|---|---|
| **Blueprint to Object** (01) | Intro na cały ekran: linie konstrukcyjne → kontur Lime → wypalanie → znak płynnie przesuwa się i zmniejsza do belki nagłówka, tło Carbon rozpuszcza się w stronę. Etykiety etapów 01 Define → 04 Deliver. Pominięcie: przycisk, scroll, Esc. |
| **Header Banner** (00) | Stan końcowy intro = nagłówek z sygnaturą 560 px (desktop) lub Primary Logo (tablet/mobile). |
| **Microimpulses** (02) | Odsłanianie zdjęć produktu (hero, sekcja „Engineering in the detail”) — wypalanie od prawej do lewej z ciepłą iskrą. |
| **Lime Cut** (03) | Podstrona Contact: pole Lime z dużym znakiem Carbon, ukośne cięcie Carbon odsłania kontakt — odtwarza się po wejściu (ok. 2,7 s). Ten sam motyw w kurtynie przejść między podstronami. |

Dodatkowo: wjazd nagłówków linia po linii, rysujące się ramki Lime detali (Focus C3.2), odnośniki rysowane na zdjęciu, linia postępu procesu, hasło „From concept to production.” zapisywane słowo po słowie, hover ikon wg `dale-icons.css`. Przy `prefers-reduced-motion` intro i ruch są wyłączone.

### Panel admina (`/admin`)

- Dodawanie, edycja, usuwanie, kolejność i publikacja projektów; teksty w PL/EN/DE (brakujący język → EN → PL); okładka + galeria do 40 elementów z podpisami — zdjęcia oraz filmy MP4 (do 300 MB, maks. 10 na projekt, opcja „odtwarzaj sam, bez dźwięku, w pętli”, klatka-okładka filmu tworzona automatycznie); szkice z podglądem `?preview`.
- Konto zakłada się i hasło resetuje plikiem **`Admin.bat`** (nie ma rejestracji przez stronę ani resetu e-mailem).
- Dane: `dale-web/data/` (baza `dale.db` + zdjęcia `media/`) — **ten folder trzeba kopiować jako backup**, nie trafia do gita.
- Kod: `dale-web/server/` (Hono + SQLite wbudowany w Node + sharp), panel: `dale-web/src/admin/` (osobny plik JS, zwykły gość go nie pobiera).
- Zabezpieczenia: hasła scrypt (min. 12 znaków), sesja w ciasteczku httpOnly + SameSite=Strict + Secure (HTTPS), wygasa po 2 h bezczynności / 12 h; ochrona CSRF (token + sprawdzanie Origin); blokada po 5 błędnych hasłach na login i 10 na IP (rosnąca); zdjęcia dekodowane i zapisywane od nowa jako WebP (bez EXIF/GPS, bez SVG, maks. 25 MB / 80 MPx); filmy zapisywane strumieniowo z limitem 300 MB, sprawdzane po nagłówku MP4 (ftyp), serwowane wyłącznie jako video/mp4 z obsługą przewijania (Range); tylko czysty tekst (bez HTML); blokada nadpisania przy edycji w dwóch oknach; nagłówki CSP, HSTS, X-Frame-Options, nosniff; dziennik zdarzeń w zakładce „Konto i bezpieczeństwo”; `noindex` dla panelu i API.
- Produkcja: `npm run build` + `npm start` za reverse proxy z HTTPS (nginx/Caddy), zmienne: `PORT`, `DALE_TRUST_PROXY=1`, `DALE_ORIGINS=https://dale.com`, `DALE_DATA_DIR`.

## 15. Otwarte kwestie

- [ ] Licencja webfont dla Domus Titling i DINOT.
- [ ] Prawdziwy numer telefonu (na stronie celowo pominięty).
- [ ] Rzeczywisty zakres usług i realne zdjęcia/rendery projektów.
- [ ] Dokładna wartość koloru ciemnych paneli (ok. `#1C1D1D`).
- [ ] Czy intro ma się odtwarzać przy każdym wejściu, czy raz na sesję.
- [ ] Korekta tłumaczeń PL i DE przez osobę znającą język i branżę.
- [ ] Czy docelowo zatwierdzić krój DINOT z pełnym zestawem polskich znaków zamiast uzupełnienia Barlow.
- [ ] Hosting i domena — potrzebny serwer z Node 24 (VPS lub hosting Node), HTTPS obowiązkowy dla panelu.
- [ ] Opcjonalnie: logowanie dwuetapowe (kod z aplikacji) i automatyczny backup folderu `data/`.
- [ ] Opcjonalnie: dodatkowe pola projektu (np. tagi usług, link zewnętrzny).
- [ ] Czy strona ma sama wybierać PL/DE na podstawie języka przeglądarki odwiedzającego.
- [ ] Podpowiedź „dale.com/projects/…” w edytorze panelu ma wpisaną domenę na sztywno — poprawić po ustaleniu domeny.
- [ ] Przy hostingu za nginx: podnieść limit wysyłanego pliku (`client_max_body_size 300m`) dla filmów.

---

## 16. Stan prac (stan na 01.11.2026)

### Co jest zrobione — po kolei

1. **`Zasady.md`** — zasady marki z obu folderów (§1–13).
2. **Strona w frameworku** (`dale-web/`, Vite + React + TS + Motion + Lenis), wszystkie zatwierdzone animacje wdrożone (mapa w §14). Intro Blueprint na cały ekran płynnie kończy się w belce nagłówka.
3. **Podział na podstrony** zamiast jednej długiej strony (tabela w §14) + kurtyna Lime/Carbon przy przejściach.
4. **Języki EN / PL / DE** z działającym przełącznikiem (globus w nagłówku i w menu mobilnym), adresy `/pl/...`, `/de/...`, zapamiętywanie wyboru, Barlow uzupełnia polskie znaki w DINOT, łamanie długich niemieckich słów.
5. **`Start.bat`** — dwuklik uruchamia stronę lokalnie (przy pierwszym razie sam robi `npm install`), otwiera przeglądarkę.
6. **Panel admina `/admin`** + podstrona **Projects** (lista i strona projektu) — dodawanie/edycja/usuwanie/kolejność/publikacja projektów, teksty w 3 językach, okładka, galeria, szkice z podglądem, zakładka „Konto i bezpieczeństwo” (zmiana hasła, urządzenia, dziennik zdarzeń). Pełne zabezpieczenia — opis w §14 „Panel admina”.
7. **`Admin.bat`** — zakłada konto administratora / ustawia nowe hasło (jedyny sposób resetu hasła).
8. **Filmy MP4 w galerii projektu** — do 300 MB, pasek postępu, automatyczna klatka-okładka, opcja autoodtwarzania (bez dźwięku, w pętli, tylko gdy film jest na ekranie).

Wszystko sprawdzone w Chrome (desktop 1600/1440/1280 px i telefon 390 px), bez błędów w konsoli; build produkcyjny i `npm start` z nagłówkami CSP też sprawdzone.

### Jak zacząć po przerwie

1. **`Admin.bat`** — jeśli konto jeszcze nie istnieje, założyć je (login + hasło min. 12 znaków). **Prawdziwe konto nie zostało jeszcze założone** — testy szły na osobnej, tymczasowej bazie, `dale-web/data/` jest puste.
2. **`Start.bat`** → strona: http://localhost:5173, panel: http://localhost:5173/admin.
3. Dodać pierwsze prawdziwe projekty w panelu (bez projektów podstrona Projects pokazuje „New projects coming soon” + pasek kontaktu).

### Mapa plików

| Co | Gdzie |
|---|---|
| Uruchamianie / konto | `Start.bat`, `Admin.bat` (folder Piotr) |
| Teksty strony (3 języki) | `dale-web/src/i18n/en.ts`, `pl.ts`, `de.ts` |
| Menu, kontakt (e-mail, telefon) | `dale-web/src/site.ts` |
| Podstrony | `dale-web/src/pages/` |
| Sekcje stron | `dale-web/src/sections/` |
| Animacje (intro, wypalanie, kurtyna, wjazdy) | `dale-web/src/motion/` |
| Logo (kontury z animacji) | `dale-web/src/brand/` |
| Style strony | `dale-web/src/index.css` |
| Panel admina (widok) | `dale-web/src/admin/` (`admin.css` = style panelu) |
| Pobieranie projektów na stronie | `dale-web/src/projects/api.ts` |
| Serwer / API / zabezpieczenia | `dale-web/server/` (`app.ts` trasy, `security.ts` hasła i blokady, `projects.ts` walidacja + zdjęcia + filmy, `db.ts` baza, `cli.ts` = Admin.bat, `index.ts` = produkcja) |
| Dane (baza + zdjęcia + filmy) | `dale-web/data/` — **backup!** |
| Fonty, zdjęcia, ikony | `dale-web/public/` |

### Ważne decyzje techniczne

- Strona **wymaga serwera Node 24** (nie wystarczy hosting statyczny) — projekty są w bazie SQLite (`node:sqlite`, wbudowane w Node).
- W trybie `npm run dev` API działa wewnątrz serwera Vite (wtyczka w `vite.config.ts`) — jeden proces, jeden port.
- Zdjęcia: przetwarzane przez `sharp` na WebP w 3 rozmiarach (640/1200/2400 px). Filmy: zapisywane bez przetwarzania (brak ffmpeg) — wrzucać rozsądnie skompresowane MP4 H.264; `.mov` nie jest przyjmowany.
- Panel jest po polsku i ładuje się jako osobny plik — zwykły odwiedzający go nie pobiera.
- Zmienna `DALE_DATA_DIR` pozwala wskazać inny folder danych (np. do testów).

### Czeka na odpowiedź (lista pytań z rozmowy)

Treści i zakres usług · teksty „O nas” · prawdziwe zdjęcia/rendery · numer telefonu · formularz kontaktowy czy tylko e-mail · długość intro i czy odtwarzać raz na sesję · szybkość kurtyny przejść · siła/ilość animacji · zawartość strony głównej · automatyczny wybór języka wg przeglądarki · **hosting i domena** (od tego zależy publikacja) · licencja fontów · polityka prywatności / analityka · repozytorium git (projekt nie jest jeszcze w gicie).
