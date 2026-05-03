'use client';

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

export function SecuritySeal({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      className="inline-flex items-center gap-1.5 rounded-full bg-trust/8 px-3 py-1.5 text-[11px] font-medium text-trust"
    >
      <ShieldCheck size={12} aria-hidden />
      <span>{label}</span>
    </motion.div>
  );
}
