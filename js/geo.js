// ============================================================
// MOETNU — geolocatie & afstanden (NL steden)
// Haversine-afstand + radius-matching voor fase 3.
// ============================================================

(function () {
  // [lat, lng] voor de belangrijkste Nederlandse steden
  const NL_GEO = {
    "Amsterdam": [52.3676, 4.9041],
    "Rotterdam": [51.9225, 4.4792],
    "Den Haag": [52.0705, 4.3007],
    "Utrecht": [52.0907, 5.1214],
    "Eindhoven": [51.4416, 5.4697],
    "Groningen": [53.2194, 6.5665],
    "Tilburg": [51.5606, 5.0919],
    "Almere": [52.3508, 5.2647],
    "Breda": [51.5719, 4.7683],
    "Nijmegen": [51.8425, 5.8528],
    "Apeldoorn": [52.2112, 5.9699],
    "Arnhem": [51.9851, 5.8987],
    "Haarlem": [52.3874, 4.6462],
    "Enschede": [52.2215, 6.8937],
    "Amersfoort": [52.1561, 5.3878],
    "Zaanstad": [52.4579, 4.7510],
    "Haarlemmermeer": [52.3004, 4.6740],
    "Den Bosch": [51.6978, 5.3037],
    "Zwolle": [52.5168, 6.0830],
    "Leiden": [52.1601, 4.4970],
    "Dordrecht": [51.8133, 4.6901],
    "Zoetermeer": [52.0607, 4.4931],
    "Emmen": [52.7858, 6.8970],
    "Deventer": [52.2661, 6.1552],
    "Delft": [52.0116, 4.3571],
    "Alkmaar": [52.6324, 4.7534],
    "Heerlen": [50.8882, 5.9795],
    "Venlo": [51.3704, 6.1724],
    "Leeuwarden": [53.2012, 5.7999],
    "Maastricht": [50.8514, 5.6910],
    "Hilversum": [52.2292, 5.1669],
    "Amstelveen": [52.3114, 4.8701],
    "Purmerend": [52.5030, 4.9592],
    "Schiedam": [51.9194, 4.3981],
    "Hoofddorp": [52.3061, 4.6907],
    "Vlaardingen": [51.9121, 4.3417],
    "Gouda": [52.0116, 4.7108],
    "Alphen aan den Rijn": [52.1293, 4.6557],
    "Roosendaal": [51.5358, 4.4653],
    "Hoorn": [52.6533, 5.0738],
    "Assen": [52.9928, 6.5642],
    "Ede": [52.0402, 5.6649],
    "Veenendaal": [52.0286, 5.5586],
    "Bergen op Zoom": [51.4946, 4.2866],
    "Capelle aan den IJssel": [51.9357, 4.5788],
    "Katwijk": [52.2015, 4.3956],
    "Nieuwegein": [52.0294, 5.0949],
    "Zeist": [52.0879, 5.2408],
    "Houten": [52.0310, 5.1698],
    "Elst": [51.9192, 5.8444],
  };

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function afstand(regioA, regioB) {
    const a = NL_GEO[regioA];
    const b = NL_GEO[regioB];
    if (!a || !b) return null; // onbekende regio → geen afstand
    return Math.round(haversine(a[0], a[1], b[0], b[1]) * 10) / 10;
  }

  window.MoetnuGeo = { NL_GEO, haversine, afstand };
})();
