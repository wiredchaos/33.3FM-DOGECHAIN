/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, X, CreditCard, Smartphone, ShieldCheck, HelpCircle } from 'lucide-react';
import { LedgerEntry } from '../types';

interface XentsOptions {
  context?: string;
  minBalance?: number;
  reason?: string;
  onSuccess?: () => void;
}

export default function XentsWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [rail, setRail] = useState<'stripe' | 'apple' | 'usdc' | 'x402'>('stripe');
  const [amount, setAmount] = useState<number | ''>('');
  const [options, setOptions] = useState<XentsOptions | null>(null);
  const [coins, setCoins] = useState<{ id: number; left: number; top: number }[]>();
  const [toast, setToast] = useState<{ visible: boolean; msg: string; kind: string }>({ visible: false, msg: '', kind: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const RATE = 100; // $1 = 100 $XENTS

  const RAIL_INFO = {
    stripe: { name: 'STRIPE', icon: '◉', min: 5, max: 500 },
    apple: { name: 'APPLE PAY', icon: '◈', min: 5, max: 500 },
    usdc: { name: 'USDC BASE', icon: '▣', min: 10, max: 10000 },
    x402: { name: 'x402 MICRO', icon: '⟁', min: 1, max: 5 }
  };

  // Synchronize with local storage
  const readBalance = () => {
    return Number(localStorage.getItem('wc_xents_balance') || 0);
  };

  const getLedger = () => {
    try {
      return JSON.parse(localStorage.getItem('wc_xents_ledger') || '[]');
    } catch {
      return [];
    }
  };

  const addLedger = (entry: Omit<LedgerEntry, 'ts'>) => {
    const fresh: LedgerEntry = { ts: Date.now(), ...entry };
    const list = [fresh, ...getLedger()].slice(0, 50);
    localStorage.setItem('wc_xents_ledger', JSON.stringify(list));
    // Trigger storage event for local updates
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    setBalance(readBalance());

    const handleStorageChange = () => {
      setBalance(readBalance());
    };

    window.addEventListener('storage', handleStorageChange);

    // Expose window.XentsChange API for drop-in suitability
    (window as any).XentsChange = {
      VERSION: '2.0.0-react',
      RATE,
      open: (opts: XentsOptions = {}) => {
        setOptions(opts);
        if (opts.minBalance) {
          const needed = Math.max(0, opts.minBalance - readBalance());
          if (needed > 0) {
            setAmount(Math.ceil(needed / RATE));
          } else {
            setAmount('');
          }
        } else {
          setAmount('');
        }
        setIsOpen(true);
      },
      close: () => {
        setIsOpen(false);
      },
      spend: (opts: { amount: number; label: string; category?: string; autoTopUp?: boolean }) => {
        const balNow = readBalance();
        if (balNow < opts.amount) {
          if (opts.autoTopUp) {
            (window as any).XentsChange.open({
              context: opts.category || 'spend',
              minBalance: opts.amount,
              reason: `${opts.label} requires ⟁${opts.amount.toLocaleString()}. You only have ⟁${balNow.toLocaleString()}.`,
              onSuccess: () => {
                (window as any).XentsChange.spend(opts);
              }
            });
          }
          return false;
        }

        const nextBal = balNow - opts.amount;
        localStorage.setItem('wc_xents_balance', String(nextBal));
        const entries: LedgerEntry = {
          ts: Date.now(),
          type: 'spend',
          label: opts.label,
          category: opts.category || 'misc',
          xents: -opts.amount
        };
        const list = [entries, ...getLedger()].slice(0, 50);
        localStorage.setItem('wc_xents_ledger', JSON.stringify(list));

        window.dispatchEvent(new Event('storage'));
        return true;
      },
      bonus: (opts: { amount: number; label: string }) => {
        if (!opts.amount || opts.amount <= 0) return false;
        const balNow = readBalance();
        const nextBal = balNow + opts.amount;
        localStorage.setItem('wc_xents_balance', String(nextBal));
        const entries: LedgerEntry = {
          ts: Date.now(),
          type: 'bonus',
          label: opts.label,
          xents: opts.amount
        };
        const list = [entries, ...getLedger()].slice(0, 50);
        localStorage.setItem('wc_xents_ledger', JSON.stringify(list));

        window.dispatchEvent(new Event('storage'));
        return true;
      },
      balance: () => readBalance(),
      ledger: () => getLedger(),
      usdValue: () => readBalance() / RATE
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const triggerToast = (msg: string, kind = 'win') => {
    setToast({ visible: true, msg, kind });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2500);
  };

  const spawnCoin = () => {
    const left = 40 + Math.random() * 20;
    const top = 30 + Math.random() * 10;
    const id = Date.now() + Math.random();
    setCoins(prev => [...(prev || []), { id, left, top }]);
    setTimeout(() => {
      setCoins(prev => (prev || []).filter(c => c.id !== id));
    }, 1200);
  };

  const currentAmt = typeof amount === 'number' ? amount : 0;
  const currentRailInfo = RAIL_INFO[rail];
  const isButtonDisabled =
    isProcessing ||
    currentAmt <= 0 ||
    currentAmt < currentRailInfo.min ||
    currentAmt > currentRailInfo.max;

  const getButtonText = () => {
    if (isProcessing) return 'PROCESSING...';
    if (currentAmt <= 0) return '◢ ENTER AMOUNT';
    if (currentAmt < currentRailInfo.min) return `◢ MIN $${currentRailInfo.min}`;
    if (currentAmt > currentRailInfo.max) return `◢ MAX $${currentRailInfo.max}`;
    return `⟁ DEPOSIT $${currentAmt} → ⟁${(currentAmt * RATE).toLocaleString()}`;
  };

  const handleDeposit = () => {
    if (isButtonDisabled) return;
    setIsProcessing(true);

    // Coins shower animation
    const coinsCount = Math.min(6, Math.ceil(currentAmt / 5));
    for (let i = 0; i < coinsCount; i++) {
      setTimeout(() => spawnCoin(), i * 100);
    }

    const duration = rail === 'x402' ? 500 : rail === 'usdc' ? 1400 : 900;
    setTimeout(() => {
      const added = currentAmt * RATE;
      const nextBal = balance + added;
      localStorage.setItem('wc_xents_balance', String(nextBal));
      setBalance(nextBal);

      addLedger({
        type: 'deposit',
        label: `DEPOSIT VIA ${currentRailInfo.name}`,
        rail: currentRailInfo.name,
        usd: currentAmt,
        xents: added
      });

      triggerToast(`+ ⟁${added.toLocaleString()} CREDITED`, 'win');
      setIsProcessing(false);

      if (options && options.minBalance && nextBal >= options.minBalance) {
        const successCb = options.onSuccess;
        setTimeout(() => {
          setIsOpen(false);
          if (typeof successCb === 'function') successCb();
        }, 500);
      } else {
        setAmount('');
      }
    }, duration);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-[380px] rounded-xl border-3 border-neutral-800 bg-gradient-to-b from-neutral-900 to-black p-5 text-[#00ffe6] shadow-[0_0_60px_rgba(194,166,51,0.25)]"
              id="xw-modal-inner"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center border border-neutral-800 bg-transparent text-neutral-500 transition-colors hover:border-red-600 hover:text-red-500 font-bold text-xs"
              >
                ✕
              </button>

              <div className="mb-4 border-b-2 border-neutral-800 pb-3 text-center">
                <div className="font-orbitron font-black text-xl text-[#c2a633] tracking-widest uppercase">
                  $1 <span className="text-[#00ffe6] mx-1">→</span> ⟁100
                </div>
                <div className="mt-1 font-mono text-[9px] tracking-[0.3em] text-[#00ffe6]/70">
                  // $XENTS CHANGE MACHINE //
                </div>
              </div>

              {options?.reason && (
                <div className="mb-4 border border-dashed border-red-500/40 bg-red-950/20 p-2.5 text-center text-xs text-red-500 leading-normal">
                  <span className="block font-orbitron text-[8px] tracking-[0.25em] font-bold text-red-500/60 mb-1">
                    ◉ {options.context?.toUpperCase() || 'GATEWAY LOCK'}
                  </span>
                  {options.reason}
                </div>
              )}

              {/* Balance Box */}
              <div className="mb-4 flex items-center justify-between border border-neutral-900 bg-black p-3 rounded">
                <span className="font-orbitron text-[9px] tracking-widest text-[#c2a633]">
                  CURRENT BALANCE
                </span>
                <span className="font-orbitron text-lg font-black text-[#c2a633] drop-shadow-[0_0_8px_rgba(194,166,51,0.4)] flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-[#00ffe6]" /> ⟁ {balance.toLocaleString()}
                </span>
              </div>

              {/* Rails Selection */}
              <div className="grid grid-cols-4 gap-1 mb-3">
                {(['stripe', 'apple', 'usdc', 'x402'] as const).map(rKey => {
                  const r = RAIL_INFO[rKey];
                  const active = rail === rKey;
                  return (
                    <button
                      key={rKey}
                      onClick={() => setRail(rKey)}
                      className={`flex flex-col items-center justify-center p-2 border font-orbitron text-[8px] tracking-wider text-center cursor-pointer transition-all ${
                        active
                          ? 'bg-neutral-800 border-[#c2a633] text-[#c2a633] shadow-[inset_0_0_10px_rgba(194,166,51,0.15)] font-bold'
                          : 'bg-[#15171c] border-neutral-800 text-neutral-500 hover:text-white hover:border-[#00ffe6]'
                      }`}
                    >
                      <span className="text-sm mb-0.5">{r.icon}</span>
                      {r.name}
                    </button>
                  );
                })}
              </div>

              {/* Amount Inputs */}
              <div className="mb-2 flex items-center gap-2 border-2 border-neutral-800 bg-black px-3 py-2 rounded focus-within:border-[#c2a633] focus-within:shadow-[0_0_10px_rgba(194,166,51,0.2)] transition-all">
                <span className="font-orbitron text-xl font-black text-[#c2a633]">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => {
                    const v = e.target.value === '' ? '' : Math.max(0, Math.floor(Number(e.target.value) || 0));
                    setAmount(v);
                  }}
                  className="flex-1 border-0 bg-transparent text-emerald-400 font-mono text-2xl outline-none drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]"
                  placeholder="0"
                  min="0"
                />
              </div>

              {/* Quick Picks */}
              <div className="grid grid-cols-4 gap-1 mb-3">
                {[5, 10, 25, 50].map(val => {
                  const active = amount === val;
                  return (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-1.5 text-[10px] font-orbitron border cursor-pointer transition-all ${
                        active
                          ? 'border-[#c2a633] bg-[#c2a633]/15 text-[#c2a633] font-bold'
                          : 'bg-[#15171c] border-neutral-800 text-[#00ffe6] hover:bg-neutral-800 hover:border-[#00ffe6]'
                      }`}
                    >
                      ${val}
                    </button>
                  );
                })}
              </div>

              {/* Preview Receive Box */}
              <div className="mb-4 border border-dashed border-[#c2a633] bg-[#c2a633]/5 p-2.5 text-center">
                <span className="font-orbitron text-[8px] tracking-[0.3em] text-[#c2a633]/70">
                  YOU RECEIVE
                </span>
                <div className="font-orbitron text-2xl font-black text-[#c2a633] mt-0.5 drop-shadow-[0_0_6px_rgba(194,166,51,0.3)]">
                  ⟁ {(currentAmt * RATE).toLocaleString()}
                </div>
              </div>

              {/* Submit Deposit Button */}
              <button
                onClick={handleDeposit}
                disabled={isButtonDisabled}
                className={`w-full py-3 border-2 font-orbitron text-xs font-black tracking-widest cursor-pointer shadow-lg active:translate-y-0.5 transition-all text-white ${
                  isButtonDisabled
                    ? 'bg-gradient-to-b from-neutral-800 to-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-b from-red-500 to-red-800 border-red-500 hover:from-red-400 hover:to-red-700 active:from-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]'
                }`}
              >
                {getButtonText()}
              </button>

              <div className="mt-3 text-center font-mono text-[7px] text-[#00ffe6]/40 leading-relaxed tracking-widest uppercase">
                <div>⟁ 1:1 Locked · One-Way · No Cash-Out</div>
                <div className="text-[#c2a633]/70 mt-0.5">Utility Credit · Not an Investment</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Coins Showers */}
      {coins && coins.map(c => (
        <div
          key={c.id}
          className="fixed flex items-center justify-center font-orbitron font-black text-xs text-[#00ffe6] h-8 w-8 rounded-full border border-[#c2a633] pointer-events-none shadow-[0_0_12px_rgba(194,166,51,0.5)] z-[100001]"
          style={{
            left: `${c.left}%`,
            top: `${c.top}%`,
            background: 'radial-gradient(circle at 35% 35%, #fff, #c2a633 60%, #7a6a20)',
            animation: 'coinDrop 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) forwards'
          }}
        >
          ⟁
        </div>
      ))}

      {/* Toast Alert */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 p-3 font-orbitron text-xs font-black tracking-widest shadow-2xl z-[100000] border border-[#c2a633] bg-black text-[#c2a633] min-w-[200px] text-center ${
              toast.kind === 'win'
                ? 'border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
                : toast.kind === 'err'
                ? 'border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                : ''
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes coinDrop {
          0% { transform: translateY(-120px) rotate(0deg); opacity: 1; }
          60% { transform: translateY(10px) rotate(360deg); opacity: 1; }
          100% { transform: translateY(60px) rotate(450deg); opacity: 0; }
        }
      `}</style>
    </>
  );
}
