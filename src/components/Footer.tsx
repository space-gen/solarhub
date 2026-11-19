import { Link } from 'react-router-dom';
import { SpaceGenMark } from '@/components/BrandLogo';

const LINKS = [
  ['Patreon', 'https://www.patreon.com/SoumyadipKarforma'],
  ['Buy me a coffee', 'https://www.buymeacoffee.com/soumyadipkarforma'],
  ['Twitter', 'https://twitter.com/soumyadip_k'],
  ['Instagram', 'https://instagram.com/soumyadip_karforma'],
  ['GitHub', 'https://github.com/space-gen/solarhub'],
];

export default function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-haze sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="flex items-center gap-2">
          <span>© {new Date().getFullYear()}</span>
          <SpaceGenMark className="h-6 w-6" />
          <a className="link" href="https://space-gen.github.io" target="_blank" rel="noopener noreferrer">SpaceGen</a>
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link className="link" to="/funding">Fund this project</Link>
          <Link className="link" to="/data">Datasets</Link>
          {LINKS.map(([label, href]) => <a key={href} className="link" href={href} target="_blank" rel="noopener noreferrer">{label}</a>)}
          <a className="link" href="mailto:soumyadipkarforma02@gmail.com">Email</a>
        </nav>
      </div>
    </footer>
  );
}
