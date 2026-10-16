import type { ReactNode } from "react";

/**
 * Ilustração ambiente compartilhada pelas áreas pública, cliente e proprietário.
 *
 * Cada parte (mangueira, jato e gotas) fica numa camada própria e só se move com
 * transform/opacity. Assim a placa de vídeo anima as camadas já desenhadas, sem
 * redesenhar a tela inteira (e o desfoque do jato) a cada quadro.
 */
export function WashHoseBackdrop() {
  return (
    <div className="wash-hose-backdrop" aria-hidden="true">
      <Layer className="wash-hose-backdrop__hose">
        <path
          className="wash-hose-backdrop__tube-shadow"
          d="M-90 865C35 768 99 807 140 748c35-50 8-111 51-151 31-29 81-27 120-18"
        />
        <path
          className="wash-hose-backdrop__tube"
          d="M-90 865C35 768 99 807 140 748c35-50 8-111 51-151 31-29 81-27 120-18"
        />
        <g className="wash-hose-backdrop__nozzle">
          <path d="M275 550l74 25-12 35-76-24z" className="wash-hose-backdrop__handle" />
          <path d="M333 568l48 1-7 28-42 11z" className="wash-hose-backdrop__metal" />
          <path d="M370 569l37-6 5 23-40 11z" className="wash-hose-backdrop__tip" />
          <path d="M288 586l-14 63 28 8 27-57z" className="wash-hose-backdrop__grip" />
        </g>
      </Layer>

      <Layer className="wash-hose-backdrop__spray">
        <defs>
          <linearGradient id="hose-water-stream" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.92" />
            <stop offset="0.55" stopColor="currentColor" stopOpacity="0.46" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <filter id="hose-water-glow" x="-20%" y="-40%" width="150%" height="180%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        <path d="M402 574C622 505 864 350 1275 116" className="wash-hose-backdrop__jet-glow" />
        <path d="M402 574C622 505 864 350 1275 116" className="wash-hose-backdrop__jet" />
        <path d="M405 578C654 526 916 421 1328 274" className="wash-hose-backdrop__mist-line" />
        <path d="M401 569C622 463 840 291 1180 63" className="wash-hose-backdrop__mist-line" />
      </Layer>

      <Layer className="wash-hose-backdrop__drops">
        <circle cx="538" cy="514" r="5" />
        <circle cx="742" cy="401" r="6" />
        <circle cx="955" cy="291" r="5" />
        <circle cx="1192" cy="166" r="4.5" />
      </Layer>
      <Layer className="wash-hose-backdrop__drops wash-hose-backdrop__drops--late">
        <circle cx="627" cy="463" r="3" />
        <circle cx="848" cy="335" r="3.5" />
        <circle cx="1080" cy="207" r="3" />
        <circle cx="1298" cy="96" r="3" />
      </Layer>
    </div>
  );
}

function Layer({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className={`wash-hose-backdrop__layer ${className}`}>
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMinYMid slice">
        {children}
      </svg>
    </div>
  );
}
