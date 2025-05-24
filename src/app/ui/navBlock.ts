import { eventBus } from '../communications/eventBus';

export function setupNavBlock() {
  const navJumpForm = document.getElementById(
    'navJumpForm',
  ) as HTMLFormElement | null;
  const navInputX = document.getElementById(
    'navInputX',
  ) as HTMLInputElement | null;
  const navInputY = document.getElementById(
    'navInputY',
  ) as HTMLInputElement | null;

  let isEditing = false;

  function setInputs(x: number, y: number) {
    if (!isEditing && navInputX && navInputY) {
      navInputX.value = x.toString();
      navInputY.value = y.toString();
    }
  }

  if (navInputX && navInputY) {
    navInputX.addEventListener('focus', () => {
      isEditing = true;
      navInputX.select();
    });
    navInputY.addEventListener('focus', () => {
      isEditing = true;
      navInputY.select();
    });
    navInputX.addEventListener('blur', () => {
      isEditing = false;
    });
    navInputY.addEventListener('blur', () => {
      isEditing = false;
    });
  }

  eventBus.on('grid:center-changed', ([x, y]) => {
    setInputs(x, y);
  });

  if (navJumpForm && navInputX && navInputY) {
    navJumpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const x = parseInt(navInputX.value.trim(), 10);
      const y = parseInt(navInputY.value.trim(), 10);
      if (!isNaN(x) && !isNaN(y)) {
        eventBus.emit('navBlock:jump', [x, y]);
      } else {
        if (isNaN(x)) navInputX.classList.add('ring-2', 'ring-red-500');
        if (isNaN(y)) navInputY.classList.add('ring-2', 'ring-red-500');
        setTimeout(() => {
          navInputX.classList.remove('ring-2', 'ring-red-500');
          navInputY.classList.remove('ring-2', 'ring-red-500');
        }, 800);
      }
    });
  }
}
