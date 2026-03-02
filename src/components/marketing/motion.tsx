import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
};

const revealEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Reveal({ className, delay = 0, transition, ...props }: RevealProps) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.62, ease: revealEase, delay, ...transition }}
      {...props}
    />
  );
}

export function FloatingOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.span
        className="absolute -top-32 left-[6%] h-80 w-80 rounded-full bg-primary/20 blur-3xl"
        animate={{ x: [0, 24, -12, 0], y: [0, 18, -8, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 16, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
      <motion.span
        className="absolute top-[20%] right-[10%] h-72 w-72 rounded-full bg-accent/20 blur-3xl"
        animate={{ x: [0, -26, 10, 0], y: [0, -12, 20, 0], scale: [1, 0.95, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
      <motion.span
        className="absolute bottom-[-12rem] left-[38%] h-96 w-96 rounded-full bg-primary/16 blur-3xl"
        animate={{ x: [0, -16, 20, 0], y: [0, -24, 6, 0], scale: [1, 1.06, 0.94, 1] }}
        transition={{ duration: 21, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
    </div>
  );
}

export function PulseDot({ className = "" }: { className?: string }) {
  return (
    <motion.span
      className={cn("zr-status-dot", className)}
      animate={{ opacity: [0.55, 1, 0.55], scale: [0.95, 1.06, 0.95] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
