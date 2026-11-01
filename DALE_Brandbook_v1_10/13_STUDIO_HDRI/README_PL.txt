DALE / LIGHT STUDIO + CARBON STUDIO / HDRI v1

ZAWARTOSC
DALE_Light_Studio_8K.hdr - jasne, neutralne studio z szerokim swiatlem glownym, wypelnieniem, konturem i swiatlem gornym.
DALE_Carbon_Studio_8K.hdr - ciemne studio z mocniejszym konturem i slabszym wypelnieniem.

FORMAT
8192 x 4096 px, panorama equirectangular 2:1, pelna sfera 360 x 180 stopni.
Radiance RGBE (.hdr), scena liniowa, neutralne RGB (chromatycznosc bieli D65 / sRGB-Rec.709 przy standardowym przypisaniu). RGBE nie jest 32-bitowym float na kanal: jest wspoldzielonym wykladnikiem i trzema mantysami.
Wartosci swiatel przekraczaja 1.0. To autorskie, proceduralne sferyczne mapy oswietlenia, nie konwersja JPG/PNG ani zmierzony fotograficznie HDR. Jednostki sa wzgledne, bez kalibracji do luksow.

UZYCIE
1. Wczytaj plik .hdr jako Environment / HDRI / World, w projekcji Equirectangular (lat-long), jako dane liniowe, bez dekodowania sRGB.
2. Zacznij od mocy srodowiska 1.0 i neutralnego balansu bieli. Dopasuj ekspozycje do swojego silnika i materialow. Te wartosci nie gwarantuja identycznej jasnosci w roznych programach.
3. Obracaj mape wokol pionowej osi do uzyskania pozadanego przebiegu odbic. Swiatlo glowne i kontrowe leza po przeciwnych stronach.
4. Dodaj rzeczywiste podloze lub shadow catcher do cienia kontaktowego i osadzenia produktu. HDRI samo w sobie nie tworzy geometrii podlogi.
5. Mapa zawiera widoczne softboksy. Dla czystego kadru skieruj kamere na spokojny fragment mapy albo ustaw osobne tlo kamery: jasne dla Light Studio i grafitowe dla Carbon Studio, zachowujac HDRI dla oswietlenia i odbic.

WAZNE
Srodowiska maja odtworzyc charakter przyjetych kierunkow, nie dokladnie rekonstrukowac oswietlenie obrazow AI. Realistyczna powierzchnia aluminium, chropowatosc i kierunek szczotkowania pochodza z materialu modelu.
PNG to podglady z kompresja tonalna, nie mapy do oswietlania. Kule testowe powstaly w prostym, analitycznym tescie odbic i oswietlenia rozproszonego; nie sa testem w docelowym programie uzytkownika.
Bez zielonego zafarbu - akcenty Lime stosujemy w grafice i oznaczeniach.

OSIE ZRODLOWE
W generacji: +Y gora, +Z kierunek srodka panoramy, +X prawa strona. Wczytanie i orientacja osi zaleza od programu. Panoramy sa ciagle sferycznie; brak twardej granicy na laczeniu 0/360.

PODSTAWY FORMATU I PROJEKCJI
https://radsite.lbl.gov/radiance/refer/Notes/picture_format.html
https://docs.blender.org/manual/en/5.4/render/shader_nodes/textures/environment.html
