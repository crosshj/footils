declare class Timer {
  start: (label: string) => void;
  end: (label: string) => void;
  log: (label?: string) => void;
  reset: () => void;
  results: () => string;
}

export const timer: Timer;
