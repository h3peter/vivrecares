import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import vivreLandingImage from '../assets/vivre-landing.webp';
import drJCImage from '../assets/drjc.webp';
import logoBlack from '../assets/vivre-black.png';
import igFacelift101 from '../assets/ig-facelift-101.webp';
import igPigmentation from '../assets/ig-pigmentation.webp';
import igStartWithTheBasics from '../assets/ig-start-with-the-basics.webp';
import igForeheadBotox from '../assets/ig-forehead-botox.webp';
import igPatientReview from '../assets/ig-patient-review.webp';
import igHikoNoselift from '../assets/ig-hiko-noselift.webp';
import consultationCarouselImage from '../assets/additional_assets/interior-consultation-desk-wide-carousel.webp';
import laserRoomCarouselImage from '../assets/additional_assets/room-laser-room-setup-carousel.webp';
import facialRoomCarouselImage from '../assets/additional_assets/room-facial-bed-cozy-carousel.webp';
import ivTherapyCarouselImage from '../assets/additional_assets/room-treatment-double-bed-wide-carousel.webp';
import equipmentLaserCarouselImage from '../assets/additional_assets/equipment-laser-resurfacing-tower-carousel.webp';
import LoginModal from '../components/LoginModal';
import NotificationBell from '../components/NotificationBell';
import ProfileAvatar from '../components/ProfileAvatar';
import OptimizedImage from '../components/OptimizedImage';
import { clearStoredSession, getStoredUser } from '../utils/session';
import { firstAdminPath } from '../utils/adminAccess';

/* --- brand color tokens (used for inline styles Tailwind can't reach) -- */
const C = {
  gold:      '#c9a227',
  goldLight: '#e8d48b',
  goldDark:  '#9a7a10',
  cream:     '#faf9f6',
  cream2:    '#f3f0e8',
  charcoal:  '#2d2a26',
  muted:     '#7a7570',
  lavender:  '#e8e4f0',
  serif:     "'Cormorant Garamond', Georgia, serif",
  sans:      "'Jost', sans-serif",
};

const SERVICE_GROUPS = [
  {
    title: 'Professional Facial Treatment',
    shortTitle: 'Facials',
    image: facialRoomCarouselImage,
    accent: '#f6efe4',
    summary: 'Polished skin rituals for resurfacing, micropeels, hydration, and glow maintenance.',
    highlight: 'Signature glow work',
    services: [
      'V Premiere Resurfacing Facial',
      'V Contura Facial',
      'Acnelan Micropeel Facial',
      'Korean Glow Micro Peel',
      'Diamond Peel Facial',
      'Hydra Pearl Facial',
    ],
  },
  {
    title: 'Laser and Machines',
    shortTitle: 'Lasers',
    image: equipmentLaserCarouselImage,
    accent: '#eef2f2',
    summary: 'Device-led care for pigmentation, texture, tightening, scars, body shaping, and hair removal.',
    highlight: 'Advanced energy devices',
    services: [
      { name: 'Pico White Laser', details: 'Melasma, dark undereyes, full face rejuvenation, dark underarms, age spots, freckles, tattoo removal' },
      { name: 'Smaxel: The Smartest CO2 Laser', details: 'Large pores, stretchmarks, wrinkles, acne scars, non-surgical vaginal tightening and rejuvenation' },
      'Viethera Hifu Face and Body Slimming',
      'BTL Elixir Face and Body Tightening',
      'Dermapoint: Collagen Induction Therapy',
      'PDT: Photo Dynamic Therapy',
      'Diode Laser: The Most Effective Hair Removal Laser',
    ],
  },
  {
    title: "Doctor's Procedures",
    shortTitle: 'Doctor Procedures',
    image: consultationCarouselImage,
    accent: '#f1ece8',
    summary: 'Injectables, regenerative skin treatments, lifting, scar revision, acne care, and contouring.',
    highlight: 'Physician-guided plans',
    services: [
      { name: 'Dermal Fillers', details: 'Hyaluronic filler, Radiesse filler, noselift, lip augmentation, cheeks, jaw reshaping, nasolabial folds, tear trough, deep wrinkles, eyebags, forehead augmentation' },
      { name: 'PRP: Platelet Rich Plasma', details: 'Hair re-growth therapy, vampire facial' },
      'Luhilo Snow',
      'Dermashine Pro',
      'V-Slim (Peptide) Injections',
      'Skin Boosters',
      'TCA Cross',
      'Sclerotherapy',
      'Happy Lift',
      'Botox Neuromodulators',
      'Time Machine Facelift (Cogs Facelift)',
      'Body Peel',
      'Scar Revision',
      'Corn and Calluses Removal',
      'HIKO Non-Surgical Noselift',
      'LipoDissolve - MesoLipo Therapy',
      'Intralesional Corticosteroid Injection',
      'Stretch Marks Revision',
      'Acne Treatment',
      'Rejuran Treatment',
      'Lenisma',
      'Juvelook',
      'Radiesse',
      'NCTF',
      'Profhilo',
    ],
  },
  {
    title: 'Dermatologic Surgery',
    shortTitle: 'Surgery',
    image: laserRoomCarouselImage,
    accent: '#eef0e7',
    summary: 'Precise removal procedures for common skin lesions and dermatologic concerns.',
    highlight: 'Focused lesion care',
    services: [
      'Syringoma Removal',
      'Mole Removal',
      'Warts Removal',
      'Corn and Calluses',
      'Skin Tags Removal',
      'Xanthelasma Removal',
      'Milia Removal',
      'EIC Removal',
      'Sebaceous Cyst Removal',
    ],
  },
  {
    title: 'IV Infusion Therapy',
    shortTitle: 'IV Therapy',
    image: ivTherapyCarouselImage,
    accent: '#f4efe9',
    summary: 'Wellness drip options that complement skin, energy, recovery, and immune support goals.',
    highlight: 'Wellness support',
    services: [
      'Gold Drip',
      'Titanium Drip',
      'Cinderella Drip',
      'Energy Booster Drip',
      'NAD Drip',
      'Immune Booster Drip',
    ],
  },
];


const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoginOpen,    setIsLoginOpen]    = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection,  setActiveSection]  = useState('home');
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const [isServiceCarouselPaused, setIsServiceCarouselPaused] = useState(false);
  const [openCatalogs, setOpenCatalogs] = useState(() => new Set([SERVICE_GROUPS[0].title]));

  const user = getStoredUser();
  const shouldShowBookingAuthHint = !user;
  const activeServiceGroup = SERVICE_GROUPS[activeServiceIndex];

  const toggleCatalog = (title) => {
    setOpenCatalogs((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  /* -- Google Fonts ----------------------------------------------- */
  useEffect(() => {
    const id = 'vivre-gfonts';
    if (!document.getElementById(id)) {
      const link  = document.createElement('link');
      link.id     = id;
      link.rel    = 'stylesheet';
      link.href   = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  /* -- Scroll-spy ------------------------------------------------- */
  useEffect(() => {
    const ids = ['home','services','why','doctor','clinics','contact'];
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { threshold: 0.3 }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  /* -- Close mobile menu on outside click ------------------------ */
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handler = () => setIsMobileMenuOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [isMobileMenuOpen]);

  /* -- Lock page scroll while mobile menu is open --------------- */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [isMobileMenuOpen]);

  /* -- Services carousel ----------------------------------------- */
  useEffect(() => {
    if (isServiceCarouselPaused) return undefined;

    const timer = window.setInterval(() => {
      setActiveServiceIndex((current) => (current + 1) % SERVICE_GROUPS.length);
    }, 4600);

    return () => window.clearInterval(timer);
  }, [isServiceCarouselPaused]);

  useEffect(() => {
    const preloadCarouselImages = () => {
      SERVICE_GROUPS.slice(1).forEach(({ image }) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = image;
      });
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preloadCarouselImages, { timeout: 2500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(preloadCarouselImages, 800);
    return () => window.clearTimeout(timeoutId);
  }, []);

  /* -- Booking logic (unchanged) --------------------------------- */
  const handleBookingClick = () => {
    if (user) {
      if      (user.role === 'Patient') navigate('/request-appointment');
      else if (user.role === 'Admin')   navigate(firstAdminPath(user));
      else if (user.role === 'Doctor')  navigate('/doctor/appointments');
      else                              navigate('/');
    } else {
      setIsLoginOpen(true);
    }
  };

  const handleLogout = () => {
    clearStoredSession();
    setIsDropdownOpen(false);
    setIsNotificationsOpen(false);
    setIsMobileMenuOpen(false);
    window.location.reload();
  };

  const dashboardRoute =
    user?.role === 'Admin'  ? firstAdminPath(user)     :
    user?.role === 'Doctor' ? '/doctor/appointments' :
    '/dashboard';

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
    setIsNotificationsOpen(false);
  };

  const NAV_LINKS = [['home','Home'],['services','Services'],['clinics','Clinics'],['contact','Contact Us']];
  const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/thevivreclinic/';
  const INSTAGRAM_POSTS = [
    {
      title: 'Facelift 101',
      description: 'A quick primer on facelift-focused care and what patients should know before treatment.',
      accent: '#d9c8ef',
      image: igFacelift101,
      href: 'https://www.instagram.com/p/DVQFwJLkzGG/?img_index=1',
    },
    {
      title: 'What Is Pigmentation?',
      description: 'An easy-to-understand explainer on pigmentation and the common causes behind dark spots.',
      accent: '#ead46b',
      image: igPigmentation,
      href: 'https://www.instagram.com/p/DV0onRcEyKB/?img_index=1',
    },
    {
      title: 'Start With The Basics',
      description: 'Simple essentials and foundational treatments that support a healthy natural glow.',
      accent: '#d1b017',
      image: igStartWithTheBasics,
      href: 'https://www.instagram.com/p/DOfxPhyEpa4/?img_index=1',
    },
    {
      title: 'Forehead Botox',
      description: 'A short treatment highlight featuring professionally performed forehead botox care.',
      accent: '#4f6377',
      image: igForeheadBotox,
      href: 'https://www.instagram.com/p/DNepXTMhm7T/',
    },
    {
      title: 'Patient Review',
      description: 'A testimonial post showcasing the patient experience and Vivre’s value-focused treatments.',
      accent: '#e8d7aa',
      image: igPatientReview,
      href: 'https://www.instagram.com/p/DIiJM5rhRKL/?img_index=1',
    },
    {
      title: 'HIKO Nose Lift',
      description: 'A before-and-after look at Vivre’s non-surgical HIKO noselift results.',
      accent: '#5f4f43',
      image: igHikoNoselift,
      href: 'https://www.instagram.com/p/DHk_UUyvtBn/',
    },
  ];

  /* --------------------------------------------------------------- */
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: C.sans, background: C.cream, color: C.charcoal }}>

      {/* -- Global keyframes ----------------------------- */}
      <style>{`
        @keyframes vivreScrollPulse { 0%,100%{opacity:.35} 50%{opacity:1} }
        @keyframes vivreFadeDown    { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes vivreServiceFill { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        .vivre-svc:hover  { transform:translateY(-5px); box-shadow:0 12px 40px rgba(45,42,38,.09); background:#fffdf5 !important; }
        .vivre-svc:hover .vivre-svc-bar { width:40px !important; }
        .vivre-service-pill:hover { border-color:rgba(201,162,39,.5) !important; background:#fffaf0 !important; }
        .vivre-service-tab:hover { transform:translateY(-2px); }
        details > summary::-webkit-details-marker { display:none; }
        .vivre-why:hover  { background:rgba(201,162,39,.06) !important; }
        .vivre-clinic:hover { transform:translateY(-3px); box-shadow:0 16px 48px rgba(140,120,180,.12) !important; }
        .vivre-nav-link   { transition:color .3s; }
        .vivre-nav-link:hover { color:#c9a227 !important; }
        .vivre-btn-dark:hover { background:#111 !important; }
        .vivre-btn-gold:hover { background:#e8d48b !important; }
          .vivre-hero-img-mobile { object-position: 62% center; }
          .vivre-doctor-img-mobile { object-position: center 50%; }
          @media (min-width: 768px) {
            .vivre-doctor-img-mobile { object-position: center top; }
          }
      `}</style>

      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}

      {/* ----------------------------------------------------
          NAV
      ---------------------------------------------------- */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-5 md:px-12 h-16 md:h-[72px]"
        style={{ background: 'rgba(250,249,246,0.93)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid rgba(201,162,39,.18)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={logoBlack} alt="Vivre Logo" className="h-8 md:h-10 w-auto object-contain" />
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-8">
          {NAV_LINKS.map(([id, label]) => (
            <span
              key={id}
              onClick={() => scrollTo(id)}
              className="vivre-nav-link cursor-pointer text-[11px] font-medium tracking-[.2em] uppercase pb-0.5"
              style={{
                color:        activeSection === id ? C.gold : C.muted,
                borderBottom: activeSection === id ? `1px solid ${C.gold}` : '1px solid transparent',
              }}
            >{label}</span>
          ))}
        </div>

        {/* Right side: icons + avatar */}
        <div className="flex items-center gap-2 md:gap-3">
          {user ? (
            <NotificationBell
              isOpen={isNotificationsOpen}
              onOpenChange={setIsNotificationsOpen}
              onOpen={() => {
                setIsDropdownOpen(false);
                setIsMobileMenuOpen(false);
              }}
            />
          ) : null}

          {!user ? (
            <button onClick={() => setIsLoginOpen(true)} style={{...iconBtn}}>
              <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => {
                  const nextOpen = !isDropdownOpen;
                  setIsDropdownOpen(nextOpen);
                  if (nextOpen) {
                    setIsNotificationsOpen(false);
                    setIsMobileMenuOpen(false);
                  }
                }}
                className="p-0 bg-transparent border-0 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-gray-200"
                  style={{ border: `1.5px solid ${C.gold}` }}>
                  <ProfileAvatar user={user} className="w-full h-full" textSize="text-sm" />
                </div>
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg py-1 z-50"
                  style={{ boxShadow:'0 8px 32px rgba(45,42,38,.13)', border:'0.5px solid rgba(201,162,39,.15)', animation:'vivreFadeDown .2s ease' }}>
                  <div className="px-4 py-3" style={{ borderBottom:'0.5px solid #f3f0e8' }}>
                    <p className="text-sm font-semibold truncate" style={{ color:C.charcoal }}>
                      Hi, {user?.nickname || user?.name || user?.first_name || 'User'}!
                    </p>
                    <p className="text-[11px] tracking-[.18em] uppercase mt-0.5" style={{ color:C.muted }}>{user.role}</p>
                  </div>
                  <Link to={dashboardRoute} className="block px-4 py-2 text-sm hover:bg-amber-50 transition" style={{ color:'#4b5563' }}>My Dashboard</Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition bg-transparent border-0 cursor-pointer">Logout</button>
                </div>
              )}
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 bg-transparent border-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileMenuOpen((current) => {
                const nextOpen = !current;
                if (nextOpen) {
                  setIsDropdownOpen(false);
                  setIsNotificationsOpen(false);
                }
                return nextOpen;
              });
            }}
            aria-label="Menu"
          >
            <span className="block w-5 h-px transition-all duration-300"
              style={{ background: C.charcoal, transform: isMobileMenuOpen ? 'rotate(45deg) translate(2px,2px)' : 'none' }}/>
            <span className="block w-5 h-px transition-all duration-300"
              style={{ background: C.charcoal, opacity: isMobileMenuOpen ? 0 : 1 }}/>
            <span className="block w-5 h-px transition-all duration-300"
              style={{ background: C.charcoal, transform: isMobileMenuOpen ? 'rotate(-45deg) translate(2px,-2px)' : 'none' }}/>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed top-16 left-0 right-0 bottom-0 z-40 px-6 py-6 flex flex-col gap-5 overflow-y-auto"
          style={{ background: 'rgba(250,249,246,0.98)', backdropFilter:'blur(16px)', borderBottom:`1px solid rgba(201,162,39,.15)`, animation:'vivreFadeDown .2s ease' }}
          onClick={e => e.stopPropagation()}
        >
          {NAV_LINKS.map(([id, label]) => (
            <span
              key={id}
              onClick={() => scrollTo(id)}
              className="cursor-pointer text-xs font-medium tracking-[.22em] uppercase py-1"
              style={{ color: activeSection === id ? C.gold : C.charcoal, borderBottom: `0.5px solid rgba(201,162,39,.15)`, paddingBottom: 12 }}
            >{label}</span>
          ))}
        </div>
      )}

      {/* ----------------------------------------------------
          HERO
      ---------------------------------------------------- */}
      <section id="home">
 
  {/* ══════════════════════════════════════════
      MOBILE LAYOUT  (hidden on md+)
      Stacked: photo on top, content on cream below
  ══════════════════════════════════════════ */}
  <div className="md:hidden flex flex-col">
 
    {/* Image block — no text on top */}
    <div className="relative overflow-hidden" style={{ height: 300 }}>
      <OptimizedImage
        src={vivreLandingImage}
        alt="Vivre Medical clinic interior"
        loading="priority"
        className="w-full h-full object-cover vivre-hero-img-mobile"
      />
      {/* Subtle bottom fade to blend into cream */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: 64,
          background: `linear-gradient(to top, ${C.cream}, transparent)`,
        }}
      />
    </div>
 
    {/* Content block — solid cream, no overlap */}
    <div className="px-6 pt-8 pb-12" style={{ background: C.cream }}>
 
      {/* Eyebrow */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="shrink-0" style={{ width: 24, height: '0.5px', background: C.gold }} />
        <span
          className="text-[10px] font-medium tracking-[.26em] uppercase"
          style={{ color: C.gold, fontFamily: C.sans }}
        >
          Luxury Medical Aesthetics
        </span>
      </div>
 
      {/* Headline */}
      <h1
        className="font-light leading-[1.15] mb-4"
        style={{
          fontFamily: C.serif,
          fontSize: 'clamp(38px, 11vw, 52px)',
          color: C.charcoal,
          letterSpacing: '-0.01em',
        }}
      >
        Your skin,<br />
        <em style={{ fontStyle: 'italic', color: C.goldDark }}>beautifully</em><br />
        restored.
      </h1>
 
      {/* Sub-copy */}
      <p
        className="text-sm font-light leading-[1.85] mb-8"
        style={{ color: C.muted, fontFamily: C.sans }}
      >
        Advanced skincare solutions with cutting-edge treatments —
        designed for your beauty, your wellness, and your confidence.
      </p>
 
      {/* CTAs */}
      <div className="flex flex-col gap-4">
        <button
          onClick={handleBookingClick}
          className="vivre-btn-dark w-full py-4 text-[10px] font-bold tracking-[.22em] uppercase border-0 cursor-pointer transition-all duration-300"
          style={{ background: C.charcoal, color: C.gold, fontFamily: C.sans }}
        >
          Request an Appointment
        </button>
        <span
          onClick={() => scrollTo('services')}
          className="cursor-pointer text-[11px] font-normal tracking-[.14em] uppercase pb-px self-start"
          style={{ color: C.muted, borderBottom: `0.5px solid ${C.muted}`, fontFamily: C.sans }}
        >
          Explore Treatments
        </span>
      </div>
 
      {shouldShowBookingAuthHint && (
        <AppointmentAccessHint
          mutedColor={C.muted}
          accentColor={C.goldDark}
          onLogin={() => setIsLoginOpen(true)}
        />
      )}
    </div>
  </div>
 
  {/* ══════════════════════════════════════════
      DESKTOP LAYOUT  (hidden below md)
      Full-bleed cinematic hero — unchanged from v1
  ══════════════════════════════════════════ */}
  <div
    className="hidden md:block relative overflow-hidden"
    style={{ height: 'min(90vh, 800px)', minHeight: 460 }}
  >
    {/* Full-bleed image */}
    <OptimizedImage
      src={vivreLandingImage}
      alt="Vivre Medical clinic interior"
      loading="priority"
      className="absolute inset-0 w-full h-full object-cover"
      style={{ objectPosition: 'center 38%' }}
    />
 
    {/* Gradient layer 1: left-side reading veil */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(100deg, rgba(30,27,23,.88) 0%, rgba(30,27,23,.68) 36%, rgba(30,27,23,.28) 62%, transparent 82%)',
      }}
    />
 
    {/* Gradient layer 2: bottom grounding vignette */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(to top, rgba(30,27,23,.55) 0%, rgba(30,27,23,.12) 28%, transparent 55%)',
      }}
    />
 
    {/* Decorative vertical gold rule */}
    <div
      className="absolute top-0 bottom-0"
      style={{
        left: '46%',
        width: '0.5px',
        background:
          'linear-gradient(to bottom, transparent 0%, rgba(201,162,39,.22) 30%, rgba(201,162,39,.22) 70%, transparent 100%)',
      }}
    />
 
    {/* Hero content */}
    <div
      className="relative h-full flex flex-col justify-center"
      style={{ padding: 'clamp(32px, 7vw, 96px)' }}
    >
      <div className="max-w-[520px]">
 
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-6 md:mb-7">
          <div className="shrink-0" style={{ width: 28, height: '0.5px', background: C.gold }} />
          <span
            className="text-[10px] md:text-[11px] font-medium tracking-[.3em] uppercase"
            style={{ color: C.gold, fontFamily: C.sans }}
          >
            Luxury Medical Aesthetics
          </span>
        </div>
 
        {/* Headline */}
        <h1
          className="font-light leading-[1.13] mb-5 md:mb-6"
          style={{
            fontFamily: C.serif,
            fontSize: 'clamp(42px, 6.2vw, 72px)',
            color: '#faf9f6',
            letterSpacing: '-0.01em',
          }}
        >
          Your skin,<br />
          <em style={{ fontStyle: 'italic', color: C.gold }}>beautifully</em><br />
          restored.
        </h1>
 
        {/* Sub-copy */}
        <p
          className="text-sm font-light leading-[1.9] mb-9 md:mb-11 max-w-xs md:max-w-sm"
          style={{ color: 'rgba(250,249,246,.68)', fontFamily: C.sans }}
        >
          Advanced skincare solutions with cutting-edge treatments —
          designed for your beauty, your wellness, and your confidence.
        </p>
 
        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={handleBookingClick}
            className="vivre-btn-gold shrink-0 px-7 py-4 text-[10px] font-bold tracking-[.22em] uppercase border-0 cursor-pointer transition-all duration-300"
            style={{ background: C.gold, color: C.charcoal, fontFamily: C.sans }}
          >
            Request an Appointment
          </button>
          <span
            onClick={() => scrollTo('services')}
            className="cursor-pointer text-[11px] font-normal tracking-[.14em] uppercase pb-px"
            style={{
              color: 'rgba(250,249,246,.58)',
              borderBottom: '0.5px solid rgba(250,249,246,.32)',
              fontFamily: C.sans,
            }}
          >
            Explore Treatments
          </span>
        </div>
 
        {shouldShowBookingAuthHint && (
          <AppointmentAccessHint
            mutedColor="rgba(250,249,246,.45)"
            accentColor={C.goldLight}
            onLogin={() => setIsLoginOpen(true)}
          />
        )}
      </div>
    </div>
 
    {/* Stats strip */}
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center gap-0 px-12 lg:px-24"
      style={{
        height: 72,
        background: 'rgba(20,18,14,.52)',
        backdropFilter: 'blur(10px)',
        borderTop: '0.5px solid rgba(201,162,39,.18)',
      }}
    >
      {[
        { value: '2',       label: 'Clinic Locations' },
        { value: '100%',    label: 'Board-Certified Physician' },
      ].map(({ value, label }) => (
        <div key={label} className="flex items-center gap-3 mr-9">
          <span className="font-light" style={{ fontFamily: C.serif, fontSize: 22, color: C.gold }}>
            {value}
          </span>
          <span
            className="text-[11px] font-light tracking-[.12em] uppercase leading-tight"
            style={{ color: 'rgba(250,249,246,.48)', fontFamily: C.sans, maxWidth: 90 }}
          >
            {label}
          </span>
        </div>
      ))}
 
      <div className="ml-auto flex items-center gap-2.5">
        <div
          className="w-px"
          style={{
            height: 28,
            background: `linear-gradient(to bottom, ${C.gold}, transparent)`,
            animation: 'vivreScrollPulse 2s ease-in-out infinite',
          }}
        />
        <span
          className="text-[10px] tracking-[.2em] uppercase"
          style={{ color: 'rgba(250,249,246,.4)', fontFamily: C.sans }}
        >
          Scroll
        </span>
      </div>
    </div>
  </div>
 
</section>

      {/* ----------------------------------------------------
          SERVICES
      ---------------------------------------------------- */}
      <section id="services" className="px-5 py-16 sm:px-10 md:px-20 md:py-24" style={{ background:C.cream }}>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-7 mb-9 md:mb-12">
          <div>
            <Eyebrow color={C.gold}>Treatment Menu</Eyebrow>
            <h2 className="font-light mb-3" style={{ fontFamily:C.serif, fontSize:'clamp(31px,5vw,52px)', color:C.charcoal }}>
              Explore Our Curated<br className="hidden sm:block"/> Clinical Treatments
            </h2>
            <p className="text-sm md:text-[15px] font-light leading-relaxed max-w-2xl" style={{ color:C.muted }}>
             Discover our specialized skin procedures by category below.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveServiceIndex((activeServiceIndex + SERVICE_GROUPS.length - 1) % SERVICE_GROUPS.length)}
              className="w-10 h-10 rounded-full cursor-pointer transition-all duration-300"
              style={{ border:'0.5px solid rgba(201,162,39,.35)', background:'white', color:C.charcoal }}
              aria-label="Previous service category"
            >‹</button>
            <button
              type="button"
              onClick={() => setActiveServiceIndex((activeServiceIndex + 1) % SERVICE_GROUPS.length)}
              className="w-10 h-10 rounded-full cursor-pointer transition-all duration-300"
              style={{ border:'0.5px solid rgba(201,162,39,.35)', background:C.charcoal, color:C.gold }}
              aria-label="Next service category"
            >›</button>
          </div>
        </div>

        <div
          onMouseEnter={() => setIsServiceCarouselPaused(true)}
          onMouseLeave={() => setIsServiceCarouselPaused(false)}
          onFocus={() => setIsServiceCarouselPaused(true)}
          onBlur={() => setIsServiceCarouselPaused(false)}
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-px mb-7 md:mb-10"
          style={{ background:'rgba(201,162,39,.18)', border:'0.5px solid rgba(201,162,39,.18)' }}
        >
          <div className="relative min-h-[430px] md:min-h-[500px] overflow-hidden" style={{ background:C.charcoal }}>
            <OptimizedImage
              key={activeServiceGroup.title}
              src={activeServiceGroup.image}
              alt={activeServiceGroup.title}
              loading="eager"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter:'brightness(.82)' }}
            />
            <div className="absolute inset-0" style={{ background:'linear-gradient(90deg, rgba(28,25,22,.88), rgba(28,25,22,.48) 48%, rgba(28,25,22,.18))' }}/>
            <div className="relative z-10 flex min-h-[430px] md:min-h-[500px] flex-col justify-end p-6 sm:p-8 md:p-10">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5"
                  style={{ background:'rgba(255,255,255,.12)', border:'0.5px solid rgba(255,255,255,.18)', color:C.goldLight }}>
                  <span className="text-[10px] font-semibold tracking-[.16em] uppercase">{activeServiceGroup.highlight}</span>
                </div>
                <div className="text-[11px] font-medium tracking-[.2em] uppercase mb-3" style={{ color:'rgba(255,250,242,.68)' }}>
                  {String(activeServiceIndex + 1).padStart(2, '0')} / {String(SERVICE_GROUPS.length).padStart(2, '0')}
                </div>
                <h3 className="font-light leading-[1.05] mb-4" style={{ fontFamily:C.serif, fontSize:'clamp(40px,7vw,72px)', color:'#fffaf2' }}>
                  {activeServiceGroup.title}
                </h3>
                <p className="text-sm md:text-[15px] font-light leading-relaxed max-w-lg mb-7" style={{ color:'rgba(255,250,242,.72)' }}>
                  {activeServiceGroup.summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeServiceGroup.services.slice(0, 5).map((service) => {
                    const item = typeof service === 'string' ? { name: service } : service;
                    return (
                      <span key={item.name} className="px-3 py-2 text-[11px] font-medium leading-tight"
                        style={{ background:'rgba(255,250,242,.12)', color:'#fffaf2', border:'0.5px solid rgba(255,250,242,.18)' }}>
                        {item.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col" style={{ background:'white' }}>
            <div className="flex max-w-full snap-x snap-mandatory overflow-x-auto lg:grid lg:grid-cols-1 lg:overflow-visible">
              {SERVICE_GROUPS.map((group, index) => {
                const isActive = index === activeServiceIndex;
                return (
                  <button
                    key={group.title}
                    type="button"
                    onClick={() => setActiveServiceIndex(index)}
                    className="vivre-service-tab relative w-[150px] shrink-0 snap-start text-left px-4 py-4 cursor-pointer transition-all duration-300 sm:w-[170px] md:px-5 md:py-5 lg:w-auto lg:min-w-0"
                    style={{
                      background: isActive ? group.accent : 'white',
                      border: '0',
                      borderBottom: '0.5px solid rgba(201,162,39,.16)',
                      borderRight: '0.5px solid rgba(201,162,39,.12)',
                      color: C.charcoal,
                    }}
                  >
                    <div className="text-[10px] font-semibold tracking-[.16em] uppercase mb-1" style={{ color:isActive ? C.goldDark : C.muted }}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="font-light leading-tight break-words" style={{ fontFamily:C.serif, fontSize:'clamp(18px,5.4vw,22px)' }}>{group.shortTitle}</div>
                    <div className="mt-1 text-[11px] font-light" style={{ color:C.muted }}>{group.services.length} services</div>
                    {isActive && !isServiceCarouselPaused ? (
                      <div className="absolute left-0 bottom-0 h-0.5 origin-left"
                        style={{ width:'100%', background:C.gold, animation:'vivreServiceFill 4.6s linear forwards' }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto p-5 md:p-6" style={{ background:C.charcoal }}>
              <div className="text-[10px] font-semibold tracking-[.18em] uppercase mb-2" style={{ color:C.gold }}>Consult First</div>
              <p className="text-[13px] font-light leading-relaxed mb-4" style={{ color:'rgba(255,250,242,.7)' }}>
                Not sure where to start? Let the clinic match your skin concern to the right treatment category.
              </p>
              <button
                onClick={handleBookingClick}
                className="vivre-btn-gold px-5 py-3 text-[10px] font-bold tracking-[.16em] uppercase border-0 cursor-pointer transition-all duration-300"
                style={{ background:C.gold, color:C.charcoal, fontFamily:C.sans }}
              >Book Consultation</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-start gap-3 md:gap-4">
          {SERVICE_GROUPS.map((group) => {
            const isOpen = openCatalogs.has(group.title);
            return (
              <div
                key={group.title}
                className="self-start"
                style={{ background:'white', border:'0.5px solid rgba(201,162,39,.16)' }}
              >
                <button
                  type="button"
                  onClick={() => toggleCatalog(group.title)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent p-4 text-left md:p-5"
                  aria-expanded={isOpen}
                >
                  <span>
                    <span className="block text-[10px] font-semibold tracking-[.16em] uppercase mb-1" style={{ color:C.goldDark }}>Catalog</span>
                    <span className="block font-light leading-tight" style={{ fontFamily:C.serif, fontSize:24, color:C.charcoal }}>{group.title}</span>
                    <span className="mt-1 block text-[12px] font-light" style={{ color:C.muted }}>{group.services.length} services</span>
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg leading-none transition-transform duration-300"
                    style={{ background:group.accent, color:C.goldDark, transform:isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    +
                  </span>
                </button>

                {isOpen ? (
                  <div className="px-4 pb-4 md:px-5 md:pb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                      {group.services.map((service) => {
                        const item = typeof service === 'string' ? { name: service } : service;
                        return (
                          <div key={item.name} className="vivre-service-pill p-3 transition-all duration-300"
                            style={{ background:'#fffdf8', border:'0.5px solid rgba(201,162,39,.14)' }}>
                            <div className="text-[13px] font-medium leading-snug" style={{ color:C.charcoal }}>{item.name}</div>
                            {item.details ? (
                              <p className="text-[12px] font-light leading-relaxed mt-1.5" style={{ color:C.muted }}>{item.details}</p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------
          WHY VIVRE
      ---------------------------------------------------- */}
      <section id="why" className="px-5 py-16 sm:px-10 md:px-20 md:py-24 relative overflow-hidden" style={{ background:C.charcoal }}>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 select-none pointer-events-none leading-none"
          style={{ fontFamily:C.serif, fontSize:'clamp(80px,18vw,220px)', fontWeight:300, color:'rgba(255,255,255,.03)', letterSpacing:'.05em' }}>VIVRE</div>

        <Eyebrow color={C.goldLight}>Why Choose Us</Eyebrow>
        <h2 className="font-light mb-3" style={{ fontFamily:C.serif, fontSize:'clamp(28px,4vw,40px)', color:'#f0ede8' }}>
          The Vivre<br/><em style={{ fontStyle:'italic', color:C.gold }}>Difference</em>
        </h2>
        <p className="text-sm font-light leading-relaxed mb-10 md:mb-14 max-w-lg" style={{ color:'rgba(240,237,232,.5)' }}>
          We combine medical expertise with a personalised, luxury experience — so every visit feels as good as you'll look.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px">
          {[
            { n:'01', title:'Aesthetic Focus',  body:'Led by board-certified aesthetic physician. Every consultation is thorough, every procedure is precise.' },
            { n:'02', title:'Safe & Proven',   body:'We use only FDA-approved treatments and clinically validated techniques. Your safety is our foundation.' },
            { n:'03', title:'Real people. Real results.', body:'Real, natural-looking outcomes backed by before-and-after results and hundreds of happy patients.' },
          ].map(({ n, title, body }) => (
            <div key={n} className="vivre-why transition-all duration-300" style={{ padding:'40px 32px', border:'0.5px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.03)' }}>
              <div className="leading-none mb-5" style={{ fontFamily:C.serif, fontSize:48, fontWeight:300, color:'rgba(201,162,39,.22)' }}>{n}</div>
              <div className="w-7 mb-4" style={{ height:'0.5px', background:C.gold, opacity:.6 }}/>
              <div className="font-light mb-3" style={{ fontFamily:C.serif, fontSize:22, color:'#f0ede8' }}>{title}</div>
              <div className="text-[13px] font-light leading-relaxed" style={{ color:'rgba(240,237,232,.55)' }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------
          MEET THE DOCTOR
      ---------------------------------------------------- */}
      <section id="doctor" className="px-5 py-16 sm:px-10 md:px-20 md:py-24" style={{ background:C.cream }}>
        <Eyebrow color={C.gold}>The Expert Behind Your Results</Eyebrow>

        <div className="flex flex-col md:grid md:grid-cols-[360px_1fr] gap-12 md:gap-20 items-start mt-2">

          {/* Photo col */}
         <div className="relative w-[calc(100%-28px)] max-w-[350px] mx-auto md:mx-0 md:w-full md:max-w-none">
            <div className="absolute top-8 -left-3 md:-left-5 w-0.5 rounded-sm"
              style={{ height:'calc(100% - 64px)', background:`linear-gradient(to bottom, ${C.gold}, transparent)` }}/>
            <div className="overflow-hidden rounded-sm" style={{ boxShadow:`16px 16px 0 ${C.cream2}` }}>
  <OptimizedImage
    src={drJCImage}
    alt="Dr. JC Masangkay"
    loading="eager"
    className="vivre-doctor-img-mobile w-full block aspect-square md:aspect-auto object-cover object-top"
  />
</div>
            {/* Credential chip */}
            <div className="absolute -bottom-6 -right-4 md:-right-6 px-5 py-4"
              style={{ background:C.charcoal, boxShadow:'0 8px 32px rgba(45,42,38,.18)' }}>
              <div className="text-[11px] tracking-[.16em] uppercase mb-1.5" style={{ color:C.gold }}>Board Certified</div>
              <div className="font-light leading-snug" style={{ fontFamily:C.serif, fontSize:18, color:'#f0ede8' }}>
                Aesthetic &<br/>Age Management<br/>Medicine
              </div>
            </div>
          </div>

          {/* Bio col */}
          <div className="pt-8 md:pt-2 mt-4 md:mt-0">
            <p className="text-[12px] font-medium tracking-[.16em] uppercase mb-2" style={{ color:C.gold }}>Meet Your Doctor</p>
            <h2 className="font-light leading-[1.15] mb-1.5" style={{ fontFamily:C.serif, fontSize:'clamp(36px,5vw,48px)', color:C.charcoal }}>
              Dr. JC<br/><em style={{ fontStyle:'italic', color:C.goldDark }}>Masangkay</em>
            </h2>
            <p className="text-[12px] tracking-[.1em] uppercase mb-8" style={{ color:C.muted }}>MD · Founder & Lead Aesthetic Physician</p>

            <p className="text-sm font-light leading-[1.9] mb-8 max-w-lg" style={{ color:C.muted }}>
              With <strong className="font-medium" style={{ color:C.charcoal }}>over 10 years of experience</strong> in Aesthetic and Age Management Medicine,
              Dr. JC Masangkay delivers patient-centered care focused on{" "}
              <strong className="font-medium" style={{ color:C.charcoal }}>precision, safety, and natural-looking results</strong> — backed by
              advanced injectables, skin rejuvenation expertise, and a deep understanding of facial anatomy.
            </p>

            {/* Credentials */}
            <div className="mb-8">
              <p className="text-[11px] font-semibold tracking-[.18em] uppercase mb-4" style={{ color:C.charcoal }}>Education & Credentials</p>
              {[
                'Doctor of Medicine, Class Valedictorian — University of Perpetual Help',
                'Top 8, Physician Licensure Examination',
                'Member: PAAAMMI | PAAS | AAAM',
              ].map((c,i) => (
                <div key={i} className="flex items-start gap-3 mb-2.5">
                  <div className="mt-2.5 shrink-0" style={{ width:16, height:'0.5px', background:C.gold }}/>
                  <span className="text-xs font-light leading-relaxed" style={{ color:C.muted }}>{c}</span>
                </div>
              ))}
            </div>

            {/* Specialties */}
            <div className="mb-8">
              <p className="text-[11px] font-semibold tracking-[.18em] uppercase mb-4" style={{ color:C.charcoal }}>Specialties & Signature Trainings</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {[
                  'Botulinum Tox A Application',
                  'Ultrasound-Guided Filler Implantation',
                  'Ultra-V HIKO Treatment',
                  'Undereye Rejuvenation with Atellocollagen',
                  'Skin Boosters — Juvelook & Rejuran',
                  'Biostimulation — Lenisna & Aesthefill',
                  'Profhilo Masterclass',
                  'Thread Lifting & Laser Surgery (Korea)',
                ].map((s,i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full shrink-0" style={{ background:C.gold }}/>
                    <span className="text-xs font-light leading-relaxed" style={{ color:C.muted }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fun fact */}
            <div className="inline-flex items-start gap-3 p-4"
              style={{ background:C.cream2, border:'0.5px solid rgba(201,162,39,.25)' }}>
              <span style={{ color:C.gold, fontSize:16, lineHeight:1 }}>◆</span>
              <div>
                <div className="text-[11px] font-semibold tracking-[.16em] uppercase mb-1" style={{ color:C.gold }}>Fun Fact</div>
                <div className="text-xs font-light leading-relaxed max-w-xs" style={{ color:C.muted }}>
                  Learned signature techniques in{" "}
                  <strong className="font-medium" style={{ color:C.charcoal }}>Korea</strong> — Thread Lifting, Laser Surgery, and Acne Management.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          CLINICS
      ---------------------------------------------------- */}
      <section id="clinics" className="px-5 py-16 sm:px-10 md:px-20 md:py-24" style={{ background:C.lavender }}>
        <Eyebrow color="#8a75a8">Find Us</Eyebrow>
        <h2 className="font-light mb-3" style={{ fontFamily:C.serif, fontSize:'clamp(28px,4vw,40px)', color:C.charcoal }}>Our Clinics</h2>
        <p className="text-sm font-light leading-relaxed mb-10 md:mb-14 max-w-lg" style={{ color:C.muted }}>
          Two convenient locations — each designed to offer you a calm, luxurious environment for your care.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {[
            {
              tag:'Branch 01',
              branch:'MOA Shore Branch',
              address:'SM Mall of Asia Complex, Pasay City, Metro Manila',
              hours:'Open Sunday · 10:00 AM – 8:00 PM',
              phone:'(02) 8255 5010 / (0917) 148 4873',
              closed:'Closed on Monday',
              mapUrl:'https://maps.app.goo.gl/4j4EVE7By8cm7kZo7',
            },
            {
              tag:'Branch 02',
              branch:'Valenzuela Branch',
              address:'22 G. Lazaro Rd, Valenzuela, 1444 Metro Manila',
              hours:'Open Sunday · 10:00 AM – 8:00 PM',
              phone:'(0917) 558 4873',
              closed:'Closed on Monday & Tuesday',
              mapUrl:'https://maps.app.goo.gl/9ypDUNUTdKj9pEbF7',
            },
          ].map(({ tag, branch, address, hours, phone, closed, mapUrl }) => (
            <div key={tag} className="vivre-clinic transition-all duration-300" style={{ background:'white', padding:'32px 28px', border:'0.5px solid rgba(196,184,216,.4)' }}>
              <div className="text-[11px] font-medium tracking-[.16em] uppercase mb-3" style={{ color:'#8a75a8' }}>{tag}</div>
              <div className="font-light mb-1" style={{ fontFamily:C.serif, fontSize:24, color:C.charcoal }}>Vivre Medical</div>
              <div className="text-[11px] font-medium tracking-[.14em] uppercase mb-4" style={{ color:C.gold }}>{branch}</div>
              <div className="text-[14px] font-light leading-relaxed mb-2" style={{ color:C.muted }}>{address}</div>
              <div className="space-y-2 mb-5">
                <div className="text-[13px] font-light" style={{ color:C.muted }}>{phone}</div>
                <div className="text-[13px] font-light" style={{ color:C.muted }}>{closed}</div>
                <div className="text-[13px] font-light" style={{ color:C.muted }}>{hours}</div>
              </div>
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-[11px] font-medium tracking-[.12em] uppercase pb-px cursor-pointer"
                style={{ color:C.charcoal, borderBottom:`0.5px solid ${C.charcoal}` }}
              >
                View on Map ◆
              </a>
            </div>
          ))}

          {/* CTA card */}
          <div className="vivre-clinic sm:col-span-2 lg:col-span-1 transition-all duration-300"
            style={{ background:C.charcoal, padding:'32px 28px', border:`0.5px solid rgba(201,162,39,.2)` }}>
            <div className="text-[11px] font-medium tracking-[.16em] uppercase mb-3" style={{ color:C.goldLight }}>Book Now</div>
            <div className="font-light mb-1" style={{ fontFamily:C.serif, fontSize:24, color:'#f0ede8' }}>Start Your Journey</div>
            <div className="text-[11px] font-medium tracking-[.14em] uppercase mb-4" style={{ color:C.gold }}>With Vivre</div>
            <div className="text-[14px] font-light leading-relaxed mb-6" style={{ color:'rgba(240,237,232,.55)' }}>
              Ready for healthy, radiant skin? Book a consultation with Dr. JC today.
            </div>
            <button
              onClick={handleBookingClick}
              className="vivre-btn-gold px-6 py-3 text-[10px] font-bold tracking-[.18em] uppercase border-0 cursor-pointer transition-all duration-300"
              style={{ background:C.gold, color:C.charcoal, fontFamily:C.sans }}
            >Book a Consultation</button>
            {shouldShowBookingAuthHint && (
              <AppointmentAccessHint
                mutedColor="rgba(240,237,232,.6)"
                accentColor={C.goldLight}
                onLogin={() => setIsLoginOpen(true)}
              />
            )}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          INSTAGRAM
      ---------------------------------------------------- */}
      <section className="px-5 py-16 sm:px-10 md:px-20 md:py-24" style={{ background:C.cream }}>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
          <div>
            <Eyebrow color={C.gold}>Latest On Instagram</Eyebrow>
            <h2 className="font-light mb-3" style={{ fontFamily:C.serif, fontSize:'clamp(28px,4vw,40px)', color:C.charcoal }}>
              Clinic Updates & Highlights
            </h2>
            <p className="text-[14px] md:text-[15px] font-light leading-relaxed max-w-2xl" style={{ color:C.muted }}>
              Browse recent treatment highlights, skin education posts, and patient-centered updates from Vivre Medical.
            </p>
          </div>

          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 text-[10px] md:text-[11px] font-semibold tracking-[.18em] uppercase border-0 cursor-pointer transition-all duration-300"
            style={{ background:C.charcoal, color:C.gold, fontFamily:C.sans }}
          >
            Follow @thevivreclinic
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {INSTAGRAM_POSTS.map(({ title, description, accent, image, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="group block transition-all duration-300"
              style={{ textDecoration:'none' }}
            >
              <div
                className="h-full flex flex-col justify-between p-6 md:p-7 rounded-[28px] border"
                style={{
                  background:`linear-gradient(160deg, ${accent} 0%, #ffffff 72%)`,
                  borderColor:'rgba(201,162,39,.18)',
                  boxShadow:'0 10px 30px rgba(45,42,38,.05)',
                }}
              >
                <div className="mb-6 overflow-hidden rounded-[22px]" style={{ boxShadow:'0 10px 24px rgba(45,42,38,.08)' }}>
                  <OptimizedImage
                    src={image}
                    alt={title}
                    loading="lazy"
                    className="w-full aspect-[4/5] object-cover"
                  />
                </div>

                <div>
                  <div className="text-[11px] md:text-[12px] font-medium tracking-[.16em] uppercase mb-3" style={{ color:C.charcoal }}>
                    Instagram Post
                  </div>
                  <div className="font-light mb-3 leading-tight" style={{ fontFamily:C.serif, fontSize:'clamp(26px,3vw,34px)', color:C.charcoal }}>
                    {title}
                  </div>
                  <p className="text-[14px] md:text-[15px] font-light leading-relaxed mb-6" style={{ color:'rgba(45,42,38,.74)' }}>
                    {description}
                  </p>
                  <div className="text-[11px] md:text-[12px] font-semibold tracking-[.14em] uppercase" style={{ color:C.charcoal }}>
                    View on Instagram ◆
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------
          CTA + FOOTER
      ---------------------------------------------------- */}
      <section id="contact" className="px-5 py-16 sm:px-10 md:px-20 md:py-24 text-center" style={{ background:C.cream2 }}>
        <div className="text-[12px] tracking-[.22em] uppercase mb-6" style={{ color:C.gold, fontFamily:C.sans }}>
          ◆ &nbsp; Begin Your Transformation &nbsp; ◆
        </div>
        <h2 className="font-light leading-[1.2] mb-5" style={{ fontFamily:C.serif, fontSize:'clamp(32px,5vw,52px)', color:C.charcoal }}>
          Healthy, <em style={{ fontStyle:'italic', color:C.goldDark }}>radiant</em><br/>skin starts here.
        </h2>
        <p className="text-sm font-light leading-relaxed max-w-sm mx-auto mb-10" style={{ color:C.muted }}>
          Schedule a consultation with our aesthetic physicians and discover what's possible for your skin.
        </p>
        <button
          onClick={handleBookingClick}
          className="vivre-btn-dark px-8 py-4 text-[10px] font-semibold tracking-[.2em] uppercase border-0 cursor-pointer transition-all duration-300"
          style={{ background:C.charcoal, color:C.gold, fontFamily:C.sans }}
        >Request an Appointment</button>
        {shouldShowBookingAuthHint && (
          <div className="mt-5 flex justify-center">
            <AppointmentAccessHint
              mutedColor={C.muted}
              accentColor={C.goldDark}
              onLogin={() => setIsLoginOpen(true)}
              centered
            />
          </div>
        )}

        <div className="mx-auto my-14" style={{ width:60, height:'0.5px', background:'rgba(201,162,39,.4)' }}/>

        <div className="flex flex-wrap justify-center gap-8 md:gap-14">
          {[
            { label:'Valenzuela', value:'(0917) 558 4873 · Closed Mon & Tue' },
            { label:'MOA Shore',  value:'(02) 8255 5010 / (0917) 148 4873 · Closed Mon' },
            { label:'Facebook',     value:'VIVRE by Dr. JC Masangkay' },
            { label:'Instagram', value:'@thevivreclinic' },
            { label:'Sunday Hours', value:'Open on Sunday · 10AM – 8PM' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[11px] font-medium tracking-[.14em] uppercase mb-1.5" style={{ color:C.gold }}>{label}</div>
              <div className="text-[13px] font-light tracking-wide" style={{ color:C.muted }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-[11px] tracking-wide" style={{ color:'rgba(122,117,112,.5)' }}>
          © {new Date().getFullYear()} Vivre Medical Group · All rights reserved
        </div>
      </section>
    </div>
  );
};

/* -- helpers --------------------------------------------------- */
const Eyebrow = ({ color, children }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div className="w-7 shrink-0" style={{ height:'0.5px', background:color }}/>
    <span className="text-[11px] font-medium tracking-[.24em] uppercase" style={{ color }}>{children}</span>
  </div>
);

const AppointmentAccessHint = ({ mutedColor, accentColor, onLogin, centered = false }) => (
  <div
    className={`mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-light leading-relaxed ${centered ? 'justify-center text-center' : ''}`}
    style={{ color: mutedColor }}
  >
    <span>Create an account or log in to request an appointment.</span>
    <Link
      to="/register"
      className="font-medium transition-opacity hover:opacity-80"
      style={{ color: accentColor }}
    >
      Sign up
    </Link>
    <span>/</span>
    <button
      type="button"
      onClick={onLogin}
      className="border-0 bg-transparent p-0 font-medium transition-opacity hover:opacity-80"
      style={{ color: accentColor }}
    >
      Log in
    </button>
  </div>
);

const iconBtn = {
  width:38, height:38, borderRadius:'50%',
  border:'0.5px solid rgba(201,162,39,.3)',
  background:'transparent', cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center',
  color:'#2d2a26', transition:'all .3s',
};

export default LandingPage;
