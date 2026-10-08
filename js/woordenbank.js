/* ===========================================================
   Cranenklas aardrijkskunde — woordenbank voor de woordzoeker
   22 onderwerpen, 763 unieke woorden en namen.
   De tool gebruikt deze lijst bij "Woorden bijvullen".

   Aanpassen: voeg een woord toe tussen aanhalingstekens, gevolgd
   door een komma. Een nieuw onderwerp is een nieuw blok met
   "onderwerp" en "woorden". Spaties, streepjes en accenten mogen:
   de tool haalt ze zelf weg in het raster.
   =========================================================== */
const WOORDENBANK = [
  {
    onderwerp: "Atlasvaardigheden",
    woorden: [
      "atlas", "breedtegraad", "coördinaten", "evenaar", "halfrond", "hoogtelijn", "kaart", "kompas",
      "legenda", "lengtegraad", "lokaal", "luchtfoto", "meridiaan", "mondiaal", "nationaal",
      "overzichtskaart", "plattegrond", "regionaal", "reliëf", "satellietbeeld", "schaal", "schaalniveau",
      "spreiding", "veldwerk", "windrichting", "windroos"
    ]
  },
  {
    onderwerp: "Landschapszones",
    woorden: [
      "biodiversiteit", "boomgrens", "ecosysteem", "grasland", "halfwoestijn", "hooggebergte",
      "landschapszone", "loofwoud", "mangrove", "naaldwoud", "oase", "oerwoud", "permafrost", "poolgebied",
      "regenwoud", "savanne", "sneeuwgrens", "steppe", "struikgewas", "taiga", "toendra", "vegetatie",
      "woestijn"
    ]
  },
  {
    onderwerp: "Klimaatgebieden op aarde",
    woorden: [
      "breedteligging", "hoogteligging", "keerkring", "klimaat", "klimaatdiagram", "klimaatgebied",
      "landklimaat", "luchtdruk", "moesson", "neerslag", "passaat", "poolcirkel", "poolklimaat",
      "regenschaduw", "regentijd", "stijgingsregen", "stuwingsregen", "subtropen", "temperatuur",
      "toendraklimaat", "tropen", "verdamping", "woestijnklimaat", "zeeklimaat", "zeestroom"
    ]
  },
  {
    onderwerp: "Bewoonbaarheid",
    woorden: [
      "akkerbouw", "bevolkingsdichtheid", "bevolkingsspreiding", "bewoonbaarheid", "bodemerosie",
      "dichtbevolkt", "drinkwater", "dunbevolkt", "groeiseizoen", "grondwater", "irrigatie", "landbouw",
      "nomaden", "ontbossing", "onvruchtbaar", "overbeweiding", "plantage", "veeteelt", "verwoestijning",
      "visserij", "vruchtbaar", "watertekort", "zwerflandbouw"
    ]
  },
  {
    onderwerp: "Culturen en bevolking",
    woorden: [
      "boeddhisme", "christendom", "cultuur", "cultuurgebied", "dialect", "erfgoed", "godsdienst",
      "hindoeïsme", "identiteit", "inheems", "islam", "jodendom", "kerk", "minderheid", "moedertaal",
      "moskee", "multicultureel", "normen", "synagoge", "taal", "tempel", "traditie", "volk", "waarden"
    ]
  },
  {
    onderwerp: "Slavernij",
    woorden: [
      "afschaffing", "driehoekshandel", "dwangarbeid", "handelspost", "herdenking", "katoen", "koffie",
      "kolonialisme", "kolonie", "kolonisatie", "marrons", "mensenhandel", "mensenrechten", "onderdrukking",
      "opstand", "plantage", "racisme", "slavenhandel", "slavenschip", "slavernij", "suikerriet",
      "uitbuiting", "vrijheid"
    ]
  },
  {
    onderwerp: "Arm en rijk",
    woorden: [
      "analfabetisme", "armoede", "armoedegrens", "basisbehoeften", "gezondheidszorg", "honger", "inkomen",
      "kinderarbeid", "kindersterfte", "koopkracht", "lagelonenland", "levensverwachting", "microkrediet",
      "noodhulp", "ondervoeding", "onderwijs", "ongelijkheid", "ontwikkelingshulp", "ontwikkelingsland",
      "rijkdom", "sloppenwijk", "welvaart", "welzijn", "werkloosheid"
    ]
  },
  {
    onderwerp: "Ontwikkeling van landen",
    woorden: [
      "alfabetisering", "analfabetisme", "bbp", "beroepsbevolking", "dienstensector", "geboortecijfer",
      "hdi", "indicator", "inkomensverdeling", "kindersterfte", "koopkracht", "levensstandaard",
      "levensverwachting", "ontwikkeling", "ontwikkelingsindex", "ontwikkelingspeil", "ranglijst",
      "scholingsgraad", "statistiek", "sterftecijfer", "voedselzekerheid", "welvaart", "welzijn",
      "zuigelingensterfte"
    ]
  },
  {
    onderwerp: "Platentektoniek en natuurrampen",
    woorden: [
      "aardbeving", "aardkern", "aardkorst", "aardmantel", "aardplaat", "aswolk", "bouwvoorschrift",
      "breuklijn", "convectiestroom", "diepzeetrog", "epicentrum", "eruptie", "evacuatie", "evacuatieroute",
      "hotspot", "hulporganisatie", "hulpverlening", "hypocentrum", "krater", "kwetsbaarheid", "lava",
      "lavastroom", "magma", "magmahaard", "naschok", "natuurramp", "noodhulp", "noodpakket", "plaatgrens",
      "platentektoniek", "preventie", "rampenplan", "risico", "risicogebied", "risicokaart", "schildvulkaan",
      "schuilplaats", "seismograaf", "slachtoffers", "stormvloedkering", "stratovulkaan", "subductie",
      "tsunami", "uitbarsting", "veerkracht", "vloedgolf", "voorbereiding", "voorspelling", "vulkaan",
      "vulkanisme", "waarschuwing", "wederopbouw"
    ]
  },
  {
    onderwerp: "Winden en stormen",
    woorden: [
      "bries", "condensatie", "corioliseffect", "cycloon", "depressie", "hogedrukgebied", "lagedrukgebied",
      "landwind", "luchtdruk", "moesson", "oog", "oogwand", "orkaan", "orkaankracht", "orkaanseizoen",
      "overstroming", "passaat", "storm", "stormvloed", "straalstroom", "tornado", "tyfoon", "verdamping",
      "vloedgolf", "wervelstorm", "westenwind", "wind", "windhoos", "windkracht", "windrichting",
      "windsnelheid", "windstilte", "windvlaag", "zeewind"
    ]
  },
  {
    onderwerp: "Vormen van bestuur en staten",
    woorden: [
      "autonomie", "deelstaat", "democratie", "dictatuur", "grens", "grondgebied", "grondwet", "hoofdstad",
      "koninkrijk", "minderheid", "natie", "natiestaat", "nationalisme", "nationaliteit",
      "onafhankelijkheid", "overheid", "parlement", "regering", "republiek", "separatisme", "soevereiniteit",
      "staat", "staatsgrens", "volk"
    ]
  },
  {
    onderwerp: "Economische ontwikkeling",
    woorden: [
      "automatisering", "beroepsbevolking", "delfstof", "dienstensector", "economie", "export", "grondstof",
      "import", "industrialisatie", "industrie", "infrastructuur", "innovatie", "investering",
      "kenniseconomie", "landbouw", "mijnbouw", "multinational", "productie", "technologie", "toerisme",
      "vestigingsfactor", "welvaart", "werkgelegenheid", "werkloosheid"
    ]
  },
  {
    onderwerp: "Klimaten en landschappen",
    woorden: [
      "aanlandig", "aflandig", "bergketen", "breedteligging", "continentaal", "cultuurlandschap",
      "depressie", "droogte", "duinen", "fjord", "gletsjer", "golfstroom", "heide", "heuvelland",
      "hittegolf", "hogedrukgebied", "hooggebergte", "hoogteligging", "hoogvlakte", "klimaatdiagram",
      "laagland", "laagvlakte", "lagedrukgebied", "landklimaat", "landschap", "loofbos", "maritiem",
      "mediterraan", "middelgebergte", "naaldbos", "natuurlandschap", "neerslag", "plooiingsgebergte",
      "polder", "poolklimaat", "regenschaduw", "rivierdal", "schiereiland", "stuwingsregen", "taiga",
      "temperatuur", "terrassenbouw", "toendra", "toendraklimaat", "veengebied", "wadden", "weiland",
      "westenwind", "zeeklimaat"
    ]
  },
  {
    onderwerp: "Klimaatverandering",
    woorden: [
      "adaptatie", "broeikaseffect", "broeikasgas", "droogte", "duurzaamheid", "energietransitie",
      "gletsjer", "hittegolf", "ijskap", "klimaatakkoord", "klimaatverandering", "klimaatvluchteling",
      "koolstofdioxide", "methaan", "mitigatie", "ontbossing", "opwarming", "overstroming", "permafrost",
      "smeltwater", "uitstoot", "voetafdruk", "weersextremen", "windenergie", "zeespiegelstijging",
      "zonne-energie", "zonnepaneel"
    ]
  },
  {
    onderwerp: "(sub)urbanisatie",
    woorden: [
      "achterstandswijk", "agglomeratie", "alleenstaand", "appartement", "armoede", "bedrijventerrein",
      "bereikbaarheid", "bevolkingsdichtheid", "bevolkingskrimp", "bevolkingsopbouw", "bewoner",
      "binnenstad", "bouwjaar", "buitengebied", "buurt", "buurtprofiel", "centrumfunctie", "discriminatie",
      "doorstroming", "dorp", "drempelwaarde", "eengezinswoning", "energielabel", "forens", "galerijflat",
      "gentrificatie", "gepensioneerd", "getto", "gezin", "glastuinbouw", "groeikern", "herkomst",
      "herstructurering", "hoekwoning", "hoogbouw", "huishouden", "huurwoning", "inkomen",
      "inkomensverschil", "integratie", "inwonertal", "jongeren", "kansarm", "kansenongelijkheid",
      "kansrijk", "koopwoning", "krimpgebied", "laagbouw", "landbouwgrond", "landelijk", "leefbaarheid",
      "leeftijdsopbouw", "leegloop", "leegstand", "luchtvervuiling", "metropool", "migratie",
      "miljoenenstad", "nationaliteit", "nieuwbouw", "ongelijkheid", "ontgroening", "opleidingsniveau",
      "ouderen", "overbevolking", "platteland", "portiekflat", "probleemwijk", "pullfactor", "pushfactor",
      "recreatie", "reikwijdte", "renovatie", "rijkdom", "rijtjeshuis", "segregatie", "sloppenwijk", "stad",
      "stadsgewest", "stadsrand", "stadsvernieuwing", "stedelijk", "suburbanisatie", "tussenwoning",
      "tweedeling", "uitkering", "uitsluiting", "urbanisatie", "urbanisatiegraad", "veiligheid",
      "verdringing", "vergrijzing", "verhuizing", "verloedering", "verstedelijking", "verzorgingsgebied",
      "voorzieningen", "vrijstaand", "weiland", "welvaartsverschil", "wereldstad", "werkloosheid",
      "wolkenkrabber", "woning", "woningcorporatie", "woningdichtheid", "woningnood", "woningwaarde",
      "woonduur", "woonomgeving", "woonoppervlak", "woonwijk"
    ]
  },
  {
    onderwerp: "Bevolkingsgroei",
    woorden: [
      "arbeidsmigrant", "asielzoeker", "babyboom", "bevolking", "bevolkingsdichtheid", "bevolkingsgroei",
      "bevolkingskrimp", "bevolkingspiramide", "bevolkingsspreiding", "demografie", "emigratie",
      "geboortecijfer", "geboorteoverschot", "gezinsplanning", "immigratie", "leeftijdsdiagram",
      "levensverwachting", "migratie", "migratiesaldo", "ontgroening", "overbevolking", "sterftecijfer",
      "sterfteoverschot", "vergrijzing", "vertrekoverschot", "vestigingsoverschot", "vluchteling"
    ]
  },
  {
    onderwerp: "Globalisering en ontwikkeling",
    woorden: [
      "afhankelijkheid", "arbeidsverdeling", "concurrentie", "containerschip", "export", "fairtrade",
      "globalisering", "grondstof", "halffabricaat", "handelsblok", "handelsverdrag", "import",
      "investering", "invoerrecht", "lagelonenland", "mainport", "multinational", "ontwikkelingshulp",
      "periferie", "productieketen", "uitbesteding", "verwesterlijking", "vrijhandel", "wereldeconomie",
      "wereldhandel", "wereldmarkt"
    ]
  },
  {
    onderwerp: "Water",
    woorden: [
      "afvoer", "benedenloop", "bodemvocht", "bovenloop", "bron", "condensatie", "delta", "drinkwater",
      "gletsjer", "grondwater", "ijskap", "infiltratie", "meander", "meer", "monding", "neerslag", "oceaan",
      "oppervlaktewater", "rivier", "smeltwater", "stroomgebied", "verdamping", "waterdamp",
      "waterkringloop", "waterscheiding", "zee", "zeewater", "zijrivier"
    ]
  },
  {
    onderwerp: "Gesteente",
    woorden: [
      "afzetting", "andesiet", "basalt", "cementatie", "compactie", "conglomeraat", "erosie", "gabbro",
      "gesteente", "gesteentecyclus", "gneis", "graniet", "intrusie", "kalksteen", "kwartsiet", "leisteen",
      "magma", "marmer", "metamorfose", "mineraal", "regoliet", "rhyoliet", "schalie", "schist", "sediment",
      "sedimentatie", "steenkool", "stollingsgesteente", "verwering", "zandsteen"
    ]
  },
  {
    onderwerp: "Landen van de wereld",
    woorden: [
      "Afghanistan", "Albanië", "Algerije", "Andorra", "Angola", "Antigua en Barbuda", "Argentinië",
      "Armenië", "Australië", "Azerbeidzjan", "Bahama's", "Bahrein", "Bangladesh", "Barbados", "Belarus",
      "België", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnië en Herzegovina", "Botswana", "Brazilië",
      "Brunei", "Bulgarije", "Burkina Faso", "Burundi", "Cambodja", "Canada",
      "Centraal-Afrikaanse Republiek", "Chili", "China", "Colombia", "Comoren", "Congo-Brazzaville",
      "Congo-Kinshasa", "Costa Rica", "Cuba", "Cyprus", "Denemarken", "Djibouti", "Dominica",
      "Dominicaanse Republiek", "Duitsland", "Ecuador", "Egypte", "El Salvador", "Equatoriaal-Guinea",
      "Eritrea", "Estland", "Eswatini", "Ethiopië", "Fiji", "Filipijnen", "Finland", "Frankrijk", "Gabon",
      "Gambia", "Georgië", "Ghana", "Grenada", "Griekenland", "Guatemala", "Guinee", "Guinee-Bissau",
      "Guyana", "Haïti", "Honduras", "Hongarije", "Ierland", "IJsland", "India", "Indonesië", "Irak", "Iran",
      "Israël", "Italië", "Ivoorkust", "Jamaica", "Japan", "Jemen", "Jordanië", "Kaapverdië", "Kameroen",
      "Kazachstan", "Kenia", "Kirgizië", "Kiribati", "Koeweit", "Kroatië", "Laos", "Lesotho", "Letland",
      "Libanon", "Liberia", "Libië", "Liechtenstein", "Litouwen", "Luxemburg", "Madagaskar", "Malawi",
      "Maldiven", "Maleisië", "Mali", "Malta", "Marokko", "Marshalleilanden", "Mauritanië", "Mauritius",
      "Mexico", "Micronesia", "Moldavië", "Monaco", "Mongolië", "Montenegro", "Mozambique", "Myanmar",
      "Namibië", "Nauru", "Nederland", "Nepal", "Nicaragua", "Nieuw-Zeeland", "Niger", "Nigeria",
      "Noord-Korea", "Noord-Macedonië", "Noorwegen", "Oeganda", "Oekraïne", "Oezbekistan", "Oman",
      "Oostenrijk", "Oost-Timor", "Pakistan", "Palau", "Panama", "Papoea-Nieuw-Guinea", "Paraguay", "Peru",
      "Polen", "Portugal", "Qatar", "Roemenië", "Rusland", "Rwanda", "Saint Kitts en Nevis", "Saint Lucia",
      "Saint Vincent en de Grenadines", "Salomonseilanden", "Samoa", "San Marino", "Saoedi-Arabië",
      "Sao Tomé en Principe", "Senegal", "Servië", "Seychellen", "Sierra Leone", "Singapore", "Slovenië",
      "Slowakije", "Soedan", "Somalië", "Spanje", "Sri Lanka", "Suriname", "Syrië", "Tadzjikistan",
      "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad en Tobago", "Tsjaad", "Tsjechië", "Tunesië",
      "Turkije", "Turkmenistan", "Tuvalu", "Uruguay", "Vanuatu", "Venezuela", "Verenigde Arabische Emiraten",
      "Verenigde Staten", "Verenigd Koninkrijk", "Vietnam", "Zambia", "Zimbabwe", "Zuid-Afrika",
      "Zuid-Korea", "Zuid-Soedan", "Zweden", "Zwitserland"
    ]
  },
  {
    onderwerp: "Landen in Europa",
    woorden: [
      "Albanië", "Andorra", "Belarus", "België", "Bosnië en Herzegovina", "Bulgarije", "Cyprus",
      "Denemarken", "Duitsland", "Estland", "Finland", "Frankrijk", "Griekenland", "Hongarije", "Ierland",
      "IJsland", "Italië", "Kosovo", "Kroatië", "Letland", "Liechtenstein", "Litouwen", "Luxemburg", "Malta",
      "Moldavië", "Monaco", "Montenegro", "Nederland", "Noord-Macedonië", "Noorwegen", "Oekraïne",
      "Oostenrijk", "Polen", "Portugal", "Roemenië", "Rusland", "San Marino", "Servië", "Slovenië",
      "Slowakije", "Spanje", "Tsjechië", "Turkije", "Vaticaanstad", "Verenigd Koninkrijk", "Zweden",
      "Zwitserland"
    ]
  },
  {
    onderwerp: "Provincies en hoofdsteden Nederland",
    woorden: [
      "Amsterdam", "Arnhem", "Assen", "Den Haag", "Drenthe", "Flevoland", "Friesland", "Gelderland",
      "Groningen", "Haarlem", "Leeuwarden", "Lelystad", "Limburg", "Maastricht", "Middelburg",
      "Noord-Brabant", "Noord-Holland", "Overijssel", "'s-Hertogenbosch", "Utrecht", "Zeeland",
      "Zuid-Holland", "Zwolle"
    ]
  }
];
