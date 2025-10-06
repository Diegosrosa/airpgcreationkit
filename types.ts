
export interface Weapon {
  id: string;
  name: string;
  type: string;
  damage: string;
  description: string;
  image?: string;
}

export enum EffectType {
  HEALING = 'Healing',
  DAMAGE = 'Damage',
  BUFF = 'Buff',
  DEBUFF = 'Debuff',
  UTILITY = 'Utility',
  OTHER = 'Other',
}

export interface StructuredEffect {
  type: EffectType;
  description: string;
}

export interface Item {
  id:string;
  name: string;
  type: string;
  description: string;
  effects: StructuredEffect[];
  image?: string;
}

export interface Gear {
  id: string;
  name: string;
  type: string; // e.g., Light Armor, Heavy Armor, Clothing
  slot: string; // e.g., Head, Chest, Legs, Feet
  armorValue: string; // e.g., "12 + Dex modifier", "5"
  description: string;
  image?: string;
}

export interface Spell {
  id: string;
  name: string;
  school: string;
  level: number;
  effect: string;
  manaCost: string;
  range: string;
  image?: string;
}

export interface NPC {
  id: string;
  name: string;
  race: string;
  role: string;
  description: string;
  image?: string;
}

export interface Creature {
  id: string;
  name: string;
  type: string; // e.g., Beast, Monstrosity, Undead
  challengeRating: string; // e.g., "1/4", "5 (1,800 XP)"
  hp?: string; // e.g., "45 (6d10 + 12)"
  armorClass?: string; // e.g., "15 (Natural Armor)"
  attackBonus?: string; // e.g., "+5"
  abilities: string[]; // e.g., "Pack Tactics", "Amphibious"
  description: string;
  image?: string;
}

export interface RPGClass {
  id: string;
  name: string;
  description: string;
  abilities: string[];
  traits: string[];
  spellIds?: string[];
}

export interface Race {
  id: string;
  name: string;
  description: string;
  traits: string[];
  bodySlots?: { name: string; isWeaponSlot?: boolean }[];
}

export interface Character {
  id: string;
  name: string;
  race: Race | null;
  rpgClass: RPGClass | null;
  level: number;
  hp: { current: number; max: number };
  mp: { current: number; max: number };
  attributes: { [key: string]: number };
  spellSlots: { [level: string]: { current: number; max: number } };
  physicalAppearance: string;
  background: string;
  spellIds?: string[];
  inventory: { itemId: string, quantity: number }[];
  equippedGear: { [key: string]: string | null };
  gearIds: { gearId: string, quantity: number }[]; // Backpack for gear
  weaponIds: { weaponId: string, quantity: number }[]; // Backpack for weapons
  equippedWeapons: { [key: string]: string | null };
  image?: string;
}

export interface Setting {
  worldName: string;
  lore: string;
  history: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  isLoadingImage?: boolean;
}

export interface RPGData {
  setting: Setting;
  weapons: Weapon[];
  items: Item[];
  gear: Gear[];
  spells: Spell[];
  npcs: NPC[];
  creatures: Creature[];
  classes: RPGClass[];
  races: Race[];
  characters: Character[];
}

export type Screen = 
  | 'dashboard'
  | 'setting'
  | 'weapons'
  | 'items'
  | 'gear'
  | 'spells'
  | 'npcs'
  | 'creatures'
  | 'classes'
  | 'races'
  | 'characters'
  | 'campaign-generator'
  | 'image-generator'
  | 'analytics';