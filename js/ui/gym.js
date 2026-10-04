window.CS = window.CS || {};

// 바일 학교의 체육관(코치 브런트의 수업). 회상에서 쓰는 그림과, 그 그림 위에서 하는 던지기 연습.
// 연습은 평면이다: 나는 앞줄에서 좌우로만 움직이고, 뒷줄에서 좌우로 오가는 허수아비를 정면에 두고 모자를 던진다.
// 코치가 던지는 공은 옆으로 비켜서 피한다. 모두 480×270 눈금으로 그린다.
CS.gym = (function () {
  const U = CS.util, input = CS.input;
  const W = 480, H = 270;
  const BACK = 172;          // 뒷줄(허수아비가 선 곳)의 바닥 높이
  const FRONT = 254;         // 앞줄(내가 선 곳)의 바닥 높이
  const GOAL = 3;            // 맞혀야 하는 횟수
  const MOVE = 190;          // 내가 옆으로 움직이는 속도(픽셀/초)
  const EDGE = [50, 380];    // 내가 움직일 수 있는 범위
  const SWING = { mid: 215, wide: 110, pace: 0.8 };  // 허수아비가 오가는 가운데, 폭, 빠르기
  const HAT_TIME = 0.42;     // 모자가 뒷줄까지 날아가는 시간(초)
  const HAT_WAIT = 0.35;     // 모자가 손에 돌아오기까지(초)
  const HAT_HIT = 22;        // 모자가 허수아비에 맞는 거리
  const BALL_TIME = 1.15;    // 공이 앞줄까지 날아오는 시간(초)
  const BALL_GAP = [2.2, 3]; // 공을 던지는 간격(초)
  const BALL_FIRST = 3;      // 첫 공까지(초)
  const BALL_HIT = 20;       // 공에 맞는 거리
  const BALL_FROM = [421, 130];  // 공이 떠나는 자리(코치의 손)
  const STUN = 0.5;          // 공에 맞고 멈칫하는 시간(초)
  const WOBBLE = 0.5;        // 맞은 허수아비가 흔들리는 시간(초)
  const END_WAIT = 1;        // 다 맞힌 뒤 넘어가기까지(초)
  const RED = '#c8142f', INK = '#2a2623';

  // ---------- 그림 ----------

  // 체육관: 높은 창, 바일의 깃발, 늑목, 샌드백, 마룻바닥
  function drawRoom(g) {
    g.fillStyle = '#59646c';
    g.fillRect(0, 0, W, BACK);
    g.fillStyle = '#4b555d';
    g.fillRect(0, 134, W, BACK - 134);

    for (const x of [124, 296]) {
      g.fillStyle = '#cfe2e8';
      g.fillRect(x, 30, 60, 76);
      g.fillStyle = 'rgba(255,255,255,0.5)';
      U.polygon(g, [x + 8, 30, x + 26, 30, x + 6, 106, x, 106, x, 62]);
      g.fillStyle = '#3d464d';
      g.fillRect(x + 28.5, 30, 3, 76);
      g.fillRect(x, 66, 60, 3);
    }

    g.fillStyle = '#8f1a22';
    U.polygon(g, [223, 22, 257, 22, 257, 110, 240, 121, 223, 110]);
    g.fillStyle = '#14151a';
    U.polygon(g, [229, 46, 235, 46, 240, 72, 245, 46, 251, 46, 243, 88, 237, 88]);

    g.fillStyle = '#b98a52';
    for (const x of [18, 58, 98]) g.fillRect(x, 38, 4, 132);
    for (let y = 46; y < 168; y += 12) g.fillRect(18, y, 84, 2.5);

    g.fillStyle = '#3d464d';
    g.fillRect(457, 0, 2, 40);
    g.fillStyle = '#7a2a2a';
    g.fillRect(447, 40, 22, 62);
    g.fillStyle = '#5c1f1f';
    g.fillRect(447, 58, 22, 3);
    g.fillRect(447, 82, 22, 3);

    g.fillStyle = '#c79b5e';
    g.fillRect(0, BACK, W, H - BACK);
    g.fillStyle = '#b48849';
    for (let y = BACK + 14; y < H; y += 18) g.fillRect(0, y, W, 1.5);
    g.fillStyle = '#3d464d';
    g.fillRect(0, BACK - 2, W, 4);
  }

  // 허수아비: 바퀴 달린 받침, 짚으로 채운 자루, 가슴의 과녁. (x, base)가 발밑.
  function drawDummy(g, x, base, tilt, scale) {
    g.save();
    g.translate(x, base);
    g.scale(scale, scale);
    g.rotate(tilt);
    g.fillStyle = '#3d464d';
    g.fillRect(-16, -5, 32, 5);
    g.fillStyle = '#7a5a36';
    g.fillRect(-2.5, -70, 5, 66);
    g.fillRect(-27, -53, 54, 4);
    g.fillStyle = '#e0bd6e';
    U.polygon(g, [-26, -56, -36, -60, -33, -51, -37, -44, -26, -46]);
    U.polygon(g, [26, -56, 36, -60, 33, -51, 37, -44, 26, -46]);
    g.fillStyle = '#d9b56a';
    U.polygon(g, [-13, -57, 13, -57, 15, -20, -15, -20]);
    g.fillStyle = '#fff';
    U.ellipse(g, 0, -38, 9.5, 9.5);
    g.fillStyle = RED;
    U.ellipse(g, 0, -38, 6.5, 6.5);
    g.fillStyle = '#fff';
    U.ellipse(g, 0, -38, 3.5, 3.5);
    g.fillStyle = RED;
    U.ellipse(g, 0, -38, 1.4, 1.4);
    g.fillStyle = '#e0bd6e';
    U.ellipse(g, 0, -68, 10, 10.5);
    g.strokeStyle = '#5a4526';
    g.lineWidth = 1.2;
    g.beginPath();
    for (const ex of [-4, 4]) {
      g.moveTo(ex - 1.8, -71.8);
      g.lineTo(ex + 1.8, -68.2);
      g.moveTo(ex + 1.8, -71.8);
      g.lineTo(ex - 1.8, -68.2);
    }
    g.moveTo(-4, -63);
    g.lineTo(4, -63);
    g.stroke();
    g.restore();
  }

  // 코치 브런트: 떡 벌어진 어깨, 깃을 세운 짙은 녹색 운동복, 위로 크게 넘긴 초록 머리, 살집 있는 얼굴과 분홍 눈화장
  function drawBrunt(g, clock) {
    const SKIN = '#e2ae88', SKIN_SHADE = '#c9936e', SUIT = '#3f5f49', SUIT_DARK = '#2b4233', TRIM = '#c9d3cc';
    const HAIR = '#55c47c', HAIR_LIGHT = '#82dc9d', HAIR_UNDER = '#5a583a', LIPS = '#8f3d3d';
    const cx = 384;

    g.save();
    g.translate(0, Math.sin(clock * 1.4) * 1.2);

    // 어깨와 운동복
    g.fillStyle = SUIT;
    U.polygon(g, [278, H + 4, 290, 180, 326, 152, 442, 152, 478, 180, 490, H + 4]);
    g.fillStyle = SUIT_DARK;
    U.polygon(g, [442, 152, 478, 180, 490, H + 4, 452, H + 4, 446, 190]);
    g.fillStyle = '#1f2420';
    U.polygon(g, [290, 180, 310, 164, 306, 200, 286, 222]);
    U.polygon(g, [478, 180, 458, 164, 462, 200, 482, 222]);
    g.fillStyle = TRIM;
    g.fillRect(cx - 1, 190, 2, H - 186);

    // 머리 뒤와 옆으로 내려온 짙은 머리
    g.fillStyle = HAIR_UNDER;
    U.polygon(g, [338, 100, 346, 70, 424, 70, 434, 100, 432, 136, 420, 112, 348, 112, 338, 134]);

    // 굵은 목과 가슴
    g.fillStyle = SKIN_SHADE;
    g.fillRect(358, 126, 52, 34);
    U.polygon(g, [362, 152, 406, 152, 384, 192]);

    // 세운 깃: 밝은 테두리와 그 안쪽
    for (const side of [-1, 1]) {
      g.fillStyle = TRIM;
      U.polygon(g, [cx + side * 48, 164, cx + side * 30, 126, cx + side * 11, 150, cx, 194, cx + side * 24, 184]);
      g.fillStyle = SUIT;
      U.polygon(g, [cx + side * 44, 166, cx + side * 29, 135, cx + side * 15, 153, cx + side * 5, 188, cx + side * 24, 180]);
    }

    // 살집 있는 얼굴: 겹친 턱과 귀
    g.fillStyle = SKIN_SHADE;
    U.ellipse(g, cx, 146, 27, 10);
    g.fillStyle = SKIN;
    U.polygon(g, [352, 78, 416, 78, 424, 110, 421, 132, 406, 147, 384, 152, 362, 147, 347, 132, 344, 110]);
    U.ellipse(g, 344.5, 110, 4, 7);
    U.ellipse(g, 423.5, 110, 4, 7);

    // 위로 크게 넘긴 초록 머리
    g.fillStyle = HAIR;
    U.polygon(g, [342, 108, 334, 82, 344, 58, 370, 42, 402, 37, 428, 45, 442, 61, 455, 58, 447, 78, 432, 94,
      426, 82, 408, 78, 384, 81, 364, 90, 352, 110]);
    g.fillStyle = HAIR_LIGHT;
    U.polygon(g, [350, 68, 372, 50, 402, 45, 424, 53, 400, 53, 376, 60, 358, 76]);
    U.polygon(g, [366, 78, 392, 68, 420, 68, 396, 73, 374, 84]);

    // 눈썹, 분홍 눈화장, 눈
    g.strokeStyle = '#3d2f27';
    g.lineWidth = 2;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(359, 97);
    g.lineTo(377, 101);
    g.moveTo(409, 97);
    g.lineTo(391, 101);
    g.stroke();
    const shut = clock % 4.6 < 0.13;
    for (const side of [-1, 1]) {
      const x = cx + side * 16;
      g.fillStyle = '#e0627c';
      U.polygon(g, [x - 7, 105, x - side * 3, 101.5, x + 7, 104, x + 6, 107, x - 6, 107]);
      g.fillStyle = '#3d2f27';
      g.fillRect(x - 6, 106.3, 12, 1.5);
      if (shut) continue;
      g.fillStyle = '#fff';
      U.polygon(g, [x - 5.5, 107.6, x + 5.5, 107.6, x + 4, 110.6, x - 4, 110.6]);
      g.fillStyle = '#3f9a5a';
      U.ellipse(g, x, 109, 2.2, 1.9);
      g.fillStyle = INK;
      U.ellipse(g, x, 109, 1, 1);
    }

    // 넓은 코, 볼의 주름, 두툼한 입술
    g.strokeStyle = SKIN_SHADE;
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(381, 108);
    g.lineTo(378, 121);
    g.lineTo(384, 123.5);
    g.lineTo(390, 121);
    g.moveTo(372, 122);
    g.quadraticCurveTo(366, 128, 367, 137);
    g.moveTo(396, 122);
    g.quadraticCurveTo(402, 128, 401, 137);
    g.stroke();
    g.fillStyle = '#4a1f1f';
    U.polygon(g, [373, 132, 395, 132, 391, 138.5, 377, 138.5]);
    g.fillStyle = '#fff';
    g.fillRect(378, 132.6, 12, 2);
    g.fillStyle = LIPS;
    U.polygon(g, [371, 132, 379, 128.5, 384, 130, 389, 128.5, 397, 132, 384, 133.2]);
    U.polygon(g, [375, 137, 393, 137, 389, 142, 379, 142]);
    g.restore();
  }

  // 대사 장면: 체육관에 허수아비가 서 있고 코치 브런트가 앞에 있다
  function draw(g, clock) {
    drawRoom(g);
    drawDummy(g, 170, BACK + 34, Math.sin(clock * 1.2) * 0.02, 1.5);
    drawBrunt(g, clock);
  }

  // 대련 상대로 선 동기 시나(뒷날의 타이거리스): 올리브색 교복에 흰 금발 단발, 팔짱을 끼고 비웃는다. (x, base)가 발밑.
  function drawRival(g, x, base, clock) {
    const UNIFORM = '#7d8566', UNIFORM_DARK = '#636b50', SKIN = '#f0d2bc', HAIR = '#ece8e0', HAIR_DARK = '#c9c3b8';
    g.save();
    g.translate(x, base + Math.sin(clock * 1.7) * 0.8);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    U.ellipse(g, 0, 0, 24, 4.5);

    // 뒷머리: 턱까지 오고 끝이 바깥으로 뻗친다
    g.fillStyle = HAIR;
    U.polygon(g, [-11, -136, 11, -136, 15, -122, 18.5, -112, 11, -114, -11, -114, -18.5, -112, -15, -122]);

    // 바지와 구두, 교복 윗옷
    g.fillStyle = '#3d4234';
    U.polygon(g, [-14, -66, -1, -66, -3, -4, -15, -4]);
    U.polygon(g, [1, -66, 14, -66, 17, -4, 5, -4]);
    g.fillStyle = '#23262d';
    g.fillRect(-17, -5, 15, 5);
    g.fillRect(4, -5, 15, 5);
    g.fillStyle = UNIFORM;
    U.polygon(g, [-17, -110, 17, -110, 15, -62, -15, -62]);
    g.fillStyle = SKIN;
    g.fillRect(-4, -117, 8, 9);
    g.fillStyle = UNIFORM_DARK;
    U.polygon(g, [-11, -110, -3, -113, 0, -102, -7, -100]);
    U.polygon(g, [11, -110, 3, -113, 0, -102, 7, -100]);
    g.fillRect(-15, -66, 30, 3);

    // 팔짱
    g.fillStyle = UNIFORM_DARK;
    U.polygon(g, [-21, -106, -15, -110, -13, -92, 19, -97, 21, -87, -19, -81]);
    g.fillStyle = UNIFORM;
    U.polygon(g, [21, -106, 15, -110, 13, -94, -19, -91, -20, -84, 20, -86]);
    g.fillStyle = SKIN;
    U.ellipse(g, -20, -87, 3.4, 3.6);
    U.ellipse(g, 20, -91, 3.4, 3.6);

    // 얼굴, 가르마를 탄 앞머리와 빨간 핀
    g.fillStyle = SKIN;
    U.ellipse(g, 0, -126, 11, 12.5);
    g.fillStyle = HAIR;
    g.beginPath();
    g.ellipse(0, -130, 11.6, 9.5, 0, Math.PI, 0);
    g.fill();
    U.polygon(g, [2, -139, -5, -137, -11, -132, -14, -118, -11, -116, -9, -127, -4, -132, 2, -134]);
    U.polygon(g, [1, -138, 7, -137, 11.5, -131, 14, -118, 11, -116, 9.5, -127, 5, -132]);
    g.strokeStyle = HAIR_DARK;
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(1, -137.5);
    g.lineTo(-6, -134);
    g.lineTo(-11, -126);
    g.stroke();
    g.fillStyle = '#c8142f';
    g.fillRect(1, -141.5, 1.4, 5);

    // 눈썹, 짙은 눈꼬리의 회청색 눈, 비웃는 보라 입술, 입가의 점
    g.strokeStyle = '#8d8578';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-9, -130.5);
    g.lineTo(-3, -129);
    g.moveTo(9, -130.5);
    g.lineTo(3, -129);
    g.stroke();
    for (const side of [-1, 1]) {
      g.fillStyle = '#33363f';
      U.polygon(g, [side * 10.5, -129, side * 8, -127.3, side * 2.6, -126.8, side * 3, -124.3, side * 8, -124.3]);
      g.fillStyle = '#7fa3bd';
      U.ellipse(g, side * 5.5, -125.6, 1.5, 1.2);
    }
    g.fillStyle = '#8e4a9e';
    U.polygon(g, [-4, -118.2, 4.5, -119.6, 2.8, -116.4, -1.5, -116.2]);
    g.fillStyle = '#4a3530';
    U.ellipse(g, -5, -115, 0.6, 0.6);
    g.restore();
  }

  // 대련 수업의 대사 장면: 시나가 기다리고 코치 브런트가 앞에 있다
  function drawSpar(g, clock) {
    drawRoom(g);
    drawRival(g, 176, BACK + 40, clock);
    drawBrunt(g, clock);
  }

  // 빨간 모자. (x, y)가 가운데.
  function drawHat(g, x, y, size, spin) {
    g.save();
    g.translate(x, y);
    g.scale(size, size * (0.75 + 0.25 * Math.cos(spin)));
    g.rotate(Math.sin(spin) * 0.3);
    g.fillStyle = RED;
    U.ellipse(g, 0, 2, 12, 3.6);
    U.polygon(g, [-6.5, 2, -5.5, -6, -2, -8, 0, -6.8, 2, -8, 5.5, -6, 6.5, 2]);
    g.fillStyle = '#1a1218';
    g.fillRect(-6.2, -1.6, 12.4, 2.6);
    g.restore();
  }

  // 훈련복을 입은 나의 뒷모습. x가 발밑의 가운데.
  function drawMe(g, x, holding, dazed) {
    g.save();
    g.translate(x, FRONT);
    if (dazed) g.rotate(Math.sin(dazed * 40) * 0.08);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    U.ellipse(g, 0, 0, 16, 3.5);
    g.fillStyle = '#23262d';
    g.fillRect(-9.5, -32, 8, 32);
    g.fillRect(1.5, -32, 8, 32);
    g.fillStyle = '#3b4656';
    U.polygon(g, [-14, -66, 14, -66, 12.5, -30, -12.5, -30]);
    U.polygon(g, [-14, -65, -19.5, -61, -20.5, -38, -15, -37]);
    U.polygon(g, [14, -65, 20, -62, 24, -50, 19, -48]);
    g.fillStyle = RED;
    g.fillRect(-13, -42, 26, 3);
    g.fillStyle = '#3a1c1a';
    U.ellipse(g, 0, -76, 10, 11);
    U.polygon(g, [-3.5, -70, 3.5, -70, 5.5, -50, 0, -43, -5.5, -50]);
    g.fillStyle = '#1a1218';
    U.ellipse(g, 22, -48, 3.2, 3.4);
    g.restore();
    if (holding) drawHat(g, x + 24, FRONT - 54, 1, 0);
  }

  // ---------- 던지기 연습 ----------

  let hud = null, onDone = null;
  let clock = 0;
  let me = 0;            // 내 자리(x)
  let hits = 0;
  let hat = null;        // 날아가는 모자 { x, t }
  let hatWait = 0;       // 모자가 손에 돌아오기까지 남은 시간
  let balls = [];        // 날아오는 공 { to, t }
  let nextBall = 0;
  let stun = 0, wobble = 0, flash = 0, ending = 0;
  let dodged = false;    // 한 번이라도 공을 피했는가(처음 피했을 때만 알려 준다)

  function between(range) {
    return range[0] + Math.random() * (range[1] - range[0]);
  }

  function dummyX() {
    return SWING.mid + Math.sin(clock * SWING.pace) * SWING.wide;
  }

  function showGoal() {
    hud.goal('허수아비 맞히기 <b>' + hits + ' / ' + GOAL + '</b> · <kbd>A</kbd><kbd>D</kbd> 움직이기 · <kbd>Space</kbd> 모자 던지기');
  }

  // hud: { goal(html), call(text, kind) }. 다 맞히면 done을 부른다.
  function start(screen, done) {
    hud = screen;
    onDone = done;
    clock = hits = hatWait = stun = wobble = flash = ending = 0;
    me = 120;
    hat = null;
    balls = [];
    nextBall = BALL_FIRST;
    dodged = false;
    showGoal();
  }

  function update(dt) {
    clock += dt;
    stun = Math.max(0, stun - dt);
    wobble = Math.max(0, wobble - dt);
    flash = Math.max(0, flash - dt);
    hatWait = Math.max(0, hatWait - dt);

    if (ending > 0) {
      ending -= dt;
      if (ending <= 0) onDone();
      return;
    }

    // 움직이기와 던지기
    const throwing = input.consume('Space');
    if (!stun) {
      const side = (input.isDown('KeyD') || input.isDown('ArrowRight') ? 1 : 0) - (input.isDown('KeyA') || input.isDown('ArrowLeft') ? 1 : 0);
      me = Math.min(EDGE[1], Math.max(EDGE[0], me + side * MOVE * dt));
      if (throwing && !hat && !hatWait) {
        hat = { x: me, t: 0 };
        CS.sound.play('throw');
      }
    }

    // 모자: 뒷줄에 닿았을 때 허수아비가 그 앞에 있으면 맞는다
    if (hat) {
      hat.t += dt / HAT_TIME;
      if (hat.t >= 1) {
        if (Math.abs(hat.x - dummyX()) < HAT_HIT) {
          hits++;
          CS.sound.play(hits >= GOAL ? 'perfect' : 'hatHit');
          wobble = WOBBLE;
          showGoal();
          hud.call(hits >= GOAL ? '세 번 명중!' : '명중!', 'good');
          if (hits >= GOAL) ending = END_WAIT;
        } else {
          hud.call('빗나갔다', '');
        }
        hat = null;
        hatWait = HAT_WAIT;
      }
    }

    // 코치가 던지는 공: 던질 때 내가 선 자리로 날아온다
    nextBall -= dt;
    if (nextBall <= 0) {
      balls.push({ to: me, t: 0 });
      CS.sound.play('star');
      nextBall = between(BALL_GAP);
    }
    for (const ball of balls) {
      ball.t += dt / BALL_TIME;
      if (ball.t < 1) continue;
      if (Math.abs(ball.to - me) < BALL_HIT) {
        stun = STUN;
        CS.sound.play('hurt');
        flash = 0.35;
        hud.call('맞았다! 옆으로 피하세요', 'bad');
      } else if (!dodged) {
        dodged = true;
        hud.call('피했다!', 'good');
      }
    }
    balls = balls.filter((ball) => ball.t < 1);
  }

  // 연습 중 매 프레임
  function frame(g, dt) {
    update(dt);
    drawRoom(g);

    // 공 상자 뒤에 선 코치
    g.save();
    g.translate(284, 62);
    g.scale(0.4, 0.4);
    drawBrunt(g, clock);
    g.restore();
    g.fillStyle = '#7a5a36';
    g.fillRect(398, 152, 80, 22);
    g.fillStyle = '#5c4326';
    g.fillRect(398, 152, 80, 3);
    for (const x of [410, 426, 442, 458]) drawBall(g, x, 149, 6);

    // 내 정면을 알려 주는 점선. 허수아비가 이 선에 걸릴 때 던지면 맞는다.
    g.fillStyle = 'rgba(255,255,255,0.4)';
    for (let y = 92; y < BACK - 4; y += 9) g.fillRect(me - 0.8, y, 1.6, 4.5);

    drawDummy(g, dummyX(), BACK, wobble ? Math.sin(wobble * 34) * 0.22 * (wobble / WOBBLE) : 0, 1);

    // 공이 떨어질 자리의 그림자
    for (const ball of balls) {
      g.fillStyle = 'rgba(0,0,0,' + (0.12 + ball.t * 0.25) + ')';
      U.ellipse(g, ball.to, FRONT, 6 + ball.t * 10, 2 + ball.t * 2.5);
    }

    drawMe(g, me, !hat && !hatWait, stun);

    if (hat) drawHat(g, hat.x + 24 * (1 - hat.t), FRONT - 54 + (BACK - 38 - (FRONT - 54)) * hat.t, 1 - hat.t * 0.35, clock * 22);

    for (const ball of balls) {
      const x = BALL_FROM[0] + (ball.to - BALL_FROM[0]) * ball.t;
      const y = BALL_FROM[1] + (FRONT - 44 - BALL_FROM[1]) * ball.t - Math.sin(ball.t * Math.PI) * 26;
      drawBall(g, x, y, 5 + ball.t * 7);
    }

    if (flash) {
      g.fillStyle = 'rgba(200, 20, 47, ' + flash + ')';
      g.fillRect(0, 0, W, H);
    }
  }

  function drawBall(g, x, y, r) {
    g.fillStyle = '#e2572e';
    U.ellipse(g, x, y, r, r);
    g.fillStyle = 'rgba(255,255,255,0.45)';
    U.ellipse(g, x - r * 0.3, y - r * 0.35, r * 0.35, r * 0.28);
  }

  return {
    draw,
    spar: drawSpar,
    room: drawRoom,
    drill: {
      start,
      frame,
      // 지금 연습의 상태(내 자리, 허수아비의 자리, 맞힌 횟수, 날아오는 공이 떨어질 자리)
      state: () => ({ me, dummy: dummyX(), hits, balls: balls.map((ball) => ball.to) }),
    },
  };
})();
