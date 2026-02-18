
import { User, InventoryItem, Skin, LiveDrop, ReferralRecord } from '../types';
import { ALL_SKINS } from '../constants';

const DB_KEY = 'otodrop_database_v3';

interface DatabaseSchema {
  users: User[];
  invites: ReferralRecord[];
  currentUser: string | null; // User ID
}

export class MockBackendService {
  private static getDB(): DatabaseSchema {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
      const db = JSON.parse(data);
      // Ensure users array exists
      if (!db.users) db.users = [];
      if (!db.invites) db.invites = [];
      return db;
    }
    
    return {
      users: [],
      invites: [],
      currentUser: null,
    };
  }

  private static saveDB(db: DatabaseSchema) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  static getCurrentUser(): User | null {
    const db = this.getDB();
    if (!db.currentUser) return null;
    return db.users.find(u => u.id === db.currentUser) || null;
  }

  static getAllUsers(): User[] {
    return this.getDB().users;
  }

  static login(provider: 'google' | 'steam'): User {
    const db = this.getDB();
    
    // Simulate finding an existing user based on provider/name
    // In a real app, this would use OAuth tokens
    const mockEmail = `${provider}_user@oto.drop`;
    let user = db.users.find(u => u.username.toLowerCase().includes(provider));

    if (!user) {
      const mockId = `${provider}_${Math.random().toString(36).substr(2, 9)}`;
      user = {
        id: mockId,
        username: `${provider === 'steam' ? 'SteamPlayer' : 'GoogleUser'}_${Math.floor(Math.random() * 9999)}`,
        displayName: provider === 'steam' ? 'CS Enthusiast' : 'Pro Gamer',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${mockId}`,
        balance: 0,
        inventory: [],
        isAdmin: db.users.length === 0 || provider === 'google', // Make the first user or any Google user admin for demo
        provider,
        referralCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
        referredBy: null,
        hasClaimedFree: false,
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
    }

    db.currentUser = user.id;
    this.saveDB(db);
    return user;
  }

  static logout() {
    const db = this.getDB();
    db.currentUser = null;
    this.saveDB(db);
  }

  static claimFreeMoney(userId: string): boolean {
    const db = this.getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1 && !db.users[userIndex].hasClaimedFree) {
      db.users[userIndex].balance += 10.00;
      db.users[userIndex].hasClaimedFree = true;
      this.saveDB(db);
      return true;
    }
    return false;
  }

  static adminUpdateBalance(userId: string, amount: number) {
    const db = this.getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      db.users[userIndex].balance += amount;
      // Ensure balance doesn't go negative
      if (db.users[userIndex].balance < 0) db.users[userIndex].balance = 0;
      this.saveDB(db);
    }
  }

  static addToInventory(userId: string, skin: Skin) {
    const db = this.getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const newItem: InventoryItem = {
        ...skin,
        uid: 'item_' + Date.now() + Math.random().toString(36).substr(2, 5),
        obtainedAt: new Date().toISOString()
      };
      db.users[userIndex].inventory.unshift(newItem);
      this.saveDB(db);
      return newItem;
    }
    return null;
  }

  static sellItem(userId: string, uid: string) {
    const db = this.getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const user = db.users[userIndex];
      const itemIdx = user.inventory.findIndex(i => i.uid === uid);
      if (itemIdx > -1) {
        const price = user.inventory[itemIdx].price;
        user.inventory.splice(itemIdx, 1);
        user.balance += price;
        this.saveDB(db);
      }
    }
  }

  static deductBalance(userId: string, amount: number): boolean {
    const db = this.getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1 && db.users[userIndex].balance >= amount) {
      db.users[userIndex].balance -= amount;
      this.saveDB(db);
      return true;
    }
    return false;
  }

  static removeItems(userId: string, uids: string[]) {
    const db = this.getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      db.users[userIndex].inventory = db.users[userIndex].inventory.filter(i => !uids.includes(i.uid));
      this.saveDB(db);
    }
  }

  static getInvitations(): ReferralRecord[] {
    return this.getDB().invites;
  }

  static applyReferral(inviteeId: string, code: string): boolean {
    const db = this.getDB();
    const inviterIndex = db.users.findIndex(u => u.referralCode === code);
    const inviteeIndex = db.users.findIndex(u => u.id === inviteeId);

    if (inviterIndex !== -1 && inviteeIndex !== -1 && db.users[inviteeIndex].referredBy === null) {
      if (db.users[inviterIndex].id === inviteeId) return false;

      db.users[inviteeIndex].referredBy = db.users[inviterIndex].id;
      db.users[inviterIndex].balance += 5.00; // Bonus to inviter
      
      const record: ReferralRecord = {
        id: `ref_${Date.now()}`,
        inviterId: db.users[inviterIndex].id,
        inviteeId: inviteeId,
        timestamp: new Date().toISOString(),
      };
      db.invites.push(record);
      this.saveDB(db);
      return true;
    }
    return false;
  }
}

export const generateLiveDrop = (): LiveDrop => {
  const randomSkin = ALL_SKINS[Math.floor(Math.random() * ALL_SKINS.length)];
  const names = ['Volt', 'Phantom', 'Dragon', 'Sniper', 'Gamer1337', 'Slayer', 'ProPlayer', 'LuckyShot'];
  return {
    id: 'drop_' + Math.random().toString(36).substr(2, 9),
    username: names[Math.floor(Math.random() * names.length)],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
    skin: randomSkin,
    timestamp: Date.now()
  };
};
