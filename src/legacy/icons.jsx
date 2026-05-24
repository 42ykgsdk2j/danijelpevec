// Minimal SVG icon set
const Icon = {
  Arrow: ({ size = 14 }) => (
    <svg className="arrow" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="13 6 19 12 13 18"></polyline>
    </svg>
  ),
  ArrowDiag: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7"></line>
      <polyline points="9 7 17 7 17 15"></polyline>
    </svg>
  ),
  Sun: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
    </svg>
  ),
  Moon: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  ),
  Menu: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <line x1="4" y1="8" x2="20" y2="8"></line>
      <line x1="4" y1="16" x2="20" y2="16"></line>
    </svg>
  ),
  Close: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18"></line>
      <line x1="18" y1="6" x2="6" y2="18"></line>
    </svg>
  ),
  Check: ({ size = 36 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5 13 10 18 19 7"></polyline>
    </svg>
  ),
  Compass: ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
    </svg>
  ),
  Tree: ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12"></path>
      <path d="M12 12L7 7"></path>
      <path d="M12 12l5-5"></path>
      <circle cx="12" cy="5" r="2"></circle>
      <circle cx="6" cy="6" r="1.5"></circle>
      <circle cx="18" cy="6" r="1.5"></circle>
    </svg>
  ),
  Hourglass: ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h12"></path>
      <path d="M6 22h12"></path>
      <path d="M6 2c0 5 6 7 6 10s-6 5-6 10"></path>
      <path d="M18 2c0 5-6 7-6 10s6 5 6 10"></path>
    </svg>
  ),
  Globe: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"></path>
    </svg>
  ),
};

window.Icon = Icon;
