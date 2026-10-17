/* ===========================================================
   Cranenklas aardrijkskunde — databank voor de kruiswoordpuzzel
   Woorden met een omschrijving, per onderwerp. De tool gebruikt deze
   lijst bij "Voorbeelden kiezen" en voor de suggesties tijdens het typen.

   Aanpassen: een nieuw onderwerp is een nieuw blok met "name" en
   "items". Elk item is een paar [woord, omschrijving], gevolgd door
   een komma. Spaties, streepjes en accenten in een woord mogen: de
   tool haalt ze zelf weg in het raster. Meer hoeft er niet te gebeuren.
   =========================================================== */
const KRUISWOORDBANK = [
  { name: 'Water', items: [
    ['VERDAMPING', 'Water verandert door warmte in waterdamp'],
    ['CONDENSATIE', 'Waterdamp koelt af en wordt weer vloeibaar'],
    ['NEERSLAG', 'Regen, sneeuw en hagel die uit wolken vallen'],
    ['INFILTRATIE', 'Regenwater zakt de grond in'],
    ['GRONDWATER', 'Water dat in de grond zit'],
    ['RIVIER', 'Stroomt van een bron naar de zee'],
    ['GLETSJER', 'Rivier van ijs in de bergen'],
    ['OCEAAN', 'Groot zoutwatergebied tussen de continenten'],
    ['WOLK', 'Hangt in de lucht en bestaat uit druppeltjes'],
    ['BRON', 'Plek waar een rivier begint']] },
  { name: 'Gesteente', items: [
    ['GRANIET', 'Stollingsgesteente met grote korrels, gevormd onder de grond'],
    ['BASALT', 'Donker gesteente dat ontstaat uit lava'],
    ['ZANDSTEEN', 'Gesteente van aan elkaar geplakte zandkorrels'],
    ['KALKSTEEN', 'Gesteente van kalk, vaak gevormd op de zeebodem'],
    ['MARMER', 'Gesteente dat ontstaat als kalksteen onder hitte en druk verandert'],
    ['VERWERING', 'Gesteente breekt af door weer, water en planten'],
    ['EROSIE', 'Wegspoelen of wegwaaien van los materiaal'],
    ['SEDIMENT', 'Los materiaal dat wordt afgezet, zoals zand en klei'],
    ['MAGMA', 'Gesmolten gesteente onder de grond'],
    ['REGOLIET', 'Laag los materiaal boven op vast gesteente']] },
  { name: 'Platentektoniek en vulkanen', items: [
    ['EPICENTRUM', 'Plek op het aardoppervlak recht boven de haard van een aardbeving'],
    ['LAVA', 'Gesmolten gesteente op het aardoppervlak'],
    ['KRATER', 'Kom boven op een vulkaan'],
    ['BREUK', 'Scheur in de aardkorst waarlangs gesteente verschuift'],
    ['SUBDUCTIE', 'Een plaat duikt onder een andere plaat'],
    ['TSUNAMI', 'Hoge golf na een aardbeving onder zee'],
    ['SEISMOGRAAF', 'Instrument dat trillingen in de aarde meet'],
    ['VULKAAN', 'Berg waaruit lava en as komen'],
    ['MAGMAKAMER', 'Ruimte onder een vulkaan vol gesmolten gesteente'],
    ['PLAAT', 'Stuk van de aardkorst dat langzaam beweegt']] },
  { name: 'Winden en stormen', items: [
    ['PASSAAT', 'Vaste wind van de keerkringen naar de evenaar'],
    ['MOESSON', 'Wind die per seizoen van richting wisselt en regen brengt'],
    ['ORKAAN', 'Storm met windkracht 12'],
    ['ZEEBRIES', 'Wind overdag van zee naar land'],
    ['TORNADO', 'Draaiende windslurf onder een onweerswolk'],
    ['LUCHTDRUK', 'Gewicht van de lucht boven je'],
    ['BAROMETER', 'Instrument dat de luchtdruk meet'],
    ['WINDROOS', 'Tekening met de windrichtingen'],
    ['CYCLOON', 'Tropische storm boven de Indische Oceaan'],
    ['KOUDEFRONT', 'Grens waar koude lucht warme lucht wegduwt']] },
  { name: 'Provincies en hoofdsteden', items: [
    ['LEEUWARDEN', 'Hoofdstad van Friesland'],
    ['ASSEN', 'Hoofdstad van Drenthe'],
    ['ZWOLLE', 'Hoofdstad van Overijssel'],
    ['LELYSTAD', 'Hoofdstad van Flevoland'],
    ['ARNHEM', 'Hoofdstad van Gelderland'],
    ['HAARLEM', 'Hoofdstad van Noord-Holland'],
    ['MIDDELBURG', 'Hoofdstad van Zeeland'],
    ['MAASTRICHT', 'Hoofdstad van Limburg'],
    ['GRONINGEN', 'Hoofdstad van de provincie Groningen'],
    ['DENBOSCH', 'Hoofdstad van Noord-Brabant, ook wel ’s-Hertogenbosch']] }
];
