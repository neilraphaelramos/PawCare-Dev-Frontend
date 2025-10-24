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
        <h1>
          Welcome to <br /> Rivera Veterinary Clinic
        </h1>
      </header>
      <p>
        All-in-one pet care—records, appointments, and health. Join Rivera Veterinary Clinic
        and try our AI Symptom Checker to better understand your pet’s health.
      </p>
      <a href="login" className="rvc-hero-btn">Get Started</a>
    </motion.div>
  );
}
