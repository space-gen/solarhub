import { motion } from 'framer-motion';
import { pageVariants, containerVariants, itemVariants, cosmicEntranceUp } from '@/animations/pageTransitions';
import StarField from '@/components/StarField';

export default function Contact() {
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
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            Have questions or want to collaborate? We'd love to hear from you.
          </p>
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
            <a href="mailto:karformasoumyadip@gmail.com" className="text-solar-400 font-bold hover:underline">
              karformasoumyadip@gmail.com
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
              <a href="https://github.com/space-gen/aurora" className="text-solar-400 font-bold hover:underline">
                space-gen/aurora (Backend)
              </a>
              <a href="https://github.com/space-gen/solarhub" className="text-solar-400 font-bold hover:underline">
                space-gen/solarhub (Frontend)
              </a>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass p-8 rounded-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="text-3xl">🌍</span> Website
            </h2>
            <p className="text-slate-400">
              Follow our mother organization for updates:
            </p>
            <a href="https://space-gen.github.io" className="text-solar-400 font-bold hover:underline">
              space-gen.github.io
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="glass p-8 rounded-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="text-3xl">🤗</span> Hugging Face
            </h2>
            <p className="text-slate-400">
              Access our open-source datasets:
            </p>
            <a href="https://huggingface.co/SpaceGen" className="text-solar-400 font-bold hover:underline">
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
            <a href="https://github.com/soumyadipkarforma" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-solar-400 transition-colors">
              GitHub
            </a>
            <a href="https://linkedin.com/in/soumyadip-karforma" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-solar-400 transition-colors">
              LinkedIn
            </a>
            <a href="https://twitter.com/SoumyadipK" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-solar-400 transition-colors">
              Twitter
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
