/* ============================================================
 * $XENTS CHANGE MACHINE — EMBEDDABLE WIDGET
 * File: xents-widget.js
 *
 * Drop into any 33.3FM / WIRED CHAOS surface for in-context
 * $XENTS top-up. Shares localStorage with the standalone
 * xents-change-machine.html page.
 *
 * USAGE:
 *   <script src="xents-widget.js"></script>
 *   <script>
 *     // Open from anywhere:
 *     window.XentsChange.open();
 *
 *     // Open with required minimum (gates an action):
 *     window.XentsChange.open({
 *       context: 'mint-gate',
 *       minBalance: 5000,
 *       reason: 'Minting a track requires ⟁5,000',
 *       onSuccess: () => doTheMint()
 *     });
 *
 *     // Spend $XENTS (returns true on success, false if blocked):
 *     window.XentsChange.spend({
 *       amount: 5000,
 *       label: 'MINT: Midnight Ghosts',
 *       category: 'mint'
 *     });
 *
 *     // Read balance:
 *     window.XentsChange.balance();    // → integer
 *     window.XentsChange.usdValue();   // → number
 *
 *     // Subscribe to balance changes:
 *     window.XentsChange.onChange(balance => { ... });
 *   </script>
 *
 * SHARED STATE KEYS (read/write):
 *   wc_xents_balance   — integer $XENTS
 *   wc_xents_ledger    — array of {type,label,rail,usd,xents,ts}
 *   wc_xents_state     — published heartbeat snapshot
 *   wc_xents_treasury  — protocol stats
 * ============================================================ */

(function(global){
  'use strict';

  const VERSION = '1.0.0';
  const RATE    = 100;      // $1 = 100 $XENTS, locked

  const RAIL_INFO = {
    stripe: { name:'STRIPE',    icon:'◉', min:5,  max:500   },
    apple:  { name:'APPLE PAY', icon:'◈', min:5,  max:500   },
    usdc:   { name:'USDC BASE', icon:'▣', min:10, max:10000 },
    x402:   { name:'x402 MICRO',icon:'⟁', min:1,  max:5     }
  };

  // ---------- STATE ----------
  const subs = [];
  function balance(){ return Number(localStorage.getItem('wc_xents_balance') || 0); }
  function setBalance(v){
    localStorage.setItem('wc_xents_balance', String(v));
    publishState();
    subs.forEach(fn => { try { fn(v); } catch(e){} });
  }
  function usdValue(){ return balance() / RATE; }
  function getLedger(){ try{return JSON.parse(localStorage.getItem('wc_xents_ledger')||'[]')}catch(e){return []} }
  function setLedger(l){ localStorage.setItem('wc_xents_ledger', JSON.stringify(l.slice(0,50))); }
  function pushLedger(entry){
    const l = getLedger();
    l.unshift(Object.assign({ts:Date.now()}, entry));
    setLedger(l);
  }
  function publishState(){
    const s = { balance: balance(), rate: RATE, direction:'one-way', ts: Date.now() };
    localStorage.setItem('wc_xents_state', JSON.stringify(s));
    global.dataLayer = global.dataLayer || [];
    global.dataLayer.push({ event:'xents_state', ...s });
  }

  // ---------- STYLES (one-shot inject) ----------
  function injectStyles(){
    if(document.getElementById('xents-widget-styles')) return;
    const css = `
    .xw-overlay{
      position:fixed;inset:0;z-index:99999;
      background:rgba(0,0,0,.85);backdrop-filter:blur(8px);
      display:none;align-items:center;justify-content:center;
      font-family:'Share Tech Mono',monospace;
      animation:xwFade .25s ease;
    }
    .xw-overlay.show{display:flex}
    @keyframes xwFade{from{opacity:0}to{opacity:1}}
    @keyframes xwSlide{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}

    .xw-modal{
      width:380px;max-width:92vw;max-height:90vh;overflow-y:auto;
      background:linear-gradient(180deg,#1a1d22 0%,#0a0b0e 100%);
      border:3px solid #2a2d33;border-radius:12px;
      box-shadow:0 0 60px rgba(194,166,51,.2),0 30px 80px rgba(0,0,0,.9),
        inset 0 2px 0 rgba(255,255,255,.08),inset 0 -2px 0 rgba(0,0,0,.6);
      padding:20px;color:#00ffe6;animation:xwSlide .35s cubic-bezier(.22,.61,.36,1);
      position:relative;
    }

    .xw-close{
      position:absolute;top:10px;right:10px;width:30px;height:30px;
      border:1px solid #2a2d33;background:transparent;color:#666;cursor:pointer;
      font-family:'Orbitron';font-size:14px;display:flex;align-items:center;justify-content:center;
      transition:all .15s;
    }
    .xw-close:hover{border-color:#ff1a2e;color:#ff1a2e}

    .xw-head{text-align:center;padding-bottom:14px;border-bottom:2px solid #2a2d33;margin-bottom:14px}
    .xw-title{font-family:'Orbitron',sans-serif;font-weight:900;font-size:22px;color:#c2a633;letter-spacing:.05em;text-shadow:0 0 16px rgba(194,166,51,.5)}
    .xw-title .arr{color:#00ffe6;margin:0 6px}
    .xw-sub{font-size:9px;letter-spacing:.35em;color:rgba(0,255,230,.7);margin-top:6px;font-family:'Major Mono Display',monospace}

    .xw-ctx{padding:10px 12px;margin-bottom:12px;background:rgba(255,26,46,.06);border:1px dashed rgba(255,26,46,.4);font-size:11px;color:#ff1a2e;text-align:center;letter-spacing:.05em;line-height:1.4}
    .xw-ctx .lbl{display:block;font-family:'Orbitron';font-size:9px;letter-spacing:.3em;margin-bottom:4px}

    .xw-bal{display:flex;justify-content:space-between;align-items:center;padding:12px;background:#000;border:1px solid #1a1a1a;margin-bottom:14px}
    .xw-bal .b-lbl{font-size:9px;letter-spacing:.3em;color:#c2a633;font-family:'Orbitron'}
    .xw-bal .b-val{font-family:'Orbitron';font-size:20px;color:#c2a633;font-weight:900;text-shadow:0 0 10px rgba(194,166,51,.4)}

    .xw-rails{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:4px;margin-bottom:12px}
    .xw-rail{padding:8px 4px;border:1px solid #2a2d33;background:#15171c;color:#666;font-family:'Orbitron';font-size:9px;letter-spacing:.1em;text-align:center;cursor:pointer;transition:all .15s}
    .xw-rail:hover{color:#00ffe6;border-color:#00ffe6}
    .xw-rail.active{background:#1a1d22;border-color:#c2a633;color:#c2a633;box-shadow:inset 0 0 10px rgba(194,166,51,.2)}
    .xw-rail .ic{display:block;font-size:14px;margin-bottom:2px}

    .xw-amount{
      background:#000;border:2px solid #2a2d33;padding:10px 14px;
      display:flex;align-items:center;gap:8px;margin-bottom:10px;transition:border-color .2s;
    }
    .xw-amount:focus-within{border-color:#c2a633;box-shadow:0 0 10px rgba(194,166,51,.3)}
    .xw-amount .dol{color:#c2a633;font-family:'Orbitron';font-size:20px;font-weight:900}
    .xw-amount input{flex:1;background:transparent;border:0;outline:0;color:#00ff88;font-family:'VT323',monospace;font-size:28px;text-shadow:0 0 8px rgba(0,255,136,.5)}

    .xw-quick{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:10px}
    .xw-quick button{padding:6px 4px;background:#15171c;border:1px solid #2a2d33;color:#00ffe6;font-family:'Orbitron';font-size:10px;cursor:pointer;letter-spacing:.05em}
    .xw-quick button:hover{border-color:#00ffe6;background:#1f2228}
    .xw-quick button.active{border-color:#c2a633;color:#c2a633}

    .xw-prev{padding:10px;border:1px dashed #c2a633;background:rgba(194,166,51,.05);text-align:center;margin-bottom:14px}
    .xw-prev .p-lbl{font-size:8px;letter-spacing:.3em;color:#c2a633;opacity:.7;font-family:'Orbitron'}
    .xw-prev .p-val{font-family:'Orbitron';font-size:22px;color:#c2a633;font-weight:900;margin-top:2px}
    .xw-prev .p-val::before{content:"⟁ ";color:#00ffe6}

    .xw-btn{
      width:100%;padding:14px;background:linear-gradient(180deg,#ff1a2e 0%,#a8101f 100%);
      border:2px solid #ff1a2e;color:#fff;font-family:'Orbitron';font-size:12px;font-weight:900;
      letter-spacing:.25em;cursor:pointer;text-shadow:0 1px 0 rgba(0,0,0,.5);
      box-shadow:0 0 20px rgba(255,26,46,.4),inset 0 2px 0 rgba(255,255,255,.25),inset 0 -3px 0 rgba(0,0,0,.4);
      transition:all .1s;
    }
    .xw-btn:hover:not(:disabled){box-shadow:0 0 28px rgba(255,26,46,.6),inset 0 2px 0 rgba(255,255,255,.3),inset 0 -3px 0 rgba(0,0,0,.4)}
    .xw-btn:active:not(:disabled){transform:translateY(2px)}
    .xw-btn:disabled{background:linear-gradient(180deg,#3a3a3a,#1a1a1a);border-color:#3a3a3a;color:#666;cursor:not-allowed;box-shadow:none}

    .xw-foot{margin-top:12px;text-align:center;font-size:8px;color:rgba(0,255,230,.4);letter-spacing:.3em;line-height:1.5}
    .xw-foot .gold{color:rgba(194,166,51,.6)}

    .xw-toast{
      position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(80px);
      padding:12px 20px;background:#000;border:1px solid #c2a633;color:#c2a633;
      font-family:'Orbitron';font-size:11px;letter-spacing:.2em;z-index:100000;
      opacity:0;transition:all .3s;box-shadow:0 0 30px rgba(194,166,51,.3);
    }
    .xw-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
    .xw-toast.win{border-color:#00ff88;color:#00ff88;box-shadow:0 0 30px rgba(0,255,136,.4)}
    .xw-toast.err{border-color:#ff1a2e;color:#ff1a2e;box-shadow:0 0 30px rgba(255,26,46,.3)}

    @keyframes xwCoin{
      0%{transform:translate(-50%,-160px) rotate(0);opacity:1}
      60%{transform:translate(-50%,0) rotate(720deg);opacity:1}
      100%{transform:translate(-50%,40px) rotate(900deg);opacity:0}
    }
    .xw-coin{
      position:fixed;left:50%;top:50%;width:32px;height:32px;border-radius:50%;
      background:radial-gradient(circle at 30% 30%,#fde47e,#c2a633 60%,#7a6a20);
      color:#000;font-family:'Orbitron';font-weight:900;font-size:12px;
      display:flex;align-items:center;justify-content:center;z-index:100001;
      box-shadow:0 0 24px rgba(194,166,51,.7);animation:xwCoin 1.1s cubic-bezier(.22,.61,.36,1) forwards;
    }
    `;
    const style = document.createElement('style');
    style.id = 'xents-widget-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ---------- MODAL ----------
  let overlay = null;
  let modalState = { rail: 'stripe', amount: 0, ctx: null };

  function buildModal(){
    injectStyles();
    if(overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'xw-overlay';
    overlay.innerHTML = `
      <div class="xw-modal" id="xw-modal-inner">
        <button class="xw-close" aria-label="Close">✕</button>
        <div class="xw-head">
          <div class="xw-title">$1<span class="arr">→</span>⟁100</div>
          <div class="xw-sub">// $XENTS CHANGE MACHINE //</div>
        </div>

        <div class="xw-ctx" id="xw-ctx" style="display:none"></div>

        <div class="xw-bal">
          <span class="b-lbl">CURRENT BALANCE</span>
          <span class="b-val">⟁ <span id="xw-balance">0</span></span>
        </div>

        <div class="xw-rails">
          <div class="xw-rail" data-rail="stripe"><span class="ic">◉</span>STRIPE</div>
          <div class="xw-rail" data-rail="apple"><span class="ic">◈</span>APPLE PAY</div>
          <div class="xw-rail" data-rail="usdc"><span class="ic">▣</span>USDC</div>
          <div class="xw-rail" data-rail="x402"><span class="ic">⟁</span>x402</div>
        </div>

        <div class="xw-amount">
          <span class="dol">$</span>
          <input type="number" id="xw-amount" placeholder="0" min="0" step="1">
        </div>

        <div class="xw-quick">
          <button data-amt="5">$5</button>
          <button data-amt="10">$10</button>
          <button data-amt="25">$25</button>
          <button data-amt="50">$50</button>
        </div>

        <div class="xw-prev">
          <div class="p-lbl">YOU RECEIVE</div>
          <div class="p-val"><span id="xw-preview">0</span></div>
        </div>

        <button class="xw-btn" id="xw-deposit" disabled>◢ SELECT A RAIL</button>

        <div class="xw-foot">
          <div>⟁ 1:1 LOCKED · ONE-WAY · NO CASH-OUT</div>
          <div class="gold">UTILITY CREDIT · NOT A SECURITY</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Wire close
    overlay.querySelector('.xw-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if(e.target === overlay) close(); });

    // Wire rails
    overlay.querySelectorAll('.xw-rail').forEach(r => {
      r.addEventListener('click', () => {
        overlay.querySelectorAll('.xw-rail').forEach(x => x.classList.remove('active'));
        r.classList.add('active');
        modalState.rail = r.dataset.rail;
        updateBtn();
      });
    });

    // Wire amount
    const inp = overlay.querySelector('#xw-amount');
    inp.addEventListener('input', () => {
      modalState.amount = Math.max(0, Math.floor(Number(inp.value) || 0));
      overlay.querySelector('#xw-preview').textContent = (modalState.amount * RATE).toLocaleString();
      overlay.querySelectorAll('.xw-quick button').forEach(b => b.classList.toggle('active', Number(b.dataset.amt) === modalState.amount));
      updateBtn();
    });
    inp.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' && !overlay.querySelector('#xw-deposit').disabled){
        overlay.querySelector('#xw-deposit').click();
      }
    });

    // Quick buttons
    overlay.querySelectorAll('.xw-quick button').forEach(b => {
      b.addEventListener('click', () => {
        modalState.amount = Number(b.dataset.amt);
        inp.value = modalState.amount;
        inp.dispatchEvent(new Event('input'));
      });
    });

    // Deposit button
    overlay.querySelector('#xw-deposit').addEventListener('click', deposit);

    // Keyboard escape
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && overlay && overlay.classList.contains('show')) close();
    });

    return overlay;
  }

  function updateBtn(){
    const btn = overlay.querySelector('#xw-deposit');
    if(!modalState.rail){ btn.disabled = true; btn.textContent = '◢ SELECT A RAIL'; return; }
    if(modalState.amount <= 0){ btn.disabled = true; btn.textContent = '◢ ENTER AMOUNT'; return; }
    const info = RAIL_INFO[modalState.rail];
    if(modalState.amount < info.min){ btn.disabled = true; btn.textContent = `◢ MIN $${info.min}`; return; }
    if(modalState.amount > info.max){ btn.disabled = true; btn.textContent = `◢ MAX $${info.max}`; return; }
    btn.disabled = false;
    btn.textContent = `⟁ DEPOSIT $${modalState.amount} → ⟁${(modalState.amount*RATE).toLocaleString()}`;
  }

  function deposit(){
    if(!modalState.rail || modalState.amount <= 0) return;
    const info = RAIL_INFO[modalState.rail];
    const btn = overlay.querySelector('#xw-deposit');
    btn.disabled = true; btn.textContent = '◉ PROCESSING...';

    // Coin shower
    for(let i = 0; i < Math.min(4, Math.ceil(modalState.amount/5)); i++){
      setTimeout(() => spawnCoin(), i * 80);
    }

    const delay = modalState.rail === 'x402' ? 350 : modalState.rail === 'usdc' ? 1200 : 800;
    setTimeout(() => {
      const xentsAdded = modalState.amount * RATE;
      setBalance(balance() + xentsAdded);
      pushLedger({
        type:'deposit',
        label:`DEPOSIT VIA ${info.name}`,
        rail: info.name,
        usd: modalState.amount,
        xents: xentsAdded
      });
      toast(`+ ⟁${xentsAdded.toLocaleString()} CREDITED`, 'win');
      paintBalance();

      // If a min-balance gate was met, fire success callback and close
      if(modalState.ctx && modalState.ctx.minBalance && balance() >= modalState.ctx.minBalance){
        const cb = modalState.ctx.onSuccess;
        setTimeout(() => {
          close();
          if(typeof cb === 'function') cb();
        }, 600);
      } else {
        modalState.amount = 0;
        overlay.querySelector('#xw-amount').value = '';
        overlay.querySelector('#xw-preview').textContent = '0';
        overlay.querySelectorAll('.xw-quick button').forEach(b => b.classList.remove('active'));
        updateBtn();
      }
    }, delay);
  }

  function paintBalance(){
    if(!overlay) return;
    overlay.querySelector('#xw-balance').textContent = balance().toLocaleString();
  }

  function spawnCoin(){
    const c = document.createElement('div');
    c.className = 'xw-coin';
    c.textContent = '⟁';
    c.style.left = (45 + Math.random()*10) + '%';
    c.style.top = (40 + Math.random()*5) + '%';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1200);
  }

  function toast(msg, kind=''){
    let t = document.getElementById('xw-toast-el');
    if(!t){
      t = document.createElement('div');
      t.id = 'xw-toast-el';
      t.className = 'xw-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'xw-toast show ' + kind;
    setTimeout(() => t.classList.remove('show'), 2400);
  }

  // ---------- PUBLIC API ----------
  function open(opts = {}){
    buildModal();
    modalState.ctx = opts;
    modalState.amount = 0;
    paintBalance();

    // Context banner
    const ctxEl = overlay.querySelector('#xw-ctx');
    if(opts.reason){
      ctxEl.style.display = 'block';
      ctxEl.innerHTML = `<span class="lbl">◉ ${opts.context || 'GATE'}</span>${opts.reason}`;
    } else {
      ctxEl.style.display = 'none';
    }

    // Suggest min amount if minBalance is set
    if(opts.minBalance){
      const needed = Math.max(0, opts.minBalance - balance());
      if(needed > 0){
        const usdNeeded = Math.ceil(needed / RATE);
        const inp = overlay.querySelector('#xw-amount');
        inp.value = usdNeeded;
        inp.dispatchEvent(new Event('input'));
      }
    }

    overlay.classList.add('show');

    // GTM event
    global.dataLayer = global.dataLayer || [];
    global.dataLayer.push({ event:'xents_widget_open', context: opts.context || 'manual' });
  }

  function close(){
    if(overlay) overlay.classList.remove('show');
  }

  function spend(opts){
    const { amount, label, category } = opts || {};
    if(!amount || amount <= 0) return false;
    if(balance() < amount){
      // Auto-open with gate if there's a callback
      if(opts.autoTopUp){
        open({
          context: category || 'spend',
          minBalance: amount,
          reason: `${label || 'This action'} requires ⟁${amount.toLocaleString()}. You have ⟁${balance().toLocaleString()}.`,
          onSuccess: () => spend(opts)
        });
      }
      return false;
    }
    setBalance(balance() - amount);
    pushLedger({
      type: 'spend',
      label: label || 'SPEND',
      category: category || 'misc',
      xents: -amount
    });
    return true;
  }

  function bonus(opts){
    const { amount, label } = opts || {};
    if(!amount || amount <= 0) return false;
    setBalance(balance() + amount);
    pushLedger({ type:'bonus', label: label || 'BONUS', xents: amount });
    return true;
  }

  function onChange(fn){ if(typeof fn === 'function') subs.push(fn); }
  function offChange(fn){ const i = subs.indexOf(fn); if(i >= 0) subs.splice(i,1); }

  // Listen for cross-tab balance changes
  global.addEventListener('storage', (e) => {
    if(e.key === 'wc_xents_balance'){
      paintBalance();
      const v = balance();
      subs.forEach(fn => { try { fn(v); } catch(err){} });
    }
  });

  // ---------- EXPOSE ----------
  global.XentsChange = {
    VERSION,
    RATE,
    open, close,
    spend, bonus,
    balance, usdValue,
    onChange, offChange,
    ledger: getLedger
  };

  // Auto-publish initial state
  publishState();
})(typeof window !== 'undefined' ? window : globalThis);
