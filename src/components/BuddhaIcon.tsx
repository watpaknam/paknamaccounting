import React from "react";

interface BuddhaIconProps {
  className?: string;
}

export default function BuddhaIcon({ className = "w-6 h-6" }: BuddhaIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Halo (Circular Aura of light behind the Buddha's head) */}
      <circle 
        cx="50" 
        cy="28" 
        r="16" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeDasharray="2 3" 
        className="opacity-50"
      />
      
      {/* Ushnisha (The crown/flame on the head representing supreme enlightenment) */}
      <path 
        d="M50,8 C51.5,8 53,10 50,13.5 C47,10 48.5,8 50,8 Z" 
        fill="currentColor" 
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <circle cx="50" cy="15.5" r="2.5" fill="currentColor" />

      {/* Head & Hair knots */}
      <path d="M43,18 C43,16 57,16 57,18 C57,24 43,24 43,18 Z" fill="none" />
      
      {/* Face details (Closed meditative serene eyes) */}
      <path d="M47,21 C48,22 49,22 50,21.5 C51,22 52,22 53,21" strokeWidth="1" className="opacity-70" />
      <path d="M49,24 C50,24.5 51,24.5 52,24" strokeWidth="1.2" className="opacity-80" />

      {/* Long ears (traditional depiction) */}
      <path d="M42,19.5 C40,19.5 40,24.5 42,24.5" strokeWidth="1.5" />
      <path d="M58,19.5 C60,19.5 60,24.5 58,24.5" strokeWidth="1.5" />

      {/* Neck */}
      <path d="M47,25.5 C48,26.5 52,26.5 53,25.5" />
      <path d="M46.5,27.5 L53.5,27.5" strokeWidth="1.5" />

      {/* Shoulders & Arms in Dhyana Mudra (Meditation posture) */}
      <path d="M28,41 C30,33 40,30 50,30 C60,30 70,33 72,41" strokeWidth="2.2" />
      
      {/* Arms flowing down */}
      <path d="M28,41 C27,47 32,58 35,68" strokeWidth="2" />
      <path d="M72,41 C73,47 68,58 65,68" strokeWidth="2" />

      {/* Robe diagonal lines (Civara) */}
      <path d="M50,30 C45,39 40,48 42,57" strokeWidth="1.2" className="opacity-60" />
      <path d="M36,41 C41,45 46,52 48,59" strokeWidth="1" className="opacity-40" />

      {/* Meditating Hands (Overlapping on the lap) */}
      <path d="M41,68.5 C45,70 55,70 59,68.5" strokeWidth="2.5" />
      <path d="M43.5,66.5 C47,65 53,65 56.5,66.5" strokeWidth="1.5" />

      {/* Full Lotus Legs (Padmasana) */}
      <path 
        d="M20,77 C22,69 34.5,68 40,68 C45,68 55,68 60,68 C65.5,68 78,69 80,77 C81,81 74,84.5 50,84.5 C26,84.5 19,81 20,77 Z" 
        strokeWidth="2.2"
      />
      
      {/* Feet details (Soles pointing up in full lotus) */}
      <path d="M32.5,74.5 C34.5,74.5 35.5,72.5 34,71.5" strokeWidth="1.5" />
      <path d="M67.5,74.5 C65.5,74.5 64.5,72.5 66,71.5" strokeWidth="1.5" />

      {/* Lotus Pedestal Base (Double Petal Lotus Seat) */}
      <path d="M24,84.5 C32,89.5 41,91 50,91 C59,91 68,89.5 76,84.5" strokeWidth="1.8" />
      <path d="M31,91 C37.5,94.5 43.5,95.5 50,95.5 C56.5,95.5 62.5,94.5 69,91" strokeWidth="1.5" />
    </svg>
  );
}
