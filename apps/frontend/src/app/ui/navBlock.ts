import { eventBus } from '../communications/eventBus';

export class NavBlock extends HTMLElement {
  constructor() {
    super();
    this.className =
      'font-inter fixed left-8 bottom-8 z-10 bg-gray-800/90 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-2 shadow-lg min-w-[120px] max-w-xs select-none';
    this.innerHTML = `
      <style>
      input[type=number]::-webkit-inner-spin-button,
      input[type=number]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type=number] {
        -moz-appearance: textfield;
      }
      </style>
      <form id="navJumpForm" class="flex items-center gap-2" autocomplete="off">
        <input
          id="navInputX"
          type="number"
          step="1"
          class="bg-gray-700 text-sky-200 text-xs font-mono rounded px-2 py-1 w-14 focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-gray-500"
          placeholder="X"
          aria-label="X coordinate"
        />
        <input
          id="navInputY"
          type="number"
          step="1"
          class="bg-gray-700 text-sky-200 text-xs font-mono rounded px-2 py-1 w-14 focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-gray-500"
          placeholder="Y"
          aria-label="Y coordinate"
        />
        <button
          type="submit"
          class="bg-sky-700 hover:bg-sky-600 active:bg-sky-800 text-white rounded px-2 py-1 text-xs font-medium transition-colors focus:outline-none"
          aria-label="Go"
        >
          Go
        </button>
      </form>
    `;
  }

  connectedCallback() {
    const navJumpForm = this.querySelector('#navJumpForm') as HTMLFormElement;
    const navInputX = this.querySelector('#navInputX') as HTMLInputElement;
    const navInputY = this.querySelector('#navInputY') as HTMLInputElement;

    let isEditing = false;

    function setInputs(x: number, y: number) {
      if (!isEditing) {
        navInputX.value = x.toString();
        navInputY.value = y.toString();
        navInputX.classList.remove('ring-2', 'ring-red-500');
        navInputY.classList.remove('ring-2', 'ring-red-500');
      }
    }

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

    eventBus.on('grid:center-changed', ([x, y]) => {
      setInputs(x, y);
    });

    navJumpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const x = parseInt(navInputX.value.trim(), 10);
      const y = parseInt(navInputY.value.trim(), 10);
      if (!isNaN(x) && !isNaN(y)) {
        navInputX.classList.remove('ring-2', 'ring-red-500');
        navInputY.classList.remove('ring-2', 'ring-red-500');
        eventBus.emit('navBlock:jump', [x, y]);
      } else {
        if (isNaN(x)) navInputX.classList.add('ring-2', 'ring-red-500');
        if (isNaN(y)) navInputY.classList.add('ring-2', 'ring-red-500');
      }
    });
  }
}

customElements.define('x-nav-block', NavBlock);
