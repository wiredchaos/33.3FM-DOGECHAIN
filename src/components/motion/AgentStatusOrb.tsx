interface AgentStatusOrbProps {
  status: "idle" | "active" | "error";
  size?: "sm" | "md" | "lg";
}

export function AgentStatusOrb({ status = "idle", size = "md" }: AgentStatusOrbProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const statusConfig = {
    idle: {
      gradient: "from-white via-zinc-900 to-black",
      glow: "shadow-[0_0_16px_rgba(255,255,255,0.3)]",
      duration: "3s",
    },
    active: {
      gradient: "from-[#00f5ff] via-[#02313a] to-black",
      glow: "shadow-[0_0_24px_#00f5ff]",
      duration: "1.4s",
    },
    error: {
      gradient: "from-[#ff0055] via-[#3a0210] to-black",
      glow: "shadow-[0_0_24px_#ff0055]",
      duration: "0.8s",
    },
  };

  const current = statusConfig[status];

  return (
    <div className="relative group cursor-pointer inline-block">
      <div
        className={`
          rounded-full bg-radial-gradient transition-all ease-in-out
          motion-safe:animate-orb-pulse
          motion-reduce:animate-none
          group-hover:scale-105
          ${sizeMap[size]}
          ${current.glow}
        `}
        style={{
          backgroundImage: `radial-gradient(circle, ${current.gradient.replace(/-/g, ' ')})`,
          animation: `orb-pulse ${current.duration} infinite ease-in-out`,
        }}
      />
    </div>
  );
}
