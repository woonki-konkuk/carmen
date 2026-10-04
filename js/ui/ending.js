window.CS = window.CS || {};

// 엔딩: 세 보석을 모두 되찾은 뒤의 마지막 장면.
// 달이 뜬 파리의 지붕 위에 카르멘이 서서 마지막 보석을 달빛에 비추고, 되찾은 보석 셋이 차례로 떠오른다.
// 480×270 눈금으로 그리고 두 배 크기로 만든다.
CS.ending = (function () {
  const save = CS.save, U = CS.util, input = CS.input;
  const W = 480, H = 270, SCALE = 2;
  const FADE = 1.2;      // 검은 화면이 걷히는 시간(초)
  const TITLE_AT = 1.4;  // 제목이 뜨는 때(초)
  const GEM_AT = 2.8;    // 첫 보석이 뜨는 때(초)
  const GEM_GAP = 0.8;   // 보석이 하나씩 뜨는 간격(초)
  const GEM_POP = 0.5;   // 보석 하나가 커지며 나타나는 시간(초)
  const WORD_AT = 5.8;   // 플레이어의 말이 뜨는 때(초)
  const END_AT = 7.2;    // '끝'과 다시 하기 단추가 뜨는 때(초)
  const GEMS = [[56, 126], [122, 126], [188, 126]];  // 보석 셋의 자리
  const GEM_SCALE = 0.42;
  const MOON = { x: 356, from: 152, to: 116, r: 62, rise: 4.5 };  // 달은 처음에 조금 낮게 있다가 떠오른다
  const TOWER = { x: 240, top: 100, foot: 214 };                  // 에펠탑의 가운데, 꼭대기, 바닥
  const RED = '#c8142f', RED_DARK = '#8f0f24', RED_MID = '#a8112a', INK = '#1a1218';

  const targets = CS.story.targets;
  const panel = document.getElementById('ending');
  panel.innerHTML =
    '<canvas width="' + W * SCALE + '" height="' + H * SCALE + '"></canvas>' +
    '<p class="label">임무 완료</p>' +
    '<h2>파리의 눈물을<br>모두 되찾았다</h2>' +
    targets.map((t, i) => '<p class="gem" style="left:' + GEMS[i][0] / W * 100 + '%">' + t.item + '</p>').join('') +
    '<p class="word"><b>플레이어</b>해냈어, 레드. 눈물 세 개가 전부 돌아왔어. 다음엔 어디로 갈까?</p>' +
    '<div class="foot"><b>끝</b><button><kbd>E</kbd>처음부터 다시 하기</button></div>';
  const g = panel.querySelector('canvas').getContext('2d');
  const label = panel.querySelector('.label'), title = panel.querySelector('h2');
  const names = panel.querySelectorAll('.gem');
  const word = panel.querySelector('.word'), foot = panel.querySelector('.foot'), again = panel.querySelector('button');

  let active = false;
  let clock = 0;
  let rung = 0;  // 떠오르는 소리를 낸 보석의 수

  // 움직이지 않는 것은 한 번만 그려 둔다: 하늘, 그리고 도시(먼 지붕들, 에펠탑, 가까운 지붕들)
  const sky = makeSky();
  const city = makeCity();
  const random = U.rng(41);
  const stars = [];
  for (let i = 0; i < 90; i++) stars.push({ x: random() * W, y: random() * 180, size: random() < 0.2 ? 1.5 : 1, speed: 0.8 + random() * 2.2, beat: random() * 6 });
  const glints = [];  // 에펠탑 위에서 깜박이는 불빛
  for (let i = 0; i < 26; i++) {
    const y = TOWER.top + random() * (TOWER.foot - TOWER.top);
    glints.push({ x: TOWER.x + (random() * 2 - 1) * towerHalf(y), y, beat: random() * 6 });
  }

  function layer() {
    const c = U.makeCanvas(W * SCALE, H * SCALE), ctx = c.getContext('2d');
    ctx.scale(SCALE, SCALE);
    return [c, ctx];
  }

  function makeSky() {
    const [c, ctx] = layer();
    const shade = ctx.createLinearGradient(0, 0, 0, 218);
    shade.addColorStop(0, '#090b20');
    shade.addColorStop(0.42, '#1a1a47');
    shade.addColorStop(0.74, '#4b2c64');
    shade.addColorStop(0.92, '#b3526b');
    shade.addColorStop(1, '#e28d5c');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
    return c;
  }

  // 그 높이에서 에펠탑의 반쪽 너비
  function towerHalf(y) {
    if (y < 150) return 1.4 + (y - 100) / 50 * 5.3;
    if (y < 180) return 6.7 + (y - 150) / 30 * 7.5;
    return 14.2 + (y - 180) / 34 * 14.8;
  }

  function makeCity() {
    const [c, ctx] = layer();
    const r = U.rng(7);

    // 먼 지붕들과 굴뚝
    ctx.fillStyle = '#2b2250';
    for (let x = -4; x < W;) {
      const w = 10 + r() * 16, h = 6 + r() * 18;
      ctx.fillRect(x, 212 - h, w + 1, h + 60);
      if (r() < 0.5) ctx.fillRect(x + w * 0.3, 208 - h, 2.5, 4);
      x += w;
    }
    // 언덕 위의 사크레쾨르
    U.polygon(ctx, [40, 214, 68, 201, 118, 201, 150, 214]);
    ctx.fillRect(77, 195, 30, 8);
    U.ellipse(ctx, 92, 190, 7, 11);
    ctx.fillRect(91, 173, 2, 7);
    U.ellipse(ctx, 81, 196, 4, 6);
    U.ellipse(ctx, 103, 196, 4, 6);
    ctx.fillRect(109, 183, 5, 20);
    U.polygon(ctx, [109, 183, 111.5, 177, 114, 183]);

    // 금빛으로 빛나는 에펠탑
    const x = TOWER.x;
    const tower = new Path2D();
    tower.moveTo(x - 1.4, 100);
    tower.quadraticCurveTo(x - 4, 170, x - 29, 214);
    tower.lineTo(x - 16, 214);
    tower.quadraticCurveTo(x, 186, x + 16, 214);
    tower.lineTo(x + 29, 214);
    tower.quadraticCurveTo(x + 4, 170, x + 1.4, 100);
    tower.closePath();
    ctx.shadowColor = 'rgba(255, 180, 80, 0.75)';
    ctx.shadowBlur = 16 * SCALE;
    ctx.fillStyle = '#d2902c';
    ctx.fill(tower);
    ctx.fillRect(x - 0.7, 88, 1.4, 12);
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.clip(tower);
    ctx.strokeStyle = 'rgba(255, 238, 180, 0.5)';
    ctx.lineWidth = 0.6;
    for (let d = -160; d < 160; d += 4) {
      ctx.beginPath();
      ctx.moveTo(x + d, 100);
      ctx.lineTo(x + d + 114, 214);
      ctx.moveTo(x + d, 100);
      ctx.lineTo(x + d - 114, 214);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#f6cf72';
    ctx.fillRect(x - 3.5, 99, 7, 2.5);
    ctx.fillRect(x - 8.5, 150, 17, 2.5);
    ctx.fillRect(x - 16.5, 180, 33, 3);

    // 가까운 지붕들: 꺾인 지붕, 굴뚝, 불 켜진 창
    for (let left = -12; left < 300;) {
      const w = 28 + r() * 18, top = 224 + r() * 20;
      ctx.fillStyle = '#141127';
      U.polygon(ctx, [left, H, left, top + 9, left + 5, top, left + w - 5, top, left + w, top + 9, left + w, H]);
      const stack = left + w * (0.25 + r() * 0.5);
      ctx.fillRect(stack, top - 8, 6, 8);
      ctx.fillRect(stack + 0.5, top - 11, 1.8, 3);
      ctx.fillRect(stack + 3.5, top - 11, 1.8, 3);
      for (let wx = left + 7; wx < left + w - 8; wx += 8) {
        if (r() < 0.5) continue;
        ctx.fillStyle = r() < 0.8 ? '#ffc76a' : '#ffe9b8';
        ctx.fillRect(wx, top + 13, 3, 4.5);
      }
      left += w + 1;
    }

    // 카르멘이 선 지붕과 굴뚝
    ctx.fillStyle = '#0b0913';
    U.polygon(ctx, [284, H, 298, 239, 308, 232, W, 232, W, H]);
    ctx.fillRect(434, 206, 22, 26);
    ctx.fillRect(431, 203, 28, 4);
    for (const px of [436, 443, 450]) ctx.fillRect(px, 195, 4, 8);
    ctx.fillStyle = '#2c2745';
    ctx.fillRect(308, 232, W - 308, 1);
    return c;
  }

  // 0에서 1로 커지다 살짝 넘쳤다가 돌아온다
  function pop(p) {
    const q = Math.min(1, Math.max(0, p)) - 1;
    return 1 + 2.7 * q * q * q + 1.7 * q * q;
  }

  // 눈물 보석. (x, y)가 가운데.
  function gem(x, y, scale, color, beat) {
    const size = CS.travel.GEM_SIZE;
    g.save();
    g.translate(x, y);
    g.scale(scale, scale);
    g.translate(-size / 2, -size / 2);
    CS.travel.drawGem(g, color, clock + beat);
    g.restore();
  }

  function drawSky() {
    g.drawImage(sky, 0, 0, W, H);

    g.fillStyle = '#fff';
    for (const s of stars) {
      g.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(clock * s.speed + s.beat));
      g.fillRect(s.x, s.y, s.size, s.size);
    }
    g.globalAlpha = 1;

    // 이따금 지나가는 별똥별
    const fall = (clock % 7) / 0.8;
    if (fall < 1) {
      const x = 468 - fall * 150, y = 10 + fall * 46;
      const tail = g.createLinearGradient(x, y, x + 34, y - 10.5);
      tail.addColorStop(0, 'rgba(255,255,255,' + (1 - fall) + ')');
      tail.addColorStop(1, 'rgba(255,255,255,0)');
      g.strokeStyle = tail;
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 34, y - 10.5);
      g.stroke();
    }

    // 달과 달무리
    const up = Math.min(1, clock / MOON.rise);
    const my = MOON.from + (MOON.to - MOON.from) * (1 - (1 - up) * (1 - up));
    const halo = g.createRadialGradient(MOON.x, my, MOON.r * 0.9, MOON.x, my, MOON.r * 2.1);
    halo.addColorStop(0, 'rgba(255, 236, 190, 0.38)');
    halo.addColorStop(1, 'rgba(255, 236, 190, 0)');
    g.fillStyle = halo;
    g.fillRect(MOON.x - MOON.r * 2.2, my - MOON.r * 2.2, MOON.r * 4.4, MOON.r * 4.4);
    g.fillStyle = '#fff3cf';
    U.ellipse(g, MOON.x, my, MOON.r, MOON.r);
    g.fillStyle = 'rgba(214, 190, 150, 0.35)';
    U.ellipse(g, MOON.x - 24, my - 22, 11, 9);
    U.ellipse(g, MOON.x + 20, my - 34, 6, 5);
    U.ellipse(g, MOON.x - 34, my + 14, 7, 8);
    U.ellipse(g, MOON.x + 30, my + 26, 12, 10);

    // 에펠탑 꼭대기에서 도는 불빛
    const reach = Math.sin(clock * 0.5) * 220;
    for (const len of [reach, -reach]) {
      if (Math.abs(len) < 14) continue;
      const beam = g.createLinearGradient(TOWER.x, 0, TOWER.x + len, 0);
      beam.addColorStop(0, 'rgba(255, 240, 200, 0.34)');
      beam.addColorStop(1, 'rgba(255, 240, 200, 0)');
      g.fillStyle = beam;
      U.polygon(g, [TOWER.x, 91, TOWER.x + len, 76, TOWER.x + len, 100]);
    }
  }

  function drawCity() {
    g.drawImage(city, 0, 0, W, H);
    g.fillStyle = '#fff';
    for (const p of glints) {
      if (Math.sin(clock * 9 + p.beat * 7) > 0.72) g.fillRect(p.x - 0.6, p.y - 0.6, 1.2, 1.2);
    }
  }

  // 지붕 위의 카르멘. 등을 보이고 서서 마지막 보석을 달빛에 비춘다. 코트와 머리가 바람에 날린다.
  function drawCarmen() {
    const wind = Math.sin(clock * 2.4) * 4, wind2 = Math.sin(clock * 2.4 + 1.1) * 3;

    // 뒤로 날리는 코트 자락
    g.fillStyle = RED_DARK;
    U.polygon(g, [362, 176, 398 + wind * 1.4, 186 - wind2, 410 + wind * 1.6, 205, 386 + wind, 211, 366, 209]);

    // 다리와 구두
    g.fillStyle = INK;
    U.polygon(g, [338, 206, 347, 206, 346.5, 232, 337.5, 232]);
    U.polygon(g, [353, 206, 362, 206, 362.5, 232, 353.5, 232]);
    g.fillRect(335.5, 229, 11.5, 3);
    g.fillRect(353, 229, 11.5, 3);

    // 코트
    g.fillStyle = RED;
    U.polygon(g, [333, 154, 340, 150, 360, 150, 367, 154, 366, 178, 374, 212, 326, 212, 334, 178]);
    U.polygon(g, [365, 180, 388 + wind, 197 + wind2 * 0.5, 381 + wind, 214, 370, 212]);
    g.fillStyle = RED_MID;
    U.polygon(g, [333, 154, 340, 150, 345, 150, 341, 178, 337, 212, 326, 212, 334, 178]);
    g.fillStyle = RED_DARK;
    g.fillRect(334, 175, 32, 4.5);
    g.fillRect(349.6, 180, 0.9, 32);

    // 내린 팔과 장갑
    g.fillStyle = RED_MID;
    U.polygon(g, [333, 155, 328, 161, 325, 189, 331.5, 190, 337, 168]);
    g.fillStyle = INK;
    U.ellipse(g, 328.2, 191.5, 3.6, 4);

    // 보석을 치켜든 팔
    g.strokeStyle = RED;
    g.lineWidth = 7.5;
    g.lineCap = g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(364, 156);
    g.lineTo(380, 147);
    g.lineTo(386, 127);
    g.stroke();
    g.fillStyle = INK;
    U.ellipse(g, 386.6, 122.5, 3.8, 4.2);

    // 세운 깃
    g.fillStyle = RED_MID;
    U.polygon(g, [337, 152, 343.5, 139, 350, 151]);
    U.polygon(g, [363, 152, 356.5, 139, 350, 151]);

    // 바람에 날리는 긴 머리
    g.fillStyle = INK;
    U.polygon(g, [340, 134, 360, 132, 367, 146, 374 + wind * 0.6, 160, 381 + wind, 177, 368 + wind * 0.6, 171,
      363, 184, 355, 169, 346, 174, 340, 157]);

    // 비스듬히 쓴 중절모
    g.save();
    g.translate(350, 132);
    g.rotate(-0.1);
    g.fillStyle = RED;
    U.polygon(g, [-14, 0, -12, -17, -5, -21, 0, -18.5, 5, -21, 12, -17, 14, 0]);
    g.fillStyle = INK;
    U.polygon(g, [-13.3, -9, 13.3, -9, 14, -2, -14, -2]);
    g.fillStyle = RED;
    U.ellipse(g, 0, 1.5, 28, 5.5);
    g.fillStyle = RED_DARK;
    U.ellipse(g, 0, 3, 24, 3);
    g.restore();

    // 손에 든 마지막 보석
    gem(387.5, 111, 0.17, targets[targets.length - 1].color, 1.3);
  }

  function draw() {
    g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    drawSky();
    drawCity();
    drawCarmen();

    // 되찾은 보석 셋이 차례로 떠오른다
    targets.forEach((t, i) => {
      const p = (clock - GEM_AT - i * GEM_GAP) / GEM_POP;
      if (p <= 0) return;
      const float = Math.sin(clock * 1.6 + i * 1.3) * 2;
      gem(GEMS[i][0], GEMS[i][1] + float, GEM_SCALE * pop(p), t.color, i * 2.1);
    });

    // 검은 화면이 걷힌다
    if (clock < FADE) {
      g.fillStyle = 'rgba(11, 10, 10, ' + (1 - clock / FADE) + ')';
      g.fillRect(0, 0, W, H);
    }
  }

  function start() {
    active = true;
    clock = rung = 0;
    CS.sound.play('fanfare');
    panel.classList.remove('hidden');
    if (document.exitPointerLock) document.exitPointerLock();
  }

  // 엔딩이 떠 있는 동안 매 프레임
  function frame(ctx, dt) {
    clock += dt;
    draw();
    if (rung < targets.length && clock > GEM_AT + rung * GEM_GAP) {
      rung++;
      CS.sound.play('gem');
    }
    label.classList.toggle('on', clock > TITLE_AT);
    title.classList.toggle('on', clock > TITLE_AT + 0.3);
    names.forEach((el, i) => el.classList.toggle('on', clock > GEM_AT + i * GEM_GAP + GEM_POP * 0.6));
    word.classList.toggle('on', clock > WORD_AT);
    foot.classList.toggle('on', clock > END_AT);
    if (clock > END_AT && input.consume('KeyE')) save.reset();
  }

  again.addEventListener('click', () => {
    if (clock > END_AT) save.reset();
  });

  // 임무를 이미 다 끝낸 저장이면 바로 엔딩을 보여 준다
  if (save.data.done >= targets.length) start();

  return { start, busy: () => active, frame };
})();
