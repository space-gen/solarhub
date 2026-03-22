import { motion } from 'framer-motion';
import { STAR_DATA } from '@/pages/Home.stardata';

export default function StarField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {STAR_DATA.map(star => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top:  `${star.y}%`,
            width:  `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
          }}
          animate={star.twinkle
            ? { opacity: [star.opacity, star.opacity * 0.15, star.opacity] }
            : undefined
          }
          transition={star.twinkle
            ? { duration: star.duration, ease: 'easeInOut', repeat: Infinity, delay: star.delay }
            : undefined
          }
        />
      ))}
    </div>
  );
}
