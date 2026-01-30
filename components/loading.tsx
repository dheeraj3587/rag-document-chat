import { motion } from "framer-motion";

export default function LoadingPage() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />

      {/* Loader container */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Animated Ring */}
        <motion.div
          className="w-24 h-24 rounded-full border-4 border-blue-400 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        />

        {/* Bouncing Dots */}
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-4 h-4 bg-blue-400 rounded-full"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
            />
          ))}
        </div>

        {/* Text */}
        <motion.p
          className="text-blue-200 text-lg tracking-widest"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          LOADING
        </motion.p>
      </div>
    </div>
  );
}
