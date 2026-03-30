import logoBlack from '../assets/vivre-black.png';

const AppLoadingScreen = ({ label = 'Loading' }) => (
    <div className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-6">
        <div className="flex flex-col items-center gap-5 text-center">
            <img src={logoBlack} alt="Vivre" className="h-12 object-contain opacity-90 sm:h-14" />
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#d4af37]/25 border-t-[#d4af37]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f8167]">{label}</p>
        </div>
    </div>
);

export default AppLoadingScreen;
