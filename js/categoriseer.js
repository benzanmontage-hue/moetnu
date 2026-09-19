// ============================================================
// MOETNU — regel-gebaseerde categoriseerder
// Zet vrije tekst ("vertel je probleem") om naar categorie,
// locatie, benodigde personen, duur en prijsindicatie.
// Slug-gebaseerd: de echte id wordt op runtime opgelost via de
// categorieën-lijst (werkt met elk id-schema in de database).
// ============================================================

(function () {
  // keyword → slug (zie categories seed)
  const KW = [
    { slug: "loodgieter", words: ["lek", "lekkage", "leiding", "kraan", "riool", "wc", "douche", "afvoer", "water", "loodgieter", "verstopping", "gas", "gaslek", "waterleiding"] },
    { slug: "elektricien", words: ["elektra", "stroom", "stopcontact", "lamp", "groepenkast", "meterkast", "bedrading", "schakelaar", "verlichting", "laadpaal", "elektricien", "aardlek", "kortsluiting", "wandcontactdoos"] },
    { slug: "verhuizen", words: ["verhuis", "transport", "verplaats", "brengen", "ophalen", "bezorgen", "koerier", "spullen", "bank", "kast naar", "tillen", "sjouwen", "meubel", "televisie", "tv", "wasmachine", "koelkast", "zolder", "kelder"] },
    { slug: "schoonmaak", words: ["schoonmaak", "schoonmaken", "poetsen", "dweilen", "stofzuigen", "ramen", "dieptereiniging", "opruimen", "glazenwassen"] },
    { slug: "tuin", words: ["tuin", "gras", "maaien", "snoeien", "heg", "onkruid", "terras", "schutting", "groen", "planten", "bladblazen", "boom"] },
    { slug: "schilderen", words: ["schilderen", "verven", "sausen", "behang", "muur verven", "lakken", "schilder"] },
    { slug: "klussen", words: ["kast", "meubel", "ikea", "ophangen", "monteren", "plank", "schilderij", "spiegel", "gordijn", "klussen", "repareren", "boren", "vastzetten", "in elkaar", "montage", "verbouwen", "gipsplaat", "vloer", "laminaat"] },
    { slug: "ict", words: ["computer", "laptop", "wifi", "internet", "printer", "it", "software", "installeren", "digitaal", "wachtwoord", "backup", "email", "slimme", "router", "netwerk"] },
    { slug: "zorg", words: ["zorg", "hulp aan huis", "boodschappen", "gezelschap", "mantelzorg", "oppas", "hond uitlaten", "dieren", "kat", "hond", "huishoudelijke hulp"] },
    { slug: "slotensmid", words: ["sleutel", "slot", "buitengesloten", "slotenmaker", "deur openen", "deur dicht", "slot vervangen", "cilinder", "inbraakpreventie", "sloten", "deur slot"] },
    { slug: "cv-monteur", words: ["cv-ketel", "cv ketel", "ketel", "verwarming", "boiler", "radiator", "warmtepomp", "cv monteur", "verwarmingsmonteur", "storing cv", "cv storing", "verwarmingsketel", "thermostaat"] },
    { slug: "dakdekker", words: ["dak", "dakdekker", "daklekkage", "dakpan", "dakbedekking", "bitumen", "dakgoot", "dakreparatie", "lekkend dak", "stormschade", "dakisolatie", "dak isolatie"] },
    { slug: "ongedierte", words: ["ongedierte", "wespen", "wespennest", "muizen", "ratten", "bedwantsen", "vlooien", "mieren", "kakkerlakken", "ongediertebestrijding", "plaagdieren", "zilvervisjes"] },
  ];

  // prijsindicatie per slug [min, max] (vóór spoedtoeslag) — reële NL-marktprijzen 2026
  const PRIJZEN = {
    loodgieter: [70, 150],
    elektricien: [70, 180],
    klussen: [40, 90],
    schoonmaak: [25, 60],
    tuin: [35, 90],
    schilderen: [60, 180],
    verhuizen: [80, 200],
    ict: [45, 90],
    zorg: [25, 60],
    slotensmid: [80, 180],
    "cv-monteur": [80, 180],
    dakdekker: [100, 300],
    ongedierte: [70, 180],
    overig: [40, 100],
  };

  // Nederlandse plaatsnamen voor locatie-detectie
  const STEDEN = [
    "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Groningen", "Tilburg",
    "Almere", "Breda", "Nijmegen", "Apeldoorn", "Arnhem", "Haarlem", "Enschede", "Amersfoort",
    "Zaanstad", "Haarlemmermeer", "Den Bosch", "Zwolle", "Leiden", "Dordrecht", "Zoetermeer",
    "Emmen", "Deventer", "Delft", "Alkmaar", "Heerlen", "Venlo", "Leeuwarden", "Maastricht",
    "Hilversum", "Amstelveen", "Purmerend", "Schiedam", "Spijkenisse", "Hoofddorp", "Vlaardingen",
    "Gouda", "Alphen aan den Rijn", "Roosendaal", "Hoorn", "Assen", "Velsen", "Ede", "Veenendaal",
    "Bergen op Zoom", "Capelle aan den IJssel", "Katwijk", "Nieuwegein", "Zeist", "Houten", "Elst",
  ];

  function detectPersonen(t) {
    if (/(twee|2)\s*(personen|man|mensen|koppels)/i.test(t)) return 2;
    if (/(drie|3)\s*(personen|man|mensen)/i.test(t)) return 3;
    return 1;
  }

  function detectDuur(t) {
    if (/(verhuis|hele woning|appartement|huis)/i.test(t)) return "2–4 uur";
    if (/(schoonmaak|poetsen|dieptereiniging|tuin|snoeien|schilderen|verven|dak)/i.test(t)) return "1–3 uur";
    return "30–60 min";
  }

  function detectLocatie(t) {
    for (const s of STEDEN) {
      if (new RegExp("\\b" + s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(t)) return s;
    }
    return null;
  }

  function categoriseer(tekst) {
    const t = " " + (tekst || "").toLowerCase() + " ";
    let slug = "overig";
    let hitWords = [];

    for (const c of KW) {
      const found = c.words.filter(w => t.includes(w.toLowerCase()));
      if (found.length > hitWords.length) {
        slug = c.slug;
        hitWords = found;
      }
    }

    const personen = detectPersonen(t);
    let [min, max] = PRIJZEN[slug] || PRIJZEN.overig;
    if (personen >= 2) { min = Math.round(min * 1.7); max = Math.round(max * 1.7); }
    if (/(verhuis|transport|bezorgen)/.test(t) && slug === "verhuizen") { min = Math.max(min, 120); }

    // resolve echte id/naam/icon via de categorieën-lijst (runtime)
    const cats = window.MOETNU_CATEGORIES || [];
    const cat = cats.find(c => c.slug === slug) || cats.find(c => c.slug === "overig");

    return {
      category_id: cat ? cat.id : 10,
      category_slug: slug,
      category_naam: cat ? cat.naam : "Overig",
      icon: cat ? cat.icon : "➕",
      personen,
      duur: detectDuur(t),
      locatie: detectLocatie(tekst),
      prijs_min: min,
      prijs_max: max,
      keywords: hitWords,
    };
  }

  window.MoetnuCategoriseer = { categoriseer, detectLocatie, detectPersonen, detectDuur };
})();
