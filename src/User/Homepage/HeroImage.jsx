import { motion } from 'framer-motion';

export default function HeroImage() {
  return (
    <motion.div
      className="rvc-hero-image"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      <figure>
        <img src="/images/LandingPage/bg1.png" alt="bg1 test" className="rvc-paw-bg" />
        <img src="/images/LandingPage/bg2.png" alt="Cat and Dog" className="rvc-animal-img" />
      </figure>
    </motion.div>
  );
}