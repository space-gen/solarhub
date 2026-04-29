import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  const base = import.meta.env.BASE_URL ?? '/';

  return (
    <footer className="w-full border-t border-white/[0.06] bg-gradient-to-t from-black/10 to-transparent py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-4">
        <div className="w-full flex flex-col items-center gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto justify-center">
            <Link to="/funding" className="text-slate-300 hover:underline text-sm text-center" aria-label="Support SolarHub (opens funding page)">
              Fund this project
            </Link>

            <a href="https://www.patreon.com/SoumyadipKarforma" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:underline text-sm text-center">
              Patreon
            </a>

            <a href="https://www.buymeacoffee.com/soumyadipkarforma" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:underline text-sm text-center">
              Buy me a coffee
            </a>
          </div>

          <nav className="flex items-center gap-4 justify-center mt-2">
            <a href="https://twitter.com/soumyadip_k" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:underline text-sm" aria-label="Twitter">
              Twitter
            </a>

            <a href="https://instagram.com/soumyadip_karforma" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:underline text-sm" aria-label="Instagram">
              Instagram
            </a>

            <a href="mailto:soumyadipkarforma02@gmail.com" className="text-slate-300 hover:underline text-sm" aria-label="Email">
              Email
            </a>
          </nav>
        </div>

        <div className="text-sm text-slate-400 text-center w-full flex items-center justify-center gap-2">
          <span>© {year}</span>
          <img src={`${base}spacegen.svg`} alt="SpaceGen" className="w-5 h-5 inline-block" />
          <a href="https://space-gen.github.io" target="_blank" rel="noopener noreferrer" className="hover:underline">SpaceGen.</a>
        </div>
      </div>
    </footer>
  );
}
