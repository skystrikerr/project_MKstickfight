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
];

export const FIGHTER_WORLD_BY_ID_3D = Object.fromEntries(
  FIGHTER_WORLD_NODES_3D.map((fighter) => [fighter.id, fighter]),
);
