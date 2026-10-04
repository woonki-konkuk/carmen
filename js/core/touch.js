window.CS = window.CS || {};

// 손가락으로 하는 조작(휴대폰·태블릿). 화면 위의 막대와 단추가 키보드의 키를 누르는 것처럼 알린다.
//   걸을 때: 왼쪽 막대(W A S D), Shift(뛰기를 켜고 끈다), 화면 오른쪽을 끌어 둘러보기, E, 표창 전투 중에는 Space
//   주먹 전투와 던지기 연습: A, D, S, Space    소매치기 게이지: Space(화면 아무 데나 눌러도 된다)
// 손가락을 쓰는 기기에서만 보이고(주소 끝에 ?touch=1을 붙이면 컴퓨터에서도 보인다), 장면에 맞는 단추만 나온다.
CS.touch = (function () {
  const input = CS.input;
  const DEAD = 0.3;  // 막대를 이만큼(반지름에 대한 비율) 넘게 밀어야 움직인다
  const LOOK = 2.2;  // 끈 거리(픽셀)에 곱해 둘러보는 양으로 쓴다
  const STICK_KEYS = ['KeyW', 'KeyS', 'KeyA', 'KeyD'];

  const root = document.documentElement;
  const pad = document.getElementById('pad');
  // data-for: 그 단추가 나오는 장면. walk(걷기) fight(표창 전투) brawl(주먹 전투) drill(던지기 연습) pick(소매치기 게이지)
  pad.innerHTML =
    '<div class="look" data-for="walk fight"></div>' +
    '<div class="stick" data-for="walk fight"><i></i></div>' +
    '<button class="key run" data-for="walk fight"><kbd>Shift</kbd>뛰기</button>' +
    '<button class="key act" data-key="KeyE" data-for="walk fight"><kbd>E</kbd></button>' +
    '<button class="key fire" data-key="Space" data-for="fight drill"><kbd>Space</kbd>던지기</button>' +
    '<button class="key left" data-key="KeyA" data-for="brawl drill"><kbd>A</kbd>◀</button>' +
    '<button class="key right" data-key="KeyD" data-for="brawl drill"><kbd>D</kbd>▶</button>' +
    '<button class="key guard" data-key="KeyS" data-for="brawl"><kbd>S</kbd>막기</button>' +
    '<button class="key punch" data-key="Space" data-for="brawl"><kbd>Space</kbd>주먹</button>' +
    '<button class="key hold" data-key="Space" data-for="pick"><kbd>Space</kbd>누르기</button>';
  const parts = [...pad.children];
  const stick = pad.querySelector('.stick'), knob = stick.querySelector('i');
  const look = pad.querySelector('.look'), run = pad.querySelector('.run');

  let mode = null;      // 지금 장면. 단추가 필요 없는 장면(대사, 카드, 휴대폰 등)이면 'talk'
  let running = false;  // 뛰기를 켜 두었는가
  let stickId = null, lookId = null, lookX = 0;

  // 손가락을 쓰는 기기인가. 한 번이라도 손가락으로 누르면 그렇게 본다.
  function enable() {
    root.classList.add('touch');
  }
  if (/[?&]touch=1/.test(location.search) || (window.matchMedia && matchMedia('(pointer: coarse)').matches)) enable();
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') enable();
  }, true);

  // 손가락이 단추 밖으로 미끄러져도 뗄 때까지 그 단추가 받게 한다
  function grab(el, e) {
    e.preventDefault();
    try {
      el.setPointerCapture(e.pointerId);
    } catch (err) {
      // 잡아 둘 수 없는 입력이면 그냥 둔다
    }
  }

  // 누르는 동안 키가 눌린 단추들
  for (const el of pad.querySelectorAll('[data-key]')) {
    const code = el.dataset.key;
    const off = () => {
      input.release(code);
      el.classList.remove('on');
    };
    el.addEventListener('pointerdown', (e) => {
      grab(el, e);
      input.press(code);
      el.classList.add('on');
    });
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
  }

  // 뛰기: 누를 때마다 켜지고 꺼진다
  function setRunning(on) {
    running = on;
    run.classList.toggle('on', on);
    if (on && (mode === 'walk' || mode === 'fight')) input.press('ShiftLeft');
    else input.release('ShiftLeft');
  }
  run.addEventListener('pointerdown', (e) => {
    grab(run, e);
    setRunning(!running);
  });

  // 막대: 민 쪽의 키(W A S D)를 누른 것으로 한다. (nx, ny)는 가운데에서 민 정도(-1~1).
  function steer(nx, ny) {
    const want = [ny < -DEAD, ny > DEAD, nx < -DEAD, nx > DEAD];
    STICK_KEYS.forEach((code, i) => (want[i] ? input.press(code) : input.release(code)));
    knob.style.transform = 'translate(' + nx * 30 + '%, ' + ny * 30 + '%)';
  }
  function pushStick(e) {
    const box = stick.getBoundingClientRect(), r = box.width / 2;
    let nx = (e.clientX - box.left - r) / r, ny = (e.clientY - box.top - r) / r;
    const far = Math.hypot(nx, ny);
    if (far > 1) {
      nx /= far;
      ny /= far;
    }
    steer(nx, ny);
  }
  function dropStick(e) {
    if (e.pointerId !== stickId) return;
    stickId = null;
    steer(0, 0);
  }
  stick.addEventListener('pointerdown', (e) => {
    grab(stick, e);
    stickId = e.pointerId;
    pushStick(e);
  });
  stick.addEventListener('pointermove', (e) => {
    if (e.pointerId === stickId) pushStick(e);
  });
  stick.addEventListener('pointerup', dropStick);
  stick.addEventListener('pointercancel', dropStick);

  // 화면 오른쪽을 끌어 둘러본다
  function dropLook(e) {
    if (e.pointerId === lookId) lookId = null;
  }
  look.addEventListener('pointerdown', (e) => {
    grab(look, e);
    lookId = e.pointerId;
    lookX = e.clientX;
  });
  look.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lookId) return;
    input.look((e.clientX - lookX) * LOOK);
    lookX = e.clientX;
  });
  look.addEventListener('pointerup', dropLook);
  look.addEventListener('pointercancel', dropLook);
  pad.addEventListener('contextmenu', (e) => e.preventDefault());

  // 지금 장면에 맞는 단추만 남긴다. overlay: 거리 위에 다른 화면(대사, 카드, 휴대폰 등)이 떠 있는가.
  function update(overlay) {
    const now = CS.brawl.busy() ? 'brawl'
      : CS.pickpocket.busy() ? 'pick'
      : CS.flashback.playing() ? 'drill'
      : overlay ? 'talk'
      : CS.fight.busy() ? 'fight' : 'walk';
    if (now === mode) return;
    mode = now;
    for (const el of parts) el.hidden = !el.dataset.for.split(' ').includes(mode);
    // 장면이 바뀌면 누르고 있던 것을 모두 뗀다. 켜 둔 뛰기는 걷는 장면으로 돌아오면 이어진다.
    for (const el of pad.querySelectorAll('[data-key]')) {
      input.release(el.dataset.key);
      el.classList.remove('on');
    }
    stickId = lookId = null;
    steer(0, 0);
    setRunning(running);
  }

  return { update, on: () => root.classList.contains('touch') };
})();
