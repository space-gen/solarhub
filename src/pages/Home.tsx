/**
 * src/pages/Home.tsx
 *
 * The SolarHub landing page – the first thing visitors see.
 *
 * Sections (top → bottom):
 *  1. Hero           – full-viewport, animated starfield + large SVG sun,
 *                      title, subtitle, and CTA button.
 *  2. Stats bar      – three live-looking statistics (tasks, contributors, etc.)
 *  3. Feature cards  – three glassmorphism cards explaining what SolarHub does.
 *  4. How it works   – three-step process description.
 *  5. CTA footer     – second call-to-action before the page ends.
 *
 * All entrance animations use Framer Motion variants so each section fades/
 * slides in as the user scrolls past it (via `whileInView`).
 *
 * No external images are used.  The large animated sun is built entirely from
 * SVG and Framer Motion, and the starfield uses deterministic CSS/inline
 * positioning so it looks natural and static between renders.
 */

import { useNavigate }              from 'react-router-dom';
import { motion }                   from 'framer-motion';
import {
  pageVariants,
  containerVariants,
  itemVariants,
  cosmicEntrance,
  cosmicEntranceUp,
} from '@/animations/pageTransitions';
import { glowButtonVariants }       from '@/animations/hoverAnimations';
import StarField                from '@/components/StarField';

// ---------------------------------------------------------------------------
// Hero section – animated sun
// ---------------------------------------------------------------------------

/**
 * HeroSun
 *
 * A large, multi-layered SVG animation of the sun.
 *
 * Layers (inner → outer):
 *  1. Radial glow (pulsing circle behind everything)
 *  2. Outer corona ring – slow clockwise rotation
 *  3. Middle corona ring – slightly faster counter-clockwise
 *  4. Long corona rays – slow rotation
 *  5. Short inner rays – slightly faster
 *  6. Solar disc with gradient fill and pulsing glow
 */
function HeroSun() {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: 340, height: 340 }}
      variants={cosmicEntrance}
    >
      {/* Pulsing outer radial glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 340, height: 340,
          background: 'radial-gradient(circle, rgba(249,115,22,0.20) 0%, rgba(249,115,22,0.05) 50%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
      />

      {/* Second wider glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 460, height: 460,
          background: 'radial-gradient(circle, rgba(0,0,0,0.08) 0%, transparent 60%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
      />

      {/* Outer dashed orbit ring – slow clockwise */}
      <motion.svg
        className="absolute inset-0"
        viewBox="0 0 340 340"
        style={{ width: 340, height: 340 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, ease: 'linear', repeat: Infinity }}
      >
        <ellipse cx="170" cy="170" rx="150" ry="50"
          fill="none" stroke="rgba(249,115,22,0.15)" strokeWidth="1"
          strokeDasharray="10 8" />
      </motion.svg>

      {/* Middle orbit ring – counter-clockwise */}
      <motion.svg
        className="absolute inset-0"
        viewBox="0 0 340 340"
        style={{ width: 340, height: 340 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
      >
        <ellipse cx="170" cy="170" rx="100" ry="35"
          fill="none" stroke="rgba(217,70,239,0.12)" strokeWidth="1"
          strokeDasharray="6 6" />
      </motion.svg>

      {/* Long corona rays */}
      <motion.svg
        className="absolute inset-0"
        viewBox="0 0 340 340"
        style={{ width: 340, height: 340 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 45, ease: 'linear', repeat: Infinity }}
      >
        {Array.from({ length: 16 }, (_, i) => {
          const angle  = (i * 22.5 * Math.PI) / 180;
          const r1     = 88;
          const r2     = 108 + (i % 4 === 0 ? 18 : 0);
          return (
            <line key={i}
              x1={170 + r1 * Math.cos(angle)} y1={170 + r1 * Math.sin(angle)}
              x2={170 + r2 * Math.cos(angle)} y2={170 + r2 * Math.sin(angle)}
              stroke={i % 2 === 0 ? 'rgba(251,146,60,0.5)' : 'rgba(249,115,22,0.3)'}
              strokeWidth={i % 4 === 0 ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
      </motion.svg>

      {/* Inner rays – faster */}
      <motion.svg
        className="absolute inset-0"
        viewBox="0 0 340 340"
        style={{ width: 340, height: 340 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 25, ease: 'linear', repeat: Infinity }}
      >
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i * 45 * Math.PI) / 180;
          return (
            <line key={i}
              x1={170 + 70 * Math.cos(angle)} y1={170 + 70 * Math.sin(angle)}
              x2={170 + 82 * Math.cos(angle)} y2={170 + 82 * Math.sin(angle)}
              stroke="rgba(251,191,36,0.4)"
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}
      </motion.svg>

      {/* Solar disc */}
      <motion.div
        className="relative z-10 rounded-full"
        style={{
          width: 120, height: 120,
          background: 'radial-gradient(circle at 38% 35%, #fde68a 0%, #fbbf24 30%, #f97316 65%, #c2410c 100%)',
        }}
        animate={{
          boxShadow: [
            '0 0 40px rgba(249,115,22,0.5), 0 0 80px rgba(249,115,22,0.25)',
            '0 0 70px rgba(249,115,22,0.8), 0 0 140px rgba(249,115,22,0.4)',
            '0 0 40px rgba(249,115,22,0.5), 0 0 80px rgba(249,115,22,0.25)',
          ],
        }}
        transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
      >
        {/* Surface highlight */}
        <div
          className="absolute rounded-full opacity-40"
          style={{
            top: '12%', left: '15%',
            width: '40%', height: '35%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------

interface StatItem { label: string; value: string; icon: string }

const STATS: StatItem[] = [
  { label: 'Tasks Available',   value: '6+',    icon: '🔭' },
  { label: 'Classifications',   value: '10K+',  icon: '📊' },
  { label: 'Active Scientists', value: '500+',  icon: '👩‍🔬' },
];

function StatsBar() {
  return (
    <motion.div
      className="grid grid-cols-3 gap-4 max-w-2xl mx-auto w-full"
      variants={containerVariants}
    >
      {STATS.map(stat => (
        <motion.div
          key={stat.label}
          variants={itemVariants}
          className="glass rounded-xl p-4 text-center"
        >
          <p className="text-2xl mb-1">{stat.icon}</p>
          <p className="text-2xl font-bold gradient-text">{stat.value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Feature cards
// ---------------------------------------------------------------------------

interface Feature { icon: string; title: string; description: string }

const FEATURES: Feature[] = [
  {
    icon:  '🛰️',
    title: 'Real NASA Data',
    description:
      'Every image you classify comes directly from NASA\'s Solar Dynamics Observatory — real science, real impact.',
  },
  {
    icon:  '🤖',
    title: 'AI + Human Intelligence',
    description:
      'Our machine-learning model makes an initial guess; your expertise validates it and improves the model over time.',
  },
  {
    icon:  '🌍',
    title: 'Open Science',
    description:
      'All annotations are stored as public GitHub Issues — transparent, auditable, and freely accessible to researchers.',
  },
];

function FeatureCards() {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      {FEATURES.map(f => (
        <motion.div
          key={f.title}
          variants={itemVariants}
          whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 30px rgba(249,115,22,0.15)' }}
          className="glass rounded-2xl p-6 flex flex-col gap-3 cursor-default"
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <span className="text-4xl">{f.icon}</span>
          <h3 className="text-lg font-bold text-slate-100">{f.title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// How it works section
// ---------------------------------------------------------------------------

interface Step { number: string; title: string; description: string }

const STEPS: Step[] = [
  {
    number:      '01',
    title:       'View a solar image',
    description: 'We show you a real SDO observation and the AI\'s initial classification attempt.',
  },
  {
    number:      '02',
    title:       'Make your assessment',
    description: 'Choose between sunspot, solar flare, or coronal hole and rate your confidence.',
  },
  {
    number:      '03',
    title:       'Contribute to science',
    description: 'Your annotation is logged to our open dataset, helping train better solar AI models.',
  },
];

function HowItWorks() {
  return (
    <section className="max-w-4xl mx-auto w-full">
      <motion.h2
        className="text-3xl font-bold text-center text-slate-100 mb-12"
        variants={cosmicEntranceUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        How it <span className="gradient-text">works</span>
      </motion.h2>

      <motion.div
        className="flex flex-col md:flex-row gap-8 relative"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {/* Connecting line (desktop only) */}
        <div className="hidden md:block absolute top-10 left-[16.6%] right-[16.6%] h-px
                        bg-gradient-to-r from-transparent via-solar-500/30 to-transparent" />

        {STEPS.map(step => (
          <motion.div
            key={step.number}
            variants={itemVariants}
            className="flex-1 flex flex-col items-center text-center gap-4"
          >
            <div className="w-20 h-20 rounded-full glass border border-solar-500/30
                            flex items-center justify-center text-solar-400 text-2xl font-bold
                            solar-halo z-10">
              {step.number}
            </div>
            <h3 className="font-bold text-slate-100">{step.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">{step.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function Home() {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen"
    >
      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* Hero section                                                          */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center
                           text-center px-4 pt-20 pb-16 overflow-hidden cosmic-bg">

        {/* Star field background */}
        <StarField />

        {/* Content stack */}
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-4xl">

          {/* Animated sun */}
          <motion.div variants={cosmicEntrance}>
            <HeroSun />
          </motion.div>

          {/* Title */}
          <motion.div variants={cosmicEntranceUp} className="flex flex-col items-center gap-4">
            <h1 className="text-6xl md:text-8xl font-black tracking-tight flex flex-col items-center">
              <span className="gradient-text">SolarHub</span>
              <span className="text-sm md:text-base uppercase tracking-[0.3em] text-slate-500 font-bold -mt-2">
                A community project
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl leading-relaxed mt-4">
              A citizen-science initiative founded by <b>Soumyadip Karforma</b>.
              Help classify real solar observations from NASA's SDO to build open-source ML datasets.
            </p>
          </motion.div>

          {/* CTA button */}
          <motion.div variants={itemVariants} className="flex gap-4">
            <motion.button
              variants={glowButtonVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              onClick={() => navigate('/classify')}
              className="btn-solar text-lg px-10 py-4 rounded-2xl"
            >
              🚀&nbsp; Start Classifying
            </motion.button>

            <motion.button
              variants={glowButtonVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              onClick={() => navigate('/funding')}
              className="btn-solar text-sm px-6 py-3 rounded-2xl"
            >
              💙&nbsp; Fund / Donate
            </motion.button>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            variants={itemVariants}
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-slate-600 text-sm flex flex-col items-center gap-1 mt-4"
          >
            <span>Scroll to learn more</span>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* Stats bar                                                             */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 bg-cosmic-950/80">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col items-center gap-8 max-w-7xl mx-auto"
        >
          <StatsBar />
        </motion.div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* Feature cards                                                         */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 cosmic-bg">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
          <motion.h2
            className="text-4xl font-bold text-slate-100 text-center"
            variants={cosmicEntranceUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            Why <span className="gradient-text">SolarHub</span>?
          </motion.h2>
          <FeatureCards />
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* How it works                                                          */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-cosmic-950/80">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
          <HowItWorks />
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* Founder Section                                                      */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-cosmic-950/90 relative overflow-hidden">
        {/* Background glow for this section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]
                        bg-solar-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
          {/* Founder image/placeholder */}
          <motion.div
            className="w-48 h-48 md:w-64 md:h-64 rounded-2xl glass p-1 relative"
            variants={cosmicEntrance}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="w-full h-full rounded-xl bg-cosmic-800 flex items-center justify-center overflow-hidden border border-white/5">
              <span className="text-6xl">🚀</span>
              {/* Optional: Add actual image path later */}
              {/* Example import (optional): import founderImg from '@/assets/soumyadipkarforma.png'; */}
              {/* Use public path so the user can upload the image to public/images */}
              {/* <img src="/images/soumyadipkarforma.png" className="w-full h-full object-cover" alt="Soumyadip Karforma, Founder" /> */}
            </div>
            <div className="absolute -bottom-4 -right-4 glass px-4 py-2 rounded-lg border border-solar-500/30">
              <p className="text-xs font-bold text-solar-400 uppercase tracking-widest">Founder</p>
            </div>
          </motion.div>

          <motion.div
            className="flex-1 flex flex-col gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2 variants={itemVariants} className="text-4xl font-bold text-slate-100">
              Meet <span className="gradient-text">Soumyadip Karforma</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="text-lg text-slate-300 leading-relaxed">
              Founder of <a href="https://space-gen.github.io" className="inline-block px-2 py-1 rounded text-solar-400 hover:bg-solar-500/10 transition-colors focus:outline-none focus:ring">SpaceGen</a>,
              Soumyadip is passionate about democratizing space science and building open datasets for the next generation of AI.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-solar-500 shrink-0" />
                <p className="text-slate-400">Leading the <b>Aurora Platform</b> – the backend powering SolarHub's ML pipeline.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-solar-500 shrink-0" />
                <p className="text-slate-400">Pioneering <b>Open Science</b> by releasing ML-ready solar data on Hugging Face.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-solar-500 shrink-0" />
                <p className="text-slate-400">Building a community of space enthusiasts and researchers globally.</p>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="pt-4 flex gap-4">
              <a href="https://space-gen.github.io" target="_blank" rel="noopener noreferrer" className="btn-secondary px-6 py-2 rounded-xl text-sm">
                Organization Website
              </a>
              <a href="https://huggingface.co/SpaceGen" target="_blank" rel="noopener noreferrer" className="btn-secondary px-6 py-2 rounded-xl text-sm">
                Hugging Face Org
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* Bottom CTA                                                            */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 cosmic-bg">
        <motion.div
          className="max-w-2xl mx-auto text-center flex flex-col items-center gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2 variants={itemVariants} className="text-4xl font-black text-slate-100">
            Ready to explore the <span className="gradient-text">Sun</span>?
          </motion.h2>
          <motion.p variants={itemVariants} className="text-lg text-slate-400">
            Join hundreds of citizen scientists helping decode solar phenomena.
            No experience required – just curiosity.
          </motion.p>
          <motion.div variants={itemVariants} className="flex gap-4">
            <motion.button
              variants={glowButtonVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              onClick={() => navigate('/classify')}
              className="btn-solar text-lg px-10 py-4 rounded-2xl"
            >
              ☀️&nbsp; Begin Classification
            </motion.button>

            <motion.button
              variants={glowButtonVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              onClick={() => navigate('/funding')}
              className="btn-solar text-sm px-6 py-3 rounded-2xl"
            >
              💙&nbsp; Fund / Donate
            </motion.button>
          </motion.div>
        </motion.div>
      </section>
    </motion.div>
  );
}
