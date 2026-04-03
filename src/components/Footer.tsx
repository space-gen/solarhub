import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/[0.06] bg-gradient-to-t from-black/10 to-transparent py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/funding" className="btn-solar px-3 py-2 rounded-xl text-sm" aria-label="Support SolarHub (opens funding page)">
            Fund this project
          </Link>

          <nav className="flex items-center gap-3" aria-label="Social links">
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-slate-100" aria-label="Twitter">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
                <path d="M22 5.92c-.68.3-1.4.5-2.16.6.78-.46 1.38-1.2 1.66-2.07-.74.44-1.56.76-2.43.93a4.1 4.1 0 0 0-7 3.73A11.63 11.63 0 0 1 3.16 4.9a4.07 4.07 0 0 0-.56 2.06c0 1.42.72 2.67 1.82 3.4-.67 0-1.3-.2-1.86-.5v.05c0 1.99 1.42 3.64 3.3 4.02-.34.1-.7.15-1.07.15-.26 0-.52-.02-.77-.07.52 1.62 2.03 2.8 3.82 2.83A8.23 8.23 0 0 1 2 19.54 11.61 11.61 0 0 0 8.29 21c7.55 0 11.68-6.26 11.68-11.69v-.53c.8-.6 1.5-1.36 2.06-2.22-.74.33-1.53.56-2.36.66z" />
              </svg>
            </a>

            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-slate-100" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
                <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm8 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM12 7a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 7zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
              </svg>
            </a>

            <a href="mailto:hello@spacegen.example" className="text-slate-300 hover:text-slate-100" aria-label="Email">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
                <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </a>
          </nav>
        </div>

        <div className="text-sm text-slate-400">
          <span>© {year} SolarHub — by SpaceGen.</span>
        </div>
      </div>
    </footer>
  );
}
