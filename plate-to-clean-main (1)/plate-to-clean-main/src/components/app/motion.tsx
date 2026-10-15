import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  domMax,
  LazyMotion,
  m,
  MotionConfig,
  useInView,
  useReducedMotion,
  type Variants,
} from "motion/react";

/**
 * Animações do LavaPro (Motion). LazyMotion + `m` carregam só os recursos
 * usados; `reducedMotion="user"` respeita a preferência do sistema.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

const springSoft = { type: "spring", stiffness: 260, damping: 28 } as const;

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: springSoft },
};

/** Revela os filhos em sequência quando entram na tela. */
export function Stagger({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol" | "dl";
}) {
  const Component = m[as];
  return (
    <Component
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const Component = m[as];
  return (
    <Component className={className} variants={staggerChild}>
      {children}
    </Component>
  );
}

/** Seção que sobe e aparece ao entrar na tela. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ ...springSoft, delay }}
    >
      {children}
    </m.div>
  );
}

/** Número que "corre" até o valor quando aparece na tela ou muda. */
export function CountUp({
  value,
  format = (n) => String(Math.round(n)),
  className,
}: {
  value: number;
  format?: (value: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const formatRef = useRef(format);
  formatRef.current = format;
  // O texto é controlado pelo efeito; o React só escreve o valor inicial.
  const [initialText] = useState(() => format(0));

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) {
      node.textContent = formatRef.current(value);
      previous.current = value;
      return;
    }
    if (!inView) return;
    const controls = animate(previous.current, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = formatRef.current(latest);
      },
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, inView, reduce]);

  return (
    <span ref={ref} className={className} aria-label={format(value)}>
      {initialText}
    </span>
  );
}
