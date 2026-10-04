window.CS = window.CS || {};

// 소매치기(손기술 게이지): Space를 누르고 있으면 손이 주머니로 다가가고, 초록 칸에서 떼면 물건을 꺼낸다.
// 표적에게도 행인에게도 같은 방식을 쓴다.
CS.pickpocket = (function () {
  const input = CS.input, U = CS.util;
  const rule = CS.story.target.sleight;
  const W = 480, H = 270;   // 그리는 화면의 크기
  const RESULT_TIME = 1.1;  // 결과를 보여 주는 시간(초)
  const CURVE = 1.5;        // 게이지가 갈수록 빨리 차는 정도(1이면 일정)

  const panel = document.getElementById('pick');
  panel.innerHTML =
    '<p class="how"></p>' +
    '<div class="time"><b></b></div>' +
    '<div class="gauge"><i class="zone"></i><i class="perfect"></i><b></b></div>';
  const how = panel.querySelector('.how');
  const timeBar = panel.querySelector('.time b');
  const zoneEl = panel.querySelector('.zone'), perfectEl = panel.querySelector('.perfect');
  const fillEl = panel.querySelector('.gauge b');

  let active = false;
  let phase = null;      // ready(누르기를 기다림) → filling(누르는 중) → result
  let who = null;        // 상대 { lead: 첫 안내 글, prize: 꺼낼 것의 이름, glint: 주머니에서 빛나는 색, look: 생김새 }
  let onDone = null;     // 끝났을 때 부를 함수. 성공이면 'perfect'나 'good', 실패면 null을 넘긴다.
  let quality = null;
  let center = 0;        // 초록 칸의 가운데(0~1)
  let held = 0;          // 누르고 있던 시간(초)
  let level = 0;         // 게이지 0~1
  let left = 0;          // ready: 남은 시간 / result: 결과를 보여 줄 남은 시간
  let clock = 0;
  let pressed = false;   // 마우스로 누르고 있는가

  // 마우스나 손가락으로 화면을 누르고 있어도 된다
  panel.addEventListener('pointerdown', () => { pressed = true; });
  window.addEventListener('pointerup', () => { pressed = false; });
  window.addEventListener('pointercancel', () => { pressed = false; });

  function start(target, done) {
    active = true;
    phase = 'ready';
    who = target;
    onDone = done;
    quality = null;
    center = 0.55 + Math.random() * 0.3;
    held = level = clock = 0;
    left = rule.wait;
    pressed = false;
    if (document.exitPointerLock) document.exitPointerLock();

    how.innerHTML = '<b>' + who.lead + '</b> <kbd>Space</kbd>를 누르고 있다가 초록 칸에서 떼세요';
    how.className = 'how';
    zoneEl.style.left = (center - rule.zone / 2) * 100 + '%';
    zoneEl.style.width = rule.zone * 100 + '%';
    perfectEl.style.left = (center - rule.perfect / 2) * 100 + '%';
    perfectEl.style.width = rule.perfect * 100 + '%';
    fillEl.style.width = '0%';
    panel.classList.remove('hidden');
  }

  function finish(result, text) {
    phase = 'result';
    quality = result;
    CS.sound.play(result === 'perfect' ? 'perfect' : result ? 'good' : 'bad');
    left = RESULT_TIME;
    how.innerHTML = '<b>' + text + '</b>';
    how.className = 'how ' + (result ? 'good' : 'bad');
  }

  function judge() {
    const off = Math.abs(level - center);
    if (off <= rule.perfect / 2) finish('perfect', '완벽! 전혀 눈치채지 못했다');
    else if (off <= rule.zone / 2) finish('good', '성공! ' + U.josa(who.prize, '을', '를') + ' 꺼냈다');
    else if (level < center) finish(null, '너무 일찍 뗐다. 손이 닿지 않았다');
    else finish(null, '너무 깊이 넣었다. 들켰다');
  }

  // 상대의 등과 뒷주머니, 다가가는 내 손
  function draw(ctx) {
    const shake = Math.sin(clock * 9);
    const ox = shake * 2, oy = Math.abs(shake) * 3;

    // 윗옷(줄무늬와 멜빵이 있으면 함께)
    const look = who.look;
    ctx.fillStyle = look.coat;
    ctx.fillRect(0, 0, W, H);
    if (look.stripes) {
      ctx.fillStyle = look.stripes;
      for (let y = -24; y < 150; y += 30) ctx.fillRect(0, y + oy, W, 12);
    }
    if (look.suspenders) {
      ctx.fillStyle = '#17171a';
      ctx.fillRect(140 + ox, 0, 22, 160);
      ctx.fillRect(318 + ox, 0, 22, 160);
    }

    // 바지와 뒷주머니. 주머니 입구에서 꺼낼 것이 살짝 빛난다.
    ctx.fillStyle = look.pants;
    ctx.fillRect(0, 146 + oy, W, 130);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 146 + oy, W, 8);
    const px = 250 + ox, py = 172 + oy;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(px, py, 76, 52);
    ctx.fillStyle = look.pants;
    ctx.fillRect(px + 3, py + 6, 70, 43);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(px + 3, py + 2, 70, 5);
    ctx.fillStyle = who.glint;
    U.ellipse(ctx, px + 38, py + 4, 7 + Math.sin(clock * 6) * 1.5, 2.5);

    // 내 손: 게이지가 초록 칸 가운데일 때 손끝이 주머니 입구에 닿는다
    const startX = 452, startY = 300, endX = px + 38, endY = py + 2;
    const reach = level / center;
    const tipX = startX + (endX - startX) * reach, tipY = startY + (endY - startY) * reach;
    const len = Math.hypot(endX - startX, endY - startY);
    const ux = (endX - startX) / len, uy = (endY - startY) / len;
    const nx = -uy, ny = ux;

    ctx.fillStyle = '#b3101f';
    U.polygon(ctx, [
      tipX - ux * 34 + nx * 19, tipY - uy * 34 + ny * 19,
      tipX - ux * 34 - nx * 19, tipY - uy * 34 - ny * 19,
      tipX - ux * 300 - nx * 30, tipY - uy * 300 - ny * 30,
      tipX - ux * 300 + nx * 30, tipY - uy * 300 + ny * 30,
    ]);
    ctx.fillStyle = '#1c1c1f';
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(Math.atan2(uy, ux));
    U.ellipse(ctx, -22, 0, 18, 15);
    for (const side of [-9, -3, 3, 9]) U.ellipse(ctx, -5, side, 9, 3);
    U.ellipse(ctx, -20, 15, 8, 3.5);
    ctx.restore();
  }

  // 소매치기 중 매 프레임
  function frame(ctx, dt) {
    clock += dt;
    const holding = input.isDown('Space') || pressed;

    if (phase === 'ready') {
      left -= dt;
      timeBar.style.width = Math.max(0, left / rule.wait) * 100 + '%';
      if (holding) {
        phase = 'filling';
        CS.sound.play('reach');
      }
      else if (left <= 0) finish(null, '망설이다 놓쳤다');
    } else if (phase === 'filling') {
      held += dt;
      level = Math.min(1, Math.pow(held / rule.fill, CURVE));
      fillEl.style.width = level * 100 + '%';
      if (!holding || level >= 1) judge();
    } else {
      left -= dt;
      if (left <= 0) {
        active = false;
        panel.classList.add('hidden');
        onDone(quality);
        return;
      }
    }

    draw(ctx);
  }

  return { start, busy: () => active, frame };
})();
