import React from 'react';

interface CartoonTeacherProps {
  isTalking: boolean;
  emotion?: 'happy' | 'thinking' | 'neutral';
}

const CartoonTeacher: React.FC<CartoonTeacherProps> = ({ isTalking, emotion = 'neutral' }) => {
  
  // Dynamic Styles for animations
  const styles = `
    @keyframes blink {
      0%, 90%, 100% { transform: scaleY(1); }
      95% { transform: scaleY(0.1); }
    }
    @keyframes eyebrow-move {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
    @keyframes talk-head-bob {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(1deg); }
      75% { transform: rotate(-1deg); }
    }
    .animate-blink {
      animation: blink 4s infinite;
      transform-origin: center;
    }
    .animate-eyebrows {
      animation: eyebrow-move 2s ease-in-out infinite;
    }
    .animate-talking-head {
      animation: talk-head-bob 2s ease-in-out infinite;
      transform-origin: 100px 140px; /* Pivot around neck area */
    }
  `;

  // --- Render Helpers ---

  const renderEyebrows = () => {
    if (emotion === 'thinking') {
      return (
        <g stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round">
           {/* Left eyebrow raised */}
           <path d="M65 75 Q80 65 95 75" />
           {/* Right eyebrow furrowed */}
           <path d="M105 78 Q120 80 135 78" />
        </g>
      );
    }
    return (
      <g stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" className={emotion === 'happy' ? 'animate-eyebrows' : ''}>
         <path d="M65 75 Q80 70 95 75" />
         <path d="M105 75 Q120 70 135 75" />
      </g>
    );
  };

  const renderEyes = () => {
    if (emotion === 'thinking') {
       // Looking up and right
       return (
        <g fill="#1F2937">
           <circle cx="82" cy="85" r="4" />
           <circle cx="122" cy="85" r="4" />
        </g>
       );
    }
    if (emotion === 'happy') {
      // Happy arcs
      return (
        <g stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round">
           <path d="M72 90 Q80 82 88 90" />
           <path d="M112 90 Q120 82 128 90" />
        </g>
      );
    }
    // Neutral (Normal eyes with blinking)
    return (
        <g fill="#1F2937" className="animate-blink">
           <circle cx="80" cy="90" r="4" />
           <circle cx="120" cy="90" r="4" />
        </g>
    );
  };

  const renderMouth = () => {
    if (isTalking) {
      // Enhanced phoneme shapes for better lip-sync simulation
      // Coordinates: Left Corner (85, 115), Right Corner (115, 115)
      
      const neutral = "M85 115 Q100 125 115 115 Q100 120 85 115";
      const ah      = "M85 115 Q100 150 115 115 Q100 100 85 115"; // 'a' - Wide Open
      const ee      = "M80 115 Q100 135 120 115 Q100 110 80 115"; // 'e' - Wide Smile
      const oh      = "M92 115 Q100 145 108 115 Q100 105 92 115"; // 'o' - Narrow Circular
      const mbp     = "M85 115 Q100 115 115 115 Q100 115 85 115"; // 'm','b','p' - Closed flat
      const f       = "M88 115 Q100 122 112 115 Q100 115 88 115"; // 'f','v' - Tucked bottom lip
      const semi    = "M85 115 Q100 135 115 115 Q100 115 85 115"; // Neutral open

      // Sequence: Neutral -> Ah -> MBP -> Ee -> F -> Oh -> Ah -> MBP -> Semi -> Neutral
      const sequence = [
        neutral, ah, mbp, ee, f, oh, ah, mbp, semi, neutral
      ].join('; ');
      
      const mouthId = "teacher-mouth-path";

      return (
         <g>
            <defs>
              <clipPath id="mouth-clip">
                <use href={`#${mouthId}`} />
              </clipPath>
            </defs>
            
            {/* Mouth Cavity & Animation Source */}
            <path id={mouthId} d={neutral} fill="#601010">
                <animate attributeName="d" 
                   values={sequence} 
                   dur="1.5s" 
                   repeatCount="indefinite"
                   calcMode="linear"
                />
            </path>

            {/* Tongue - Clipped to stay inside mouth */}
            <g clipPath="url(#mouth-clip)">
                <path d="M90 135 Q100 125 110 135" fill="#ef4444" opacity="0.9">
                     <animate attributeName="d"
                        values="M90 140 Q100 130 110 140; M90 145 Q100 135 110 145; M90 130 Q100 125 110 130; M90 145 Q100 135 110 145; M95 140 Q100 135 105 140; M90 140 Q100 130 110 140"
                        dur="1.5s"
                        repeatCount="indefinite"
                     />
                </path>
            </g>
         </g>
      );
    }
    
    if (emotion === 'thinking') {
        // Small 'o' mouth or pursed lips
        return <circle cx="100" cy="120" r="3" fill="#1F2937" />;
    }
    
    // Smile for happy/neutral
    return <path d="M85 115 Q100 130 115 115" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />;
  };

  return (
    <div className="relative w-32 h-32 md:w-48 md:h-48 mx-auto mb-4 transition-all duration-500">
      <style>{styles}</style>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl overflow-visible">
        
        {/* Thinking Bubbles (Only when thinking) */}
        {emotion === 'thinking' && (
            <g className="animate-pulse origin-bottom-left">
                <circle cx="160" cy="50" r="5" fill="#94a3b8" />
                <circle cx="175" cy="40" r="8" fill="#94a3b8" />
                <path d="M185 10 Q210 10 210 35 Q210 60 185 60 Q160 60 160 35 Q160 10 185 10" fill="#cbd5e1" />
                <text x="178" y="45" fontSize="24" fill="#475569" fontWeight="bold">?</text>
            </g>
        )}

        {/* Background Circle */}
        <circle cx="100" cy="100" r="90" fill="#E0F2FE" stroke="#3B82F6" strokeWidth="4" />
        
        {/* Body (Suit/Coat) - Static */}
        <path d="M50 190 Q100 220 150 190 L150 150 Q100 160 50 150 Z" fill="#1E40AF" />
        <path d="M90 190 L100 150 L110 190" fill="#fff" opacity="0.2" /> {/* Shirt detail */}
        
        {/* Head Group - Animates when talking */}
        <g className={isTalking ? "animate-talking-head" : ""}>
            {/* Head Shape */}
            <circle cx="100" cy="90" r="50" fill="#FFedd5" />
            
            {/* Hair (Grey/White for Guru Thuma look) */}
            <path d="M45 80 Q50 15 100 15 Q150 15 155 80 Q155 95 145 85 Q100 35 55 85 Q45 95 45 80 Z" fill="#4b5563" />
            
            {/* Facial Features */}
            {renderEyebrows()}
            
            {/* Glasses */}
            <g stroke="#1F2937" strokeWidth="2" fill="rgba(255,255,255,0.4)">
                <circle cx="80" cy="90" r="14" />
                <circle cx="120" cy="90" r="14" />
                <line x1="94" y1="90" x2="106" y2="90" />
            </g>

            {renderEyes()}
            {renderMouth()}
        </g>
        
        {/* Hands / Gestures */}
        {emotion === 'thinking' ? (
             // Hand scratching chin
             <g transform="translate(0, 5)">
                <path d="M120 150 Q140 130 110 120" stroke="#854d0e" strokeWidth="8" strokeLinecap="round" fill="none"/>
                <circle cx="110" cy="120" r="7" fill="#FFedd5" />
             </g>
        ) : (
             // Pointer stick
             <g className={isTalking ? "animate-pulse" : ""}>
                <line x1="140" y1="140" x2="170" y2="70" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
                <circle cx="170" cy="70" r="5" fill="#ef4444" />
             </g>
        )}

      </svg>
      
      {/* Name Tag */}
      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-700 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap z-10 border border-blue-400">
        ගුරු තුමා
      </div>
    </div>
  );
};

export default CartoonTeacher;