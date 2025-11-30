"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { 
  MapPin, Shield, Users, Briefcase, Heart, MessageSquare, 
  Video, Route, Sparkles, ArrowRight, ArrowLeft, Check,
  Bell, Coins
} from "lucide-react";

interface OnboardingTutorialProps {
  open: boolean;
  onComplete: () => void;
}

const TUTORIAL_STEPS = [
  {
    icon: Shield,
    title: "Tu Seguridad Primero",
    description: "Aurora App es tu compañera de seguridad. El Botón de Pánico funciona incluso sin internet y alerta a tus contactos de emergencia.",
    color: "var(--color-aurora-orange)",
    bgColor: "var(--color-aurora-orange)",
    features: ["Botón de Pánico", "Contactos de Emergencia", "Check-ins de Seguridad"],
    tip: "💡 Configura tus contactos de emergencia en Ajustes",
  },
  {
    icon: Users,
    title: "Aurora Guardians",
    description: "Conecta con otras mujeres de confianza. Tus Guardians pueden ver tu ubicación en tiempo real cuando la compartes.",
    color: "var(--color-aurora-purple)",
    bgColor: "var(--color-aurora-purple)",
    features: ["Acompañamiento Virtual", "Alertas de Emergencia", "Ubicación en Tiempo Real"],
    tip: "💡 Invita a amigas o familiares como tus Guardians",
  },
  {
    icon: MapPin,
    title: "Mapa de Seguridad",
    description: "Descubre y comparte lugares seguros. Reporta incidentes laborales y ayuda a otras mujeres a estar informadas.",
    color: "var(--color-aurora-mint)",
    bgColor: "var(--color-aurora-mint)",
    features: ["Califica Lugares", "Reportes Laborales", "Verificado por la Comunidad"],
    tip: "💡 Los reportes de workplace aparecen en el mapa",
  },
  {
    icon: Route,
    title: "Rutas Seguras",
    description: "Rastrea tus viajes y comparte rutas seguras. Usa Sister Accompaniment para que tus Guardians te acompañen virtualmente.",
    color: "var(--color-aurora-blue)",
    bgColor: "var(--color-aurora-blue)",
    features: ["GPS en Tiempo Real", "Compartir Rutas", "Sister Accompaniment"],
    tip: "💡 Gana créditos por cada ruta que compartas",
  },
  {
    icon: Heart,
    title: "Soul Sanctuary",
    description: "Tu espacio de bienestar. Hidratación, estado de ánimo, ciclo menstrual y meditación guiada - todo en un lugar.",
    color: "var(--color-aurora-pink)",
    bgColor: "var(--color-aurora-pink)",
    features: ["Hidratación", "Diario de Ánimo", "Ciclo Menstrual", "Meditación"],
    tip: "💡 Completa tu check-in diario para ganar créditos",
  },
  {
    icon: Briefcase,
    title: "Oportunidades",
    description: "Descubre empleos, mentorías y recursos verificados por la comunidad. Usa tus créditos para desbloquear oportunidades.",
    color: "var(--color-aurora-yellow)",
    bgColor: "var(--color-aurora-yellow)",
    features: ["Empleos", "Mentorías", "Recursos de Carrera"],
    tip: "💡 Las empresas con buenos reportes aparecen destacadas",
  },
  {
    icon: Video,
    title: "Reels y Lives",
    description: "Comparte experiencias en video. Publica reels de seguridad o transmite en vivo para conectar con la comunidad.",
    color: "var(--color-aurora-lavender)",
    bgColor: "var(--color-aurora-lavender)",
    features: ["Reels de Seguridad", "Transmisiones en Vivo", "Videos en Posts"],
    tip: "💡 Los videos ayudan a otras mujeres a conocer lugares",
  },
  {
    icon: Coins,
    title: "Economía de Créditos",
    description: "Gana créditos ayudando a otras. Publica, verifica lugares, completa rutas y contribuye a la comunidad.",
    color: "var(--color-aurora-yellow)",
    bgColor: "var(--color-aurora-yellow)",
    features: ["Gana Compartiendo", "Desbloquea Funciones", "Ayuda a Otras"],
    tip: "💡 Empiezas con 25 créditos de bienvenida 🎉",
  },
];

export function OnboardingTutorial({ open, onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  
  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="w-[95vw] max-w-md bg-gradient-to-br from-[var(--color-aurora-violet)] via-[#231E35] to-[var(--color-aurora-purple)] border-[var(--color-aurora-pink)]/30 shadow-2xl p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            {/* Icon with animation */}
            <div className="flex justify-center mb-5">
              <motion.div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: `${step.bgColor}20` }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <step.icon 
                  className="w-10 h-10" 
                  style={{ color: step.color }}
                />
              </motion.div>
            </div>
            
            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
              {step.title}
            </h2>
            
            {/* Description */}
            <p className="text-sm sm:text-base text-[var(--color-aurora-cream)]/80 text-center mb-4">
              {step.description}
            </p>
            
            {/* Features */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {step.features.map((feature, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-[var(--color-aurora-cream)]"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Tip */}
            {step.tip && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-center text-[var(--color-aurora-cream)]/70">
                  {step.tip}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Progress & Navigation */}
        <div className="p-6 pt-0 space-y-4">
          {/* Progress Dots */}
          <div className="flex justify-center gap-1.5">
            {TUTORIAL_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep 
                    ? "w-6 bg-[var(--color-aurora-pink)]" 
                    : idx < currentStep
                    ? "w-2 bg-[var(--color-aurora-purple)]"
                    : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {currentStep > 0 ? (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1 min-h-[48px] bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atrás
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1 min-h-[48px] bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Saltar Tutorial
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              className="flex-1 min-h-[48px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:from-[var(--color-aurora-purple)] hover:to-[var(--color-aurora-violet)] shadow-lg"
            >
              {isLastStep ? (
                <>
                  ¡Comenzar!
                  <Sparkles className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
          
          {/* Step Counter */}
          <p className="text-center text-xs text-[var(--color-aurora-cream)]/50">
            {currentStep + 1} of {TUTORIAL_STEPS.length}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
