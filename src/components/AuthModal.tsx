import React, { useState } from 'react';
import { 
  isFirebaseConfigured, 
  auth as firebaseAuth, 
  UserSession, 
  setLocalSession 
} from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut 
} from 'firebase/auth';
import { ChaosPulse } from './motion/ChaosPulse';
import { AgentStatusOrb } from './motion/AgentStatusOrb';
import { Shield, Mail, Lock, User, X, Check, AlertTriangle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onUserChange: (user: UserSession | null) => void;
}

export default function AuthModal({ isOpen, onClose, currentUser, onUserChange }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError("Please fill in all security fields.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Security credentials must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      if (isFirebaseConfigured && firebaseAuth) {
        // --- REAL FIREBASE INTEG ---
        if (isSignUp) {
          const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
          const session: UserSession = {
            uid: userCredential.user.uid,
            email: email,
            displayName: nickname || email.split('@')[0],
            isMock: false
          };
          onUserChange(session);
          setLocalSession(session);
          setSuccessMsg("Biometric node registration verified successfully!");
        } else {
          const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
          const session: UserSession = {
            uid: userCredential.user.uid,
            email: email,
            displayName: userCredential.user.displayName || email.split('@')[0],
            isMock: false
          };
          onUserChange(session);
          setLocalSession(session);
          setSuccessMsg("Uplink handshake approved. Node active.");
        }
      } else {
        // --- OFFLINE DEV MODE FALLBACK ---
        const usersStr = localStorage.getItem("wc_stored_users") || "{}";
        const users = JSON.parse(usersStr);

        if (isSignUp) {
          if (users[email.toLowerCase()]) {
            throw new Error("Local biometric email footprint already registered.");
          }
          const simulatedUid = 'user_' + Math.random().toString(36).substring(2, 11);
          const newUser = {
            uid: simulatedUid,
            email: email,
            password: password,
            displayName: nickname || email.split('@')[0],
            isMock: true
          };
          users[email.toLowerCase()] = newUser;
          localStorage.setItem("wc_stored_users", JSON.stringify(users));

          const session: UserSession = {
            uid: simulatedUid,
            email: email,
            displayName: newUser.displayName,
            isMock: true
          };
          onUserChange(session);
          setLocalSession(session);
          setSuccessMsg("Sandbox registration generated. Node credentials stored offline.");
        } else {
          const registeredUser = users[email.toLowerCase()];
          if (!registeredUser || registeredUser.password !== password) {
            throw new Error("Invalid biometric email or decryption key.");
          }

          const session: UserSession = {
            uid: registeredUser.uid,
            email: registeredUser.email,
            displayName: registeredUser.displayName,
            isMock: true
          };
          onUserChange(session);
          setLocalSession(session);
          setSuccessMsg("Sandbox handshake authorized. Welcome counter-sign offline.");
        }
      }

      // Clear fields and auto close on success after a short delay
      setTimeout(() => {
        setEmail('');
        setPassword('');
        setNickname('');
        onClose();
        setSuccessMsg(null);
      }, 1500);

    } catch (err: any) {
      console.error("Authentication handshake exception:", err);
      setError(err?.message || "Encryption interface negotiation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (isFirebaseConfigured && firebaseAuth) {
        await fbSignOut(firebaseAuth);
      }
      onUserChange(null);
      setLocalSession(null);
      setSuccessMsg("Uplink severed. Local keys flushed.");
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to disconnect security node.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#050507] border-2 border-neutral-900 rounded-2xl relative overflow-hidden shadow-[0_0_50px_rgba(255,26,46,0.15)] font-mono">
        {/* Futuristic Grid Accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-[#00ffe6] to-[#c2a633]" />
        
        {/* Title & Close */}
        <div className="p-6 border-b border-neutral-900 flex justify-between items-center bg-black/45">
          <div className="flex items-center gap-2.5">
            <AgentStatusOrb status={currentUser ? "active" : "idle"} size="sm" />
            <div>
              <h2 className="font-orbitron font-extrabold text-[#fff] text-sm uppercase tracking-wider leading-none">
                {currentUser ? "◢ SECURITY NODE: CONNECTED" : "◢ SECURITY handSHAKE UPLINK"}
              </h2>
              <span className="text-[8px] text-neutral-500 tracking-widest uppercase mt-1 block">
                {isFirebaseConfigured ? "SYSTEM: FIREBASE SECURITY AUTH" : "SYSTEM: OFFLINE DIRECTORY FALLBACK"}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Notification Area */}
        {!isFirebaseConfigured && (
          <div className="bg-yellow-950/20 border-b border-yellow-900/30 px-6 py-2.5 flex items-center gap-2.5 text-[9px] text-[#c2a633]">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#c2a633] animate-pulse" />
            <span>LOCAL HANDSHAKE INTERFACE ACTIVE. KEYS STORED SECURELY IN SANDBOX CACHE.</span>
          </div>
        )}

        {/* Content Box */}
        <div className="p-6">
          {currentUser ? (
            // --- LOGGED IN STATUS PANEL ---
            <div className="space-y-5 py-2">
              <ChaosPulse variant="cyan" speed="normal">
                <div className="p-4 bg-black/40">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Authenticated Profile Signature</div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-[#00ffe6] font-extrabold truncate">
                      <span className="text-neutral-500 font-normal">NICKNAME:</span> {currentUser.displayName || "ANONYMOUS"}
                    </p>
                    <p className="text-xs text-white tracking-widest truncate">
                      <span className="text-neutral-500 font-normal font-mono">NODE-EMAIL:</span> {currentUser.email}
                    </p>
                    <p className="text-[9px] text-neutral-500">
                      <span className="text-neutral-500 font-normal">FOOTPRINT:</span> {currentUser.uid}
                    </p>
                  </div>
                </div>
              </ChaosPulse>

              <div className="text-center text-[10px] text-neutral-550 leading-relaxed italic py-1">
                "We live in the margins. Radio waves cross borders without checkpoints. Your frequency is secured."
              </div>

              {successMsg && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/40 text-emerald-400 text-xs rounded text-center font-bold">
                  {successMsg}
                </div>
              )}

              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-b from-red-950/20 to-neutral-950 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white font-bold font-orbitron text-xs tracking-widest transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "SEVERING CONNECTION..." : "◤ SEVER TRANSMISSION LINK (LOG OUT)"}
              </button>
            </div>
          ) : (
            // --- SIGN IN or REGISTER PANEL ---
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {/* Tab Selector buttons */}
              <div className="grid grid-cols-2 gap-2 border-b border-neutral-900 pb-4">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(null); }}
                  className={`py-2 text-[10px] font-orbitron font-extrabold tracking-widest border transition-all rounded ${
                    !isSignUp 
                      ? "bg-neutral-950/60 border-neutral-700 text-[#00ffe6]" 
                      : "bg-transparent border-transparent text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  ◤ ESTABLISH DECRYPT (LOG IN)
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(null); }}
                  className={`py-2 text-[10px] font-orbitron font-extrabold tracking-widest border transition-all rounded ${
                    isSignUp 
                      ? "bg-neutral-950/60 border-neutral-700 text-[#ff1a2e]" 
                      : "bg-transparent border-transparent text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  ◣ INITIALIZE FOOTPRINT (SIGN UP)
                </button>
              </div>

              {/* Status or Alert feedback bar */}
              {error && (
                <div className="p-2.5 bg-red-950/35 border border-red-500/30 text-red-400 text-[10px] rounded font-bold leading-normal">
                  ⚠️ ERROR: {error}
                </div>
              )}
              {successMsg && (
                <div className="p-2.5 bg-emerald-950/35 border border-emerald-500/30 text-emerald-400 text-[10px] rounded font-bold leading-normal">
                  {successMsg}
                </div>
              )}

              {/* Inputs */}
              {isSignUp && (
                <div className="space-y-1">
                  <label className="block text-[8px] text-neutral-500 font-extrabold tracking-wider uppercase">AGENT CODENAME / NICKNAME</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-650" />
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="e.g. DJ RED FANG"
                      className="w-full bg-black border border-neutral-850 rounded p-2 pl-9 text-xs text-white outline-none focus:border-neutral-700"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[8px] text-neutral-500 font-extrabold tracking-wider uppercase">COMMUNICATION VECTOR (EMAIL)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-650" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent_address@domain.com"
                    className="w-full bg-black border border-neutral-850 rounded p-2 pl-9 text-xs text-white outline-none focus:border-neutral-700"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[8px] text-neutral-500 font-extrabold tracking-wider uppercase">DECRYPTION SECRET KEY (PASSWORD)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-650" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black border border-neutral-850 rounded p-2 pl-9 text-xs text-white outline-none focus:border-neutral-700"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 mt-4 text-xs font-orbitron font-extrabold tracking-widest transition-all cursor-pointer rounded border ${
                  isSignUp
                    ? "bg-[#ff1a2e]/10 border-[#ff1a2e] text-[#ff1a2e] hover:bg-[#ff1a2e] hover:text-white"
                    : "bg-[#00ffe6]/10 border-[#00ffe6] text-[#00ffe6] hover:bg-[#00ffe6] hover:text-black"
                }`}
              >
                {loading ? "TRANSMITTING..." : isSignUp ? "◤ DEPLOY PROFILE SIGNAL" : "◤ SECURE AUTHORIZATION"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
