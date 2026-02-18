
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Coins, LayoutGrid, ArrowUpRight, LogOut, 
  TrendingUp, Info, Zap, Trash2, CheckCircle2, 
  AlertTriangle, Gift, DollarSign, Search, ChevronRight, X,
  ShieldAlert, Users, Link as LinkIcon, User as UserIcon, Plus, Minus
} from 'lucide-react';
import { User, CaseItem, Skin, LiveDrop, InventoryItem, UpgradeState, ReferralRecord } from './types';
import { CASES, ALL_SKINS } from './constants';
import { MockBackendService, generateLiveDrop } from './services/mockBackend';
import { askGeminiAboutSkins } from './services/gemini';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(MockBackendService.getCurrentUser());
  const [activePage, setActivePage] = useState('cases');
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [liveDrops, setLiveDrops] = useState<LiveDrop[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonSkin, setWonSkin] = useState<Skin | null>(null);
  
  // Upgrade State
  const [upgrade, setUpgrade] = useState<UpgradeState>({
    sourceItems: [null, null, null],
    targetItem: null,
    isRolling: false,
    result: null
  });

  // Admin Dashboard State
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminInvites, setAdminInvites] = useState<ReferralRecord[]>([]);

  const [aiMessage, setAiMessage] = useState("Oto: Ready for some action? Use your free bonus to start! 🚀");
  const [userInput, setUserInput] = useState("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Auto-generate live drops
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveDrops(prev => [generateLiveDrop(), ...prev].slice(0, 20));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update Admin data periodically if on admin page
  useEffect(() => {
    if (activePage === 'admin' && user?.isAdmin) {
      setAdminUsers(MockBackendService.getAllUsers());
      setAdminInvites(MockBackendService.getInvitations());
    }
  }, [activePage, user]);

  const totalUpgradeValue = useMemo(() => 
    upgrade.sourceItems.reduce((acc, item) => acc + (item?.price || 0), 0)
  , [upgrade.sourceItems]);

  const upgradeChance = useMemo(() => {
    if (!upgrade.targetItem || totalUpgradeValue === 0) return 0;
    return Math.min((totalUpgradeValue / upgrade.targetItem.price) * 95, 95);
  }, [upgrade.targetItem, totalUpgradeValue]);

  const handleLogin = (provider: 'google' | 'steam') => {
    const loggedInUser = MockBackendService.login(provider);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    MockBackendService.logout();
    setUser(null);
    setActivePage('cases');
  };

  const handleClaimFree = () => {
    if (user && MockBackendService.claimFreeMoney(user.id)) {
      setUser(MockBackendService.getCurrentUser());
      setAiMessage("Oto: Boom! $10 added to your account. Go get those skins! 💎");
    }
  };

  const handleOpenCase = (c: CaseItem) => {
    if (!user) return;
    if (user.balance < c.price) {
      alert("Insufficient funds! Use the Free Money button if available or ask an admin.");
      return;
    }
    setSelectedCase(c);
    setWonSkin(null);
  };

  const startSpin = () => {
    if (!selectedCase || isSpinning || !user) return;
    setIsSpinning(true);
    setWonSkin(null);
    const success = MockBackendService.deductBalance(user.id, selectedCase.price);
    if (!success) {
      setIsSpinning(false);
      alert("Transaction failed.");
      return;
    }
    setUser(MockBackendService.getCurrentUser());

    const roll = Math.random() * 100;
    let sum = 0;
    let result = selectedCase.contents[0].skin;
    for (const item of selectedCase.contents) {
      sum += item.chance;
      if (roll <= sum) {
        result = item.skin;
        break;
      }
    }

    setTimeout(() => {
      setIsSpinning(false);
      setWonSkin(result);
      MockBackendService.addToInventory(user.id, result);
      setUser(MockBackendService.getCurrentUser());
    }, 4000);
  };

  const handleUpgradeRoll = () => {
    if (!user || totalUpgradeValue === 0 || !upgrade.targetItem || upgrade.isRolling) return;
    setUpgrade(prev => ({ ...prev, isRolling: true, result: null }));
    
    setTimeout(() => {
      const win = Math.random() * 100 < upgradeChance;
      const removedUids = upgrade.sourceItems.filter(i => i !== null).map(i => i!.uid);
      MockBackendService.removeItems(user.id, removedUids);
      
      if (win) {
        MockBackendService.addToInventory(user.id, upgrade.targetItem!);
        setUpgrade(prev => ({ ...prev, isRolling: false, result: 'success' }));
      } else {
        setUpgrade(prev => ({ ...prev, isRolling: false, result: 'fail' }));
      }
      setUser(MockBackendService.getCurrentUser());
    }, 3000);
  };

  const handleAiChat = async () => {
    if (!userInput.trim()) return;
    setIsLoadingAi(true);
    const answer = await askGeminiAboutSkins(userInput);
    setAiMessage(answer);
    setUserInput("");
    setIsLoadingAi(false);
  };

  const handleAdminAddBalance = (targetId: string, amount: number) => {
    MockBackendService.adminUpdateBalance(targetId, amount);
    setAdminUsers(MockBackendService.getAllUsers());
  };

  // --- Login Screen ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0b0d11] flex flex-col items-center justify-center p-8 font-['Rajdhani']">
        <div className="flex flex-col items-center gap-2 mb-12">
            <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-black font-black text-3xl rotate-3 shadow-2xl shadow-yellow-400/20">OD</div>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white">OTO<span className="text-yellow-400">DROP</span></h1>
            <p className="text-gray-500 uppercase font-bold tracking-[0.3em] text-[10px]">Secure Login System</p>
        </div>
        
        <div className="bg-[#14171c] p-12 rounded-[4rem] border border-white/5 flex flex-col gap-6 w-full max-w-md shadow-2xl">
          <div className="text-center space-y-2 mb-4">
             <h2 className="text-2xl font-black uppercase text-white italic">Authentication</h2>
             <p className="text-gray-500 text-xs font-medium">Choose your preferred login provider to access your vault.</p>
          </div>

          <button 
            onClick={() => handleLogin('steam')}
            className="flex items-center justify-center gap-4 bg-[#1b2838] hover:bg-[#2a475e] text-white py-5 rounded-2xl transition-all border border-white/5 group relative overflow-hidden"
          >
            <div className="bg-white/5 p-2 rounded-lg group-hover:scale-110 transition-transform">
               <img src="https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg" className="w-6 h-6 invert" alt="Steam" />
            </div>
            <span className="font-black uppercase tracking-widest text-sm z-10">Sign in with Steam</span>
          </button>
          
          <button 
            onClick={() => handleLogin('google')}
            className="flex items-center justify-center gap-4 bg-white hover:bg-gray-100 text-black py-5 rounded-2xl transition-all group border border-transparent"
          >
            <div className="bg-black/5 p-2 rounded-lg group-hover:rotate-12 transition-transform">
               <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-6 h-6" alt="Google" />
            </div>
            <span className="font-black uppercase tracking-widest text-sm">Sign in with Google</span>
          </button>
          
          <div className="mt-8 flex flex-col items-center gap-4">
             <div className="flex items-center gap-2 text-[10px] text-gray-700 font-black uppercase tracking-widest">
               <ShieldAlert className="w-4 h-4" /> Trusted Provably Fair Provider
             </div>
             <p className="text-[10px] text-gray-600 text-center max-w-[240px] leading-relaxed">By logging in, you certify that you are at least 18 years of age and agree to our virtual asset terms.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Main App ---
  return (
    <div className="min-h-screen flex flex-col font-['Rajdhani'] bg-[#0b0d11]">
      {/* Header */}
      <header className="h-20 bg-[#14171c] border-b border-white/5 flex items-center justify-between px-8 z-50 sticky top-0 shadow-2xl">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActivePage('cases')}>
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-black text-xl transition-transform group-hover:rotate-6">OD</div>
            <span className="text-2xl font-black italic tracking-tighter uppercase text-white">OTO<span className="text-yellow-400">DROP</span></span>
          </div>
          <nav className="flex items-center gap-8">
            <button onClick={() => setActivePage('cases')} className={`flex items-center gap-2 font-bold uppercase text-xs tracking-widest transition-all ${activePage === 'cases' ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              <Box className="w-4 h-4" /> Shop
            </button>
            <button onClick={() => setActivePage('upgrade')} className={`flex items-center gap-2 font-bold uppercase text-xs tracking-widest transition-all ${activePage === 'upgrade' ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              <Zap className="w-4 h-4" /> Upgrade
            </button>
            <button onClick={() => setActivePage('inventory')} className={`flex items-center gap-2 font-bold uppercase text-xs tracking-widest transition-all ${activePage === 'inventory' ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              <LayoutGrid className="w-4 h-4" /> Vault
            </button>
            {user.isAdmin && (
              <button onClick={() => setActivePage('admin')} className={`flex items-center gap-2 font-bold uppercase text-xs tracking-widest transition-all ${activePage === 'admin' ? 'text-red-500' : 'text-gray-600 hover:text-red-400'}`}>
                <ShieldAlert className="w-4 h-4" /> Terminal
              </button>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Claim Free Money Button - disappear after claim */}
          {!user.hasClaimedFree && (
            <button 
              onClick={handleClaimFree}
              className="bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-green-500 hover:text-black transition-all animate-bounce shadow-lg shadow-green-500/10"
            >
              <Gift className="w-4 h-4" /> Free $10 Reward
            </button>
          )}
          
          <div className="bg-black/40 px-5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-4 shadow-inner">
            <div className="text-right leading-none">
              <div className="font-black text-yellow-400 text-lg tracking-tighter leading-none">${user.balance.toFixed(2)}</div>
              <div className="text-[9px] text-gray-500 font-bold uppercase mt-1">Available Credits</div>
            </div>
            <Coins className="text-yellow-400 w-5 h-5" />
          </div>
          
          <div className="flex items-center gap-4 pl-6 border-l border-white/5">
             <div className="text-right">
                <div className="text-xs font-black text-white">{user.username}</div>
                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{user.provider} linked</div>
             </div>
             <img src={user.avatar} className="w-10 h-10 rounded-xl border border-white/10" alt="" />
             <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      {/* Ticker */}
      <div className="h-14 bg-black/80 border-b border-white/5 flex items-center overflow-hidden">
        <div className="bg-yellow-400 text-black px-5 h-full flex items-center text-[10px] font-black uppercase italic tracking-widest z-10 shadow-2xl">Network Activity</div>
        <div className="flex gap-10 px-6 animate-marquee">
          {liveDrops.map(drop => (
            <div key={drop.id} className="flex items-center gap-3 whitespace-nowrap">
              <img src={drop.avatar} className="w-6 h-6 rounded-lg border border-white/10" alt="" />
              <span className="text-[10px] text-gray-400 font-black uppercase">{drop.username}</span>
              <span className="text-[10px] font-black uppercase italic" style={{ color: drop.skin.color }}>{drop.skin.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 p-10 overflow-y-auto">
        {activePage === 'cases' && (
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="relative h-72 rounded-[4rem] overflow-hidden bg-gradient-to-br from-[#1a1d24] to-[#0b0d11] border border-white/5 flex items-center px-16 shadow-2xl">
              <div className="z-10 space-y-4">
                <span className="inline-block px-3 py-1 bg-yellow-400 text-black font-black text-[10px] uppercase rounded italic tracking-widest">Global Marketplace</span>
                <h2 className="text-7xl font-black italic uppercase tracking-tighter text-white leading-none">OTO<span className="text-yellow-400">DROP</span></h2>
                <p className="text-gray-400 text-sm max-w-lg font-medium leading-relaxed">High-fidelity skin decryption platform. Trade virtual assets with confirmed probabilities and instant liquidity.</p>
                
                <div className="flex gap-4 pt-4">
                   <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex flex-col justify-center">
                      <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Referral Code</span>
                      <span className="text-white font-black tracking-[0.3em] text-lg">{user.referralCode}</span>
                   </div>
                   <button onClick={() => navigator.clipboard.writeText(user.referralCode)} className="bg-yellow-400/5 hover:bg-yellow-400 p-4 rounded-2xl text-yellow-400 hover:text-black transition-all border border-yellow-400/20">
                      <LinkIcon className="w-5 h-5" />
                   </button>
                </div>
              </div>
              <div className="absolute right-[-10%] top-[-20%] opacity-5 select-none pointer-events-none">
                 <Box className="w-[600px] h-[600px] text-white" />
              </div>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {CASES.map(c => (
                <div key={c.id} onClick={() => handleOpenCase(c)} className="bg-[#14171c] p-10 rounded-[3rem] border-2 border-white/5 hover:border-yellow-400/50 cursor-pointer transition-all flex flex-col items-center group shadow-xl hover:-translate-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 text-[9px] font-black text-gray-700 uppercase italic opacity-20 group-hover:opacity-100 transition-opacity">OD-CRYPT-X</div>
                  <div className="relative mb-8">
                    <img src={c.img} className="h-44 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-700" alt="" />
                    <div className="absolute inset-0 bg-yellow-400/5 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic text-white tracking-tighter">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    <span className="text-yellow-400 font-black text-xl tracking-tighter">${c.price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* Upgrade Page */}
        {activePage === 'upgrade' && (
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
            <h2 className="text-5xl font-black uppercase text-white italic tracking-tighter">MOLECULAR <span className="text-yellow-400 underline decoration-yellow-400/20 decoration-8 underline-offset-8">FORGE</span></h2>
            
            <div className={`w-full grid grid-cols-12 gap-10 ${upgrade.isRolling ? 'upgrade-shake' : ''}`}>
              <div className="col-span-3 bg-[#14171c] rounded-[3rem] p-8 border border-white/5 flex flex-col h-[65vh] shadow-2xl">
                <h4 className="text-[10px] font-black uppercase text-gray-500 mb-8 tracking-[0.3em] flex items-center justify-between">
                   Input Slots <span>{user.inventory.length} Items</span>
                </h4>
                <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-4">
                  {user.inventory.map(item => (
                    <div key={item.uid} onClick={() => {
                      const next = [...upgrade.sourceItems];
                      const firstEmpty = next.indexOf(null);
                      if (firstEmpty !== -1) { next[firstEmpty] = item; setUpgrade({...upgrade, sourceItems: next}); }
                    }} className="bg-black/30 p-5 rounded-[1.5rem] flex items-center gap-5 cursor-pointer hover:bg-yellow-400/5 hover:border-yellow-400/30 border border-transparent transition-all group active:scale-95 shadow-lg">
                      <img src={item.img} className="w-14 h-14 object-contain group-hover:scale-110 transition-transform" alt="" />
                      <div className="leading-none overflow-hidden">
                        <div className="text-[10px] font-black text-gray-500 uppercase truncate mb-1">{item.weapon}</div>
                        <div className="text-xs font-black text-white truncate">{item.skinName}</div>
                        <div className="text-sm font-black text-yellow-400 mt-2 tracking-tighter">${item.price.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                  {user.inventory.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-10 text-center space-y-4 py-10">
                       <Box className="w-16 h-16" />
                       <span className="text-[11px] font-black uppercase italic tracking-widest">No Assets Found</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-6 bg-[#0b0d11]/80 rounded-[5rem] p-16 flex flex-col items-center justify-center border border-white/5 relative shadow-inner overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/5 to-transparent opacity-30" />
                 
                 <div className="flex items-center gap-10 mb-16 z-10">
                    <div className="flex gap-4">
                       {upgrade.sourceItems.map((item, i) => (
                         <div key={i} onClick={() => {
                            const next = [...upgrade.sourceItems];
                            next[i] = null;
                            setUpgrade({...upgrade, sourceItems: next});
                         }} className="w-24 h-24 bg-black/40 rounded-[2rem] border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-red-500/50 transition-all relative group shadow-2xl">
                           {item ? (
                             <>
                               <img src={item.img} className="w-16 h-16 object-contain drop-shadow-xl" alt="" />
                               <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-[2rem]">
                                  <Minus className="w-6 h-6 text-red-500" />
                               </div>
                             </>
                           ) : <Zap className="w-10 h-10 text-white/5" />}
                         </div>
                       ))}
                    </div>
                    <ChevronRight className={`w-14 h-14 text-yellow-400 ${upgrade.isRolling ? 'animate-pulse' : ''}`} />
                    <div className="w-40 h-40 bg-yellow-400/5 rounded-[3rem] border-2 border-yellow-400/20 flex items-center justify-center shadow-2xl relative group">
                       <div className="absolute inset-0 bg-yellow-400/5 blur-[50px] rounded-full opacity-50" />
                       {upgrade.targetItem ? <img src={upgrade.targetItem.img} className="w-28 h-28 object-contain drop-shadow-[0_0_40px_rgba(250,204,21,0.2)] relative z-10" alt="" /> : <Zap className="w-16 h-16 text-yellow-400/20" />}
                    </div>
                 </div>

                 <div className="flex flex-col items-center gap-3 mb-12 z-10">
                    <div className="text-8xl font-black italic text-white tracking-tighter leading-none">{upgradeChance.toFixed(1)}%</div>
                    <span className="text-xs font-black text-gray-500 uppercase tracking-[0.5em] italic">Probability Threshold</span>
                 </div>
                 
                 <button 
                  onClick={handleUpgradeRoll}
                  disabled={upgrade.isRolling || totalUpgradeValue === 0 || !upgrade.targetItem}
                  className="bg-yellow-400 text-black px-24 py-6 rounded-[2.5rem] font-black uppercase text-3xl shadow-[0_20px_70px_rgba(250,204,21,0.3)] hover:scale-105 active:scale-95 transition-all tracking-tighter disabled:opacity-20 disabled:hover:scale-100 disabled:cursor-not-allowed z-10"
                 >
                   {upgrade.isRolling ? "TRANSMUTING..." : "FORGE SKIN"}
                 </button>

                 {upgrade.result && (
                   <div className={`mt-12 px-8 py-3 rounded-full font-black uppercase text-md italic tracking-[0.2em] animate-bounce z-10 ${upgrade.result === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                      {upgrade.result === 'success' ? "Operation Success 🎉" : "Operation Failure 💀"}
                   </div>
                 )}
              </div>

              <div className="col-span-3 bg-[#14171c] rounded-[3rem] p-8 border border-white/5 flex flex-col h-[65vh] shadow-2xl">
                <h4 className="text-[10px] font-black uppercase text-gray-500 mb-8 tracking-[0.3em]">Output Targets</h4>
                <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-4">
                  {ALL_SKINS.filter(s => s.price > totalUpgradeValue && s.price < totalUpgradeValue * 25).map(item => (
                    <div key={item.id} onClick={() => setUpgrade({...upgrade, targetItem: item})} className={`p-5 rounded-[1.5rem] flex items-center gap-5 cursor-pointer transition-all border shadow-lg ${upgrade.targetItem?.id === item.id ? 'bg-yellow-400/10 border-yellow-400' : 'bg-black/30 border-transparent hover:bg-white/5'}`}>
                      <img src={item.img} className="w-14 h-14 object-contain" alt="" />
                      <div className="leading-none overflow-hidden">
                        <div className="text-[10px] font-black text-gray-500 uppercase truncate mb-1">{item.weapon}</div>
                        <div className="text-xs font-black text-white truncate">{item.skinName}</div>
                        <div className="text-sm font-black text-yellow-400 mt-2 tracking-tighter">${item.price.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                  {totalUpgradeValue === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-10 text-center space-y-4 py-10">
                       <Zap className="w-16 h-16" />
                       <span className="text-[11px] font-black uppercase italic tracking-widest">Selection Required</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory / Vault */}
        {activePage === 'inventory' && (
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex justify-between items-end border-b border-white/5 pb-10">
              <div className="space-y-4">
                <h2 className="text-6xl font-black uppercase text-white italic tracking-tighter leading-none">PERSONAL <span className="text-yellow-400">VAULT</span></h2>
                <div className="flex items-center gap-6">
                   <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">{user.inventory.length} Encrypted Assets</div>
                   <div className="text-xs font-black uppercase text-gray-600 tracking-widest">Total Valuation: <span className="text-yellow-400 ml-2">${user.inventory.reduce((a, b) => a + b.price, 0).toFixed(2)}</span></div>
                </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => { user.inventory.forEach(i => MockBackendService.sellItem(user.id, i.uid)); setUser(MockBackendService.getCurrentUser()); }} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-10 py-4 rounded-3xl font-black text-[11px] transition-all border border-red-500/20 uppercase tracking-[0.3em] flex items-center gap-3">
                    <Trash2 className="w-4 h-4" /> Liquify All Assets
                 </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8">
              {user.inventory.map(item => (
                <div key={item.uid} className="bg-[#14171c] p-8 rounded-[3rem] border-b-8 relative group hover:-translate-y-4 transition-all shadow-2xl active:scale-95" style={{ borderBottomColor: item.color }}>
                  <img src={item.img} className="w-full h-32 object-contain mb-6 drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-700" alt="" />
                  <div className="text-center">
                    <div className="text-[10px] font-black uppercase text-gray-500 truncate leading-none mb-2 tracking-widest">{item.weapon}</div>
                    <div className="text-sm font-black text-white truncate italic tracking-tighter">{item.skinName}</div>
                    <div className="text-md font-black text-yellow-400 mt-4 tracking-tighter">${item.price.toFixed(2)}</div>
                  </div>
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem] flex items-center justify-center p-6">
                    <button onClick={() => { MockBackendService.sellItem(user.id, item.uid); setUser(MockBackendService.getCurrentUser()); }} className="bg-red-500 text-white w-full py-4 rounded-2xl shadow-2xl hover:scale-105 transition-transform font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" /> Sell Item
                    </button>
                  </div>
                </div>
              ))}
              {user.inventory.length === 0 && (
                <div className="col-span-full py-48 flex flex-col items-center justify-center border-4 border-dashed border-white/5 rounded-[5rem] opacity-20 text-center grayscale">
                   <Box className="w-24 h-24 mb-10" />
                   <h3 className="text-4xl font-black uppercase italic tracking-tighter">SECURE STORAGE OFFLINE</h3>
                   <p className="text-sm font-bold uppercase tracking-[0.4em] mt-3">Decrypt cases to populate your inventory</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Dashboard */}
        {activePage === 'admin' && user.isAdmin && (
          <div className="max-w-7xl mx-auto space-y-12">
            <h2 className="text-6xl font-black uppercase text-red-500 italic tracking-tighter leading-none flex items-center gap-6">
              <ShieldAlert className="w-16 h-16" /> SYSTEM <span className="text-white">TERMINAL</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               <div className="bg-[#14171c] p-12 rounded-[4rem] border border-white/5 flex flex-col gap-3 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><Users className="w-32 h-32" /></div>
                  <Users className="text-red-500 w-10 h-10 mb-6" />
                  <span className="text-[11px] font-black uppercase text-gray-500 tracking-[0.4em]">Indexed User Base</span>
                  <span className="text-6xl font-black italic text-white tracking-tighter">{adminUsers.length}</span>
               </div>
               <div className="bg-[#14171c] p-12 rounded-[4rem] border border-white/5 flex flex-col gap-3 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><LinkIcon className="w-32 h-32" /></div>
                  <LinkIcon className="text-red-500 w-10 h-10 mb-6" />
                  <span className="text-[11px] font-black uppercase text-gray-500 tracking-[0.4em]">Referral Linkage</span>
                  <span className="text-6xl font-black italic text-white tracking-tighter">{adminInvites.length}</span>
               </div>
               <div className="bg-[#14171c] p-12 rounded-[4rem] border border-white/5 flex flex-col gap-3 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><Coins className="w-32 h-32" /></div>
                  <Coins className="text-red-500 w-10 h-10 mb-6" />
                  <span className="text-[11px] font-black uppercase text-gray-500 tracking-[0.4em]">Aggregated Credits</span>
                  <span className="text-6xl font-black italic text-white tracking-tighter">${adminUsers.reduce((a, b) => a + b.balance, 0).toFixed(0)}</span>
               </div>
            </div>

            <div className="bg-[#14171c] rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl">
               <div className="p-10 border-b border-white/5 flex items-center justify-between bg-black/20">
                  <h3 className="text-2xl font-black uppercase italic text-white tracking-tighter">Database Records</h3>
                  <div className="relative group">
                     <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-600 group-hover:text-red-500 transition-colors" />
                     <input placeholder="Search UID / Username..." className="bg-black/40 border border-white/5 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-white outline-none focus:border-red-500/50 transition-all w-80 font-bold tracking-widest" />
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="text-[11px] font-black uppercase text-gray-500 tracking-[0.3em] bg-white/[0.02] border-b border-white/5">
                           <th className="p-8">Entity / Provider</th>
                           <th className="p-8">Credit Balance</th>
                           <th className="p-8">Invited Nodes</th>
                           <th className="p-8">Administrative Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {adminUsers.map(u => (
                           <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="p-8">
                                 <div className="flex items-center gap-6">
                                    <div className="relative">
                                       <img src={u.avatar} className="w-14 h-14 rounded-2xl border border-white/10 group-hover:border-red-500/30 transition-colors" alt="" />
                                       {u.isAdmin && <ShieldAlert className="absolute -top-2 -right-2 w-5 h-5 text-red-500 bg-[#14171c] rounded-full p-0.5" />}
                                    </div>
                                    <div>
                                       <div className="text-md font-black text-white italic">{u.username}</div>
                                       <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">{u.id} | {u.provider}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-8">
                                 <div className="flex flex-col">
                                    <span className="text-xl font-black text-yellow-400 tracking-tighter">${u.balance.toFixed(2)}</span>
                                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Adjustable Credits</span>
                                 </div>
                              </td>
                              <td className="p-8">
                                 <div className="text-2xl font-black text-white italic">{adminInvites.filter(i => i.inviterId === u.id).length}</div>
                              </td>
                              <td className="p-8">
                                 <div className="flex gap-4">
                                    <button onClick={() => handleAdminAddBalance(u.id, 100)} className="bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border border-green-500/20">
                                       <Plus className="w-3 h-3" /> $100
                                    </button>
                                    <button onClick={() => handleAdminAddBalance(u.id, -100)} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border border-red-500/20">
                                       <Minus className="w-3 h-3" /> $100
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Case Opening Overlay */}
      {selectedCase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 p-6 backdrop-blur-2xl">
          <div className="w-full max-w-5xl bg-[#0b0d11] rounded-[5rem] border border-white/10 p-20 relative overflow-hidden shadow-[0_0_200px_rgba(250,204,21,0.15)]">
             <button onClick={() => { if(!isSpinning) setSelectedCase(null); }} className="absolute top-14 right-14 text-gray-600 hover:text-white transition-all transform hover:rotate-90"><X className="w-12 h-12" /></button>
             
             <div className="text-center mb-16">
                <span className="text-[11px] font-black uppercase tracking-[0.6em] text-yellow-400 mb-4 block animate-pulse">Initializing Decryption</span>
                <h2 className="text-7xl font-black uppercase italic tracking-tighter text-white leading-none">{selectedCase.name}</h2>
                <div className="flex items-center justify-center gap-6 mt-6">
                   <div className="w-3 h-3 rounded-full bg-yellow-400 animate-ping" />
                   <p className="text-yellow-400 font-black text-3xl tracking-tighter">${selectedCase.price.toFixed(2)} CREDITS</p>
                </div>
             </div>

             <div className="relative h-64 bg-black/40 rounded-[3.5rem] overflow-hidden border border-white/5 mb-16 flex items-center shadow-inner">
                <div className="absolute inset-0 spinner-gradient z-10 pointer-events-none" />
                <div className="absolute left-1/2 top-0 bottom-0 w-1.5 bg-yellow-400 z-20 shadow-[0_0_40px_#facc15] before:content-[''] before:absolute before:top-0 before:left-[-12px] before:border-l-[12px] before:border-l-transparent before:border-r-[12px] before:border-r-transparent before:border-t-[12px] before:border-t-yellow-400 after:content-[''] after:absolute after:bottom-0 after:left-[-12px] after:border-l-[12px] after:border-l-transparent after:border-r-[12px] after:border-r-transparent after:border-b-[12px] after:border-b-yellow-400" />
                
                <div 
                  className={`flex gap-5 transition-transform duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1) ${isSpinning ? 'translate-x-[-3500px]' : 'translate-x-0'}`} 
                  style={{ paddingLeft: '50%' }}
                >
                  {Array.from({ length: 100 }).map((_, i) => {
                    const s = selectedCase.contents[Math.floor(Math.random() * selectedCase.contents.length)].skin;
                    return (
                      <div key={i} className="min-w-[200px] h-48 bg-[#14171c] border-b-4 flex flex-col items-center justify-center p-8 rounded-[2rem] shadow-2xl relative group overflow-hidden" style={{ borderBottomColor: s.color }}>
                        <div className="absolute top-0 right-0 p-3 opacity-5 text-[8px] font-black text-white italic">OD-{i}</div>
                        <img src={s.img} className="h-32 object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-700" alt="" />
                        <div className="text-[10px] font-black text-gray-500 uppercase mt-4 truncate w-full text-center tracking-[0.2em]">{s.skinName}</div>
                      </div>
                    );
                  })}
                </div>
             </div>

             <div className="flex flex-col items-center gap-10">
                {!wonSkin ? (
                  <button 
                    disabled={isSpinning}
                    onClick={startSpin}
                    className="bg-yellow-400 text-black px-32 py-8 rounded-[3rem] font-black uppercase text-4xl shadow-[0_20px_80px_rgba(250,204,21,0.25)] hover:scale-105 active:scale-95 transition-all tracking-tighter relative group"
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isSpinning ? "COMPUTING HASH..." : "COMMENCE DECRYPT"}
                  </button>
                ) : (
                  <div className="text-center animate-bounce-in w-full max-w-md">
                    <div className="relative mb-10">
                        <div className="absolute inset-0 bg-white/5 blur-[120px] rounded-full animate-pulse" />
                        <img src={wonSkin.img} className="h-72 w-full object-contain drop-shadow-[0_0_100px_rgba(255,255,255,0.25)] relative z-10" alt="" />
                    </div>
                    <span className="text-[12px] font-black uppercase tracking-[0.6em] text-gray-500 block mb-2">{wonSkin.weapon}</span>
                    <h3 className="text-5xl font-black uppercase italic text-white tracking-tighter" style={{ color: wonSkin.color }}>{wonSkin.name}</h3>
                    <p className="text-gray-500 font-black mb-12 text-3xl tracking-tighter mt-4 italic">${wonSkin.price.toFixed(2)}</p>
                    <div className="flex gap-6">
                      <button onClick={() => { MockBackendService.sellItem(user.id, user.inventory[0].uid); setUser(MockBackendService.getCurrentUser()); setWonSkin(null); setSelectedCase(null); }} className="flex-1 bg-white/5 border border-white/10 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] hover:bg-white/10 transition-all shadow-xl">Market Sell</button>
                      <button onClick={() => { setWonSkin(null); setSelectedCase(null); }} className="flex-1 bg-yellow-400 text-black px-12 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl shadow-yellow-400/20 hover:scale-105 transition-all">Vault Transfer</button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* AI Intelligence Assistant */}
      <div className="fixed bottom-12 right-12 z-[80]">
        <div className={`bg-[#14171c] border border-white/5 w-80 rounded-[3rem] overflow-hidden shadow-[0_30px_120px_rgba(0,0,0,0.9)] mb-8 transition-all duration-700 transform ${isLoadingAi || aiMessage ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none translate-y-12'}`}>
          <div className="bg-yellow-400 p-6 text-black font-black uppercase text-[10px] flex items-center justify-between tracking-[0.4em] italic shadow-lg">
            <div className="flex items-center gap-3"><TrendingUp className="w-4 h-4" /> Market-Intel v1.5</div>
            <div className="w-2.5 h-2.5 rounded-full bg-black animate-pulse shadow-[0_0_10px_black]" />
          </div>
          <div className="p-10 bg-gradient-to-b from-[#14171c] to-[#0b0d11] text-[14px] text-gray-300 min-h-[120px] leading-relaxed italic font-medium relative">
            <div className="absolute top-2 left-2 opacity-5"><Info className="w-12 h-12" /></div>
            {isLoadingAi ? (
              <div className="flex flex-col gap-4">
                 <div className="h-3 bg-white/5 rounded-full w-full animate-pulse shadow-inner" />
                 <div className="h-3 bg-white/5 rounded-full w-4/5 animate-pulse shadow-inner" />
                 <div className="h-3 bg-white/5 rounded-full w-3/5 animate-pulse shadow-inner" />
              </div>
            ) : `"${aiMessage}"`}
          </div>
          <div className="p-5 border-t border-white/5 bg-[#0b0d11] flex gap-4">
            <input 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiChat()}
              placeholder="Query Oto Market Data..."
              className="bg-black/30 border border-white/5 rounded-[1.5rem] px-6 py-4 text-[11px] flex-1 outline-none text-white focus:border-yellow-400/50 transition-all font-bold uppercase tracking-widest placeholder:text-gray-700" 
            />
            <button onClick={handleAiChat} className="bg-yellow-400 p-4 rounded-[1.5rem] text-black shadow-xl shadow-yellow-400/10 hover:scale-110 transition-transform active:scale-90"><Zap className="w-6 h-6" /></button>
          </div>
        </div>
        <button 
          onClick={() => setAiMessage(prev => prev ? "" : "Oto is processing real-time skin trends. How can I assist? 📊")}
          className="bg-yellow-400 text-black p-7 rounded-[3rem] shadow-[0_20px_100px_rgba(250,204,21,0.2)] hover:scale-110 active:scale-95 transition-all flex items-center gap-5 font-black uppercase text-xs tracking-tighter border-4 border-black shadow-2xl"
        >
          <TrendingUp className="w-8 h-8" /> Market Assistant
        </button>
      </div>

      <footer className="bg-[#0f1116] border-t border-white/5 p-20 text-center">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-16 opacity-20 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white font-black text-lg">OD</div>
               <span className="text-2xl font-black uppercase italic tracking-tighter">OTODROP <span className="text-white/20">PRODUCTION v3.0</span></span>
            </div>
            <p className="text-gray-500 text-[11px] font-black uppercase tracking-[0.6em] max-w-sm leading-loose">Provably fair. Registered virtual assets. Responsible decryption encouraged.</p>
            <div className="flex gap-10">
               <UserIcon className="w-6 h-6 text-gray-400 hover:text-white transition-colors cursor-pointer" />
               <LayoutGrid className="w-6 h-6 text-gray-400 hover:text-white transition-colors cursor-pointer" />
               <Coins className="w-6 h-6 text-gray-400 hover:text-white transition-colors cursor-pointer" />
            </div>
         </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 50s linear infinite;
        }
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
        }
        .upgrade-shake {
          animation: shake 0.2s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0); }
          25% { transform: translate(-2px, 2px) rotate(-1deg); }
          50% { transform: translate(2px, -2px) rotate(1deg); }
          75% { transform: translate(-2px, -2px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
