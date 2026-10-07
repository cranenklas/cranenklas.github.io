// ===========================================================
// Cranenklas aardrijkskunde — inhoud van de uitlegpagina
// "De gesteentecyclus" (aarde/de-gesteentecyclus-uitleg.html).
// Wordt gelezen door js/uitleg.js, het algemene script voor alle
// uitlegpagina's. Elke sleutel in "onderdelen" hoort bij een
// element met data-k="<sleutel>" in de tekening of rechts.
//
// Per onderdeel:
//   titel, soort, tekst   kop, regel erboven en uitleg (tekst mag <br> bevatten)
//   voorbeelden           (optioneel) fotovakken. foto = bestandsnaam in
//                         fotoMap; leeg = leeg vak. maker en licentie komen
//                         onder de foto, als link naar bron. Alt-tekst:
//                         "Foto van <naam>".
//                         Verwachte namen: de naam in kleine letters + .jpg,
//                         bv. graniet.jpg, conglomeraat.jpg, kwartsiet.jpg.
//   reeksTitel, reeksIntro, reeksen
//                         (optioneel) keuzeknoppen met een reeks stappen.
//                         Per reeks: knop, tekst, stappen [naam, kenmerk,
//                         extra]. splitsing: true = de eerste stap splitst
//                         in de andere. schaal: [links, rechts] = balk
//                         onder de stappen.
// ===========================================================
window.UITLEG = {
  start: "stolling",
  fotoMap: "../img/gesteenten/",
  onderdelen: {
    korst: {
      titel: "Continentale korst",
      soort: "Tussenstation",
      tekst: "De vaste buitenlaag van de aarde onder de continenten. Gesteente dat hier aan het oppervlak ligt, staat bloot aan weer en wind. Daar begint de cyclus opnieuw."
    },
    regoliet: {
      titel: "Regoliet",
      soort: "Tussenstation",
      tekst: "Regoliet is de laag los materiaal die op het vaste gesteente ligt. Het bestaat vaak uit verweerd gesteente. Op aarde zijn er drie soorten. Zit er organisch materiaal in, zoals plantenresten of wortels, dan heet het een bodem. Is het materiaal pas kort geleden vervoerd en groeit er nog niets in, dan heet het alluvium of colluvium. Alluvium is door water afgezet, colluvium ligt onderaan een helling. Is het gesteente door chemische verwering losgemaakt en op zijn plek blijven liggen, dan heet het saproliet."
    },
    sediment: {
      titel: "Sediment",
      soort: "Tussenstation",
      tekst: "Sediment bestaat uit los materiaal dat door water, wind of ijs is vervoerd en ergens is neergelegd. Er zijn drie soorten. Klastisch sediment bestaat uit brokstukken van gesteente, zoals grind, zand en klei. Organisch sediment bestaat uit resten van planten en dieren, zoals veen. Chemisch neergeslagen sediment ontstaat uit stoffen die in water zijn opgelost, waarna het water verdampt. De materialen die eerst opgelost waren, vormen dan vaste kristallen die naar de bodem zakken. Zo ontstaat steenzout in een opdrogend meer en kalk op de bodem van een warme zee."
    },
    magma: {
      titel: "Magma",
      soort: "Tussenstation",
      tekst: "Gesmolten gesteente diep in de aarde. Het stijgt op door breuken in ouder gesteente. Komt het aan het oppervlak, dan heet het lava."
    },
    stolling: {
      titel: "Stollingsgesteente",
      soort: "Gesteenteklasse",
      tekst: "Ontstaat als magma afkoelt en stolt. Onder de grond koelt het langzaam af en groeien de kristallen groot. Aan het oppervlak koelt het snel af en blijven de kristallen klein.",
      voorbeelden: [
        { naam: "Graniet", kenmerk: "diep gestold, grofkorrelig", foto: "graniet.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/granite:nmnhmineralsciences_1204768" },
        { naam: "Gabbro", kenmerk: "diep gestold, donker", foto: "gabbro.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/gabbro:nmnhmineralsciences_1337538" },
        { naam: "Basalt", kenmerk: "lava, fijnkorrelig en donker", foto: "basalt.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/basalt:nmnhmineralsciences_1325067" },
        { naam: "Rhyoliet", kenmerk: "lava, licht van kleur", foto: "rhyoliet.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/rhyolite:nmnhmineralsciences_1325561" },
        { naam: "Andesiet", kenmerk: "lava, tussenvorm", foto: "andesiet.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/andesite:nmnhmineralsciences_1211544" }
      ],
      reeksTitel: "Zelfde magma, ander gesteente",
      reeksIntro: "Welk gesteente ontstaat, hangt af van de soort magma en van de plek waar het stolt. Kies een soort magma.",
      reeksen: [
        {
          knop: "Felsisch magma",
          tekst: "Felsisch magma is rijk aan kwarts en veldspaat. Het gesteente is licht van kleur.",
          splitsing: true,
          stappen: [
            ["Felsisch magma", "licht, veel kwarts", ""],
            ["Graniet", "stolt diep en langzaam: grote kristallen", ""],
            ["Rhyoliet", "stolt aan het oppervlak en snel: kleine kristallen", ""]
          ]
        },
        {
          knop: "Intermediair magma",
          tekst: "Intermediair magma zit qua samenstelling tussen felsisch en mafisch in.",
          splitsing: true,
          stappen: [
            ["Intermediair magma", "tussenvorm", ""],
            ["Dioriet", "stolt diep en langzaam: grote kristallen", ""],
            ["Andesiet", "stolt aan het oppervlak en snel: kleine kristallen", ""]
          ]
        },
        {
          knop: "Mafisch magma",
          tekst: "Mafisch magma is rijk aan magnesium en ijzer. Het gesteente is donker en zwaar.",
          splitsing: true,
          stappen: [
            ["Mafisch magma", "donker, veel ijzer", ""],
            ["Gabbro", "stolt diep en langzaam: grote kristallen", ""],
            ["Basalt", "stolt aan het oppervlak en snel: kleine kristallen", ""]
          ]
        }
      ]
    },
    sedimentair: {
      titel: "Sedimentair gesteente",
      soort: "Gesteenteklasse",
      tekst: "Sedimentair gesteente ontstaat als lagen sediment worden samengeperst. Je herkent het vaak aan de gelaagdheid. Dit is het type gesteente waarin je fossielen vindt. Een dood dier vergaat normaal gesproken snel of wordt opgegeten. Als het dier snel onder zand of modder verdwijnt, bijvoorbeeld in een rivier, op een zeebodem of tijdens een landverschuiving, blijven de harde delen bewaard. Laag na laag sediment komt eroverheen. Het sediment en de botten verstenen, bij lage temperatuur en zonder dat het gesteente vervormt. Bij de andere twee klassen kan dat niet.<br><br>Stollingsgesteente ontstaat uit magma en daarin verbrandt of smelt elk overblijfsel. Metamorf gesteente is zo sterk verhit en samengeperst dat fossielen worden vervormd of verdwijnen. Een enkele keer vind je nog een vervormd fossiel in licht omgevormd gesteente, of een afdruk in vulkanische as. Vrijwel alle fossielen komen dus uit sedimentair gesteente.",
      voorbeelden: [
        { naam: "Zandsteen", kenmerk: "zandkorrels, aaneengekit", foto: "zandsteen.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/sandstone:nmnhmineralsciences_1353349" },
        { naam: "Conglomeraat", kenmerk: "afgeronde kiezels in fijner materiaal", foto: "conglomeraat.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/sedimentary-rock-conglomerate:nmnheducation_10025197" },
        { naam: "Schalie", kenmerk: "klei, breekt in dunne plaatjes", foto: "schalie.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/shale:nmnhmineralsciences_1324806" },
        { naam: "Kalksteen", kenmerk: "chemisch neergeslagen kalk", foto: "kalksteen.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/limestone:nmnhmineralsciences_1324776" },
        { naam: "Steenkool", kenmerk: "samengeperste plantenresten", foto: "steenkool.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/sedimentary-rock-bituminous-coal:nmnheducation_10024916" }
      ],
      reeksTitel: "Van sediment naar gesteente",
      reeksIntro: "Het soort sediment bepaalt welk gesteente ontstaat. Kies een sediment.",
      reeksen: [
        {
          knop: "Plantenresten",
          tekst: "In een moeras verteren plantenresten niet. Hoe dieper ze begraven raken, hoe meer water en gas eruit verdwijnt en hoe meer koolstof overblijft. Antraciet wordt soms al tot de metamorfe gesteenten gerekend.",
          schaal: ["minder", "dieper begraven"],
          stappen: [
            ["Veen", "plantenresten in een moeras", ""],
            ["Bruinkool", "zacht en bruin", "tot ca. 1,5 km diep"],
            ["Steenkool", "hard en zwart", "ca. 1 tot 5 km diep"],
            ["Antraciet", "glanzend, bijna pure koolstof", "dieper dan ca. 5 km"]
          ]
        },
        {
          knop: "Grind",
          tekst: "Grove, afgeronde stenen worden door fijner materiaal aan elkaar gekit.",
          stappen: [
            ["Grind", "korrels groter dan 2 mm", ""],
            ["Conglomeraat", "kiezels in een fijnere massa", ""]
          ]
        },
        {
          knop: "Zand",
          tekst: "Zandkorrels, meestal kwarts, worden samengeperst en aan elkaar gekit.",
          stappen: [
            ["Zand", "korrels van 0,06 tot 2 mm", ""],
            ["Zandsteen", "korrels voelbaar, vaak gelaagd", ""]
          ]
        },
        {
          knop: "Klei",
          tekst: "De fijnste deeltjes bezinken alleen in stilstaand water. Samengeperst vormen ze dunne laagjes.",
          stappen: [
            ["Klei", "de fijnste korrels, niet los te zien", ""],
            ["Schalie", "breekt in dunne, vlakke plaatjes", ""]
          ]
        }
      ]
    },
    metamorf: {
      titel: "Metamorf gesteente",
      soort: "Gesteenteklasse",
      tekst: "Ontstaat als bestaand gesteente diep in de aarde door hitte en druk verandert, zonder te smelten. De mineralen groeien opnieuw of worden andere mineralen. Vaak zie je banden of een glans.",
      voorbeelden: [
        { naam: "Leisteen", kenmerk: "uit schalie, splijt in platen", foto: "leisteen.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/slate:nmnhmineralsciences_1325040" },
        { naam: "Schist", kenmerk: "uit schalie, glinsterende glimmers", foto: "schist.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/schist:nmnhmineralsciences_1325145" },
        { naam: "Gneis", kenmerk: "lichte en donkere banden", foto: "gneis.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/gneiss:nmnhmineralsciences_1325517" },
        { naam: "Kwartsiet", kenmerk: "uit zandsteen, zeer hard", foto: "kwartsiet.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/quartzite:nmnhmineralsciences_1321676" },
        { naam: "Marmer", kenmerk: "uit kalksteen", foto: "marmer.jpg", maker: "Smithsonian, National Museum of Natural History", licentie: "CC0", bron: "https://www.si.edu/object/marble:nmnhmineralsciences_1321942" }
      ],
      reeksTitel: "Metamorfose in stappen",
      reeksIntro: "Hoe heter en hoe hoger de druk, hoe verder een gesteente verandert. Kies een uitgangsgesteente.",
      reeksen: [
        {
          knop: "Schalie",
          tekst: "Schalie is fijnkorrelig gesteente van klei. Bij stijgende temperatuur groeien de glimmers stap voor stap.",
          schaal: ["minder", "meer hitte en druk"],
          stappen: [
            ["Schalie", "uitgangsgesteente", ""],
            ["Leisteen", "splijt in harde, vlakke platen", "ca. 150 tot 300 °C"],
            ["Fylliet", "zijdeachtige glans", "ca. 300 tot 450 °C"],
            ["Schist", "glimmers met het blote oog zichtbaar", "ca. 450 tot 550 °C"],
            ["Gneis", "lichte en donkere banden", "boven ca. 550 °C"]
          ]
        },
        {
          knop: "Kalksteen",
          tekst: "Kalksteen bestaat uit calciet. Er ontstaan geen nieuwe mineralen, de kristallen worden alleen groter.",
          stappen: [
            ["Kalksteen", "uitgangsgesteente", ""],
            ["Marmer", "grotere kristallen, lagen en fossielen verdwijnen", ""]
          ]
        },
        {
          knop: "Zandsteen",
          tekst: "Zandsteen bestaat vooral uit kwarts. De korrels groeien aan elkaar vast.",
          stappen: [
            ["Zandsteen", "uitgangsgesteente", ""],
            ["Kwartsiet", "korrels vergroeid, breekt dwars door de korrels", ""]
          ]
        }
      ]
    },
    "p-verwering": {
      titel: "Verwering",
      soort: "Proces",
      tekst: "Verwering is het uiteenvallen van gesteente op de plek waar het ligt. Dat gebeurt met elk gesteente aan het oppervlak, ook met gestolde lava op een vulkaan. Bij mechanische verwering breekt het in kleinere stukken, bijvoorbeeld doordat water in scheuren bevriest en uitzet. Bij chemische verwering verandert de samenstelling, bijvoorbeeld doordat regenwater mineralen oplost. Wat overblijft is regoliet."
    },
    "p-erosie": {
      titel: "Erosie en afzetting",
      soort: "Proces",
      tekst: "Erosie is het losmaken en meenemen van verweerd materiaal door stromend water, wind of ijs. Dat is het verschil met verwering: bij erosie wordt het materiaal verplaatst. Waar de stroming afneemt, zakt het materiaal naar de bodem. Dat heet afzetting of sedimentatie. Grove deeltjes blijven het eerst liggen, fijne deeltjes komen het verst."
    },
    "p-begraving": {
      titel: "Begraving en cementatie",
      soort: "Proces",
      tekst: "Nieuwe lagen sediment bedekken de oude: dat is begraving. Het gewicht perst de korrels dichter op elkaar en drukt het water eruit. In het water dat achterblijft zitten opgeloste mineralen, zoals kalk of kwarts. Die kristalliseren in de ruimtes tussen de korrels en werken als lijm: dat is cementatie. Zo wordt los sediment hard gesteente."
    },
    "p-metamorfose": {
      titel: "Metamorfose",
      soort: "Proces",
      tekst: "Metamorfose betekent letterlijk gedaanteverandering. Diep in de aarde, vooral bij gebergtevorming, staat gesteente bloot aan hoge temperatuur en druk. Het smelt niet, maar de mineralen groeien opnieuw of veranderen in andere mineralen. Daardoor krijgt het gesteente een nieuwe structuur, vaak met banden of plaatjes. Dit kan zowel sedimentair gesteente als stollingsgesteente overkomen."
    },
    "p-smelten": {
      titel: "Smelten",
      soort: "Proces",
      tekst: "Hoe dieper in de aarde, hoe heter het is. Wordt gesteente heet genoeg, dan smelt het geheel of voor een deel. Het gesmolten gesteente heet magma. Magma is lichter dan het vaste gesteente eromheen en stijgt daardoor op."
    },
    "p-intrusie": {
      titel: "Intrusie en vulkanisme",
      soort: "Proces",
      tekst: "Magma stijgt op door breuken in de aardkorst. Blijft het onderweg steken en stolt het onder de grond, dan heet dat intrusie. Het koelt daar langzaam af, waardoor grote kristallen groeien, zoals in graniet. Bereikt het magma het oppervlak, dan heet dat vulkanisme en noemen we het lava. Lava koelt snel af en vormt gesteente met kleine kristallen, zoals basalt."
    },
    "p-opheffing": {
      titel: "Tektonische opheffing",
      soort: "Proces",
      tekst: "De platen van de aardkorst bewegen en botsen. Daarbij wordt gesteente dat diep lag langzaam omhooggeduwd, bijvoorbeeld in een gebergte. Tegelijk haalt erosie de lagen erboven weg. Zo komt gesteente dat kilometers diep is gevormd toch aan het oppervlak te liggen. Dit kan met alle drie de gesteenteklassen gebeuren."
    }
  }
};
