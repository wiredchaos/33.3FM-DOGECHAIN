import React from "react";

interface ChaosPulseProps {
  children: React.ReactNode;
  variant?: "cyan" | "red" | "white";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
}

export function ChaosPulse({
  children,
  variant = "cyan",
  speed = "normal",
  pauseOnHover = true,
}: ChaosPulseProps) {
  const speedMap = {
    fast: "1s",
    normal: "1.8s",
    slow: "3s",
  };

  const variantMap = {
    cyan: "shadow-[0_0_20px_rgba(0,245,255,0.4)] border-[#00f5ff]/30",
    red: "shadow-[0_0_20px_rgba(255,0,85,0.4)] border-[#ff0055]/30",
    white: "shadow-[0_0_20px_rgba(255,255,255,0.2)] border-white/30",
  };

  return (
    <div
      className={`
        relative rounded-xl border bg-black transition-all duration-300
        motion-safe:animate-pulse-glow
        ${variantMap[variant]}
        ${pauseOnHover ? "hover:animate-none" : ""}
      `}
      style={{
        animationDuration: speedMap[speed],
      }}
    >
      {children}
    </div>
  );
}
