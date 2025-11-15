import { motion } from 'framer-motion';

export default function HeroText() {
  return (
    <motion.div
      className="rvc-hero-text"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <header>
        <h1 className='title-h1'>
          Welcome to <br /> Rivera Veterinary Clinic
        </h1>
      </header>
      <p>
        PawCare brings a smarter, more connected experience to pet healthcare—simple, 
        reliable, and designed with your pet’s well-being in mind.
      </p>
      <a href="login" className="rvc-hero-btn">Get Started</a>
    </motion.div>
  );
}
