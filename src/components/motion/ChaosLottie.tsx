import { useEffect, useRef, useState } from "react";
import lottie, { AnimationItem } from "lottie-web";

interface ChaosLottieProps {
  path: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  pauseOnHover?: boolean;
}

export function ChaosLottie({
  path,
  loop = true,
  autoplay = true,
  speed = 1,
  pauseOnHover = false,
}: ChaosLottieProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);

    if (!containerRef.current || mediaQuery.matches) return;

    try {
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: loop,
        autoplay: autoplay,
        path: path,
      });

      animRef.current.setSpeed(speed);
    } catch (e) {
      console.warn("Lottie failed to load path", path, e);
    }

    return () => {
      animRef.current?.destroy();
    };
  }, [path, loop, autoplay, speed]);

  // Fallback for reduced motion users
  if (isReducedMotion) {
    return (
      <div className="flex items-center justify-center border border-zinc-850 bg-black text-xs text-zinc-500 uppercase tracking-widest h-full w-full min-h-[100px]">
        [ Motion Disabled ]
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      onMouseEnter={() => {
        if (pauseOnHover && animRef.current) animRef.current.pause();
      }}
      onMouseLeave={() => {
        if (pauseOnHover && animRef.current && autoplay) animRef.current.play();
      }}
    />
  );
}
