/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface CyberAvatarProps {
  artistId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isAnimated?: boolean;
}

export default function CyberAvatar({ artistId, size = 'md', isAnimated = true }: CyberAvatarProps) {
  // Translate size props to class dimensions
  const dims = {
    sm: 'h-10 w-10 text-xs',
    md: 'h-16 w-16 text-sm',
    lg: 'h-24 w-24 text-lg',
    xl: 'h-36 w-36 text-2xl',
  }[size];

  // Pick colors and details based on each individual Cyber-occupant
  const getAvatarSchema = () => {
    switch (artistId) {
      case 'red-fang':
        return {
          glowColor: '#ff1a2e',
          accentColor: '#4f040a',
          textColor: '#ff1a2e',
          bgColor: 'bg-black border-2 border-[#ff1a2e]',
          shadow: 'shadow-[0_0_15px_rgba(255,26,46,0.25)]',
        };
      case 'pack':
        return {
          glowColor: '#c2a633',
          accentColor: '#302706',
          textColor: '#c2a633',
          bgColor: 'bg-black border-2 border-[#c2a633]',
          shadow: 'shadow-[0_0_15px_rgba(194,166,51,0.25)]',
        };
      case 'lens':
        return {
          glowColor: '#00ffe6',
          accentColor: '#013233',
          textColor: '#00ffe6',
          bgColor: 'bg-black border-2 border-[#00ffe6]',
          shadow: 'shadow-[0_0_15px_rgba(0,255,230,0.25)]',
        };
      case 'mint':
        return {
          glowColor: '#5cfca9',
          accentColor: '#09361e',
          textColor: '#5cfca9',
          bgColor: 'bg-black border-2 border-[#5cfca9]',
          shadow: 'shadow-[0_0_15px_rgba(92,252,169,0.25)]',
        };
      case 'nexus':
        return {
          glowColor: '#ec4899',
          accentColor: '#3d0822',
          textColor: '#ec4899',
          bgColor: 'bg-black border-2 border-[#ec4899]',
          shadow: 'shadow-[0_0_15px_rgba(236,72,153,0.25)]',
        };
      default:
        return {
          glowColor: '#9945ff',
          accentColor: '#1d023b',
          textColor: '#9945ff',
          bgColor: 'bg-black border-2 border-[#9945ff]',
          shadow: 'shadow-[0_0_15px_rgba(153,69,255,0.25)]',
        };
    }
  };

  const schema = getAvatarSchema();

  // Procedural SVG representations of the avatar faces
  const renderFaceContent = () => {
    switch (artistId) {
      case 'red-fang':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            {/* Ambient Background Grid */}
            <circle cx="50" cy="50" r="45" stroke="#ff1a2e" strokeWidth="0.5" strokeDasharray="1 3" />
            
            {/* Spinning Radar Line */}
            {isAnimated && (
              <motion.circle
                cx="50"
                cy="50"
                r="38"
                stroke="#ff1a2e"
                strokeWidth="1"
                strokeDasharray="12 40"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
              />
            )}

            {/* Glowing red vampire eyes */}
            <motion.path
              d="M32 45 L44 48 L34 50 Z"
              fill="#ff1a2e"
              animate={isAnimated ? { opacity: [0.7, 1, 0.7] } : {}}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />
            <motion.path
              d="M68 45 L56 48 L66 50 Z"
              fill="#ff1a2e"
              animate={isAnimated ? { opacity: [0.7, 1, 0.7] } : {}}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.3 }}
            />

            {/* Vampire Fangs Smile */}
            <path d="M38 65 Q50 72 62 65" stroke="#ff1a2e" strokeWidth="2.5" />
            <path d="M42 66 L45 74 L47 67.5 Z" fill="#ffffff" />
            <path d="M58 66 L55 74 L53 67.5 Z" fill="#ffffff" />

            {/* Sleek DJ Headphones */}
            <rect x="18" y="38" width="10" height="24" rx="4" fill="#ff1a2e" />
            <rect x="72" y="38" width="10" height="24" rx="4" fill="#ff1a2e" />
            <path d="M23 40 Q50 14 77 40" stroke="#ff1a2e" strokeWidth="3" fill="none" />
          </svg>
        );

      case 'pack':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            {/* Tactical Grid */}
            <rect x="15" y="15" width="70" height="70" stroke="#c2a633" strokeWidth="0.5" strokeDasharray="2 2" />
            
            {/* Spinning crosshairs */}
            {isAnimated && (
              <motion.g
                animate={{ rotate: -360 }}
                style={{ transformOrigin: '50px 50px' }}
                transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
              >
                <line x1="50" y1="5" x2="50" y2="20" stroke="#c2a633" strokeWidth="0.75" />
                <line x1="50" y1="80" x2="50" y2="95" stroke="#c2a633" strokeWidth="0.75" />
                <line x1="5" y1="50" x2="20" y2="50" stroke="#c2a633" strokeWidth="0.75" />
                <line x1="80" y1="50" x2="95" y2="50" stroke="#c2a633" strokeWidth="0.75" />
              </motion.g>
            )}

            {/* Wolf-mask contours */}
            <path d="M30 35 L50 20 L70 35 L62 62 L50 78 L38 62 Z" stroke="#c2a633" strokeWidth="2" fill="#120f03" />
            
            {/* High-contrast amber eyes */}
            <polygon points="36,44 44,48 40,51" fill="#c2a633" />
            <polygon points="64,44 56,48 60,51" fill="#c2a633" />

            {/* Tactical mask vents */}
            <line x1="46" y1="64" x2="54" y2="64" stroke="#c2a633" strokeWidth="1.5" />
            <line x1="44" y1="68" x2="56" y2="68" stroke="#c2a633" strokeWidth="1.5" />
            <line x1="47" y1="72" x2="53" y2="72" stroke="#c2a633" strokeWidth="1.5" />
          </svg>
        );

      case 'lens':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            {/* Telemetry frame */}
            <path d="M10 25 L10 10 L25 10" stroke="#00ffe6" strokeWidth="1.5" />
            <path d="M75 10 L90 10 L90 25" stroke="#00ffe6" strokeWidth="1.5" />
            <path d="M10 75 L10 90 L25 90" stroke="#00ffe6" strokeWidth="1.5" />
            <path d="M75 90 L90 90 L90 75" stroke="#00ffe6" strokeWidth="1.5" />

            {/* Focus concentric circle */}
            <circle cx="50" cy="50" r="34" stroke="#00ffe6" strokeWidth="0.5" strokeDasharray="4 4" />

            {/* Futuristic holographic visor wrapper */}
            <path d="M22 40 L78 40 L72 56 L28 56 Z" fill="#013233" stroke="#00ffe6" strokeWidth="2" />
            
            {/* Glowing visor core scanline */}
            {isAnimated && (
              <motion.line
                x1="24"
                y1="48"
                x2="76"
                y2="48"
                stroke="#00ffe6"
                strokeWidth="3.5"
                animate={{
                  scaleX: [0.2, 1, 0.2],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              />
            )}
            {!isAnimated && <line x1="24" y1="48" x2="76" y2="48" stroke="#00ffe6" strokeWidth="2" />}

            {/* Visor digital HUD accents */}
            <rect x="42" y="34" width="16" height="3" fill="#00ffe6" opacity="0.6" />
            <circle cx="50" cy="72" r="3.5" fill="#00ffe6" />
          </svg>
        );

      case 'mint':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            {/* Radiant ripple waves */}
            {isAnimated && (
              <motion.circle
                cx="50"
                cy="50"
                r="38"
                stroke="#5cfca9"
                strokeWidth="0.5"
                animate={{ scale: [0.85, 1.1, 0.85], opacity: [0.4, 0.9, 0.4] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              />
            )}

            {/* Cozy holographic cat-ear headphones */}
            <path d="M30 24 L20 10 L34 16 Z" fill="#5cfca9" stroke="#5cfca9" strokeWidth="1.5" />
            <path d="M70 24 L80 10 L66 16 Z" fill="#5cfca9" stroke="#5cfca9" strokeWidth="1.5" />

            {/* Earcups */}
            <circle cx="21" cy="48" r="11" fill="#09361e" stroke="#5cfca9" strokeWidth="2" />
            <circle cx="79" cy="48" r="11" fill="#09361e" stroke="#5cfca9" strokeWidth="2" />
            <path d="M21 48 Q50 20 79 48" stroke="#5cfca9" strokeWidth="2.5" />

            {/* Calm smiley closed eyes of absolute chill */}
            <path d="M36 48 Q42 52 46 48" stroke="#5cfca9" strokeWidth="2" />
            <path d="M54 48 Q58 52 64 48" stroke="#5cfca9" strokeWidth="2" />

            {/* Floating digital $XENTS coin representation behind */}
            <motion.circle
              cx="50"
              cy="70"
              r="7"
              stroke="#5cfca9"
              strokeWidth="1.5"
              fill="#09361e"
              animate={isAnimated ? { y: [-3, 3, -3] } : {}}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            />
            <path d="M48.5 69 L51.5 69 M50 66.5 L50 73.5" stroke="#5cfca9" strokeWidth="1" />
          </svg>
        );

      case 'nexus':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            {/* Glitch scan bars */}
            {isAnimated && (
              <motion.g
                animate={{
                  x: [-3, 3, -2, 2, 0],
                  y: [1, -2, 2, -1, 0]
                }}
                transition={{ repeat: Infinity, duration: 0.35, repeatType: 'mirror', repeatDelay: 1.2 }}
              >
                {/* Horizontal razor glitches */}
                <rect x="5" y="24" width="30" height="2" fill="#ec4899" opacity="0.7" />
                <rect x="65" y="68" width="30" height="2.5" fill="#38bdf8" opacity="0.7" />
              </motion.g>
            )}

            {/* Split color stylized geometric face silhouette */}
            <polygon points="50,22 80,48 50,86" fill="#ec4899" opacity="0.3" />
            <polygon points="50,22 20,48 50,86" fill="#38bdf8" opacity="0.3" />

            {/* Split framing lines */}
            <line x1="50" y1="18" x2="50" y2="88" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" />

            {/* Starburst glint facial sensors */}
            <path d="M33 46 L43 46 M38 41 L38 51" stroke="#38bdf8" strokeWidth="1.5" />
            <path d="M67 46 L57 46 M62 41 L62 51" stroke="#ec4899" strokeWidth="1.5" />

            {/* Cybernetic code elements */}
            <rect x="42" y="66" width="16" height="4" fill="#ec4899" />
            <rect x="44" y="73" width="12" height="3" fill="#38bdf8" />
          </svg>
        );

      default:
        // Oracle (Generative Silent Drone)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            {/* Concentric high-meditation rings */}
            <circle cx="50" cy="50" r="42" stroke="#9945ff" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="32" stroke="#9945ff" strokeWidth="0.5" />
            
            {/* Pulsing signal center */}
            <motion.circle
              cx="50"
              cy="50"
              r="24"
              stroke="#9945ff"
              strokeWidth="0.75"
              fill="#1d023b"
              animate={isAnimated ? { scale: [0.9, 1.15, 0.9], opacity: [0.4, 0.8, 0.4] } : {}}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            />

            {/* Floating Diamond Sigil */}
            <motion.polygon
              points="50,28 66,50 50,72 34,50"
              stroke="#9945ff"
              strokeWidth="2.2"
              animate={isAnimated ? { rotate: [0, 90, 180, 270, 360] } : {}}
              style={{ transformOrigin: '50px 50px' }}
              transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
            />

            {/* Small glowing white beacon center */}
            <circle cx="50" cy="50" r="4" fill="#ffffff" />
          </svg>
        );
    }
  };

  return (
    <motion.div
      className={`relative rounded-full flex items-center justify-center overflow-hidden ${schema.bgColor} ${schema.shadow} ${dims}`}
      whileHover={isAnimated ? { scale: 1.05, borderColor: '#fff' } : {}}
      transition={{ duration: 0.3 }}
      id={`avatar-${artistId}`}
    >
      {/* Background glow sweep */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          background: `radial-gradient(circle, ${schema.glowColor} 0%, transparent 65%)`
        }}
      />
      {renderFaceContent()}
    </motion.div>
  );
}
