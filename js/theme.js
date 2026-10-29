/*
 * Darkroom / Daylight. Darkroom is the default; the choice is remembered.
 * The inline script in each page's <head> applies a saved Daylight before
 * anything paints, so there's never a dark flash.
 *
 * To Daylight the page develops like a print: a red safelight wash, a sheet
 * of paper rising from the bottom, then the light page fading up through it.
 * Back to Darkroom closes through the viewfinder: a dark frame opens from the
 * centre and widens to the screen edges (a dip to black where unsupported).
 */

const KEY = 'theme';
const COLOURS = { darkroom: '#0A0A0A', daylight: '#F2F2F0' };

const current = () => (document.documentElement.dataset.theme === 'daylight' ? 'daylight' : 'darkroom');

function sync() {
  const mode = current();
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(mode === 'daylight'));
    btn.setAttribute('aria-label', mode === 'daylight' ? 'Daylight mode — switch to darkroom' : 'Darkroom mode — switch to daylight');
    const label = btn.querySelector('.theme-toggle__label');
    if (label) label.textContent = mode === 'daylight' ? 'Daylight' : 'Darkroom';
  });
}

function apply(mode) {
  const root = document.documentElement;
  if (mode === 'daylight') root.dataset.theme = 'daylight';
  else delete root.dataset.theme;
  root.style.background = COLOURS[mode];
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOURS[mode]);
  try { localStorage.setItem(KEY, mode); } catch { /* private mode: still switches, just not remembered */ }
  sync();
}

export function initTheme() {
  const toggles = [...document.querySelectorAll('[data-theme-toggle]')];
  sync();
  if (!toggles.length) return;

  let busy = false;

  const develop = (to) => {
    const { gsap } = window;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!gsap || reduce) { apply(to); return; }
    busy = true;
    const done = () => { busy = false; };

    if (to === 'daylight') {
      const veil = document.createElement('div');
      const paper = document.createElement('div');
      veil.className = 'theme-veil';
      paper.className = 'theme-paper';
      document.body.append(veil, paper);
      gsap.timeline({ onComplete: () => { veil.remove(); paper.remove(); done(); } })
        // Safelight on.
        .to(veil, { opacity: 0.85, duration: 0.35, ease: 'power2.out' }, 0)
        // Paper slides into the tray.
        .fromTo(paper, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'expo.inOut' }, 0.25)
        .add(() => { apply('daylight'); gsap.set(veil, { opacity: 0 }); }, 0.85)
        // The image comes up through the paper: washed out first, then full contrast.
        .to(paper, { opacity: 0, duration: 0.9, ease: 'power2.in' }, 0.9);
      return;
    }

    // Back to Darkroom through the lens: a dark frame opens from the centre, corner
    // marks riding its edges, with Daylight still outside it. View Transitions let
    // both themes be on screen at once; older browsers get the dip to black below.
    if (document.startViewTransition) {
      const root = document.documentElement;
      const finder = document.createElement('div');
      finder.className = 'theme-finder';
      finder.setAttribute('aria-hidden', 'true');
      finder.innerHTML = '<i></i><i></i><i></i><i></i><b></b>';
      root.classList.add('vt-finder');
      const vt = document.startViewTransition(() => {
        apply('darkroom');
        document.body.append(finder);
      });
      const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';
      const DUR = 950;
      vt.ready.then(() => {
        root.animate(
          { clipPath: ['inset(46% 46% 46% 46%)', 'inset(0% 0% 0% 0%)'] },
          { duration: DUR, easing: EASE, pseudoElement: '::view-transition-new(root)', fill: 'both' },
        );
        finder.animate(
          { inset: ['46% 46% 46% 46%', '0% 0% 0% 0%'] },
          { duration: DUR, easing: EASE, fill: 'both' },
        );
      }).catch(() => {});
      vt.finished.finally(() => {
        root.classList.remove('vt-finder');
        gsap.to(finder, { autoAlpha: 0, duration: 0.5, ease: 'power2.out', onComplete: () => finder.remove() });
        done();
      });
      return;
    }

    const veil = document.createElement('div');
    veil.className = 'theme-veil is-black';
    document.body.append(veil);
    const lines = document.querySelectorAll('.grid-lines:not(.pf__grid) span');
    gsap.timeline({ onComplete: () => { veil.remove(); gsap.set(lines, { clearProps: 'clipPath' }); done(); } })
      // Lights off.
      .to(veil, { opacity: 1, duration: 0.35, ease: 'power2.in' }, 0)
      .add(() => apply('darkroom'), 0.38)
      .to(veil, { opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.5)
      // The grid draws itself back in.
      .fromTo(lines, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, stagger: 0.08, ease: 'expo.inOut' }, 0.45);
  };

  toggles.forEach((btn) => btn.addEventListener('click', () => {
    if (busy) return;
    develop(current() === 'daylight' ? 'darkroom' : 'daylight');
  }));
}
