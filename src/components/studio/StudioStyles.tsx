export function StudioStyles() {
  return (
    <style>{`
      @keyframes studioBreatheCTA {
        0%, 100% { box-shadow: 0 0 20px hsla(180, 100%, 32%, 0.3); }
        50% { box-shadow: 0 0 35px hsla(180, 100%, 32%, 0.5), 0 0 60px hsla(180, 100%, 32%, 0.2); }
      }
      @keyframes studioNeonFlicker {
        0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; text-shadow: 0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary)); }
        20%, 24%, 55% { opacity: 0.6; text-shadow: none; }
      }
      @keyframes studioGlowBreathe {
        0%, 100% { box-shadow: 0 0 8px hsla(180, 100%, 32%, 0.2); }
        50% { box-shadow: 0 0 20px hsla(180, 100%, 32%, 0.5), 0 0 40px hsla(180, 100%, 32%, 0.15); }
      }
      @keyframes studioFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }
      @keyframes studioSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes studioBounce {
        0%, 100% { transform: translateY(0); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
        50% { transform: translateY(-12px); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
      }
      @keyframes widgetTicker {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
      @keyframes tickerScroll {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
      @keyframes weatherSunPulse {
        0%, 100% { filter: drop-shadow(0 0 12px #FFB020) drop-shadow(0 0 24px #FFB02080); transform: scale(1); }
        50% { filter: drop-shadow(0 0 20px #FFB020) drop-shadow(0 0 40px #FFB020AA); transform: scale(1.08); }
      }
      @keyframes weatherRainDrop {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(3px); }
      }
      @keyframes weatherAuroraShift {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      @keyframes alertGlitchIn {
        0% { opacity: 0; background: white; }
        25% { opacity: 1; background: #FF0033; }
        50% { opacity: 0.3; background: white; }
        75% { opacity: 1; background: #FF0033; }
        100% { opacity: 1; background: #FF0033; }
      }
      @keyframes alertLiveFlash {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.2; }
      }
      @keyframes alertGlowSpill {
        0%, 100% { box-shadow: 0 -20px 60px rgba(255,0,51,0.3); }
        50% { box-shadow: 0 -30px 80px rgba(255,0,51,0.5), 0 -50px 120px rgba(255,0,51,0.2); }
      }
      .studio-neon-flicker { animation: studioNeonFlicker 2s infinite; }
      .studio-glow-breathe { animation: studioGlowBreathe 3s ease-in-out infinite; }
      .studio-float { animation: studioFloat 3s ease-in-out infinite; }
      .studio-spin { animation: studioSpin 4s linear infinite; }
      .studio-bounce { animation: studioBounce 1s infinite; }
      .alert-glitch-in { animation: alertGlitchIn 0.2s ease-out; }
      .alert-live-flash { animation: alertLiveFlash 0.5s ease-in-out infinite; }
    `}</style>
  );
}
