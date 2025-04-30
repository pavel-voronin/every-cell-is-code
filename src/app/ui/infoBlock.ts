import { Context } from '../context.ts';

export function setupInfoBlockLogic(context: Context) {
  const infoBlock = context.document.getElementById('infoBlock');
  const infoBlockContent = context.document.getElementById('infoBlockContent');
  const collapseBtn = context.document.getElementById('collapseInfoBlock');
  const expandBtn = context.document.getElementById('expandInfoBlock');

  function attachInfoBtnPointerHandlers(
    btn: HTMLElement | null,
    onClick: () => void,
  ) {
    if (!btn) return;
    let pointerDownTarget: EventTarget | null = null;
    let pointerDownRect: DOMRect | null = null;
    btn.addEventListener('pointerdown', (e) => {
      pointerDownTarget = e.currentTarget;
      pointerDownRect = btn.getBoundingClientRect();
    });
    btn.addEventListener('pointerup', (e) => {
      if (
        pointerDownTarget === e.currentTarget &&
        pointerDownRect &&
        e.clientX >= pointerDownRect.left &&
        e.clientX <= pointerDownRect.right &&
        e.clientY >= pointerDownRect.top &&
        e.clientY <= pointerDownRect.bottom
      ) {
        onClick();
      }
      pointerDownTarget = null;
      pointerDownRect = null;
    });
    btn.addEventListener('pointerleave', () => {
      pointerDownTarget = null;
      pointerDownRect = null;
    });
    btn.addEventListener('pointercancel', () => {
      pointerDownTarget = null;
      pointerDownRect = null;
    });
  }

  attachInfoBtnPointerHandlers(collapseBtn, () => setExpanded(false));
  attachInfoBtnPointerHandlers(expandBtn, () => setExpanded(true));

  function isMobile() {
    return context.window.innerWidth <= 640;
  }

  function getSavedState() {
    return context.storage.getItem('infoBlockState');
  }
  function saveState(state: string) {
    context.storage.setItem('infoBlockState', state);
  }

  function setExpanded(expanded: boolean, save = true) {
    if (!infoBlock || !infoBlockContent || !expandBtn) return;
    if (expanded) {
      infoBlockContent.classList.remove('hidden');
      expandBtn.classList.add('hidden');
      infoBlock.setAttribute('data-state', 'expanded');
      if (save) saveState('expanded');
    } else {
      infoBlockContent.classList.add('hidden');
      expandBtn.classList.remove('hidden');
      infoBlock.setAttribute('data-state', 'collapsed');
      if (save) saveState('collapsed');
    }
  }

  function initInfoBlockState() {
    if (!infoBlock) return;
    let state = getSavedState();
    if (!state) {
      state = isMobile() ? 'collapsed' : 'expanded';
    }
    setExpanded(state === 'expanded', false);
    infoBlock.classList.remove('hidden');
  }

  initInfoBlockState();
}
