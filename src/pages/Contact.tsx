const LINKS = [
  ['Email', 'soumyadipkarforma02@gmail.com', 'mailto:soumyadipkarforma02@gmail.com'],
  ['App code', 'space-gen/solarhub', 'https://github.com/space-gen/solarhub'],
  ['Data pipeline', 'space-gen/aurora', 'https://github.com/space-gen/aurora'],
  ['Datasets', 'Request access', '#/data'],
  ['Organization', 'space-gen.github.io', 'https://space-gen.github.io'],
];

export default function Contact() {
  return (
    <div className="page">
      <h1 className="text-5xl font-bold md:text-7xl">Get in <span className="gradient-text">touch</span></h1>
      <p className="measure mt-4 text-lg text-haze">Ask a question, report a problem or suggest a collaboration.</p>
      <dl className="mt-10 max-w-2xl divide-y divide-hairline border-y border-hairline">
        {LINKS.map(([label, text, href]) => (
          <div key={label} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="font-semibold">{label}</dt>
            <dd><a className="link break-words" href={href}>{text}</a></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
