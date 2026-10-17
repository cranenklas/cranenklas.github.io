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
    ['VERDAMPING', 'Het proces dat water omzet in waterdamp'],
    ['CONDENSATIE', 'Waterdamp koelt af en wordt weer vloeibaar'],
    ['NEERSLAG', 'Regen, sneeuw en hagel die uit wolken vallen'],
    ['INFILTRATIE', 'Regenwater zakt de grond in'],
    ['GRONDWATER', 'Water dat in de grond zit'],
    ['DIJK', 'Door de mens gemaakte langgerekte ophoging die beschermt tegen water'],
    ['GLETSJER', 'Bewegende ijsmassa die is gevormd door sneeuw die jarenlang is blijven liggen'],
    ['DAM', 'Een waterkering die dwars door een waterloop staat'],
    ['TERP', 'Door de mens gemaakte ophoging ter bescherming tegen hoog water'],
    ['BOEZEM', 'Waterlichaam dat dient om polderwater op te vangen en af te voeren']] },
  { name: 'Gesteente', items: [
    ['SEDIMENTGESTEENTE', 'Gesteente dat ontstaat uit samengeperste lagen zand, klei of kalk'],
    ['STOLLINGSGESTEENTE', 'Gesteente dat ontstaat als magma of lava stolt'],
    ['METAMORFGESTEENTE', 'Gesteente dat is veranderd door hitte en druk'],
    ['GRANIET', 'Stollingsgesteente met grote korrels, gevormd onder de grond'],
    ['MARMER', 'Gesteente dat ontstaat als kalksteen onder hitte en druk verandert'],
    ['VERWERING', 'Gesteente breekt af door weer, water en planten'],
    ['AARDKORST', 'De bovenste vaste laag van de aarde'],
    ['SEDIMENT', 'Los materiaal dat wordt afgezet, zoals zand en klei'],
    ['MAGMA', 'Gesmolten gesteente onder de grond'],
    ['REGOLIET', 'Laag los materiaal boven op vast gesteente']] },
  { name: 'Platentektoniek en vulkanen', items: [
    ['EPICENTRUM', 'Plek op het aardoppervlak recht boven de haard van een aardbeving'],
    ['LAVA', 'Gesmolten gesteente op het aardoppervlak'],
    ['KRATER', 'Opening van de vulkaan waar lava uit komt of uit kwam'],
    ['BREUK', 'Scheur in de aardkorst'],
    ['SUBDUCTIE', 'Een plaat duikt onder een andere plaat'],
    ['HYPOCENTRUM', 'De plaats waar de aardbeving ondergronds begint'],
    ['SEISMOGRAAF', 'Instrument dat trillingen in de aarde meet'],
    ['CONVERGENTIE', 'Twee aardplaten die naar elkaar toe bewegen'],
    ['MAGMAKAMER', 'Ruimte onder een vulkaan vol gesmolten gesteente'],
    ['PLAAT', 'Stuk van de aardkorst dat langzaam beweegt']] },
  { name: 'Winden en stormen', items: [
    ['PASSAAT', 'Vaste wind van de keerkringen naar de evenaar'],
    ['FÖHN', 'Warme en droge wind die aan de lijzijde van de Alpen waait'],
    ['ORKAAN', 'Storm met windkracht 12 of hoger'],
    ['ZEEBRIES', 'Wind overdag van zee naar land'],
    ['TORNADO', 'Draaiende windslurf onder een onweerswolk'],
    ['LUCHTDRUK', 'Gewicht van de lucht boven je'],
    ['BAROMETER', 'Instrument dat de luchtdruk meet'],
    ['WINDROOS', 'Voorwerp of tekening die de windrichtingen aangeeft'],
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
    ['DENBOSCH', 'Hoofdstad van Noord-Brabant, ook wel \'s-Hertogenbosch']] }
];
