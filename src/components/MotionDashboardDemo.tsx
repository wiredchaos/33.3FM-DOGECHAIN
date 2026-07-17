import { ChaosLottie } from "./motion/ChaosLottie";
import { ChaosPulse } from "./motion/ChaosPulse";
import { AgentStatusOrb } from "./motion/AgentStatusOrb";

export default function MotionDashboardDemo() {
  return (
    <div className="bg-[#050507] border border-neutral-900 rounded-2xl p-6 font-mono text-white flex flex-col gap-6">
      {/* Header */}
      <header className="border-b border-neutral-900 pb-4 mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold font-orbitron tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-300 to-neutral-500 uppercase">
            ◢ FABLE5 // MOTION_SYSTEM DIAGNOSTICS
          </h1>
          <p className="text-[9px] text-neutral-500 mt-1">
            Zero-cost local runtime engine active. Verified client orbits.
          </p>
        </div>
        <span className="text-[10px] text-[#00f5ff] font-bold border border-[#00f5ff]/30 bg-[#00f5ff]/5 px-2.5 py-1 rounded">
          DEEP SCAN ONLINE
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Module 1: Native Status Orbs */}
        <div className="border border-neutral-900 bg-[#07070a]/60 p-5 rounded-xl">
          <h2 className="text-[10px] uppercase tracking-widest text-[#00ffe6] mb-4 font-bold font-orbitron">
            ◤ Agent Native Status Orbs
          </h2>
          <div className="flex items-center justify-around h-32 bg-black/40 rounded-lg p-3 border border-neutral-900/60">
            <div className="text-center">
              <AgentStatusOrb status="idle" size="md" />
              <span className="text-[9px] text-zinc-500 mt-2 block">IDLE</span>
            </div>
            <div className="text-center">
              <AgentStatusOrb status="active" size="md" />
              <span className="text-[9px] text-[#00f5ff] mt-2 block">ACTIVE</span>
            </div>
            <div className="text-center">
              <AgentStatusOrb status="error" size="md" />
              <span className="text-[9px] text-[#ff0055] mt-2 block">CRITICAL</span>
            </div>
          </div>
        </div>

        {/* Module 2: Ambient Containers */}
        <div className="border border-neutral-900 bg-[#07070a]/60 p-5 rounded-xl">
          <h2 className="text-[10px] uppercase tracking-widest text-[#ff1a2e] mb-4 font-bold font-orbitron">
            ◤ Ambient Interface Wrappers
          </h2>
          <div className="space-y-4">
            <ChaosPulse variant="cyan" speed="normal">
              <div className="p-4 text-xs">
                <div className="text-[#00f5ff] mb-1 font-orbitron font-extrabold tracking-widest">DATA STREAM RUNNING</div>
                <div className="text-neutral-500 text-[9px]">Hover to freeze cycle.</div>
              </div>
            </ChaosPulse>

            <ChaosPulse variant="red" speed="fast">
              <div className="p-4 text-xs">
                <div className="text-[#ff0055] mb-1 font-orbitron font-extrabold tracking-widest">FIREWALL INTELLIGENCE</div>
                <div className="text-neutral-500 text-[9px]">Priority overhead payload locked.</div>
              </div>
            </ChaosPulse>
          </div>
        </div>

        {/* Module 3: Lottie-Web Integration */}
        <div className="border border-neutral-900 bg-[#07070a]/60 p-5 rounded-xl">
          <h2 className="text-[10px] uppercase tracking-widest text-[#c2a633] mb-4 font-bold font-orbitron">
            ◤ Lottie-Web Complex Engine
          </h2>
          <div className="h-32 bg-black/40 rounded-lg border border-neutral-900 flex items-center justify-center overflow-hidden p-3 text-center">
            {/* Pass path to a dummy or loading telemetry animation */}
            <ChaosLottie 
              path="/animations/agent-orb.json" 
              speed={1.2}
              pauseOnHover={true} 
            />
          </div>
          <span className="text-[8px] text-zinc-500 mt-2.5 block text-center leading-normal uppercase">
            [ Fallback activated automatically if JSON breaks or resource missing ]
          </span>
        </div>

      </div>
    </div>
  );
}
