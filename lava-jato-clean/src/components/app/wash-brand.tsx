type WashMarkProps = {
  className?: string;
};

/** Símbolo próprio do LavaPro: gota, brilho e linha d'água. */
export function WashMark({ className = "size-8 text-primary" }: WashMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="LavaPro"
      className={`wash-mark shrink-0 ${className}`}
    >
      <path
        className="wash-mark__drop"
        d="M24 4.5c-3.5 6.1-11.8 14.6-11.8 23.1A11.8 11.8 0 0 0 24 39.4a11.8 11.8 0 0 0 11.8-11.8C35.8 19.1 27.5 10.6 24 4.5Z"
        fill="currentColor"
      />
      <path
        className="wash-mark__wave"
        d="M8 39.1c4.4-2.7 8.8-2.7 13.2 0s8.8 2.7 13.2 0 7.5-2.7 9.6-1.3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.8"
      />
      <path
        className="wash-mark__shine"
        d="M20.2 16.5c-2.1 2.8-3.6 5.7-3.6 8.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <circle className="wash-mark__bubble" cx="39.5" cy="10" r="3" fill="currentColor" />
    </svg>
  );
}

export function WashBrand({ suffix }: { suffix?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <WashMark />
      <span className="plate text-sm text-primary">LAVAPRO{suffix ? ` / ${suffix}` : ""}</span>
    </span>
  );
}
