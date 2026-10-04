window.CS = window.CS || {};

// 주먹 전투: 상대와 마주 서서 맨주먹으로 싸운다.
//   상대가 한쪽 발톱을 치켜들면 반대쪽으로 피하고(A/D), 두 손을 다 들면 막는다(S).
//   헛친 상대가 비틀거리는 동안 Space로 때린다. 상대가 버티고 있을 때의 주먹은 막힌다.
//   진짜 싸움의 상대는 한쪽을 치켜들었다가 반대쪽으로 바꾸는 속임 동작을 쓰고, 체력이 절반 아래로 내려가면 분노해 빨라진다.
CS.brawl = (function () {
  const input = CS.input, U = CS.util, sound = CS.sound;
  const W = 480, H = 270;
  const HEARTS = 3;          // 내 체력
  const DODGE_TIME = 0.45;   // 한 번 피하는 동작의 길이(초)
  const DODGE_WAIT = 0.12;   // 피한 뒤 다시 피하기까지(초)
  const DODGE_SHIFT = 96;    // 피할 때 화면이 옆으로 밀리는 정도(픽셀)
  const PUNCH_TIME = 0.2;    // 주먹 한 번의 길이(초)
  const PUNCH_LAND = 0.4;    // 그중 주먹이 닿는 때(0~1)
  const PUNCH_WAIT = 0.27;   // 다시 주먹을 내기까지(초)
  const STRIKE_TIME = 0.25;  // 상대가 휘두르는 동작의 길이(초)
  const END_WAIT = 1.3;      // 승패가 난 뒤 화면이 넘어가기까지(초)
  const CALL_TIME = 0.7;     // "피했다!" 같은 글이 떠 있는 시간(초)
  const FEINT_AT = 0.6;      // 속임 동작: 치켜든 시간의 이만큼이 지났을 때 반대쪽으로 바꾼다
  const FEINT_TELL = 0.42;   // 바꾼 뒤 내리치기까지(초)
  const RAGE_TIME = 1.1;     // 분노하며 울부짖는 시간(초)

  const SUIT = '#1d1d22', STRIPE = '#c9602a', SKIN = '#f0d2bc', HAIR = '#ece8e0', HAIR_DARK = '#c9c3b8';
  const LENS = '#a6e05a', RAGE_LENS = '#ff4b3a', LIPS = '#8e4a9e', CLAW = '#d9dde0', UNIFORM = '#7d8566';

  const panel = document.getElementById('brawl');
  panel.innerHTML =
    '<div class="foe"><b></b><i><span></span></i></div>' +
    '<p class="me"></p>' +
    '<p class="call"></p>' +
    '<p class="keys"><kbd>A</kbd><kbd>D</kbd>피하기 <kbd>S</kbd>막기 <kbd>Space</kbd>주먹</p>';
  const foeName = panel.querySelector('.foe b'), foeBar = panel.querySelector('.foe span');
  const meEl = panel.querySelector('.me'), callEl = panel.querySelector('.call');
  const hurt = document.getElementById('hurt');

  let active = false;
  let foe = null, rule = null, onDone = null;
  let backdrop = null;   // 싸움이 시작될 때의 거리 모습(연습이면 받은 배경 그림)
  let student = false;   // 상대를 학생 시절의 모습(가면도 발톱도 없는 교복 차림)으로 그리는가
  let hp = 0, hearts = 0;
  let mode = 'ready';    // ready(버팀) → windup(치켜듦) → strike(휘두름) → open(비틀거림) / rage(분노해 울부짖음) / down(쓰러짐) / over(내가 쓰러짐)
  let modeLeft = 0;
  let dir = 'L';         // 공격하는 쪽: L(화면 왼쪽에서), R(오른쪽에서), B(두 손으로 덮침)
  let missed = false;    // 방금 휘두른 것이 빗나갔는가
  let swapLeft = 0;      // 속임 동작: 반대쪽으로 바꾸기까지 남은 시간(0이면 속임이 아니다)
  let raging = false;    // 분노했는가
  let dodge = 0, dodgeDir = 0, dodgeWait = 0;
  let punch = 0, punchSide = 0, punchWait = 0, landed = false;
  let blocking = false;
  let shake = 0, jerk = 0, callLeft = 0, clock = 0;
  // 상대의 두 손이 지금 있는 자리 [x, y, 크기]. 자세가 바뀌면 그쪽으로 빠르게 옮겨 간다.
  const hands = [[-70, 190, 16], [70, 190, 16]];

  function between(range) {
    return range[0] + Math.random() * (range[1] - range[0]);
  }

  function call(text, tone) {
    callEl.textContent = text;
    callEl.className = 'call ' + tone;
    callLeft = CALL_TIME;
  }

  function showStatus() {
    foeBar.style.width = Math.max(0, hp / rule.hp) * 100 + '%';
    meEl.textContent = '나 ' + '♥'.repeat(hearts) + '♡'.repeat(HEARTS - hearts);
  }

  // drill: 회상에서 연습으로 싸울 때만 넘긴다 { rule: 연습용 규칙, backdrop: 배경 그림, name: 띄울 이름, student: 학생 모습인가 }
  function start(target, done, drill) {
    active = true;
    foe = target;
    rule = drill ? drill.rule : target.brawl;
    student = !!(drill && drill.student);
    onDone = done;
    hp = rule.hp;
    hearts = HEARTS;
    mode = 'ready';
    modeLeft = 1.2;
    dodge = dodgeWait = punch = punchWait = shake = jerk = callLeft = clock = 0;
    blocking = false;
    raging = false;
    swapLeft = 0;
    panel.classList.remove('rage');
    backdrop = U.makeCanvas(W, H);
    backdrop.getContext('2d').drawImage(drill ? drill.backdrop : document.getElementById('view'), 0, 0, W, H);
    foeName.textContent = (drill && drill.name) || target.name;
    callEl.textContent = '';
    showStatus();
    panel.classList.remove('hidden');
    if (document.exitPointerLock) document.exitPointerLock();
  }

  function end(result) {
    active = false;
    panel.classList.add('hidden');
    onDone(result);
  }

  function gotHit() {
    hearts--;
    shake = 0.3;
    hurt.classList.remove('on');
    void hurt.offsetWidth;  // 번쩍임을 처음부터 다시 틀게 한다
    hurt.classList.add('on');
    showStatus();
    call('맞았다!', 'bad');
    sound.play(hearts <= 0 ? 'fall' : 'hurt');
    if (hearts <= 0) {
      mode = 'over';
      modeLeft = END_WAIT;
    }
  }

  // 치켜든 발톱이 내리꽂힌다. 제대로 피했거나 막았는지 가린다.
  function resolve() {
    const dodged = dodge > 0 && ((dir === 'L' && dodgeDir > 0) || (dir === 'R' && dodgeDir < 0));
    const blocked = blocking;
    mode = 'strike';
    modeLeft = STRIKE_TIME;
    missed = dir === 'B' ? blocked : dodged;
    sound.play('swipe');
    if (missed) call(dir === 'B' ? '막아 냈다!' : '피했다!', 'good');
    else if (blocked) call('막았다', '');
    else gotHit();
    if (blocked) sound.play('guard');
  }

  function punchLands() {
    if (mode !== 'open') {
      if (mode === 'ready') {
        call('막힘', '');
        sound.play('blocked');
      }
      return;
    }
    hp--;
    jerk = 0.14;
    showStatus();
    sound.play(hp <= 0 ? 'down' : 'hit');
    if (hp <= 0) {
      mode = 'down';
      modeLeft = END_WAIT;
      call('쓰러뜨렸다!', 'good');
    } else if (rule.rage && !raging && hp <= rule.hp / 2) {
      enrage();
    }
  }

  // 체력이 절반 아래로 내려가면 분노한다: 틈을 털고 일어나 울부짖고, 눈이 붉게 빛나며, 빨라지고, 속임 동작이 잦아진다
  function enrage() {
    raging = true;
    mode = 'rage';
    modeLeft = RAGE_TIME;
    shake = 0.5;
    panel.classList.add('rage');
    call(U.josa(foe.name, '이', '가') + ' 분노했다!', 'bad');
    sound.play('rage');
  }

  // 분노하면 치켜드는 시간과 공격 사이가 이 배율로 줄어든다
  function pace() {
    return raging ? rule.rage : 1;
  }

  function update(dt) {
    clock += dt;
    shake = Math.max(0, shake - dt);
    jerk = Math.max(0, jerk - dt);
    dodgeWait = Math.max(0, dodgeWait - dt);
    punchWait = Math.max(0, punchWait - dt);
    if (callLeft > 0) {
      callLeft -= dt;
      if (callLeft <= 0) callEl.textContent = '';
    }

    // 내 움직임
    const fighting = mode !== 'down' && mode !== 'over';
    blocking = fighting && (input.isDown('KeyS') || input.isDown('ArrowDown'));
    const left = input.consume('KeyA') || input.consume('ArrowLeft');
    const right = input.consume('KeyD') || input.consume('ArrowRight');
    const hit = input.consume('Space') || input.consume('KeyJ') || input.consume('Mouse');
    if (dodge > 0) {
      // 상대가 아직 발톱을 치켜들고 있으면 비킨 자세로 기다린다. 일찍 피해도 헛되지 않게.
      // 그사이에 반대쪽 키를 누르면 그쪽으로 다시 피한다(속임 동작에 맞서는 법).
      const waiting = mode === 'windup' && dodge <= DODGE_TIME / 2;
      const other = left ? -1 : right ? 1 : 0;
      if (waiting && other && other !== dodgeDir) {
        dodge = DODGE_TIME;
        dodgeDir = other;
        sound.play('dodge');
      } else if (!waiting) {
        dodge -= dt;
      }
      if (dodge <= 0) dodgeWait = DODGE_WAIT;
    } else if (fighting && !blocking && dodgeWait <= 0 && (left || right)) {
      dodge = DODGE_TIME;
      dodgeDir = left ? -1 : 1;
      sound.play('dodge');
    }
    if (punch > 0) {
      punch -= dt;
      if (!landed && punch <= PUNCH_TIME * (1 - PUNCH_LAND)) {
        landed = true;
        punchLands();
      }
    } else if (fighting && hit && !blocking && dodge <= 0 && punchWait <= 0) {
      punch = PUNCH_TIME;
      punchWait = PUNCH_WAIT;
      punchSide = 1 - punchSide;
      landed = false;
      sound.play('punch');
    }

    // 상대의 움직임
    if (mode === 'windup' && swapLeft > 0) {
      // 속임 동작: 치켜든 발톱을 내리고 반대쪽으로 바꾼다
      swapLeft -= dt;
      if (swapLeft <= 0) {
        dir = dir === 'L' ? 'R' : 'L';
        modeLeft = FEINT_TELL;
        call('속임수!', '');
        sound.play('feint');
      }
    }
    modeLeft -= dt;
    if (modeLeft > 0) return;
    if (mode === 'ready') {
      mode = 'windup';
      dir = ['L', 'R', 'B'][(Math.random() * 3) | 0];
      // 체력이 줄수록 치켜드는 시간이 짧아진다
      modeLeft = (rule.tell[0] + (rule.tell[1] - rule.tell[0]) * (1 - hp / rule.hp)) * pace();
      const feints = rule.feint && dir !== 'B' && Math.random() < rule.feint[raging ? 1 : 0];
      swapLeft = feints ? modeLeft * FEINT_AT : 0;
      sound.play('raise');
    } else if (mode === 'windup') {
      resolve();
    } else if (mode === 'strike') {
      mode = missed ? 'open' : 'ready';
      modeLeft = missed ? rule.open : between(rule.gap) * pace();
    } else if (mode === 'open') {
      mode = 'ready';
      modeLeft = between(rule.gap) * pace();
    } else if (mode === 'rage') {
      mode = 'ready';
      modeLeft = 0.5;
    } else {
      end(mode === 'down' ? 'won' : 'lost');
    }
  }

  // 지금 자세에서 두 손이 있어야 할 자리 [x(가운데에서), y, 크기]
  function pose() {
    if (mode === 'windup') {
      if (dir === 'L') return [[-118, 46, 20], [62, 186, 16]];
      if (dir === 'R') return [[-62, 186, 16], [118, 46, 20]];
      return [[-96, 36, 20], [96, 36, 20]];
    }
    if (mode === 'strike') {
      if (dir === 'L') return [[20, 176, 40], [62, 190, 16]];
      if (dir === 'R') return [[-62, 190, 16], [-20, 176, 40]];
      return [[-44, 178, 36], [44, 178, 36]];
    }
    if (mode === 'open' || mode === 'down') return [[-84, 246, 15], [84, 246, 15]];
    if (mode === 'rage') return [[-112, 84, 21], [112, 84, 21]];  // 두 발톱을 벌리고 울부짖는다
    return [[-30, 124, 17], [30, 124, 17]];  // 버티는 자세: 두 손으로 얼굴을 가린다
  }

  // 꺾은선을 긋는다
  function trace(ctx, color, width, points) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
    ctx.stroke();
  }

  // 연습용 장갑을 낀 주먹(학생 시절)
  function drawGlove(ctx, x, y, r) {
    ctx.fillStyle = '#a3202c';
    U.ellipse(ctx, x, y, r, r);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (const off of [-0.5, 0, 0.5]) U.ellipse(ctx, x + off * r, y - r * 0.35, r * 0.2, r * 0.14);
    ctx.fillStyle = '#f1ece2';
    ctx.fillRect(x - r * 0.7, y + r * 0.45, r * 1.4, r * 0.3);
  }

  // 발톱 달린 손
  function drawHand(ctx, x, y, r, down) {
    if (student) return drawGlove(ctx, x, y, r);
    ctx.fillStyle = CLAW;
    const tip = down ? 1 : -1;
    for (const off of [-0.6, 0, 0.6]) {
      U.polygon(ctx, [x + off * r - r * 0.22, y + tip * r * 0.5, x + off * r + r * 0.22, y + tip * r * 0.5, x + off * r * 1.3, y + tip * r * 1.9]);
    }
    ctx.fillStyle = '#2b2b31';
    U.ellipse(ctx, x, y, r, r);
    ctx.fillStyle = STRIPE;
    ctx.fillRect(x - r * 0.7, y - r * 0.15, r * 1.4, r * 0.3);
  }

  // 타이거리스의 몸과 얼굴: 줄무늬 옷, 가면, 초록 눈 유리
  function drawTigress(ctx, x, oy, stunned) {
    // 뒤로 묶은 머리
    ctx.fillStyle = HAIR;
    U.polygon(ctx, [x + 16, 54 + oy, x + 62, 68 + oy, x + 78, 122 + oy, x + 60, 156 + oy, x + 50, 112 + oy, x + 28, 86 + oy]);
    ctx.fillStyle = HAIR_DARK;
    U.polygon(ctx, [x + 28, 86 + oy, x + 50, 112 + oy, x + 60, 156 + oy, x + 55, 116 + oy, x + 36, 90 + oy]);

    // 몸과 가슴으로 모이는 호랑이 줄무늬
    ctx.fillStyle = SUIT;
    U.polygon(ctx, [x - 64, 134 + oy, x + 64, 134 + oy, x + 50, 300 + oy, x - 50, 300 + oy]);
    ctx.fillRect(x - 11, 106 + oy, 22, 32);
    ctx.fillStyle = STRIPE;
    for (const side of [-1, 1]) {
      for (let y = 146; y < 270; y += 28) {
        const edge = 62 - (y - 134) / 166 * 14;  // 그 높이에서 몸의 가장자리
        U.polygon(ctx, [x + side * edge, y + oy, x + side * 18, y + 19 + oy, x + side * 22, y + 26 + oy, x + side * (edge - 1), y + 9 + oy]);
      }
    }

    // 얼굴과 옆으로 넘긴 앞머리
    ctx.fillStyle = SKIN;
    U.ellipse(ctx, x, 82 + oy, 30, 34);
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.ellipse(x, 70 + oy, 31.5, 24, 0, Math.PI, 0);
    ctx.fill();
    U.polygon(ctx, [x + 16, 50 + oy, x - 8, 52 + oy, x - 28, 64 + oy, x - 36, 94 + oy, x - 30, 96 + oy, x - 22, 74 + oy, x - 4, 65 + oy, x + 20, 62 + oy]);
    U.polygon(ctx, [x + 8, 52 + oy, x + 30, 64 + oy, x + 34, 90 + oy, x + 28, 74 + oy, x + 14, 64 + oy]);
    trace(ctx, HAIR_DARK, 1.5, [x + 14, 52 + oy, x - 12, 59 + oy, x - 28, 76 + oy]);

    // 눈꼬리가 위로 솟은 가면. 가장자리는 적갈색.
    for (const side of [-1, 1]) {
      const mask = [x, 73 + oy, x + side * 10, 70 + oy, x + side * 22, 67 + oy, x + side * 38, 48 + oy, x + side * 32, 76 + oy,
        x + side * 27, 88 + oy, x + side * 14, 91 + oy, x + side * 4, 86 + oy, x, 83 + oy];
      ctx.fillStyle = SUIT;
      U.polygon(ctx, mask);
      trace(ctx, STRIPE, 1.5, mask);
    }
    // 눈: 평소에는 초록 유리(분노하면 붉은 유리), 비틀거릴 때는 감긴 눈
    const lens = raging ? RAGE_LENS : LENS;
    for (const side of [-1, 1]) {
      if (stunned || mode === 'down') {
        trace(ctx, lens, 2, [x + side * 21, 74 + oy, x + side * 9, 82 + oy]);
        trace(ctx, lens, 2, [x + side * 21, 82 + oy, x + side * 9, 74 + oy]);
      } else {
        ctx.fillStyle = lens;
        U.polygon(ctx, [x + side * 24, 71 + oy, x + side * 6, 77 + oy, x + side * 8, 85 + oy, x + side * 22, 83 + oy]);
      }
    }
    // 입: 평소에는 비웃고, 맞으면 벌어지고, 울부짖을 때는 크게 벌어진다
    ctx.fillStyle = LIPS;
    if (mode === 'rage') U.ellipse(ctx, x, 105 + oy, 8, 7);
    else if (stunned || jerk > 0 || mode === 'down') U.ellipse(ctx, x, 105 + oy, 5, 5);
    else U.polygon(ctx, [x - 10, 101 + oy, x + 11, 98 + oy, x + 6, 105 + oy, x - 4, 105 + oy]);
  }

  // 학생 시절(시나)의 몸과 얼굴: 올리브색 교복, 빨간 핀을 꽂은 흰 금발 단발, 회청색 눈과 보라 입술, 입가의 점
  function drawStudent(ctx, x, oy, stunned) {
    const UNIFORM_DARK = '#636b50', SHADE = '#dcbba3', DARK = '#33363f';

    // 뒷머리: 턱까지 오고 끝이 바깥으로 뻗친다
    ctx.fillStyle = HAIR;
    U.polygon(ctx, [x - 30, 58 + oy, x + 30, 58 + oy, x + 40, 96 + oy, x + 48, 120 + oy, x + 30, 113 + oy,
      x - 30, 113 + oy, x - 48, 120 + oy, x - 40, 96 + oy]);

    // 교복과 깃
    ctx.fillStyle = UNIFORM;
    U.polygon(ctx, [x - 64, 134 + oy, x + 64, 134 + oy, x + 50, 300 + oy, x - 50, 300 + oy]);
    ctx.fillStyle = SHADE;
    ctx.fillRect(x - 10, 106 + oy, 20, 32);
    U.polygon(ctx, [x - 12, 134 + oy, x + 12, 134 + oy, x, 152 + oy]);
    ctx.fillStyle = UNIFORM_DARK;
    U.polygon(ctx, [x - 30, 136 + oy, x - 10, 127 + oy, x - 1, 154 + oy, x - 20, 162 + oy]);
    U.polygon(ctx, [x + 30, 136 + oy, x + 10, 127 + oy, x + 1, 154 + oy, x + 20, 162 + oy]);
    ctx.fillRect(x - 1, 154 + oy, 2, 150);
    for (let y = 176; y < 270; y += 30) U.ellipse(ctx, x, y + oy, 2.6, 2.6);

    // 얼굴과 가르마를 탄 앞머리, 빨간 핀
    ctx.fillStyle = SKIN;
    U.ellipse(ctx, x, 82 + oy, 30, 34);
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.ellipse(x, 70 + oy, 31.5, 24, 0, Math.PI, 0);
    ctx.fill();
    U.polygon(ctx, [x + 6, 48 + oy, x - 14, 52 + oy, x - 30, 66 + oy, x - 37, 102 + oy, x - 29, 106 + oy, x - 24, 80 + oy, x - 10, 66 + oy, x + 6, 61 + oy]);
    U.polygon(ctx, [x + 2, 50 + oy, x + 20, 54 + oy, x + 31, 68 + oy, x + 37, 102 + oy, x + 29, 106 + oy, x + 25, 80 + oy, x + 12, 66 + oy]);
    trace(ctx, HAIR_DARK, 1.5, [x + 2, 52 + oy, x - 16, 60 + oy, x - 29, 80 + oy]);
    trace(ctx, HAIR_DARK, 1.5, [x + 8, 54 + oy, x + 22, 64 + oy, x + 30, 84 + oy]);
    ctx.fillStyle = '#c8142f';
    ctx.fillRect(x + 2.5, 44 + oy, 3, 12);

    // 눈썹과 눈: 평소에는 짙은 눈꼬리의 회청색 눈, 비틀거릴 때는 감긴 눈
    trace(ctx, '#8d8578', 2, [x - 25, 69 + oy, x - 8, 73 + oy]);
    trace(ctx, '#8d8578', 2, [x + 25, 69 + oy, x + 8, 73 + oy]);
    for (const side of [-1, 1]) {
      if (stunned || mode === 'down') {
        trace(ctx, DARK, 2, [x + side * 21, 76 + oy, x + side * 9, 84 + oy]);
        trace(ctx, DARK, 2, [x + side * 21, 84 + oy, x + side * 9, 76 + oy]);
        continue;
      }
      ctx.fillStyle = DARK;
      U.polygon(ctx, [x + side * 29, 73 + oy, x + side * 22, 77 + oy, x + side * 7, 78.5 + oy, x + side * 8, 85 + oy, x + side * 22, 85 + oy]);
      ctx.fillStyle = '#f6f3ee';
      U.polygon(ctx, [x + side * 21.5, 79 + oy, x + side * 9, 80 + oy, x + side * 10, 84 + oy, x + side * 20.5, 84 + oy]);
      ctx.fillStyle = '#7fa3bd';
      U.ellipse(ctx, x + side * 15, 81.6 + oy, 3.4, 3);
      ctx.fillStyle = DARK;
      U.ellipse(ctx, x + side * 15, 81.6 + oy, 1.5, 1.5);
    }

    // 코, 입(평소에는 비웃고 맞으면 벌어진다), 입가의 점
    trace(ctx, SHADE, 1.5, [x + 1, 90 + oy, x + 3, 96 + oy, x - 1, 97 + oy]);
    ctx.fillStyle = LIPS;
    if (stunned || jerk > 0 || mode === 'down') U.ellipse(ctx, x, 105 + oy, 5, 5);
    else U.polygon(ctx, [x - 10, 101 + oy, x + 11, 97 + oy, x + 7, 104.5 + oy, x - 3, 105 + oy]);
    ctx.fillStyle = '#4a3530';
    U.ellipse(ctx, x - 13, 109 + oy, 1.3, 1.3);
  }

  function drawFoe(ctx, cx, dt) {
    const stunned = mode === 'open';
    const sway = mode === 'ready' ? Math.sin(clock * 3) * 5 : 0;
    const crouch = mode === 'windup' && dir === 'B' ? 12 : mode === 'strike' ? 8 : 0;
    const fall = mode === 'down' ? (1 - Math.max(0, modeLeft) / END_WAIT) * 260 : 0;
    const lean = stunned ? Math.sin(clock * 5) * 6 : 0;
    const tremble = mode === 'rage' ? Math.sin(clock * 60) * 3 : 0;
    const x = cx + sway + lean + tremble + (jerk > 0 ? (punchSide ? -9 : 9) : 0);
    const oy = crouch + fall;

    if (student) drawStudent(ctx, x, oy, stunned);
    else drawTigress(ctx, x, oy, stunned);

    // 비틀거릴 때 머리 위를 도는 별
    if (stunned) {
      ctx.fillStyle = '#ffe98a';
      for (let i = 0; i < 3; i++) {
        const a = clock * 6 + i * 2.1;
        const sx = x + Math.cos(a) * 34, sy = 36 + oy + Math.sin(a) * 8;
        U.polygon(ctx, [sx, sy - 6, sx + 2, sy - 2, sx + 6, sy, sx + 2, sy + 2, sx, sy + 6, sx - 2, sy + 2, sx - 6, sy, sx - 2, sy - 2]);
      }
    }

    // 두 팔과 발톱. 손은 자세에 맞는 자리로 빠르게 옮겨 간다.
    const want = pose();
    const quick = Math.min(1, dt * (mode === 'strike' ? 30 : 16));
    for (let i = 0; i < 2; i++) {
      for (let k = 0; k < 3; k++) hands[i][k] += (want[i][k] - hands[i][k]) * quick;
      const hx = x + hands[i][0], hy = hands[i][1] + oy, r = hands[i][2];
      ctx.strokeStyle = student ? UNIFORM : SUIT;
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + (i ? 56 : -56), 142 + oy);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      drawHand(ctx, hx, hy, r, mode === 'strike' || stunned || mode === 'down');
    }

    // 휘두른 자국: 발톱은 세 줄, 주먹은 굵은 한 줄
    if (mode === 'strike' && !missed) {
      const marks = student ? 0 : 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = student ? 9 : 3;
      for (let i = -marks; i <= marks; i++) {
        ctx.beginPath();
        ctx.moveTo(150 + i * 26, 40);
        ctx.lineTo(310 + i * 26, 250);
        ctx.stroke();
      }
    }
  }

  // 내 두 주먹: 평소에는 아래 양쪽, 막을 때는 가운데로 모으고, 때릴 때는 앞으로 뻗는다
  function drawFists(ctx, lean) {
    const reach = punch > 0 ? Math.sin((1 - punch / PUNCH_TIME) * Math.PI) : 0;
    for (let i = 0; i < 2; i++) {
      const side = i ? 1 : -1;
      let x = 240 + side * 104 + lean, y = 262, r = 34;
      if (blocking) {
        x = 240 + side * 40 + lean;
        y = 206;
      } else if (punch > 0 && punchSide === i) {
        x += (240 + side * 8 - x) * reach;
        y += (150 - y) * reach;
        r -= 9 * reach;
      }
      ctx.fillStyle = '#b3101f';
      U.polygon(ctx, [x - r * 0.75, y + r * 0.4, x + r * 0.75, y + r * 0.4, 240 + side * 180 + r, H + 40, 240 + side * 180 - r, H + 40]);
      ctx.fillStyle = '#1c1c1f';
      U.ellipse(ctx, x, y, r, r * 0.92);
      ctx.fillStyle = '#34343a';
      for (let k = -1; k <= 1; k++) U.ellipse(ctx, x + k * r * 0.5, y - r * 0.55, r * 0.2, r * 0.14);
    }
  }

  function draw(ctx, dt) {
    const swing = dodge > 0 ? Math.sin((1 - dodge / DODGE_TIME) * Math.PI) : 0;
    const view = dodgeDir * DODGE_SHIFT * swing;  // 내가 옆으로 비킨 만큼 상대는 반대쪽으로 보인다
    const quake = shake > 0 ? (Math.random() - 0.5) * 10 : 0;

    ctx.drawImage(backdrop, -24 - view * 0.25 + quake, -12, W + 48, H + 24);
    ctx.fillStyle = 'rgba(18,14,24,0.5)';
    ctx.fillRect(0, 0, W, H);
    if (raging) {
      ctx.fillStyle = 'rgba(190, 24, 24, ' + (0.16 + Math.sin(clock * 4) * 0.05) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    drawFoe(ctx, 240 - view + quake, dt);
    drawFists(ctx, view * 0.35 + quake);
  }

  // 주먹 전투 중 매 프레임
  function frame(ctx, dt) {
    update(dt);
    if (active) draw(ctx, dt);
  }

  return {
    start,
    busy: () => active,
    frame,
    // 지금 싸움의 상태(상대의 자세와 공격하는 쪽, 두 사람의 체력)
    state: () => ({ mode, dir, hp, hearts, raging, feint: swapLeft > 0 }),
  };
})();
