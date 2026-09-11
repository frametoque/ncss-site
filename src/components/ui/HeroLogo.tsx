import Image from "next/image";

export function HeroLogo() {
  return (
    <div className="relative flex justify-center items-center w-full h-[220px] mb-8">
      <style>{`
        @keyframes shine-sweep {
          0% {
            -webkit-mask-position: 250% 0;
            mask-position: 250% 0;
          }
          45% {
            -webkit-mask-position: -50% 0;
            mask-position: -50% 0;
          }
          100% {
            -webkit-mask-position: -50% 0;
            mask-position: -50% 0;
          }
        }
      `}</style>
      
      {/* Glow Ring (Static gentle pulse) */}
      <div className="absolute inset-0 rounded-full flex items-center justify-center animate-pulse" style={{ animationDuration: '8s' }}>
        <div className="w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(242,184,181,0.18)_0%,rgba(210,50,41,0.08)_50%,transparent_70%)]" />
      </div>
      
      {/* Static Shadow */}
      <div 
        className="absolute bottom-4 left-1/2 w-[90px] h-[18px] rounded-[50%] blur-[4px] bg-[radial-gradient(ellipse,rgba(210,50,41,0.25)_0%,transparent_70%)]"
        style={{ transform: "translateX(-50%)" }}
      />
      
      {/* Static Logo Wrapper */}
      <div className="relative z-10 w-[150px] h-[150px]">
        {/* Base Logo */}
        <Image 
          src="/ncss-logo.png" 
          alt="NCSS Logo" 
          width={300}
          height={300}
          className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(122,12,46,0.2)]"
          style={{ transform: "scale(1.2)", transformOrigin: "center" }}
        />
        
        {/* Sweeping Shine Overlay */}
        <Image 
          src="/ncss-logo.png" 
          alt="" 
          width={300}
          height={300}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-90"
          style={{ 
            transform: "scale(1.2)", 
            transformOrigin: "center",
            filter: "brightness(0) invert(1)", // Turn the entire logo purely white for the shine
            WebkitMaskImage: "linear-gradient(60deg, transparent 40%, rgba(0,0,0,1) 48%, rgba(0,0,0,1) 52%, transparent 60%)",
            maskImage: "linear-gradient(60deg, transparent 40%, rgba(0,0,0,1) 48%, rgba(0,0,0,1) 52%, transparent 60%)",
            WebkitMaskSize: "300% 100%",
            maskSize: "300% 100%",
            animation: "shine-sweep 8s ease-in-out infinite"
          }}
        />
      </div>
    </div>
  );
}
