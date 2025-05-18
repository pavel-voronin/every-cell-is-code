export function setupNavBlockLogic(jumpTo: (x: number, y: number) => void) {
  const navJumpForm = document.getElementById(
    'navJumpForm',
  ) as HTMLFormElement | null;
  const navInputX = document.getElementById(
    'navInputX',
  ) as HTMLInputElement | null;
  const navInputY = document.getElementById(
    'navInputY',
  ) as HTMLInputElement | null;

  if (navJumpForm && navInputX && navInputY) {
    navJumpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const x = parseInt(navInputX.value.trim(), 10);
      const y = parseInt(navInputY.value.trim(), 10);
      if (!isNaN(x) && !isNaN(y)) {
        jumpTo(x, y);
        navInputX.value = '';
        navInputY.value = '';
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
