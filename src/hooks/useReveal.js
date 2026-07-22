import { useEffect, useRef } from 'react';

/**
 * Hook de reveal no scroll.
 * Retorna uma ref para anexar ao elemento com className 'reveal'.
 * Quando o elemento entra na viewport, adiciona a classe 'is-visible'
 * (uma única vez — faz unobserve após revelar).
 */
export function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return ref;
}
