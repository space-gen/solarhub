import { NavLink } from 'react-router-dom';
import { SpaceGenMark, SunLogo } from '@/components/BrandLogo';
import { useStoredUser } from '@/hooks/useStoredUser';

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Classify', to: '/classify' },
  { label: 'Data', to: '/data' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center rounded-md px-3 font-medium transition-colors hover:bg-raised ${
    isActive ? 'text-sun underline decoration-2 underline-offset-8' : 'text-limb'
  }`;

export default function NavigationBar({ points, streak }: { points: number; streak: number }) {
  const user = useStoredUser();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ink">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 sm:px-6">
        <NavLink to="/" end aria-label="SolarHub by SpaceGen, home" className="group mr-auto flex min-h-11 items-center gap-1 rounded-md">
          <SunLogo />
          <span className="flex flex-col">
            <span className="text-xl font-bold leading-tight tracking-tight">
              <span className="gradient-text">Solar</span><span className="text-white">Hub</span>
            </span>
            <span className="-mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-haze group-hover:text-sun">
              by <SpaceGenMark /> SpaceGen
            </span>
          </span>
        </NavLink>

        <nav aria-label="Main" className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user ? (
          <NavLink
            to="/account"
            aria-label={`Account for ${user.login}: ${points} points, ${streak} day streak`}
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 font-medium hover:bg-raised"
          >
            <span>{points} {points === 1 ? 'point' : 'points'}</span>
            <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full" />
          </NavLink>
        ) : (
          <NavLink to="/account" className="btn">Account</NavLink>
        )}
        <a href="https://ko-fi.com/spacegen" target="_blank" rel="noreferrer" className="btn btn-primary hidden sm:inline-flex">Fund</a>
      </div>
    </header>
  );
}
