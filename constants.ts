
import { Skin, CaseItem } from './types';

const rawSkinData = `
P250|Sand Dune|0.10|#4b69ff
Glock-18|Catacombs|0.20|#4b69ff
SSG 08|Abyss|0.50|#4b69ff
P90|Grim|0.80|#4b69ff
M4A4|Magnesium|1.00|#4b69ff
MAC-10|Candy Apple|1.10|#4b69ff
Glock-18|Weasel|1.20|#8847ff
Glock-18|Moonrise|1.50|#8847ff
USP-S|Ticket to Hell|1.80|#8847ff
P250|Asiimov|2.00|#d32ee6
AK-47|Elite Build|2.50|#4b69ff
M4A1-S|Night Terror|2.50|#8847ff
AWP|Worm God|3.00|#8847ff
USP-S|Cyrex|3.50|#8847ff
AK-47|Slate|4.00|#8847ff
Desert Eagle|Light Rail|4.00|#8847ff
AWP|Mortis|4.50|#d32ee6
Glock-18|Water Elemental|5.00|#d32ee6
USP-S|Cortex|5.00|#d32ee6
Desert Eagle|Conspiracy|6.00|#d32ee6
AK-47|Phantom Disruptor|6.00|#d32ee6
Desert Eagle|Mecha Industries|7.00|#d32ee6
MAC-10|Neon Rider|8.00|#eb4b4b
AWP|Atheris|10.00|#8847ff
M4A4|Desolate Space|10.00|#d32ee6
Glock-18|Bullet Queen|12.00|#eb4b4b
FAMAS|Commemoration|12.00|#eb4b4b
M4A1-S|Decimator|14.00|#d32ee6
AK-47|Redline|15.00|#d32ee6
Glock-18|Neo-Noir|15.00|#eb4b4b
M4A4|In Living Color|15.00|#eb4b4b
AK-47|Ice Coaled|18.00|#d32ee6
USP-S|Neo-Noir|18.00|#eb4b4b
M4A4|Neo-Noir|20.00|#eb4b4b
AWP|Neo-Noir|25.00|#eb4b4b
USP-S|Orion|25.00|#d32ee6
M4A1-S|Hyper Beast|25.00|#eb4b4b
M4A4|The Emperor|30.00|#eb4b4b
AK-47|Asiimov|35.00|#eb4b4b
M4A1-S|Player Two|35.00|#eb4b4b
AK-47|Neon Rider|40.00|#eb4b4b
USP-S|Kill Confirmed|45.00|#eb4b4b
USP-S|Printstream|55.00|#eb4b4b
Desert Eagle|Printstream|60.00|#eb4b4b
AK-47|Bloodsport|75.00|#eb4b4b
AK-47|Vulcan|80.00|#eb4b4b
AWP|Containment Breach|85.00|#eb4b4b
AWP|Asiimov|110.00|#eb4b4b
M4A1-S|Printstream|210.00|#eb4b4b
Desert Eagle|Emerald Jörmungandr|350.00|#8847ff
Bayonet|Slaughter|450.00|#ebca44
M4A1-S|Blue Phosphor|700.00|#d32ee6
Glock-18|Fade|800.00|#8847ff
Desert Eagle|Blaze|900.00|#8847ff
M9 Bayonet|Doppler|900.00|#ebca44
Talon Knife|Fade|1000.00|#ebca44
Karambit|Tiger Tooth|1000.00|#ebca44
Karambit|Doppler|1100.00|#ebca44
Karambit|Fade|1200.00|#ebca44
M9 Bayonet|Lore|1200.00|#ebca44
Driver Gloves|King Snake|1200.00|#ebca44
Karambit|Marble Fade|1300.00|#ebca44
Butterfly Knife|Slaughter|1400.00|#ebca44
Karambit|Lore|1500.00|#ebca44
M9 Bayonet|Autotronic|1500.00|#ebca44
Butterfly Knife|Doppler|1600.00|#ebca44
Skeleton Knife|Crimson Web|1600.00|#ebca44
Butterfly Knife|Tiger Tooth|1700.00|#ebca44
M9 Bayonet|Crimson Web|1800.00|#ebca44
Skeleton Knife|Fade|1800.00|#ebca44
Butterfly Knife|Marble Fade|2000.00|#ebca44
Sport Gloves|Vice|2000.00|#ebca44
Butterfly Knife|Fade|2200.00|#ebca44
M4A1-S|Welcome to the Jungle|2500.00|#eb4b4b
AWP|Medusa|3000.00|#eb4b4b
AK-47|Gold Arabesque|3000.00|#eb4b4b
M4A4|Howl|3500.00|#e4ae39
Sport Gloves|Pandora's Box|4000.00|#ebca44
AK-47|Wild Lotus|4500.00|#eb4b4b
AWP|Dragon Lore|5000.00|#eb4b4b
AWP|Gungnir|6000.00|#eb4b4b
`;

export const SKINS_DB: Record<string, Skin> = {};

rawSkinData.trim().split("\n").forEach((line, idx) => {
  const [weapon, skinName, priceStr, color] = line.split("|");
  const price = parseFloat(priceStr);
  const id = (idx + 1).toString();
  const urlWeapon = weapon.replace(/ /g, "_");
  const urlName = skinName.replace(/ /g, "_").replace(/'/g, "");
  
  let folder = "skins";
  if (weapon.includes("Gloves") || weapon.includes("Wraps")) folder = "gloves";
  else if (weapon.includes("Knife") || weapon.includes("Karambit") || weapon.includes("Bayonet") || weapon.includes("Daggers")) folder = "knives";

  const primaryImg = `https://www.csgodatabase.com/images/${folder}/webp/${urlWeapon}_${urlName}.webp`;
  
  SKINS_DB[id] = {
    id,
    weapon,
    skinName,
    name: `${weapon} | ${skinName}`,
    price,
    color,
    img: primaryImg,
    rarityName: color === '#ebca44' ? 'gold' : (color === '#eb4b4b' ? 'red' : (color === '#d32ee6' ? 'pink' : 'blue'))
  };
});

export const ALL_SKINS = Object.values(SKINS_DB);

export const CASES: CaseItem[] = [
  {
    id: "budget",
    name: "Budget Grinder",
    price: 4.99,
    color: "blue",
    img: SKINS_DB["13"].img, // AWP Worm God
    contents: [
      { skin: SKINS_DB["2"], chance: 60 },
      { skin: SKINS_DB["9"], chance: 25 },
      { skin: SKINS_DB["17"], chance: 12 },
      { skin: SKINS_DB["25"], chance: 2.5 },
      { skin: SKINS_DB["29"], chance: 0.5 },
    ]
  },
  {
    id: "covert",
    name: "Covert Dreams",
    price: 99.00,
    color: "red",
    img: SKINS_DB["48"].img, // AWP Asiimov
    contents: [
      { skin: SKINS_DB["38"], chance: 65 },
      { skin: SKINS_DB["46"], chance: 25 },
      { skin: SKINS_DB["48"], chance: 8 },
      { skin: SKINS_DB["50"], chance: 2 },
    ]
  },
  {
    id: "knife-ultra",
    name: "Ultra Knife Box",
    price: 499.00,
    color: "gold",
    img: SKINS_DB["59"].img, // Karambit Fade
    contents: [
      { skin: SKINS_DB["55"], chance: 30 },
      { skin: SKINS_DB["73"], chance: 25 },
      { skin: SKINS_DB["57"], chance: 20 },
      { skin: SKINS_DB["59"], chance: 15 },
      { skin: SKINS_DB["56"], chance: 10 },
    ]
  }
];
