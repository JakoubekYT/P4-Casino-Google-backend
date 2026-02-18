
export enum RarityColor {
  BLUE = '#4b69ff',
  PURPLE = '#8847ff',
  PINK = '#d32ee6',
  RED = '#eb4b4b',
  GOLD = '#ebca44',
  CONTRA = '#e4ae39'
}

export interface Skin {
  id: string;
  weapon: string;
  skinName: string;
  name: string;
  price: number;
  color: string;
  img: string;
  rarityName: string;
}

export interface CaseItem {
  id: string;
  name: string;
  price: number;
  color: string;
  img: string;
  contents: { skin: Skin; chance: number }[];
}

export interface InventoryItem extends Skin {
  uid: string;
  obtainedAt: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  balance: number;
  inventory: InventoryItem[];
  isAdmin: boolean;
  provider: 'google' | 'steam' | 'guest' | null;
  referralCode: string;
  referredBy: string | null;
  hasClaimedFree: boolean;
  createdAt: string;
}

export interface UpgradeState {
  sourceItems: (InventoryItem | null)[];
  targetItem: Skin | null;
  isRolling: boolean;
  result: 'success' | 'fail' | null;
}

export interface LiveDrop {
  id: string;
  username: string;
  avatar: string;
  skin: Skin;
  timestamp: number;
}

export interface ReferralRecord {
  id: string;
  inviterId: string;
  inviteeId: string;
  timestamp: string;
}
