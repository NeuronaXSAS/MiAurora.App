"use client";

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Sparkles, Star, Heart, Gift, Trophy, Coins } from 'lucide-react';

type CelebrationType = 'credits' | 'achievement' | 'milestone' | 'welcome' | 'streak';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  type: 'confetti' | 'star' | 'heart' | 'sparkle';
}

interface CelebrationAnimationProps {
  type: CelebrationType;
  amount?: number;
  message?: string;
  onComplete?: () => void;
}

const celebrationConfig = {
  credits: {
    icon: Coins,
    title: 'Credits Earned!',
    colors: ['#FFC285', '#FFD4A3', '#FFE4C2', '#FF6B7A'],
    particleCount: 15, // Reduced for better performance
  },
  achievement: {
    icon: Trophy,
    title: 'Achievement Unlocked!',
    colors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#FF6B7A'],
    particleCount: 20,
  },
  milestone: {
    icon: Star,
    title: 'Milestone Reached!',
    colors: ['#FF6B7A', '#FFB3BC', '#FFC285', '#8B5CF6'],
    particleCount: 25,
  },
  welcome: {
    icon: Heart,
    title: 'Welcome to Aurora App!',
    colors: ['#FF6B7A', '#FFE8E8', '#FFC285', '#8B5CF6'],
    particleCount: 18,
  },
  streak: {
    icon: Sparkles,
    title: 'Streak Bonus!',
    colors: ['#FFC285', '#FF6B7A', '#8B5CF6', '#FFD4A3'],
    particleCount: 12,
  },
};

function generateParticles(count: number, colors: string[]): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 12 + 6,
    rotation: Math.random() * 360,
    type: ['confetti', 'star', 'heart', 'sparkle'][Math.floor(Math.random() * 4)] as Particle['type'],
  }));
}

function ParticleComponent({ particle }: { particle: Particle }) {
  const shapes = {
    confetti: (
      <motion.div
        className="absolute rounded-sm"
        style={{
          width: particle.size,
          height: particle.size * 0.4,
          backgroundColor: particle.color,
          left: `${particle.x}%`,
          top: `${particle.y}%`,
        }}
        initial={{ 
          y: -100, 
          x: 0, 
          rotate: particle.rotation,
          opacity: 1 
        }}
        animate={{ 
          y: window.innerHeight + 100, 
          x: (Math.random() - 0.5) * 200,
          rotate: particle.rotation + 720,
          opacity: 0 
        }}
        transition={{ 
          duration: 2 + Math.random() * 2,
          ease: "easeOut"
        }}
      />
    ),
    star: (
      <motion.div
        className="absolute"
        style={{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
        }}
        initial={{ 
          y: -50, 
          scale: 0, 
          rotate: 0,
          opacity: 1 
        }}
        animate={{ 
          y: window.innerHeight + 50, 
          scale: [0, 1.5, 1],
          rotate: 360,
          opacity: [1, 1, 0] 
        }}
        transition={{ 
          duration: 2.5 + Math.random() * 1.5,
          ease: "easeOut"
        }}
      >
        <Star className="fill-current" style={{ color: particle.color, width: particle.size, height: particle.size }} />
      </motion.div>
    ),
    heart: (
      <motion.div
        className="absolute"
        style={{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
        }}
        initial={{ 
          y: -50, 
          scale: 0,
          opacity: 1 
        }}
        animate={{ 
          y: window.innerHeight + 50, 
          scale: [0, 1.2, 0.8],
          opacity: [1, 1, 0] 
        }}
        transition={{ 
          duration: 3 + Math.random() * 1,
          ease: "easeOut"
        }}
      >
        <Heart className="fill-current" style={{ color: particle.color, width: particle.size, height: particle.size }} />
      </motion.div>
    ),
    sparkle: (
      <motion.div
        className="absolute"
        style={{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
        }}
        initial={{ 
          scale: 0, 
          rotate: 0,
          opacity: 1 
        }}
        animate={{ 
          scale: [0, 1.5, 0],
          rotate: 180,
          opacity: [0, 1, 0] 
        }}
        transition={{ 
          duration: 1.5 + Math.random() * 1,
          ease: "easeInOut"
        }}
      >
        <Sparkles style={{ color: particle.color, width: particle.size, height: particle.size }} />
      </motion.div>
    ),
  };

  return shapes[particle.type];
}

export function CelebrationAnimation({ 
  type, 
  amount, 
  message, 
  onComplete 
}: CelebrationAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);
  
  const config = celebrationConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    setMounted(true);
    setParticles(generateParticles(config.particleCount, config.colors));
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 2500); // Faster animation

    return () => clearTimeout(timer);
  }, [config, onComplete]);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Particles */}
          {particles.map((particle) => (
            <ParticleComponent key={particle.id} particle={particle} />
          ))}

          {/* Central celebration card */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B7A] to-[#8B5CF6] rounded-3xl blur-xl opacity-50 scale-110" />
              
              {/* Card */}
              <div className="relative bg-gradient-to-br from-[#1E1535] to-[#231E35] rounded-3xl p-8 border border-white/20 shadow-2xl min-w-[280px]">
                {/* Icon */}
                <motion.div
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FF6B7A] to-[#8B5CF6] flex items-center justify-center"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Icon className="w-10 h-10 text-white" />
                </motion.div>

                {/* Title */}
                <motion.h2
                  className="text-2xl font-bold text-white text-center mb-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {config.title}
                </motion.h2>

                {/* Amount */}
                {amount !== undefined && (
                  <motion.div
                    className="text-4xl font-bold text-center bg-gradient-to-r from-[#FFC285] to-[#FF6B7A] bg-clip-text text-transparent"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    +{amount}
                  </motion.div>
                )}

                {/* Message */}
                {message && (
                  <motion.p
                    className="text-white/70 text-center mt-3 text-sm"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {message}
                  </motion.p>
                )}

                {/* Sparkle decorations */}
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6 text-[#FFC285]" />
                </motion.div>
                <motion.div
                  className="absolute -bottom-2 -left-2"
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                >
                  <Star className="w-5 h-5 text-[#FF6B7A] fill-current" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

// Hook for triggering celebrations
export function useCelebration() {
  const [celebration, setCelebration] = useState<{
    type: CelebrationType;
    amount?: number;
    message?: string;
  } | null>(null);

  const celebrate = useCallback((
    type: CelebrationType,
    options?: { amount?: number; message?: string }
  ) => {
    setCelebration({ type, ...options });
  }, []);

  const clearCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  const CelebrationComponent = celebration ? (
    <CelebrationAnimation
      type={celebration.type}
      amount={celebration.amount}
      message={celebration.message}
      onComplete={clearCelebration}
    />
  ) : null;

  return { celebrate, CelebrationComponent };
}
