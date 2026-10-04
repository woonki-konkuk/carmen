window.CS = window.CS || {};

// 회상(튜토리얼): 구역에 처음 도착하면 바일 학교 시절을 떠올리며 그 구역에서 쓸 기술을 연습한다.
// 그림 한 장 위에 선생의 대사가 나오고, 연습은 실제 게임의 화면(손기술 게이지)을 쓰거나 그 그림 위에서 한다(던지기).
// 연습은 벌 없이 될 때까지 다시 하고, 언제든 건너뛸 수 있다.
// 480×270 눈금으로 그리고 두 배 크기로 만든다.
CS.flashback = (function () {
  const save = CS.save, U = CS.util, input = CS.input;
  const W = 480, H = 270, SCALE = 2;
  const BAR = 13;  // 위아래 검은 띠의 두께

  // 구역 순서대로의 수업. steps의 한 칸은 대사({ who, say }), 다른 화면에서 하는 연습({ drill, retry: 실패했을 때의 대사 }),
  // 이 그림 위에서 하는 연습({ play: { start(hud, done), frame(g, dt) } }) 가운데 하나다.
  const LESSONS = [
    {
      when: '회상 · 몇 해 전, 바일 섬의 학교',
      scene: drawDojo,
      teacher: '섀도우산',
      steps: [
        { who: '섀도우산', say: '블랙 쉽. 도둑의 기본은 손끝이다. 저 코트의 주머니에서 지폐를 꺼내 보아라.' },
        { who: '섀도우산', say: '<kbd>Space</kbd>를 누르고 있으면 손이 다가간다. 초록 칸에 왔을 때 떼라. 이르면 닿지 않고, 늦으면 들킨다.' },
        { drill: sleightDrill, retry: '아직이다. 서두르지 말고 손끝에 집중해라. 다시.' },
        { who: '섀도우산', say: '좋다. 하지만 상대가 눈치채면 달아날 것이다. 그때는 <kbd>Shift</kbd>로 뛰어 바짝 붙어라. 닿을 만큼 가까워지면 손은 저절로 나간다.' },
        { who: '섀도우산', say: '물건을 손에 넣었으면 미련 없이 떠나라. 쫓는 자가 나타나면 맞서지 말고, 미리 봐 둔 출구로 달아나는 것이다.' },
        { who: '카르멘', say: '…출구라. 파리에서는 지하철 입구겠지.' },
      ],
    },
    {
      when: '회상 · 몇 해 전, 바일 학교의 체육관',
      scene: () => CS.gym.draw(g, clock),
      teacher: '코치 브런트',
      steps: [
        { who: '코치 브런트', say: '자, 우리 아기 양! 오늘은 던지기란다. 저 허수아비를 세 번 맞혀 보렴.' },
        { who: '코치 브런트', say: '<kbd>A</kbd><kbd>D</kbd>로 옆으로 움직여서 허수아비를 정면에 두고, <kbd>Space</kbd>로 모자를 던지는 거야. 움직이는 놈이니 조금 앞을 노려야지.' },
        { who: '코치 브런트', say: '그동안 나는 공을 던질 거란다. 바닥에 그림자가 보이면 옆으로 비켜. 가만히 서 있는 도둑은 금방 당해.' },
        { play: CS.gym.drill },
        { who: '코치 브런트', say: '잘했어! 싸움은 그런 거란다. 움직이면서 던지고, 던지면서 움직이고.' },
        { who: '카르멘', say: '…움직이면서 던진다. 날아오는 게 종이 표창이라도 마찬가지겠지.' },
      ],
    },
    {
      when: '회상 · 몇 해 전, 바일 학교의 체육관',
      scene: () => CS.gym.spar(g, clock),
      teacher: '코치 브런트',
      steps: [
        { who: '코치 브런트', say: '오늘은 대련이란다, 아기 양. 상대는 시나야.' },
        { who: '시나', say: '흥, 블랙 쉽. 울어도 안 봐줄 거야.' },
        { who: '코치 브런트', say: '시나가 한쪽 주먹을 치켜들면 반대쪽으로 피하렴. <kbd>A</kbd>는 왼쪽, <kbd>D</kbd>는 오른쪽이야. 두 손을 다 들면 <kbd>S</kbd>로 막고.' },
        { who: '코치 브런트', say: '헛치고 비틀거릴 때가 기회란다. 그때 <kbd>Space</kbd>로 때려. 버티고 서 있을 때 친 주먹은 막혀.' },
        { drill: sparDrill, retry: '다시 일어나렴, 아기 양. 주먹이 어느 쪽에서 오는지 끝까지 보고 움직이는 거야.' },
        { who: '코치 브런트', say: '그거야! 잘 피하고, 잘 때렸어.' },
        { who: '시나', say: '…운이 좋았던 거야. 다음엔 안 져.' },
        { who: '카르멘', say: '…다음이라. 그게 오늘이네, 시나. 아니, 이제는 타이거리스지.' },
      ],
    },
  ];
  // 대련의 규칙: 진짜 싸움보다 체력이 적고, 주먹을 오래 치켜들고, 틈이 길다
  const SPAR = { hp: 6, tell: [0.95, 0.8], gap: [0.9, 1.4], open: 1.6 };

  const panel = document.getElementById('flashback');
  panel.innerHTML =
    '<canvas width="' + W * SCALE + '" height="' + H * SCALE + '"></canvas>' +
    '<p class="when"></p>' +
    '<button class="skip">건너뛰기</button>' +
    '<div class="talk"><b></b><p></p><span><kbd>E</kbd>다음</span></div>' +
    '<p class="goal hidden"></p>' +
    '<p class="call"></p>';
  const g = panel.querySelector('canvas').getContext('2d');
  const whenEl = panel.querySelector('.when');
  const talk = panel.querySelector('.talk'), whoEl = talk.querySelector('b'), sayEl = talk.querySelector('p');
  const goalEl = panel.querySelector('.goal'), callEl = panel.querySelector('.call');

  // 주소 끝에 ?lesson=2처럼 적으면 저장과 상관없이 그 수업을 미리 본다. 이때는 저장을 건드리지 않는다.
  const preview = Number(new URLSearchParams(location.search).get('lesson')) || 0;
  const lesson = LESSONS[preview ? preview - 1 : save.data.done] || null;
  let active = false;
  let drilling = false;  // 연습 화면이 떠 있는 동안에는 그쪽이 화면을 쓴다
  let retrying = false;  // 연습에 실패해서 선생의 꾸중을 듣는 중
  let playing = null;    // 이 그림 위에서 하고 있는 연습
  let index = 0;
  let clock = 0;

  // ---------- 연습 ----------

  // 섀도우산의 코트 시험: 손기술 게이지로 코트 주머니의 지폐를 꺼낸다
  function sleightDrill(done) {
    const coat = { coat: '#27304a', pants: '#1d2334' };
    CS.pickpocket.start({ lead: '코트 시험', prize: '지폐', glint: '#9fe0a8', look: coat }, (quality) => done(!!quality));
  }

  // 코치 브런트의 대련: 체육관에서 학생 시절의 타이거리스(본명 시나)와 연습용 규칙으로 주먹 전투를 한다. 져도 벌 없이 다시 한다.
  function sparDrill(done) {
    const backdrop = U.makeCanvas(W, H);
    CS.gym.room(backdrop.getContext('2d'));
    const rival = CS.story.targets.find((t) => t.brawl);
    CS.brawl.start(rival, (result) => done(result === 'won'), { rule: SPAR, backdrop, name: '시나', student: true });
  }

  // ---------- 그림 ----------

  // 섀도우산의 도장: 장지문, 바일의 깃발, 다다미, 시험용 코트, 팔짱을 낀 섀도우산
  function drawDojo() {
    // 벽과 장지문
    g.fillStyle = '#4a3528';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#ecdcb8';
    g.fillRect(18, 36, 284, 156);
    g.fillStyle = 'rgba(255, 244, 210, 0.5)';
    U.polygon(g, [60, 36, 190, 36, 150, 192, 20, 192]);
    g.fillStyle = '#2f211a';
    for (let x = 18; x <= 302; x += 35.5) g.fillRect(x - 1.5, 36, 3, 156);
    for (let y = 36; y <= 192; y += 31.2) g.fillRect(18, y - 1.5, 284, 3);
    g.fillRect(12, 30, 296, 7);

    // 바일의 깃발
    g.fillStyle = '#8f1a22';
    U.polygon(g, [322, 28, 360, 28, 360, 150, 341, 162, 322, 150]);
    g.fillStyle = '#14151a';
    U.polygon(g, [329, 62, 336, 62, 341, 92, 346, 62, 353, 62, 344, 108, 338, 108]);
    g.fillRect(318, 25, 46, 4);

    // 다다미
    g.fillStyle = '#a99758';
    g.fillRect(0, 192, W, H - 192);
    g.fillStyle = '#2f211a';
    g.fillRect(0, 190, W, 4);
    g.strokeStyle = '#6a5c33';
    g.lineWidth = 1.5;
    g.beginPath();
    for (const x of [-140, 20, 160, 300, 440, 600]) {
      g.moveTo(240 + (x - 240) * 0.55, 194);
      g.lineTo(x, H);
    }
    g.moveTo(0, 222);
    g.lineTo(W, 222);
    g.stroke();

    // 옷걸이에 걸린 시험용 코트. 주머니에서 지폐가 살짝 빛난다.
    g.fillStyle = '#2f211a';
    g.fillRect(96, 78, 4, 158);
    g.fillRect(70, 236, 56, 5);
    g.fillRect(72, 90, 52, 4);
    g.fillStyle = '#27304a';
    U.polygon(g, [70, 94, 126, 94, 134, 126, 130, 214, 66, 214, 62, 126]);
    g.fillStyle = '#1d2334';
    U.polygon(g, [98, 94, 106, 94, 102, 214, 96, 214]);
    g.fillRect(108, 166, 17, 2.5);
    g.fillStyle = '#9fe0a8';
    U.ellipse(g, 116.5, 166, 3 + Math.sin(clock * 5) * 0.8, 1.4);

    drawShadowsan();
  }

  // 섀도우산: 짧게 깎은 검은 머리, 창백하고 주름진 굳은 얼굴, 흰 속옷 위에 여민 푸른 옷, 등에 멘 칼
  function drawShadowsan() {
    const SKIN = '#ece5e0', SKIN_SHADE = '#d3c7c5', LINE = '#b3a3a3', INK = '#14151a';
    const GI = '#3b5ba7', GI_DARK = '#2c4688', GI_LIGHT = '#4a6dbd', UNDER = '#f1f1f3';
    const breath = Math.sin(clock * 1.5) * 1;

    g.save();
    g.translate(0, breath);

    // 등에 멘 칼의 자루
    g.strokeStyle = INK;
    g.lineWidth = 7;
    g.lineCap = 'butt';
    g.beginPath();
    g.moveTo(438, 62);
    g.lineTo(416, 128);
    g.stroke();
    g.strokeStyle = '#8fa3d6';
    g.lineWidth = 2;
    for (let t = 0.08; t < 0.6; t += 0.13) {
      g.beginPath();
      g.moveTo(438 - 22 * t - 3.5, 62 + 66 * t - 1);
      g.lineTo(438 - 22 * t + 3.5, 62 + 66 * t + 1.5);
      g.stroke();
    }
    g.fillStyle = '#c9a23b';
    U.polygon(g, [409, 108, 427, 114, 425, 119, 407, 113]);

    // 몸과 흰 속옷
    g.fillStyle = GI;
    U.polygon(g, [302, H, 310, 186, 338, 158, 434, 158, 462, 186, 470, H]);
    g.fillStyle = UNDER;
    U.polygon(g, [364, 158, 408, 158, 386, 206]);
    g.fillStyle = SKIN_SHADE;
    U.polygon(g, [373, 158, 399, 158, 386, 186]);
    // 여민 옷깃
    g.fillStyle = GI_DARK;
    U.polygon(g, [350, 158, 364, 158, 393, 214, 383, 226]);
    U.polygon(g, [422, 158, 408, 158, 379, 214, 389, 226]);
    g.strokeStyle = GI_DARK;
    g.lineWidth = 1.2;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(326, 172);
    g.lineTo(336, 214);
    g.moveTo(446, 172);
    g.lineTo(438, 210);
    g.stroke();

    // 팔짱
    g.fillStyle = GI_LIGHT;
    U.polygon(g, [314, 216, 446, 206, 452, 236, 318, 248]);
    g.fillStyle = GI;
    U.polygon(g, [322, 228, 458, 220, 462, 250, 326, 260]);
    g.fillStyle = SKIN;
    U.ellipse(g, 325, 242, 9, 10);
    U.ellipse(g, 449, 220, 9, 10);

    // 목, 귀, 긴 얼굴
    g.fillStyle = SKIN_SHADE;
    g.fillRect(373, 132, 26, 30);
    g.fillStyle = SKIN;
    U.ellipse(g, 358.5, 119, 4, 7.5);
    U.ellipse(g, 413.5, 119, 4, 7.5);
    U.polygon(g, [362, 86, 410, 86, 413, 124, 404, 146, 386, 154, 368, 146, 359, 124]);
    g.fillStyle = SKIN_SHADE;
    U.ellipse(g, 358.5, 120, 1.6, 4);
    U.ellipse(g, 413.5, 120, 1.6, 4);

    // 머리: 짧게 깎아 이마 선이 반듯하다
    g.fillStyle = INK;
    U.polygon(g, [358, 110, 359, 84, 366, 75, 406, 75, 413, 84, 414, 110, 409, 96, 404, 88, 368, 88, 363, 96]);

    // 주름: 이마, 눈 밑, 볼, 입가
    g.strokeStyle = LINE;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(374, 93);
    g.lineTo(398, 93);
    g.moveTo(377, 98);
    g.lineTo(395, 98);
    g.moveTo(367, 126);
    g.lineTo(377, 127.5);
    g.moveTo(405, 126);
    g.lineTo(395, 127.5);
    g.moveTo(364, 124);
    g.quadraticCurveTo(364, 134, 369, 141);
    g.moveTo(408, 124);
    g.quadraticCurveTo(408, 134, 403, 141);
    g.moveTo(380, 131);
    g.quadraticCurveTo(375, 137, 375, 145);
    g.moveTo(392, 131);
    g.quadraticCurveTo(397, 137, 397, 145);
    g.stroke();

    // 눈썹과 눈
    g.fillStyle = INK;
    U.polygon(g, [364, 106, 382, 111.5, 382, 115.5, 363, 110.5]);
    U.polygon(g, [408, 106, 390, 111.5, 390, 115.5, 409, 110.5]);
    const shut = clock % 5 < 0.13;
    for (const x of [366, 393]) {
      g.fillStyle = INK;
      g.fillRect(x, 118, 13, 1.6);
      if (shut) continue;
      g.fillStyle = '#fff';
      U.polygon(g, [x + 0.5, 119.6, x + 12.5, 119.6, x + 11, 123, x + 2, 123]);
      g.fillStyle = INK;
      U.ellipse(g, x + 6.5, 121, 2.3, 2);
    }

    // 코와 굳게 다문 입
    g.strokeStyle = SKIN_SHADE;
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(383, 117);
    g.lineTo(381.5, 131);
    g.lineTo(386, 133);
    g.lineTo(390.5, 131);
    g.stroke();
    g.strokeStyle = '#7a6462';
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(376, 143);
    g.quadraticCurveTo(386, 138.5, 396, 143);
    g.stroke();
    g.strokeStyle = LINE;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(381, 147.5);
    g.lineTo(391, 147.5);
    g.stroke();

    g.restore();
  }

  // 지난 일처럼 보이게: 누런 빛, 어두운 가장자리, 위아래 검은 띠. 연습 중에는 잘 보이게 가장자리를 덜 어둡게 한다.
  function drawMemory() {
    g.fillStyle = 'rgba(150, 100, 40, 0.16)';
    g.fillRect(0, 0, W, H);
    const edge = g.createRadialGradient(W / 2, H / 2, 110, W / 2, H / 2, 300);
    edge.addColorStop(0, 'rgba(20, 10, 4, 0)');
    edge.addColorStop(1, 'rgba(20, 10, 4, ' + (playing ? 0.3 : 0.72) + ')');
    g.fillStyle = edge;
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#0b0a0a';
    g.fillRect(0, 0, W, BAR);
    g.fillRect(0, H - BAR, W, BAR);
  }

  // ---------- 진행 ----------

  // 지금 칸을 화면에 옮긴다. 연습 칸이면 연습 화면을 연다.
  function show() {
    const step = lesson.steps[index];
    if (!step) return finish();
    if (step.drill && !retrying) return startDrill(step);
    if (step.play) return startPlay(step);
    whoEl.textContent = step.drill ? lesson.teacher : step.who;
    sayEl.innerHTML = step.drill ? step.retry : step.say;
    talk.classList.toggle('me', !step.drill && step.who === '카르멘');
  }

  function startDrill(step) {
    drilling = true;
    panel.classList.add('hidden');
    step.drill((passed) => {
      drilling = false;
      panel.classList.remove('hidden');
      retrying = !passed;
      if (passed) index++;
      show();
    });
  }

  // 이 그림 위에서 하는 연습을 연다. 대사 칸은 감추고 할 일과 결과 글을 띄운다.
  function startPlay(step) {
    playing = step.play;
    talk.classList.add('hidden');
    whenEl.classList.add('hidden');
    goalEl.classList.remove('hidden');
    playing.start({ goal: (html) => { goalEl.innerHTML = html; }, call }, () => {
      endPlay();
      index++;
      show();
    });
  }

  function endPlay() {
    playing = null;
    talk.classList.remove('hidden');
    whenEl.classList.remove('hidden');
    goalEl.classList.add('hidden');
    callEl.className = 'call';
  }

  // "명중!" 같은 글을 잠깐 띄운다
  function call(text, kind) {
    callEl.textContent = text;
    callEl.className = 'call';
    void callEl.offsetWidth;  // 나타나는 움직임을 처음부터 다시 틀게 한다
    callEl.className = 'call on ' + kind;
  }

  function next() {
    if (playing) return;
    CS.sound.play('ui');
    if (retrying) retrying = false;  // 꾸중을 들었으니 같은 연습을 다시 한다
    else index++;
    show();
  }

  // 회상을 끝낸다(다 봤거나 건너뛰었다). 다시 나오지 않게 적어 두고 거리로 나간다.
  function finish() {
    if (playing) endPlay();
    active = false;
    panel.classList.add('hidden');
    if (preview) {
      history.replaceState(null, '', location.pathname);  // 새로 열릴 때 미리 보기가 또 나오지 않게
    } else {
      save.data.lessons = save.data.done + 1;
      save.commit();
    }
    CS.travel.arrive();
  }

  function start() {
    active = true;
    index = clock = 0;
    retrying = false;
    whenEl.textContent = lesson.when;
    panel.classList.remove('hidden');
    show();
  }

  // 회상이 떠 있는 동안 매 프레임
  function frame(ctx, dt) {
    clock += dt;
    g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    if (playing) playing.frame(g, dt);
    else lesson.scene();
    drawMemory();
    if (clock > 0.3 && (input.consume('KeyE') || input.consume('Enter'))) next();
  }

  talk.addEventListener('click', next);
  panel.querySelector('.skip').addEventListener('click', finish);

  // 이 구역의 수업을 아직 듣지 않았으면 회상을 띄운다
  if (lesson && (preview || save.data.lessons <= save.data.done)) start();

  return {
    busy: () => active && !drilling,
    frame,
    // 회상이 이어지는 중인가(다른 화면에서 연습하는 동안도 포함)
    active: () => active,
  };
})();
