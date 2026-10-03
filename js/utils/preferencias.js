/* ==========================================================================
   Preferências do usuário, lidas do sistema
   ========================================================================== */

// true quando o usuário pediu menos animações no sistema operacional
export const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
