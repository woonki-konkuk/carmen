(function () {
  const WALK = 2.8;      // 걷는 속도(칸/초)
  const RUN = 5;
  const TURN = 2.4;      // 방향키 회전(라디안/초)
  const MOUSE = 0.0025;  // 마우스 1픽셀당 회전(라디안)
  const RADIUS = 0.25;   // 벽과 유지하는 거리(칸)
  const PROP_GAP = 0.35; // 가로등·나무·서 있는 사람과 유지하는 거리(칸)
  const CITIZENS = 20;
  const STEP = 1.3;      // 이만큼(칸) 걸을 때마다 발소리가 난다

  const world = CS.world.load(CS.district.rows);
  const player = Object.assign({ bob: 0, running: false }, CS.district.start);
  let stride = 0;
  let walked = 0;        // 지난 발소리 뒤로 걸은 거리(칸)

  const props = world.props.map((p) => Object.assign({ x: p.x, y: p.y }, CS.sprites[p.kind]));
  const citizens = CS.npc.spawn(world, CITIZENS, 5);
  const landmarks = CS.district.landmarks.map((m) => Object.assign({ x: m.x, y: m.y }, CS.sprites[m.kind]));
  const sprites = props.concat(landmarks, citizens, CS.chase.sprites, CS.fight.sprites, CS.escape.sprites);
  const solids = sprites.filter((s) => s.solid);  // 몸으로 막히는 것: 가로등, 나무, 서 있는 사람
  const OVERLAYS = [CS.ending, CS.jail, CS.title, CS.flashback, CS.travel, CS.cutin, CS.notice, CS.brawl, CS.pickpocket, CS.tourism, CS.phone];

  // 시작 화면도 회상도 엔딩도 없으면 바로 구역 이름이 뜬 검은 화면이 걷힌다
  if (!OVERLAYS.some((o) => o.busy())) CS.travel.arrive();

  const canvas = document.getElementById('view');
  const ctx = canvas.getContext('2d');
  const hint = document.getElementById('hint');
  const screen = document.getElementById('screen');
  const input = CS.input;

  function blocked(x, y) {
    return world.cell(Math.floor(x), Math.floor(y)) !== 0;
  }

  function hitsProp(x, y) {
    for (const p of solids) {
      const dx = x - p.x, dy = y - p.y;
      const gap = p.gap || PROP_GAP;
      if (dx * dx + dy * dy < gap * gap) return true;
    }
    return false;
  }

  // 가로·세로를 따로 움직여 벽에 닿으면 벽을 타고 미끄러진다.
  function move(dx, dy) {
    const nx = player.x + dx;
    const edgeX = nx + Math.sign(dx) * RADIUS;
    if (!blocked(edgeX, player.y - RADIUS) && !blocked(edgeX, player.y + RADIUS) &&
        !hitsProp(nx, player.y)) player.x = nx;

    const ny = player.y + dy;
    const edgeY = ny + Math.sign(dy) * RADIUS;
    if (!blocked(player.x - RADIUS, edgeY) && !blocked(player.x + RADIUS, edgeY) &&
        !hitsProp(player.x, ny)) player.y = ny;
  }

  function update(dt) {
    // 형사가 나타나는 장면 동안에는 시선이 형사에게 고정된다
    const look = input.takeLook();
    if (CS.escape.showing()) return;

    player.a += look * MOUSE;
    if (input.isDown('ArrowLeft')) player.a -= TURN * dt;
    if (input.isDown('ArrowRight')) player.a += TURN * dt;

    let fwd = 0, side = 0;
    if (input.isDown('KeyW') || input.isDown('ArrowUp')) fwd += 1;
    if (input.isDown('KeyS') || input.isDown('ArrowDown')) fwd -= 1;
    if (input.isDown('KeyD')) side += 1;
    if (input.isDown('KeyA')) side -= 1;

    if (CS.chase.stunned()) fwd = side = 0;

    player.running = false;
    if (fwd || side) {
      const running = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
      player.running = running;
      const dist = (running ? RUN : WALK) * dt;
      const len = Math.hypot(fwd, side);
      const cos = Math.cos(player.a), sin = Math.sin(player.a);
      move((cos * fwd - sin * side) / len * dist, (sin * fwd + cos * side) / len * dist);

      // 걸을 때 화면이 살짝 흔들린다
      stride += dist * 5;
      walked += dist;
      if (walked >= STEP) {
        walked -= STEP;
        CS.sound.play('step');
      }
      player.bob = Math.sin(stride) * 1.5;
    } else {
      player.bob *= 0.85;
    }
  }

  // 지금 어울리는 배경음악. 보석 장면에서는 음악을 멈춘다.
  function tune() {
    if (CS.ending.busy()) return 'ending';
    if (CS.jail.busy()) return 'jail';
    if (CS.title.busy()) return 'title';
    if (CS.brawl.busy()) return 'action';
    if (CS.flashback.active()) return 'memory';
    if (CS.travel.busy()) return null;
    if (CS.cutin.busy() || !CS.chase.quiet()) return 'action';
    return 'street';
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // 엔딩, 감옥, 시작 화면, 회상, 보석 장면, 얼굴 컷, 알림 카드, 주먹 전투, 소매치기, 카페, 휴대폰이 열려 있는 동안 거리는 멈춘다
    const overlay = OVERLAYS.find((o) => o.busy());
    if (overlay) {
      input.takeLook();
      overlay.frame(ctx, dt);
    } else {
      update(dt);
      CS.npc.update(citizens, world, player, dt);
      CS.raycaster.render(ctx, world, player, sprites);
      CS.chase.walkFrame(world, player, dt);
      CS.fight.walkFrame(world, player, dt);
      CS.escape.walkFrame(world, player, dt);
      CS.rob.walkFrame(citizens, player);
      CS.tourism.walkFrame(world, player);
      CS.phone.walkFrame(world, player, dt);
      CS.hud.resolve();
    }
    CS.music.want(tune());
    CS.touch.update(!!overlay);
    screen.classList.toggle('busy', !!overlay);
    hint.classList.toggle('hidden', !!overlay || input.isLooking());

    input.endFrame();
    requestAnimationFrame(frame);
  }

  input.init(canvas);

  CS.level = world;
  CS.player = player;
  CS.citizens = citizens;
  CS.frame = frame;  // 한 장면을 직접 돌릴 때 쓴다(화면이 가려져 멈춘 창에서 확인할 때)
  requestAnimationFrame(frame);
})();
