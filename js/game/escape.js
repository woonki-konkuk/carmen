window.CS = window.CS || {};

// 도망: 보석을 되찾으면 ACME 형사가 눈앞에 나타나 쫓아온다. 붙잡히기 전에 지하철 입구 계단까지 가면 성공.
CS.escape = (function () {
  const S = CS.sprites, scenes = CS.scenes, T = CS.textures;
  const cop = CS.story.detective;
  const nodes = CS.district.streets.nodes;
  const frames = S.personFrames(cop.look);
  const halt = S.person(cop.look, false, 0, 'wallA');  // 등장 장면: 두 손을 들고 "거기 서!"

  const SPAWN_NEAR = 6, SPAWN_FAR = 14;  // 형사는 내가 볼 수 있는, 이 거리(칸) 사이의 갈림길에 나타난다
  const SPAWN_BEST = 9;                  // 그중 이 거리에 가장 가까운 곳
  const SPAWN_TURN = 2;                  // 고개를 많이 돌려야 보이는 곳일수록 덜 고른다(라디안당 칸)
  const SPAWN_BLOCK = 6;                 // 지하철 입구로 가는 쪽을 막는 곳은 이만큼(칸) 덜 고른다
  // 등장 장면: 형사 쪽으로 고개를 돌리며 당겨 보고, 잠깐 머문 뒤 되돌아온다(초)
  const ZOOM_IN = 0.5, HOLD = 1.3, ZOOM_OUT = 0.4;
  const ZOOM = 4.5;         // 당겨 보는 배율
  const TURN_RATE = 8;      // 고개를 돌리는 빠르기
  const SPEED = 4;          // 형사의 빠르기(칸/초). 내가 뛰는 빠르기(5)보다 느리게 시작해서
  const SPEED_GAIN = 0.02;  // 초마다 이만큼 빨라지고
  const SPEED_MAX = 4.9;    // 여기까지 빨라진다
  const CATCH = 0.9;        // 이 거리(칸) 안으로 붙으면 붙잡힌다
  const REPATH = 0.3;       // 내가 안 보일 때 길을 다시 찾는 간격(초)
  const CLOSE = 4;          // 이 거리(칸) 안이면 거리 표시가 빨개진다
  const METER = 3;          // 한 칸은 약 3미터

  // 갈림길 사이의 가장 짧은 거리(far)와, 그리로 가려면 먼저 갈 갈림길(hop)
  const N = nodes.length;
  const far = nodes.map(() => new Array(N).fill(Infinity));
  const hop = nodes.map(() => new Array(N).fill(-1));
  for (let i = 0; i < N; i++) {
    far[i][i] = 0;
    hop[i][i] = i;
  }
  for (const [a, b] of CS.district.streets.edges) {
    far[a][b] = far[b][a] = Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]);
    hop[a][b] = b;
    hop[b][a] = a;
  }
  for (let k = 0; k < N; k++) {
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (far[i][k] + far[k][j] < far[i][j]) {
          far[i][j] = far[i][k] + far[k][j];
          hop[i][j] = hop[i][k];
        }
      }
    }
  }

  const body = { x: 0, y: 0, img: frames.front[0], w: S.PERSON_W, h: S.PERSON_H, hidden: true };
  const mark = { x: 0, y: 0, img: scenes.alertMark, w: 0.18, h: 0.18, lift: 0.66, hidden: true };
  // 지하철 입구 위에 떠 있는 초록 화살표
  const goal = { x: 0, y: 0, img: scenes.goalMark, w: 0.4, h: 0.4, lift: 1.5, hidden: true };

  const hud = document.getElementById('chase');
  const banner = document.getElementById('banner');
  banner.innerHTML = cop.name + '가 쫓아옵니다!<br><small>지하철 입구로 달아나세요</small>';

  let state = 'off';  // off → pending(다음 프레임에 형사가 나타남) → intro(등장 장면) → on(쫓아옴)
  let onEnd = null;   // 끝났을 때 부를 함수. 'escaped'나 'caught'를 넘긴다.
  let clock = 0;      // intro: 장면이 흐른 시간 / on: 쫓아온 시간(초)
  let route = [];     // 내가 안 보일 때 따라갈 갈림길들
  let repath = 0;

  function place(x, y) {
    body.x = mark.x = x;
    body.y = mark.y = y;
  }

  function show(visible) {
    body.hidden = mark.hidden = goal.hidden = !visible;
  }

  // a에서 b로 고개를 돌리는 각도(-π~π)
  function turnTo(a, b) {
    return Math.atan2(Math.sin(b - a), Math.cos(b - a));
  }

  function start(done) {
    state = 'pending';
    onEnd = done;
  }

  // 내 눈에 보이는 갈림길 가운데, 되도록 정면이고 지하철 가는 쪽을 막지 않는 곳에 나타난다
  function spawn(world, player) {
    const metro = world.props.find((p) => p.kind === 'metro');
    goal.x = Math.floor(metro.x) + 0.5;
    goal.y = Math.floor(metro.y) + 0.5;
    const toMetro = Math.atan2(goal.y - player.y, goal.x - player.x);

    let best = -1, bestScore = Infinity, farthest = 0;
    nodes.forEach((n, i) => {
      const dist = Math.hypot(n[0] - player.x, n[1] - player.y);
      if (dist > Math.hypot(nodes[farthest][0] - player.x, nodes[farthest][1] - player.y)) farthest = i;
      if (dist < SPAWN_NEAR || dist > SPAWN_FAR || !world.clear(player.x, player.y, n[0], n[1])) return;
      const bearing = Math.atan2(n[1] - player.y, n[0] - player.x);
      let score = Math.abs(dist - SPAWN_BEST) + Math.abs(turnTo(player.a, bearing)) * SPAWN_TURN;
      if (Math.abs(turnTo(toMetro, bearing)) < Math.PI / 4) score += SPAWN_BLOCK;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    });
    // 보이는 갈림길이 없으면 가장 먼 갈림길에 나타난다
    if (best < 0) best = farthest;
    place(nodes[best][0], nodes[best][1]);

    state = 'intro';
    clock = 0;
    route = [];
    body.img = halt;
    show(true);
    banner.classList.remove('hidden');
    CS.sound.play('siren');
  }

  // 등장 장면: 시선이 형사에게 돌아가며 당겨졌다가 되돌아온다
  function intro(player, dt) {
    clock += dt;
    const aim = Math.atan2(body.y - player.y, body.x - player.x);
    player.a += turnTo(player.a, aim) * Math.min(1, dt * TURN_RATE);

    let pull = 1;
    if (clock < ZOOM_IN) pull = clock / ZOOM_IN;
    else if (clock > ZOOM_IN + HOLD) pull = 1 - (clock - ZOOM_IN - HOLD) / ZOOM_OUT;
    pull = Math.max(0, pull);
    player.zoom = 1 + (ZOOM - 1) * pull * pull * (3 - 2 * pull);

    if (clock >= ZOOM_IN + HOLD + ZOOM_OUT) {
      player.zoom = 1;
      state = 'on';
      clock = repath = 0;
      banner.classList.add('hidden');
    }
  }

  function end(result) {
    state = 'off';
    show(false);
    CS.sound.play(result === 'escaped' ? 'escape' : 'caught');
    hud.classList.add('hidden');
    onEnd(result);
  }

  // (x, y)에서 곧게 보이는 갈림길들. 하나도 없으면 가장 가까운 갈림길.
  function seen(world, x, y) {
    const list = [];
    let near = 0;
    nodes.forEach((n, i) => {
      if (world.clear(x, y, n[0], n[1])) list.push(i);
      if (Math.hypot(n[0] - x, n[1] - y) < Math.hypot(nodes[near][0] - x, nodes[near][1] - y)) near = i;
    });
    return list.length ? list : [near];
  }

  // 형사에게서 나에게 이르는 가장 짧은 길(갈림길 번호들)
  function plan(world, player) {
    let best = null, bestDist = Infinity;
    for (const s of seen(world, body.x, body.y)) {
      for (const g of seen(world, player.x, player.y)) {
        const dist = Math.hypot(nodes[s][0] - body.x, nodes[s][1] - body.y) + far[s][g] +
          Math.hypot(nodes[g][0] - player.x, nodes[g][1] - player.y);
        if (dist < bestDist) {
          bestDist = dist;
          best = [s, g];
        }
      }
    }
    const path = [best[0]];
    while (path[path.length - 1] !== best[1]) path.push(hop[path[path.length - 1]][best[1]]);
    return path;
  }

  // 지하철 입구가 내 시선에서 어느 쪽인지
  function arrowTo(player) {
    const turn = turnTo(player.a, Math.atan2(goal.y - player.y, goal.x - player.x));
    if (Math.abs(turn) < Math.PI / 4) return '↑';
    if (Math.abs(turn) > Math.PI * 3 / 4) return '↓';
    return turn > 0 ? '→' : '←';
  }

  // 걷는 동안 매 프레임
  function walkFrame(world, player, dt) {
    if (state === 'off') return;
    if (state === 'pending') spawn(world, player);
    if (state === 'intro') return intro(player, dt);

    clock += dt;

    // 내가 보이면 곧장 달려오고, 안 보이면 길을 따라 온다
    let tx = player.x, ty = player.y;
    if (!world.clear(body.x, body.y, player.x, player.y)) {
      repath -= dt;
      if (repath <= 0 || !route.length) {
        route = plan(world, player);
        repath = REPATH;
      }
      while (route.length > 1 && Math.hypot(nodes[route[0]][0] - body.x, nodes[route[0]][1] - body.y) < 0.2) route.shift();
      tx = nodes[route[0]][0];
      ty = nodes[route[0]][1];
    } else {
      route = [];
    }

    const dx = tx - body.x, dy = ty - body.y;
    const gap = Math.hypot(dx, dy) || 0.001;
    const step = Math.min(gap, Math.min(SPEED_MAX, SPEED + clock * SPEED_GAIN) * dt);
    place(body.x + dx / gap * step, body.y + dy / gap * step);

    const px = player.x - body.x, py = player.y - body.y;
    const dist = Math.hypot(px, py);
    body.img = (dx * px + dy * py > 0 ? frames.front : frames.back)[((clock * 9) | 0) & 1];
    goal.lift = 1.5 + Math.sin(clock * 4) * 0.08;

    if (dist < CATCH) return end('caught');
    const floor = world.floors[Math.floor(player.y) * world.w + Math.floor(player.x)];
    if (floor === T.METRO_H || floor === T.METRO_V) return end('escaped');

    hud.classList.remove('hidden');
    hud.classList.toggle('warn', dist < CLOSE);
    hud.textContent = '형사 ' + Math.round(dist * METER) + ' m · 지하철 ' + arrowTo(player) + ' ' +
      Math.round(Math.hypot(goal.x - player.x, goal.y - player.y) * METER) + ' m';
  }

  return {
    sprites: [body, mark, goal],
    start,
    walkFrame,
    // 형사가 나타나는 장면이 나오는 중인가. 그동안은 움직일 수 없다.
    showing: () => state === 'pending' || state === 'intro',
  };
})();
