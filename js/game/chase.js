window.CS = window.CS || {};

// 추격전: 표적에게 다가가면 달아난다. 길을 따라 쫓아가 바짝 붙으면 붙잡고 소매치기를 한다.
// 싸우는 표적은 달아나는 대신 전투를 건다: 표창 전투(story.js의 fight → fight.js), 주먹 전투(brawl → brawl.js).
// 보석을 되찾으면 형사에게서 달아나는 도망(escape.js)으로 넘어간다.
CS.chase = (function () {
  const S = CS.sprites, scenes = CS.scenes, save = CS.save, josa = CS.util.josa;
  const target = CS.story.target;
  const finished = save.data.done >= CS.story.targets.length;  // 임무를 모두 끝냈는가
  const nodes = CS.district.streets.nodes;
  const frames = S.personFrames(target.look);
  const size = S.personSize(target.look);
  // 서 있을 때의 마임(마임을 하는 표적만): 보이지 않는 벽을 짚다가 보이지 않는 줄을 당긴다
  const MIME = ['wallA', 'wallB', 'wallA', 'wallB', 'wallA', 'wallB', 'ropeA', 'ropeB', 'ropeA', 'ropeB', 'ropeA', 'ropeB'];
  const MIME_BEAT = 0.4;   // 한 동작의 길이(초)
  const mime = {};
  for (const pose of MIME) mime[pose] = mime[pose] || S.person(target.look, false, 0, pose);

  // 이 거리(칸) 안에서 눈에 띄면 표적이 알아챈다. 걸어서 다가가면 더 가까이 갈 수 있다.
  const NOTICE_WALK = 3.5, NOTICE_RUN = 7;
  const ALERT_TIME = 0.4;  // 알아채고 달아나기까지(초)
  // 달아나는 빠르기(칸/초). 처음엔 내가 뛰는 빠르기(5)보다 빨라 거리를 벌리고, 지칠수록 느려진다.
  const [SPEED_FRESH, SPEED_TIRED] = target.speed;
  const TIRE_TIME = 20;    // 다 지치기까지(초)
  const CATCH = 1.1;       // 이 거리(칸) 안으로 붙으면 붙잡는다
  const FAIL_HEAT = 20;    // 소매치기에 실패했을 때 오르는 추격 게이지
  const LOSE_HEAT = 25;    // 전투에서 쓰러졌을 때 오르는 추격 게이지
  const CAUGHT_HEAT = 25;  // 보석을 들고 달아나다 형사에게 붙잡혔을 때 오르는 추격 게이지
  const STUN = 1.2;        // 실패하면 이만큼(초) 비틀거려 못 걷는다
  const GRACE = 2.5;       // 뿌리치고 달아난 뒤 이만큼(초)은 다시 붙잡히지 않는다
  const RECOVER = 10;      // 뿌리치고 달아날 때 지친 정도가 이만큼(초) 되돌아간다
  const BLOCK_AHEAD = 4;   // 달아나는 길 앞쪽 이 거리(칸) 안에 내가 있으면 그 길로 가지 않는다
  const BLOCK_SIDE = 2;    // 길에서 옆으로 이만큼(칸) 안에 있어야 길을 막은 것으로 친다
  const LOSE_DIST = 14;    // 이보다 멀어지거나 안 보이는 채로
  const LOSE_TIME = 6;     // 이만큼(초) 지나면 놓친다
  const LOSE_WARN = 2;
  const START_REACH = 14;  // 처음 달아날 때 이 거리(칸) 안의 갈림길로 뛴다
  const REST = 8;          // 임무가 끝나고 표적이 다시 나를 알아채기까지(초)
  const METER = 3;         // 한 칸은 약 3미터

  // 갈림길마다 곧게 이어진 갈림길들
  const links = nodes.map(() => []);
  for (const [a, b] of CS.district.streets.edges) {
    links[a].push(b);
    links[b].push(a);
  }

  const body = {
    x: target.spot[0], y: target.spot[1],
    img: frames.front[0],
    w: size.w, h: size.h, solid: true,
  };
  // 머리 위 표시: 평소엔 빨간 세모, 나를 알아챈 순간엔 "!"
  const mark = { x: body.x, y: body.y, img: scenes.targetMark, w: 0.16, h: 0.16, lift: size.h + 0.06 };

  const hud = document.getElementById('chase');

  // 임무를 모두 끝냈으면 표적은 나타나지 않는다
  if (finished) body.hidden = mark.hidden = true;

  // idle(서 있음) → alert(알아챔) → flee(달아남) → held(붙잡힘) → escape(형사에게 쫓김) → done(임무 끝)
  // alert 다음에 얼굴 컷(intro)이 지나간다. 싸우는 표적은 그다음이 fight(전투)이고, 이기면 escape로 간다.
  let stage = finished ? 'done' : 'idle';
  let timer = 0;
  let from = -1, to = -1;  // 지금 뛰는 길의 두 끝 갈림길. 처음 달아날 때는 from이 없다(-1).
  let dirX = 1, dirY = 0;
  let lostFor = 0;
  let clock = 0;           // 달아난 시간(초)
  let stun = 0;            // 내가 비틀거리는 남은 시간(초)
  let grace = 0;           // 다시 붙잡히지 않는 남은 시간(초)
  let idleClock = 0;       // 서서 마임한 시간(초)
  let calm = 0;            // 서 있어도 나를 알아채지 못하는 남은 시간(초)

  function place(x, y) {
    body.x = mark.x = x;
    body.y = mark.y = y;
  }

  function reset() {
    stage = 'idle';
    stun = grace = 0;
    body.hidden = mark.hidden = false;
    place(target.spot[0], target.spot[1]);
    body.img = frames.front[0];
    mark.img = scenes.targetMark;
    hud.classList.add('hidden');
  }

  // (x, y)에서 갈림길 n으로 가는 길을 내가 막고 있는가
  function blocked(x, y, n, player) {
    const ex = nodes[n][0] - x, ey = nodes[n][1] - y;
    const len = Math.hypot(ex, ey) || 0.001;
    const px = player.x - x, py = player.y - y;
    const ahead = (px * ex + py * ey) / len;
    const side = Math.abs(px * ey - py * ex) / len;
    return ahead > 0 && ahead < Math.min(len, BLOCK_AHEAD) + 1 && side < BLOCK_SIDE;
  }

  // 갈 수 있는 갈림길 중 나에게서 가장 멀어지는 곳. 방금 지나온 곳은 되도록 피한다.
  function pick(x, y, options, came, player) {
    let best = -1, bestScore = -Infinity;
    for (const n of options) {
      let score = Math.hypot(nodes[n][0] - player.x, nodes[n][1] - player.y);
      if (n === came) score -= 4;
      if (blocked(x, y, n, player)) score -= 100;
      if (score > bestScore) {
        bestScore = score;
        best = n;
      }
    }
    return best;
  }

  // 길 한가운데(갈림길이 아닌 곳)에서 뛸 곳을 고른다: 곧게 갈 수 있는 갈림길 중에서.
  function pickFromHere(world, player) {
    const options = [];
    nodes.forEach((n, i) => {
      if (Math.hypot(n[0] - body.x, n[1] - body.y) < START_REACH && world.clear(body.x, body.y, n[0], n[1])) options.push(i);
    });
    from = -1;
    to = pick(body.x, body.y, options, -1, player);
  }

  function startFleeing(world, player) {
    stage = 'flee';
    lostFor = clock = 0;
    mark.img = scenes.targetMark;
    pickFromHere(world, player);
  }

  function run(world, player, dt) {
    // 가던 길 앞을 내가 막으면 되돌아선다
    if (blocked(body.x, body.y, to, player)) {
      if (from >= 0) {
        const turn = from;
        from = to;
        to = turn;
      } else {
        pickFromHere(world, player);
      }
    }

    const tired = Math.min(1, clock / TIRE_TIME);
    let step = (SPEED_FRESH + (SPEED_TIRED - SPEED_FRESH) * tired) * dt;
    while (step > 0) {
      const dx = nodes[to][0] - body.x, dy = nodes[to][1] - body.y;
      const dist = Math.hypot(dx, dy);
      if (dist > step) {
        dirX = dx / dist;
        dirY = dy / dist;
        place(body.x + dirX * step, body.y + dirY * step);
        break;
      }
      // 갈림길에 닿았다. 다음 길을 고른다.
      place(nodes[to][0], nodes[to][1]);
      step -= dist;
      const next = pick(body.x, body.y, links[to], from, player);
      from = to;
      to = next;
    }
  }

  // 붙잡았다. 소매치기를 하고, 실패하면 표적이 뿌리치고 다시 달아난다.
  function grab() {
    stage = 'held';
    hud.classList.add('hidden');
    CS.pickpocket.start({ lead: '붙잡았다!', prize: '보석', glint: target.color, look: target.look }, (quality) => {
      if (quality) {
        gotJewel(target.name + '의 주머니에서 「' + target.item + '」을 꺼냈습니다.');
      } else {
        stage = 'flee';
        stun = STUN;
        grace = GRACE;
        clock = Math.max(0, clock - RECOVER);
        CS.heat.add(FAIL_HEAT, josa(target.name, '이', '가') + ' 뿌리치고 달아납니다');
      }
    });
  }

  // 보석을 손에 넣었다. 표적은 사라지고 형사가 나타난다.
  function gotJewel(text) {
    stage = 'escape';
    body.hidden = mark.hidden = true;
    CS.sound.play('jewel');
    CS.notice.show('보석을 되찾았다',
      '<p>' + text + '</p>' +
      '<p>ACME가 냄새를 맡았습니다. 지하철 입구로 빠져나가세요.</p>',
      () => CS.escape.start(escaped));
  }

  // 전투가 끝났다. 이겼으면 보석을 바로 얻는다. 졌거나 멀리 달아났으면 표적이 제자리로 돌아가고,
  // 진 것이면 나는 구역에 처음 도착한 자리에서 깨어난다.
  function fought(result) {
    if (result === 'won') {
      gotJewel('쓰러진 ' + target.name + '에게서 「' + target.item + '」을 챙겼습니다.');
      return;
    }
    reset();
    calm = REST;
    if (result === 'lost') knockedOut();
  }

  // 전투에서 쓰러졌다. 화면이 어두워졌다가 구역에 처음 도착한 자리에서 깨어나고, 추격 게이지가 오른다.
  function knockedOut() {
    CS.notice.show('쓰러졌다',
      '<p>' + target.name + '에게 당했습니다.</p>' +
      '<p>정신을 차려 보니 이 구역에 처음 도착한 자리입니다. ' + josa(target.name, '은', '는') + ' 제자리로 돌아갔습니다.</p>',
      () => {
        Object.assign(CS.player, CS.district.start);
        CS.travel.wake();
        CS.heat.add(LOSE_HEAT, '전투에서 졌습니다');
      });
  }

  // 도망이 끝났다. 빠져나갔으면 보석 장면 뒤 다음 구역으로 가고, 붙잡혔으면 표적이 제자리로 돌아와 다시 해야 한다.
  function escaped(result) {
    if (result === 'escaped') {
      stage = 'done';
      CS.phone.deliver(target.won);
      CS.travel.depart(target);
    } else {
      CS.notice.show('형사에게 붙잡혔다',
        '<p>' + CS.story.detective.name + '에게 보석을 빼앗겼습니다.</p>' +
        '<p>그 틈에 ' + josa(target.name, '이', '가') + ' 보석을 다시 챙겨 달아났습니다.</p>',
        () => CS.heat.add(CAUGHT_HEAT, '형사에게 붙잡혔습니다'));
      reset();
      calm = REST;
    }
  }

  function lost() {
    CS.sound.play('bad');
    CS.notice.show('놓쳤다',
      '<p>' + josa(target.name, '이', '가') + ' 보이지 않습니다.</p>' +
      '<p>처음 있던 자리로 돌아갔습니다.</p>');
    reset();
  }

  // 걷는 동안 매 프레임
  function walkFrame(world, player, dt) {
    const dx = player.x - body.x, dy = player.y - body.y;
    const dist = Math.hypot(dx, dy) || 0.001;
    const inView = world.clear(body.x, body.y, player.x, player.y);

    stun = Math.max(0, stun - dt);
    grace = Math.max(0, grace - dt);

    if (stage === 'escape' || stage === 'done' || stage === 'fight' || stage === 'intro') return;

    if (stage === 'idle') {
      idleClock += dt;
      calm = Math.max(0, calm - dt);
      body.img = target.mime ? mime[MIME[((idleClock / MIME_BEAT) | 0) % MIME.length]] : frames.front[0];
      if (calm <= 0 && dist < (player.running ? NOTICE_RUN : NOTICE_WALK) && inView) {
        stage = 'alert';
        timer = ALERT_TIME;
        CS.sound.play('alert');
        mark.img = scenes.alertMark;
        body.img = frames.front[0];
      }
      return;
    }
    if (stage === 'alert') {
      timer -= dt;
      if (timer > 0) return;
      // 얼굴을 크게 보여 주는 컷이 지나간 뒤 싸우거나 달아난다
      mark.img = scenes.targetMark;
      if (target.brawl) {
        stage = 'fight';
        CS.cutin.show(target, () => CS.brawl.start(target, fought));
      } else if (target.fight) {
        stage = 'fight';
        CS.cutin.show(target, () => CS.fight.start({ body, mark, frames, target, done: fought }));
      } else {
        stage = 'intro';
        CS.cutin.show(target, () => startFleeing(world, player));
      }
      return;
    }

    clock += dt;
    run(world, player, dt);

    // 나를 향해 뛰어오면 앞모습, 멀어지면 뒷모습
    const toward = dirX * (player.x - body.x) + dirY * (player.y - body.y) > 0;
    body.img = (toward ? frames.front : frames.back)[((clock * 9) | 0) & 1];

    if (dist > LOSE_DIST || !inView) lostFor += dt;
    else lostFor = Math.max(0, lostFor - dt * 2);
    if (lostFor > LOSE_TIME) return lost();

    const losing = lostFor > LOSE_WARN;
    hud.classList.remove('hidden');
    hud.classList.toggle('warn', losing);
    hud.textContent = (losing ? '멀어지고 있다!' : '추격 중') + ' · ' + Math.round(dist * METER) + ' m';

    if (dist < CATCH && grace <= 0) grab();
  }

  return {
    sprites: [body, mark],
    body,
    walkFrame,
    // 소매치기에 실패해 비틀거리는 동안에는 걸을 수 없다
    stunned: () => stun > 0,
    // 한가로이 걸어도 되는 때인가(표적이 가만히 있거나, 임무를 다 끝냈다)
    quiet: () => stage === 'idle' || stage === 'done',
  };
})();
