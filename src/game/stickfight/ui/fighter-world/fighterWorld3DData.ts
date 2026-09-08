export type FighterWorldNode3D = {
  id: string;
  name: string;
  title: string;
  location: string;
  era: string;
  lat: number;
  lon: number;
  region: string;
};

/**
 * Kuro is deliberately absent. Every other fighter is a person who was
 * somewhere on a particular day; he is a story people in several countries
 * swear happened to them, with no year and no place, and the rest of the game
 * already says so. Giving him a pin would be the one lie on the map.
 */
export const FIGHTER_WORLD_NODES_3D: FighterWorldNode3D[] = [
  { id: "roman",    name: "Lucius Vorenus",        title: "Roman Legionary", location: "Nervii territory, Gaul", era: "54 BC",       lat: 50.55, lon: 4.35,   region: "Europe" },
  { id: "spartan",  name: "Dienekes",              title: "Spartan Hoplite", location: "Thermopylae, Greece",    era: "480 BC",      lat: 38.80, lon: 22.54,  region: "Europe" },
  { id: "viking",   name: "Freydís Eiríksdóttir",  title: "Norse Explorer",  location: "Vinland",                 era: "c. 1000",      lat: 51.60, lon: -55.50, region: "North America" },
  { id: "samurai",  name: "Tomoe Gozen",           title: "Onna-musha",      location: "Awazu, Japan",            era: "1184",         lat: 35.01, lon: 135.87, region: "Asia" },
  { id: "mongol",   name: "Subutai",               title: "Mongol General",  location: "Kalka River",             era: "1223",         lat: 47.30, lon: 36.20,  region: "Europe / Asia" },
  { id: "knight",   name: "John Chandos",          title: "English Knight",  location: "Poitiers, France",        era: "1356",         lat: 46.58, lon: 0.34,   region: "Europe" },
  { id: "jaguar",   name: "Tzilacatzin",           title: "Mexica Warrior",  location: "Tenochtitlan",            era: "1521",         lat: 19.43, lon: -99.13, region: "North America" },
  { id: "shaolin",  name: "Yuekong",               title: "Ming-era Fighter",location: "Jiangnan coast, China",    era: "1553",         lat: 30.20, lon: 121.50, region: "Asia" },
  { id: "ninja",    name: "Hattori Hanzō",         title: "Shinobi",         location: "Iga, Japan",               era: "1582",         lat: 34.77, lon: 136.13, region: "Asia" },
  { id: "pirate",   name: "Anne Bonny",            title: "Pirate",          location: "Negril Point, Jamaica",    era: "1720",         lat: 18.27, lon: -78.35, region: "Caribbean" },
  { id: "muaythai", name: "Nai Khanom Tom",        title: "Muay Thai Fighter",location:"Ava, Myanmar",             era: "1774",         lat: 21.86, lon: 96.02,  region: "Asia" },
  { id: "nihang",   name: "Akali Phula Singh",     title: "Nihang Warrior",  location: "Punjab",                   era: "1807",         lat: 31.15, lon: 75.34,  region: "Asia" },
  { id: "zulu",     name: "Mgobozi ovela Ntla",    title: "Zulu Warrior",    location: "Gqokli Hill, South Africa",era:"1818",          lat: -28.50,lon: 31.40,  region: "Africa" },
  { id: "western",  name: "Wyatt Earp",            title: "Frontier Lawman", location: "Tombstone, Arizona",       era: "1881",         lat: 31.71, lon: -110.07,region: "North America" },
  { id: "soldier",  name: "The Ia Drang Trooper",  title: "Infantryman",     location: "Ia Drang Valley, Vietnam", era: "1965",         lat: 13.58, lon: 107.72, region: "Asia" },

  // The other ten. The globe shipped knowing fifteen of the roster, so eleven
  // fighters had a card on the select screen and nowhere on the map they came
  // from - which is the one thing this menu is for.
  //
  // Hydarnes and Cortés stand a fraction off Dienekes and Tzilacatzin rather
  // than exactly on them: both pairs fought each other in the same place, and
  // two beacons at identical coordinates are one beacon you cannot click.
  { id: "iceman",   name: "Ötzi",                  title: "Copper Age Traveller", location: "Ötztal Alps, Tyrol",  era: "c. 3300 BC",  lat: 46.78, lon: 10.84,  region: "Europe" },
  { id: "shanidar", name: "Shanidar 1",            title: "Neanderthal",     location: "Shanidar Cave, Zagros",   era: "c. 45,000 BC", lat: 36.83, lon: 44.22,  region: "Asia" },
  { id: "persian",  name: "Hydarnes",              title: "Commander of the Immortals", location: "Thermopylae, Greece", era: "480 BC", lat: 38.72, lon: 22.63,  region: "Asia / Europe" },
  { id: "celt",     name: "Vercingetorix",         title: "Arvernian War Chief", location: "Alesia, Gaul",        era: "52 BC",        lat: 47.54, lon: 4.50,   region: "Europe" },
  { id: "iceni",    name: "Boudica",               title: "Queen of the Iceni", location: "Watling Street, Britain", era: "AD 61",    lat: 52.55, lon: -1.30,  region: "Europe" },
  { id: "lapulapu", name: "Lapulapu",              title: "Datu of Mactan",  location: "Mactan, Visayas",         era: "1521",         lat: 10.31, lon: 124.02, region: "Asia" },
  { id: "conquistador", name: "Hernán Cortés",     title: "Conquistador",    location: "Tenochtitlan",            era: "1521",         lat: 19.38, lon: -99.22, region: "North America" },
  { id: "duelist",  name: "Julie d'Aubigny",       title: "Opera Singer and Duellist", location: "Paris",         era: "1690s",        lat: 48.86, lon: 2.35,   region: "Europe" },
  { id: "maori",    name: "Te Rauparaha",          title: "Ngāti Toa Chief", location: "Kapiti Coast, Aotearoa",  era: "1820s",        lat: -40.87,lon: 174.98, region: "Oceania" },
  { id: "ethiopia", name: "Ras Alula Engida",      title: "Ethiopian General", location: "Dogali, Eritrea",       era: "1887",         lat: 15.45, lon: 39.05,  region: "Africa" },
];

export const FIGHTER_WORLD_BY_ID_3D = Object.fromEntries(
  FIGHTER_WORLD_NODES_3D.map((fighter) => [fighter.id, fighter]),
);
