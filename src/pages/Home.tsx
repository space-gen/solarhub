import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  pageVariants,
  staggerContainer,
  staggerChild,
} from '../animations/pageTransitions'
import { solarPulse } from '../animations/hoverAnimations'

const FEATURES = [
  {
    icon: '🌑',
    title: 'Identify Sunspots',
    description:
      'Classify dark sunspot regions on the solar surface that affect space weather.',
  },
  {
    icon: '⚡',
    title: 'Track Solar Flares',
    description:
      'Help identify explosive releases of electromagnetic radiation and particles.',
  },
  {
    icon: '🕳️',
    title: 'Map Coronal Holes',
    description:
      'Find regions in the corona where the magnetic field extends outward.',
  },
  {
    icon: '🌊',
    title: 'Spot Prominences',
    description:
      'Detect loops of plasma rising from the solar surface into the corona.',
  },
]

const STATS = [
  { value: '50K+', label: 'Images Classified' },
  { value: '2.4K', label: 'Contributors' },
  { value: '98%', label: 'Accuracy' },
  { value: '15', label: 'Countries' },
]

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative"
    >
      <div className="stars-bg" />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
        >
          {/* Solar orb */}
          <motion.div
            className="relative mx-auto mb-10 w-40 h-40"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              className="w-full h-full rounded-full"
              style={{
                background:
                  'radial-gradient(ellipse at 35% 35%, #ffd966 0%, #ff9500 35%, #ff4500 65%, #b01000 90%)',
              }}
              animate={solarPulse}
            />
            {/* Corona rings */}
            {[1.5, 2, 2.6].map((scale, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-solar-400/20"
                style={{ transform: `scale(${scale})` }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.5,
                }}
              />
            ))}
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.p
              variants={staggerChild}
              className="text-solar-400/80 text-sm font-mono tracking-[0.3em] uppercase mb-4"
            >
              Citizen Science Platform
            </motion.p>

            <motion.h1
              variants={staggerChild}
              className="text-5xl sm:text-7xl font-black mb-6 leading-none"
            >
              <span className="text-gradient">Solar</span>
              <span className="text-white">Hub</span>
            </motion.h1>

            <motion.p
              variants={staggerChild}
              className="text-xl sm:text-2xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Help scientists understand our star. Classify solar observations
              and contribute to cutting-edge space weather research.
            </motion.p>

            <motion.div
              variants={staggerChild}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/classify">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary text-base px-8 py-4"
                >
                  🚀 Start Classifying
                </motion.button>
              </Link>
              <Link to="/leaderboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-secondary text-base px-8 py-4"
                >
                  🏆 View Leaderboard
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
              <motion.div
                className="w-1 h-2 rounded-full bg-solar-400"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-space-950 pointer-events-none" />
      </section>

      {/* Stats */}
      <section className="relative z-10 py-16 px-4">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {STATS.map(({ value, label }) => (
            <motion.div
              key={label}
              variants={staggerChild}
              className="card text-center"
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300 } }}
            >
              <div className="text-3xl font-black text-gradient">{value}</div>
              <div className="text-white/40 text-sm mt-1">{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              What you'll <span className="text-gradient">classify</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Each image contains one or more solar features. Your expert eye
              helps train better AI models.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-50px' }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {FEATURES.map(({ icon, title, description }) => (
              <motion.div
                key={title}
                variants={staggerChild}
                whileHover={{
                  y: -6,
                  boxShadow: '0 20px 40px rgba(255,149,0,0.15)',
                  transition: { type: 'spring', stiffness: 300 },
                }}
                className="card hover:border-white/20 transition-colors"
              >
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center glass-strong p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-solar-500/10 via-transparent to-blue-500/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="text-5xl mb-6">☀️</div>
            <h2 className="text-3xl font-bold mb-4">
              Ready to explore the Sun?
            </h2>
            <p className="text-white/50 mb-8 text-lg">
              Every classification you make helps scientists understand solar
              activity and protect our technology here on Earth.
            </p>
            <Link to="/classify">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary text-base px-10 py-4"
              >
                Begin Classification →
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>
    </motion.div>
  )
}
