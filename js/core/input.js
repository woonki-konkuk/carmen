window.CS = window.CS || {};

// 키보드와 마우스 상태. 한글 입력 상태에서도 되도록 e.key가 아닌 e.code를 쓴다.
CS.input = (function () {
  const GAME_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Tab'];
  const down = {};
  let pressed = {};  // 이번 프레임에 새로 눌린 키
  let lookDX = 0;
  let dragging = false;
  let canvas = null;

  function init(el) {
    canvas = el;

    window.addEventListener('keydown', (e) => {
      down[e.code] = true;
      if (!e.repeat) pressed[e.code] = true;
      if (GAME_KEYS.includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      down[e.code] = false;
    });
    window.addEventListener('blur', () => {
      for (const code in down) down[code] = false;
    });
    // 누른 단추에 초점이 남아 Space나 Enter가 그 단추를 다시 누르지 않게 한다
    document.addEventListener('click', (e) => {
      if (e.target.closest('button')) e.target.closest('button').blur();
    });

    canvas.addEventListener('click', () => {
      if (!canvas.requestPointerLock) return;
      const locking = canvas.requestPointerLock();
      // 마우스 고정이 안 되는 창에서는 누른 채 끌어서 둘러본다
      if (locking && locking.catch) locking.catch(() => {});
    });
    canvas.addEventListener('mousedown', () => {
      dragging = true;
      // 마우스가 화면에 고정된 동안의 클릭은 'Mouse' 키를 누른 것으로 친다
      if (isLooking()) pressed.Mouse = true;
    });
    window.addEventListener('mouseup', () => {
      dragging = false;
    });
    document.addEventListener('mousemove', (e) => {
      if (isLooking() || dragging) lookDX += e.movementX;
    });
  }

  function isDown(code) {
    return down[code] === true;
  }

  // 키가 새로 눌렸으면 true. 한 번 누름에 한 번만 true가 된다.
  function consume(code) {
    if (!pressed[code]) return false;
    pressed[code] = false;
    return true;
  }

  // 프레임 끝에 불러, 아무도 받지 않은 누름을 버린다.
  function endFrame() {
    pressed = {};
  }

  function isLooking() {
    return document.pointerLockElement === canvas;
  }

  // 지난 프레임 이후 마우스가 가로로 움직인 양을 꺼내고 비운다.
  function takeLook() {
    const dx = lookDX;
    lookDX = 0;
    return dx;
  }

  return { init, isDown, consume, endFrame, isLooking, takeLook };
})();
