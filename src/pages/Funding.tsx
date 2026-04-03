import { motion } from 'framer-motion';
import { pageVariants, containerVariants, itemVariants, cosmicEntranceUp } from '@/animations/pageTransitions';
import StarField from '@/components/StarField';

export default function Funding() {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen pt-24 pb-16 px-4"
    >
      <StarField />

      <div className="max-w-4xl mx-auto relative z-10 flex flex-col gap-12">
        <motion.div variants={cosmicEntranceUp} className="text-center flex flex-col items-center gap-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            Support <span className="gradient-text">SolarHub</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            SolarHub is an open-source citizen science project. Your contribution helps
            cover hosting, compute for model training, data storage, outreach, and community growth.
          </p>
        </motion.div>

        <motion.section variants={containerVariants} className="glass p-8 rounded-2xl">
          <motion.h2 variants={itemVariants} className="text-2xl font-bold text-slate-100 mb-4">How donations are used</motion.h2>
          <motion.p variants={itemVariants} className="text-slate-400 leading-relaxed mb-4">
            Funds will be allocated to: reliable cloud hosting and bandwidth for serving images,
            compute resources for training and evaluating machine learning models, maintaining
            open datasets and backups, and supporting outreach programs (workshops, scholarships,
            and community events) to grow the SolarHub contributor base.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 items-start">
            <a href="mailto:soumyadipkarforma02@gmail.com" className="btn-solar px-6 py-3 rounded-2xl">
              Contact to Donate (email)
            </a>

            <a href="https://github.com/sponsors/soumyadipkarforma" target="_blank" rel="noopener noreferrer" className="btn-solar px-6 py-3 rounded-2xl">
              Sponsor on GitHub
            </a>

            <a href="/" className="btn-secondary px-6 py-3 rounded-2xl">
              Back to Home
            </a>
          </motion.div>

          <motion.p variants={itemVariants} className="text-slate-400 text-sm mt-6">
            If you prefer, email us directly at <a href="mailto:soumyadipkarforma02@gmail.com" className="inline-block px-2 py-1 rounded text-solar-400 hover:bg-solar-500/10 transition-colors focus:outline-none focus:ring">soumyadipkarforma02@gmail.com</a> to discuss
            sponsorships, research partnerships, or other funding opportunities.
          </motion.p>
        </motion.section>
      </div>
    </motion.div>
  );
}
