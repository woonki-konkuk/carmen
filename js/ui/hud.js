window.CS = window.CS || {};

// 걷는 화면 아래의 "E ○○하기" 안내. 여러 곳에서 내놓은 것 중 하나를 띄우고 E를 받는다.
CS.hud = (function () {
  const el = document.getElementById('prompt');
  let label = null, action = null;
  let shown = null;

  // 이번 프레임에 E로 할 수 있는 일을 내놓는다. 먼저 내놓은 것이 우선한다.
  function offer(text, run) {
    if (label) return;
    label = text;
    action = run;
  }

  // 걷는 프레임의 끝에 부른다.
  function resolve() {
    if (label !== shown) {
      shown = label;
      el.classList.toggle('hidden', !label);
      if (label) el.innerHTML = '<kbd>E</kbd>' + label;
    }
    const run = action;
    label = action = null;
    if (run && CS.input.consume('KeyE')) run();
  }

  return { offer, resolve };
})();

// 화면 가운데에 띄우는 알림 카드. 확인을 누를 때까지 거리가 멈춘다.
CS.notice = (function () {
  const panel = document.getElementById('notice');
  let open = false;
  let after = null;

  // onClose: 확인을 누른 뒤에 할 일
  function show(title, html, onClose) {
    open = true;
    after = onClose || null;
    if (document.exitPointerLock) document.exitPointerLock();
    panel.innerHTML = '<div class="note-card"><h3>' + title + '</h3>' + html +
      '<div class="choices"><button><kbd>E</kbd>확인</button></div></div>';
    panel.querySelector('button').addEventListener('click', close);
    panel.classList.remove('hidden');
  }

  function close() {
    open = false;
    panel.classList.add('hidden');
    CS.sound.play('ui');
    const run = after;
    after = null;
    if (run) run();
  }

  function frame() {
    const input = CS.input;
    if (input.consume('KeyE') || input.consume('Enter') || input.consume('Escape')) close();
  }

  return { show, busy: () => open, frame };
})();
