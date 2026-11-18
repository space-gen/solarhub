const LINKS = [
  ['Sponsor on GitHub', 'https://github.com/sponsors/soumyadipkarforma'],
  ['Join on Patreon', 'https://www.patreon.com/SoumyadipKarforma'],
  ['Buy a coffee', 'https://www.buymeacoffee.com/soumyadipkarforma'],
];

export default function Funding() {
  return (
    <div className="page">
      <h1 className="max-w-4xl text-5xl font-bold md:text-7xl">Support <span className="gradient-text">SolarHub</span></h1>
      <p className="measure mt-5 text-lg text-haze">
        Support pays for hosting, data storage, model training and outreach to new contributors.
      </p>
      <ul className="mt-8 flex flex-wrap gap-3">
        {LINKS.map(([label, href], index) => (
          <li key={href}>
            <a className={`btn big ${index === 0 ? 'btn-primary' : ''}`} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-haze">
        For sponsorships or research partnerships, email{' '}
        <a className="link" href="mailto:soumyadipkarforma02@gmail.com">soumyadipkarforma02@gmail.com</a>.
      </p>
    </div>
  );
}
