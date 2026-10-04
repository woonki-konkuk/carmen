window.CS = window.CS || {};

// 시작 화면: 노을빛 파리를 등지고 선 카르멘과 게임 제목. E를 누르면 거리로 나간다.
// 게임을 처음 열었을 때만 뜨고, 구역을 옮기느라 새로 열릴 때는 뜨지 않는다.
// 480×270 눈금으로 그리고 두 배 크기로 만든다.
CS.title = (function () {
  const save = CS.save, U = CS.util, input = CS.input;
  const W = 480, H = 270, SCALE = 2;
  const SUN = { x: 356, y: 128, r: 98 };
  const GEMS = [[40, 154], [68, 154], [96, 154]];  // 제목 아래 보석 셋의 자리
  const GEM_SCALE = 0.2;
  const BLINK_EVERY = 4.2, BLINK = 0.13;           // 눈을 깜박이는 간격과 길이(초)
  const RED = '#c8142f', RED_DARK = '#8f0f24', RED_MID = '#a8112a', INK = '#1a1218';
  const SKIN = '#d39a6a', SKIN_SHADE = '#b57c52', HAIR = '#2c1616';

  const targets = CS.story.targets;
  const started = save.data.done > 0 || save.data.batches.length > 0;  // 하던 게임이 있는가
  const panel = document.getElementById('title');
  panel.innerHTML =
    '<canvas width="' + W * SCALE + '" height="' + H * SCALE + '"></canvas>' +
    '<h1>카르멘<br>산디에고</h1>' +
    '<p class="sub">파리의 눈물</p>' +
    '<button><kbd>E</kbd>' + (started ? '이어 하기' : '시작하기') + '</button>' +
    (started ? '<p class="where">' + CS.district.name + '에서 이어집니다</p>' : '') +
    '<p class="keys">' + (CS.touch.on()
      ? '왼쪽 막대로 걷기 · 화면 오른쪽을 끌어 둘러보기 · 단추로 뛰기와 소매치기'
      : 'WASD 걷기 · Shift 뛰기 · 마우스로 둘러보기 · Tab 휴대폰') + '</p>';
  const g = panel.querySelector('canvas').getContext('2d');

  let active = false;
  let clock = 0;
  const backdrop = makeBackdrop();

  // 움직이지 않는 배경: 노을 하늘, 먼 지붕들과 에펠탑, 가까운 지붕들
  function makeBackdrop() {
    const c = U.makeCanvas(W * SCALE, H * SCALE), ctx = c.getContext('2d');
    ctx.scale(SCALE, SCALE);
    const r = U.rng(19);

    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, '#f9d466');
    shade.addColorStop(1, '#ee8f3c');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);

    // 먼 지붕들
    ctx.fillStyle = '#e17f33';
    for (let x = -4; x < W;) {
      const w = 12 + r() * 18, h = 8 + r() * 22;
      ctx.fillRect(x, 232 - h, w + 1, h + 40);
      if (r() < 0.5) ctx.fillRect(x + w * 0.3, 228 - h, 3, 4);
      x += w;
    }
    // 에펠탑
    const x = 222;
    ctx.beginPath();
    ctx.moveTo(x - 1.6, 100);
    ctx.quadraticCurveTo(x - 5, 186, x - 34, 240);
    ctx.lineTo(x - 19, 240);
    ctx.quadraticCurveTo(x, 206, x + 19, 240);
    ctx.lineTo(x + 34, 240);
    ctx.quadraticCurveTo(x + 5, 186, x + 1.6, 100);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x - 0.8, 86, 1.6, 14);
    ctx.fillRect(x - 4, 99, 8, 3);
    ctx.fillRect(x - 10, 160, 20, 3);
    ctx.fillRect(x - 19.5, 197, 39, 3.5);

    // 가까운 지붕들
    ctx.fillStyle = '#c9612a';
    for (let left = -10; left < W;) {
      const w = 30 + r() * 22, top = 238 + r() * 16;
      U.polygon(ctx, [left, H, left, top + 8, left + 5, top, left + w - 5, top, left + w, top + 8, left + w, H]);
      const stack = left + w * (0.25 + r() * 0.5);
      ctx.fillRect(stack, top - 7, 6, 7);
      ctx.fillRect(stack + 0.5, top - 10, 1.8, 3);
      ctx.fillRect(stack + 3.5, top - 10, 1.8, 3);
      left += w + 1;
    }
    return c;
  }

  // 눈 하나. side: 얼굴 왼쪽(-1)인지 오른쪽(1)인지. 눈꼬리가 바깥으로 길게 올라간다.
  function eye(x, y, side, shut) {
    g.fillStyle = INK;
    if (shut) {
      U.polygon(g, [x - side * 7, y + 1, x + side * 2, y + 2.2, x + side * 14, y - 6, x + side * 9, y + 2, x + side * 2, y + 3.6]);
      return;
    }
    U.polygon(g, [x - side * 8, y + 1, x + side * 1.5, y - 5.5, x + side * 9, y - 3, x + side * 15, y - 8, x + side * 9.5, y + 1.5, x + side * 1.5, y + 4]);
    g.fillStyle = '#f6f1e4';
    U.polygon(g, [x - side * 5.5, y + 1, x + side * 1.5, y - 2.8, x + side * 7, y - 0.8, x + side * 1.5, y + 2.8]);
    g.fillStyle = '#7d8590';
    U.ellipse(g, x + side * 2, y, 2.7, 2.7);
    g.fillStyle = INK;
    U.ellipse(g, x + side * 2, y, 1.3, 1.3);
    g.fillStyle = '#fff';
    U.ellipse(g, x + side * 1.1, y - 1, 0.7, 0.7);
  }

  // 카르멘의 상반신: 비스듬히 눌러쓴 빨간 중절모, 그늘진 눈, 세운 코트 깃, 바람에 날리는 긴 머리
  function drawCarmen() {
    const wave = Math.sin(clock * 1.8) * 3;
    const cx = 356;

    // 뒤로 날리는 머리
    g.fillStyle = HAIR;
    U.polygon(g, [312, 108, 398, 106, 416, 150, 428 + wave, 196, 444 + wave * 1.6, 238, 412 + wave, 228, 402, 252,
      382, 214, 330, 214, 314, 244, 298, 216, 302, 160]);

    // 코트의 어깨
    g.fillStyle = RED;
    U.polygon(g, [246, H, 266, 228, 312, 206, 400, 206, 446, 228, 466, H]);
    g.fillStyle = RED_MID;
    U.polygon(g, [400, 206, 446, 228, 466, H, 424, H, 406, 234]);

    // 목과 안에 입은 검은 옷
    g.fillStyle = SKIN_SHADE;
    U.polygon(g, [344, 168, 368, 168, 371, 204, 356, 220, 341, 204]);
    g.fillStyle = INK;
    U.polygon(g, [330, 212, 341, 202, 356, 220, 371, 202, 382, 212, 362, H, 350, H]);

    // 세운 깃: 바깥쪽과 그 안쪽
    for (const side of [-1, 1]) {
      g.fillStyle = RED_DARK;
      U.polygon(g, [cx + side * 38, 164, cx + side * 14, 200, cx + side * 20, 208, cx + side * 34, 182]);
      g.fillStyle = RED;
      U.polygon(g, [cx + side * 56, 224, cx + side * 38, 164, cx + side * 30, 190, cx + side * 9, 236, cx + side * 26, 254]);
    }

    // 얼굴
    g.fillStyle = SKIN;
    U.ellipse(g, cx, 138, 25, 31);
    U.polygon(g, [333, 146, 379, 146, 367, 171, 356, 176, 345, 171]);

    // 얼굴 옆으로 내려온 머리
    g.fillStyle = HAIR;
    U.polygon(g, [330, 110, 341, 110, 335, 148, 327, 182, 319, 162, 324, 130]);
    U.polygon(g, [371, 110, 382, 110, 389, 130, 394, 162, 387, 186, 378, 148]);

    // 모자챙이 얼굴에 드리운 그늘
    g.fillStyle = 'rgba(70, 12, 24, 0.42)';
    U.polygon(g, [331, 112, 381, 112, 381, 136, 331, 145]);

    // 눈썹, 눈, 코, 입
    const shut = clock % BLINK_EVERY < BLINK;
    g.strokeStyle = INK;
    g.lineWidth = 1.7;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(340, 129);
    g.lineTo(351, 127.5);
    g.moveTo(362, 126);
    g.lineTo(374, 123);
    g.stroke();
    eye(346, 137, -1, shut);
    eye(367, 134.5, 1, shut);
    g.strokeStyle = SKIN_SHADE;
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(357.5, 145);
    g.lineTo(360, 151.5);
    g.lineTo(356.5, 153);
    g.stroke();
    g.fillStyle = '#a3162c';
    U.polygon(g, [347, 161.5, 356, 160, 368, 157, 364, 163.5, 356, 165.5, 349.5, 164.5]);

    // 비스듬히 눌러쓴 중절모
    g.save();
    g.translate(cx, 113);
    g.rotate(-0.14);
    g.fillStyle = RED_DARK;
    U.ellipse(g, 0, 6, 62, 12.5);
    g.fillStyle = RED;
    U.ellipse(g, 0, 3, 62, 10);
    U.polygon(g, [-28, 3, -25, -30, -11, -39, 0, -34, 11, -39, 25, -30, 29, 3]);
    g.fillStyle = RED_MID;
    U.polygon(g, [11, -39, 25, -30, 29, 3, 15, 3, 12, -20]);
    g.fillStyle = INK;
    U.polygon(g, [-27, -8, 28, -8, 29, 3, -28, 3]);
    g.restore();
  }

  function draw() {
    g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    g.drawImage(backdrop, 0, 0, W, H);

    // 해와 천천히 도는 햇살
    g.save();
    g.translate(SUN.x, SUN.y);
    g.rotate(clock * 0.07);
    g.fillStyle = 'rgba(255, 244, 200, 0.2)';
    for (let i = 0; i < 12; i++) {
      g.rotate(Math.PI / 6);
      U.polygon(g, [0, 0, -34, -330, 34, -330]);
    }
    g.restore();
    g.fillStyle = '#fdebb0';
    U.ellipse(g, SUN.x, SUN.y, SUN.r, SUN.r);

    drawCarmen();

    // 되찾아야 할 보석 셋
    targets.forEach((t, i) => {
      const size = CS.travel.GEM_SIZE;
      g.save();
      g.translate(GEMS[i][0], GEMS[i][1] + Math.sin(clock * 1.6 + i * 1.3) * 1.5);
      g.scale(GEM_SCALE, GEM_SCALE);
      g.translate(-size / 2, -size / 2);
      CS.travel.drawGem(g, t.color, clock + i * 2.1);
      g.restore();
    });
  }

  function open() {
    active = true;
    clock = 0;
    panel.classList.remove('hidden');
  }

  // 거리로 나간다. 회상이 기다리고 있으면 그쪽으로 넘어가고, 아니면 구역 이름이 뜬 검은 화면이 걷히며 시작한다.
  function begin() {
    if (!active) return;
    active = false;
    panel.classList.add('hidden');
    save.play();
    CS.sound.play('start');
    if (!CS.flashback.busy()) CS.travel.arrive();
  }

  // 시작 화면이 떠 있는 동안 매 프레임
  function frame(ctx, dt) {
    clock += dt;
    draw();
    if (clock > 0.3 && (input.consume('KeyE') || input.consume('Enter') || input.consume('Space'))) begin();
  }

  panel.querySelector('button').addEventListener('click', begin);

  // 이 창에서 아직 시작하지 않았고, 엔딩을 볼 차례도 아니면 시작 화면을 띄운다
  if (!save.playing() && save.data.done < targets.length) open();

  return { busy: () => active, frame };
})();
