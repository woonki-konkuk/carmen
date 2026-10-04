window.CS = window.CS || {};

// 감옥 엔딩: ACME 추격 게이지가 가득 차면 붙잡혀 감옥에 갇힌다.
// 달빛이 드는 감방의 침상에 카르멘이 앉아 있고, 플레이어가 잠금장치를 풀어 주면 이 구역의 처음부터 다시 한다.
// 480×270 눈금으로 그리고 두 배 크기로 만든다.
CS.jail = (function () {
  const U = CS.util, input = CS.input;
  const W = 480, H = 270, SCALE = 2;
  const FADE = 1;        // 검은 화면이 걷히는 시간(초)
  const TITLE_AT = 1.2;  // 제목이 뜨는 때(초)
  const LOST_AT = 2.2;   // 빼앗긴 돈이 뜨는 때(초)
  const WORD_AT = 3.4;   // 플레이어의 말이 뜨는 때(초)
  const OPEN_AT = 4.6;   // 잠금장치가 풀리고 다시 하기 단추가 뜨는 때(초)
  const FLOOR = 206;     // 바닥이 시작되는 높이
  const BARS = 44;       // 쇠창살 사이의 간격
  const LOCK = { x: 240, y: 142 };  // 잠금장치가 달린 창살과 그 높이
  const RED = '#c8142f', RED_DARK = '#8f0f24', RED_MID = '#a8112a', INK = '#1a1218';
  const SKIN = '#d39a6a', HAIR = '#2c1616';

  const panel = document.getElementById('jail');
  panel.innerHTML =
    '<canvas width="' + W * SCALE + '" height="' + H * SCALE + '"></canvas>' +
    '<p class="label">체포</p>' +
    '<h2>ACME에<br>붙잡혔다</h2>' +
    '<p class="lost"></p>' +
    '<p class="word"><b>플레이어</b>걱정 마, 레드. 잠금장치는 내가 풀게. 이 구역 처음부터 다시 해보자.</p>' +
    '<button><kbd>E</kbd>다시 시도해보기</button>';
  const g = panel.querySelector('canvas').getContext('2d');
  const label = panel.querySelector('.label'), title = panel.querySelector('h2');
  const lostEl = panel.querySelector('.lost'), word = panel.querySelector('.word'), again = panel.querySelector('button');

  let active = false;
  let clock = 0;
  let opened = false;  // 잠금장치가 풀리는 소리를 냈는가
  const room = makeRoom();
  const random = U.rng(23);
  const motes = [];  // 달빛 속에 떠다니는 먼지
  for (let i = 0; i < 16; i++) motes.push({ along: random(), across: random(), beat: random() * 6 });

  // 움직이지 않는 것: 벽돌 벽, 창살 달린 창, 바닥, 사슬에 매달린 침상
  function makeRoom() {
    const c = U.makeCanvas(W * SCALE, H * SCALE), ctx = c.getContext('2d');
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = '#1c2233';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#232a3f';
    for (let row = 0; row * 18 < FLOOR; row++) {
      for (let x = row % 2 ? -22 : 0; x < W; x += 44) ctx.fillRect(x + 1, row * 18 + 1, 42, 16);
    }

    // 창과 밤하늘
    ctx.fillStyle = '#0c0f18';
    ctx.fillRect(210, 30, 60, 54);
    ctx.fillStyle = '#34477c';
    ctx.fillRect(214, 34, 52, 46);
    ctx.fillStyle = '#fff3cf';
    U.ellipse(ctx, 252, 50, 9, 9);
    ctx.fillStyle = '#0c0f18';
    for (const x of [227, 240, 253]) ctx.fillRect(x - 1.5, 34, 3, 46);

    // 바닥
    ctx.fillStyle = '#141826';
    ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.fillStyle = '#0c0f18';
    ctx.fillRect(0, FLOOR - 1.5, W, 3);

    // 침상
    ctx.strokeStyle = '#3a4257';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(92, 186);
    ctx.lineTo(84, 112);
    ctx.moveTo(256, 186);
    ctx.lineTo(264, 112);
    ctx.stroke();
    ctx.fillStyle = '#3a4257';
    ctx.fillRect(84, 186, 180, 8);
    ctx.fillStyle = '#2a3044';
    ctx.fillRect(84, 194, 180, 6);
    return c;
  }

  // 창에서 비스듬히 내려오는 달빛과 창살의 그림자, 떠다니는 먼지
  function drawMoonlight() {
    g.fillStyle = 'rgba(150, 180, 255, ' + (0.1 + Math.sin(clock * 0.9) * 0.015) + ')';
    U.polygon(g, [214, 34, 266, 34, 228, 262, 70, 262]);
    g.strokeStyle = 'rgba(10, 12, 20, 0.32)';
    g.lineWidth = 3.5;
    g.beginPath();
    for (const [top, foot] of [[227, 110], [240, 149], [253, 188]]) {
      g.moveTo(top, 80);
      g.lineTo(foot, 262);
    }
    g.stroke();
    g.fillStyle = '#dfe8ff';
    for (const m of motes) {
      const along = (m.along + clock * 0.02) % 1;
      const left = 214 + (70 - 214) * along, right = 266 + (228 - 266) * along;
      g.globalAlpha = 0.25 + 0.4 * Math.abs(Math.sin(clock * 1.3 + m.beat));
      g.fillRect(left + (right - left) * m.across, 34 + 228 * along, 1, 1);
    }
    g.globalAlpha = 1;
  }

  // 침상에 앉은 카르멘: 모자를 눌러쓰고 팔짱을 낀 채 웃고 있다
  function drawCarmen() {
    const cx = 174;

    // 앉은 자리를 기준으로 조금 키운다
    g.save();
    g.translate(cx, 191);
    g.scale(1.25, 1.25);
    g.translate(-cx, -191);

    // 뒤로 늘어진 머리
    g.fillStyle = HAIR;
    U.polygon(g, [cx - 17, 120, cx + 17, 120, cx + 23, 150, cx + 17, 170, cx - 17, 170, cx - 23, 150]);

    // 정강이와 구두
    g.fillStyle = INK;
    U.polygon(g, [cx - 20, 188, cx - 8, 188, cx - 9, 228, cx - 19, 228]);
    U.polygon(g, [cx + 8, 188, cx + 20, 188, cx + 19, 228, cx + 9, 228]);
    g.fillRect(cx - 22, 226, 15, 5);
    g.fillRect(cx + 7, 226, 15, 5);

    // 코트: 무릎을 덮은 자락과 몸통
    g.fillStyle = RED;
    U.polygon(g, [cx - 21, 166, cx + 21, 166, cx + 26, 191, cx - 26, 191]);
    U.polygon(g, [cx - 20, 139, cx + 20, 139, cx + 22, 170, cx - 22, 170]);
    g.fillStyle = RED_MID;
    U.polygon(g, [cx + 8, 139, cx + 20, 139, cx + 22, 170, cx + 26, 191, cx + 10, 191]);
    g.fillStyle = RED_DARK;
    g.fillRect(cx - 0.5, 172, 1, 19);

    // 팔짱과 장갑
    g.fillStyle = RED_DARK;
    U.polygon(g, [cx - 24, 151, cx + 24, 149, cx + 25, 161, cx - 23, 164]);
    g.fillStyle = RED;
    U.polygon(g, [cx - 25, 156, cx + 22, 156, cx + 24, 167, cx - 24, 169]);
    g.fillStyle = INK;
    U.ellipse(g, cx - 24, 160, 4, 4.5);
    U.ellipse(g, cx + 24, 158, 4, 4.5);

    // 세운 깃
    g.fillStyle = RED_MID;
    U.polygon(g, [cx - 19, 142, cx - 13, 127, cx - 3, 142]);
    U.polygon(g, [cx + 19, 142, cx + 13, 127, cx + 3, 142]);

    // 모자 그늘 아래로 보이는 턱과 웃는 입, 얼굴 옆의 머리
    g.fillStyle = SKIN;
    U.polygon(g, [cx - 11, 118, cx + 11, 118, cx + 9.5, 133, cx, 139, cx - 9.5, 133]);
    g.fillStyle = 'rgba(50, 10, 20, 0.5)';
    g.fillRect(cx - 11, 118, 22, 8);
    g.fillStyle = '#a3162c';
    U.polygon(g, [cx - 5, 131.5, cx + 1, 131, cx + 6.5, 129, cx + 4, 133, cx - 1, 133.8]);
    g.fillStyle = HAIR;
    U.polygon(g, [cx - 15, 116, cx - 10, 116, cx - 11, 140, cx - 18, 152]);
    U.polygon(g, [cx + 15, 116, cx + 10, 116, cx + 11, 140, cx + 18, 152]);

    // 눌러쓴 중절모
    g.save();
    g.translate(cx, 119);
    g.rotate(0.07);
    g.fillStyle = RED_DARK;
    U.ellipse(g, 0, 3, 30, 6.5);
    g.fillStyle = RED;
    U.ellipse(g, 0, 1, 30, 5.3);
    U.polygon(g, [-14, 1, -12.5, -15, -5, -19.5, 0, -17, 5, -19.5, 12.5, -15, 14, 1]);
    g.fillStyle = INK;
    U.polygon(g, [-13.5, -5, 13.5, -5, 14, 1, -14, 1]);
    g.restore();
    g.restore();
  }

  // 앞을 가로막은 쇠창살과 잠금장치. 플레이어가 풀면 불빛이 초록으로 바뀐다.
  function drawBars() {
    for (let x = 20; x < W; x += BARS) {
      g.fillStyle = '#0c0f18';
      g.fillRect(x - 4.5, 0, 9, H);
      g.fillStyle = '#2a3148';
      g.fillRect(x - 4.5, 0, 1.5, H);
    }
    g.fillStyle = '#0c0f18';
    g.fillRect(0, 24, W, 9);
    g.fillRect(0, 238, W, 9);
    g.fillStyle = '#2a3148';
    g.fillRect(0, 24, W, 1.5);
    g.fillRect(0, 238, W, 1.5);

    const open = clock > OPEN_AT;
    g.fillStyle = '#2a3148';
    g.fillRect(LOCK.x - 12, LOCK.y, 24, 34);
    g.fillStyle = '#0c0f18';
    g.fillRect(LOCK.x - 8, LOCK.y + 15, 16, 14);
    g.fillStyle = open ? '#3ddc84' : (clock * 2 % 1 < 0.6 ? '#e0182d' : '#5a0d16');
    U.ellipse(g, LOCK.x, LOCK.y + 8, 3.2, 3.2);
    if (open) {
      g.fillStyle = 'rgba(61, 220, 132, 0.25)';
      U.ellipse(g, LOCK.x, LOCK.y + 8, 8, 8);
    }
  }

  function draw() {
    g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    g.drawImage(room, 0, 0, W, H);
    drawCarmen();
    drawMoonlight();
    drawBars();

    // 가장자리를 어둡게, 그리고 검은 화면이 걷힌다
    const edge = g.createRadialGradient(190, 140, 90, 240, 135, 330);
    edge.addColorStop(0, 'rgba(6, 8, 14, 0)');
    edge.addColorStop(1, 'rgba(6, 8, 14, 0.6)');
    g.fillStyle = edge;
    g.fillRect(0, 0, W, H);
    if (clock < FADE) {
      g.fillStyle = 'rgba(11, 10, 10, ' + (1 - clock / FADE) + ')';
      g.fillRect(0, 0, W, H);
    }
  }

  // lost: 빼앗긴 돈(유로)
  function start(lost) {
    active = true;
    clock = 0;
    opened = false;
    CS.sound.play('jail');
    lostEl.textContent = lost ? '가진 돈 ' + lost + '유로를 모두 빼앗겼습니다' : '빼앗길 돈은 한 푼도 없었습니다';
    panel.classList.remove('hidden');
    if (document.exitPointerLock) document.exitPointerLock();
  }

  // 이 구역의 처음부터 다시 한다. 되찾은 보석은 그대로다.
  function retry() {
    if (clock > OPEN_AT) location.reload();
  }

  // 감옥 장면이 떠 있는 동안 매 프레임
  function frame(ctx, dt) {
    clock += dt;
    draw();
    label.classList.toggle('on', clock > TITLE_AT);
    title.classList.toggle('on', clock > TITLE_AT + 0.3);
    lostEl.classList.toggle('on', clock > LOST_AT);
    word.classList.toggle('on', clock > WORD_AT);
    again.classList.toggle('on', clock > OPEN_AT);
    if (clock > OPEN_AT && !opened) {
      opened = true;
      CS.sound.play('unlock');
    }
    if (input.consume('KeyE')) retry();
  }

  again.addEventListener('click', retry);

  return { start, busy: () => active, frame };
})();
