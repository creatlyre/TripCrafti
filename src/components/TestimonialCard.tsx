import { motion } from 'framer-motion';

interface TestimonialCardProps {
  text: string;
  author: string;
  delay: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ text, author, delay }) => {
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, delay } },
  };

  return (
    <motion.div
      className="flex flex-col justify-between p-6 bg-slate-900/60 rounded-xl border border-slate-800/70 shadow-md"
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
    >
      <blockquote className="text-lg italic text-slate-200">“{text}”</blockquote>
      <cite className="mt-4 text-right font-semibold not-italic text-cyan-400">— {author}</cite>
    </motion.div>
  );
};

export default TestimonialCard;
