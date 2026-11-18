import { Link } from 'react-router-dom';

const SECTIONS = [
  ['The goal', 'SolarHub turns public solar images into labelled data that researchers and machine learning projects can use.'],
  ['How data is checked', 'The same pictures go to many people, answers record when someone is unsure, and marks outside the Sun are rejected.'],
  ['Aurora', 'Aurora is the open pipeline that collects new images, reads submitted marks and publishes them.'],
  ['SpaceGen', 'SpaceGen is the organization behind SolarHub. It was founded by Soumyadip Karforma to build open tools for space science.'],
];

export default function About() {
  return (
    <div className="page">
      <h1 className="max-w-4xl text-5xl font-bold md:text-7xl">About <span className="gradient-text">SolarHub</span></h1>
      <dl className="mt-12 grid gap-8 md:grid-cols-2">
        {SECTIONS.map(([title, text]) => (
          <div key={title} className="border-t border-edge pt-4">
            <dt className="text-xl font-bold">{title}</dt>
            <dd className="mt-2 text-haze">{text}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-12 flex items-center gap-4">
        <img src="/images/soumyadipkarforma.png" alt="" className="h-20 w-20 rounded-full object-cover" />
        <p><strong>Soumyadip Karforma</strong><br /><span className="text-haze">Founder of SpaceGen</span></p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/classify" className="btn btn-primary big">Start marking</Link>
        <a className="btn big" href="https://github.com/space-gen/aurora" target="_blank" rel="noopener noreferrer">View Aurora on GitHub</a>
      </div>
    </div>
  );
}
