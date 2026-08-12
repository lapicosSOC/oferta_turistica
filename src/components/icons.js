// Iconos de trazo, 16x16, heredan color y grosor del contexto. Se usan en vez de
// emojis para que el conjunto se vea consistente en cualquier sistema operativo.
const base = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

export function SearchIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </svg>
  );
}

export function CloseIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg {...base} className={className}>
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  );
}

export function ResetIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg {...base} className={className}>
      <path d="M13.5 8a5.5 5.5 0 1 1-1.9-4.16" />
      <path d="M13.5 2v3.2h-3.2" />
    </svg>
  );
}

export function CheckIcon({ className = "h-3 w-3" }) {
  return (
    <svg {...base} strokeWidth={2.1} className={className}>
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

export function ExternalLinkIcon({ className = "h-3 w-3" }) {
  return (
    <svg {...base} className={className}>
      <path d="M6.5 3.5H3.2v9.3h9.3V9.5" />
      <path d="M9.8 3.2h3v3M12.5 3.5 7.8 8.2" />
    </svg>
  );
}

export function MapPinIcon({ className = "h-8 w-8" }) {
  return (
    <svg {...base} strokeWidth={1.2} className={className}>
      <path d="M8 14.2s4.6-3.9 4.6-7.2a4.6 4.6 0 1 0-9.2 0C3.4 10.3 8 14.2 8 14.2Z" />
      <circle cx="8" cy="6.8" r="1.7" />
    </svg>
  );
}
