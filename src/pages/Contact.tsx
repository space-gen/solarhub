import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { pageVariants, containerVariants, itemVariants, cosmicEntranceUp } from '@/animations/pageTransitions';
import StarField from '@/components/StarField';

export default function Contact() {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen pt-24 pb-16 px-4 lg:px-8"
    >
      <StarField />

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col gap-12">
        <motion.div variants={cosmicEntranceUp} className="text-center flex flex-col items-center gap-4">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl">
            Have questions or want to collaborate? We'd love to hear from you.
          </p>
          <div className="flex gap-4 mt-2">
            <Link to="/funding" className="btn-solar px-6 py-3 rounded-2xl">Fund this project</Link>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <motion.div variants={itemVariants} className="glass p-8 rounded-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="text-3xl">📧</span> Email
            </h2>
            <p className="text-slate-400">
              For general inquiries and collaboration:
            </p>
            <a href="mailto:soumyadipkarforma02@gmail.com" aria-label="Email Soumyadip Karforma" className="btn-secondary px-4 py-2 rounded-lg">
              soumyadipkarforma02@gmail.com
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="glass p-8 rounded-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="text-3xl">🐙</span> GitHub
            </h2>
            <p className="text-slate-400">
              Contribute to the project or report bugs on our repositories:
            </p>
            <div className="flex flex-col gap-2">
              <a href="https://github.com/space-gen/aurora" className="btn-secondary px-4 py-2 rounded-lg">
                space-gen/aurora (Backend)
              </a>
              <a href="https://github.com/space-gen/solarhub" className="btn-secondary px-4 py-2 rounded-lg">
                space-gen/solarhub (Frontend)
              </a>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass p-8 rounded-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="text-3xl">🌍</span> Website
            </h2>
            <p className="text-slate-400">
              Follow the organization for updates:
            </p>
            <a href="https://space-gen.github.io" className="btn-secondary px-4 py-2 rounded-lg">
              Organization website
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="glass p-8 rounded-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="text-3xl">🤗</span> Hugging Face
            </h2>
            <p className="text-slate-400">
              Access our open-source datasets:
            </p>
            <a href="https://huggingface.co/SpaceGen" className="btn-secondary px-4 py-2 rounded-lg">
              huggingface.co/SpaceGen
            </a>
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass p-8 rounded-2xl mt-8 text-center">
          <h2 className="text-2xl font-bold text-slate-100 mb-4">
            Follow <span className="gradient-text">Soumyadip Karforma</span>
          </h2>
          <p className="text-slate-400 mb-6">
            Connect with the founder and stay updated with his latest work in space tech.
          </p>
          <div className="flex justify-center gap-6">
            <a href="https://github.com/soumyadipkarforma" target="_blank" rel="noopener noreferrer" aria-label="Soumyadip Karforma on GitHub" className="btn-secondary px-3 py-2 rounded-lg text-sm">
              GitHub
            </a>
            <a href="https://instagram.com/soumyadip_karforma" target="_blank" rel="noopener noreferrer" aria-label="Soumyadip Karforma on Instagram" className="btn-secondary px-3 py-2 rounded-lg text-sm">
              Instagram
            </a>
            <a href="https://twitter.com/soumyadip_k" target="_blank" rel="noopener noreferrer" aria-label="Soumyadip Karforma on Twitter" className="btn-secondary px-3 py-2 rounded-lg text-sm">
              Twitter
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
