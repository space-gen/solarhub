import { motion } from 'framer-motion';
import { pageVariants, containerVariants, itemVariants, cosmicEntranceUp } from '@/animations/pageTransitions';
import StarField from '@/components/StarField';

export default function About() {
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
            About <span className="gradient-text">SolarHub</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            Empowering global citizen scientists to accelerate solar research and ML dataset creation.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <motion.div variants={itemVariants} className="glass p-8 rounded-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="text-3xl">🔭</span> Our Mission
            </h2>
            <p className="text-slate-400 leading-relaxed">
              SolarHub aims to bridge the gap between massive astronomical data collections and 
              ML-ready datasets. By involving the global community, we can process observations 
              from NASA's SDO faster and more accurately than AI alone.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass p-8 rounded-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="text-3xl">🌌</span> Powered by Aurora
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Every classification made on SolarHub is fed into the <b>Aurora</b> pipeline. 
              Aurora is our backend platform that manages the lifecycle of solar observations, 
              from ingestion to ML training cycles.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass p-8 rounded-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="text-3xl">🤝</span> SpaceGen Org
            </h2>
            {/* TODO: Confirm if the explicit mention of the organization should be retained */}
            <p className="text-slate-400 leading-relaxed">
              SpaceGen is the parent organization behind SolarHub and Aurora. Founded by 
              <b> Soumyadip Karforma</b>, we are dedicated to building open-source tools 
              and datasets for space science.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass p-8 rounded-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="text-3xl">💾</span> Open Data
            </h2>
            <p className="text-slate-400 leading-relaxed">
              We believe in transparency. All our processed datasets are published on 
              <b> Hugging Face</b> under the SpaceGen organization, making them freely 
              available to researchers and developers worldwide.
            </p>
          </motion.div>
        </motion.div>

        <motion.section variants={itemVariants} className="mt-12 text-center flex flex-col items-center gap-6">
          <h2 className="text-3xl font-bold text-slate-100">
            Join the <span className="gradient-text">Journey</span>
          </h2>
          <p className="text-slate-400 max-w-2xl">
            Whether you are an amateur astronomer, a data scientist, or just curious about 
            the sun, there is a place for you at SolarHub. Start classifying today and help 
            us decode the secrets of our nearest star.
          </p>
          <div className="flex gap-4">
            <a href="https://space-gen.github.io" target="_blank" rel="noopener noreferrer" className="btn-secondary px-8 py-3 rounded-2xl">
              Visit Organization
            </a>
            <a href="https://github.com/space-gen/aurora" target="_blank" rel="noopener noreferrer" className="btn-secondary px-8 py-3 rounded-2xl">
              View Aurora on GitHub
            </a>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
