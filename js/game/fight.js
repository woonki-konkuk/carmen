window.CS = window.CS || {};

// 전투: 표적이 종이 표창을 던지며 덤빈다. 표창을 피하면서 Space로 모자를 던져 맞힌다.
// 상대의 체력을 다 깎으면 이기고, 내 체력 세 칸을 다 잃으면 쓰러진다.
CS.fight = (function () {
  const input = CS.input, scenes = CS.scenes, S = CS.sprites;
  const HEARTS = 3;          // 내 체력
  const STARS = 9;           // 한꺼번에 날 수 있는 표창 수
  const STAR_RANGE = 18;     // 표창이 날아가는 거리(칸)
  const STAR_HIT = 0.35;     // 표창이 이 거리(칸) 안으로 오면 맞는다
  const SAFE_TIME = 1;       // 맞은 뒤 이만큼(초)은 다시 맞지 않는다
  const SPREAD = 0.2;        // 세 갈래로 던질 때 벌어지는 각도(라디안)
  const LEAD_CHANCE = 0.5;   // 내가 가는 쪽을 앞질러 던질 확률
  const WINDUP = 0.4;        // 던지기 전에 팔을 드는 시간(초). 이때는 제자리에 선다.
  const FLINCH = 0.5;        // 모자에 맞고 움찔하는 시간(초)
  const RETORT = 0.3;        // 움찔한 뒤 이 시간(초) 안에 표창을 던진다
  const GUARD = 1.3;         // 한 번 맞은 뒤 이만큼(초)은 모자에 다시 맞지 않는다(그동안 몸이 깜빡인다)
  const HAT_SPEED = 11;      // 모자의 빠르기(칸/초)
  const HAT_RANGE = 14;      // 모자가 날아가는 거리(칸)
  const HAT_HIT = 0.75;      // 모자가 이 거리(칸) 안으로 가면 맞는다
  const HAT_WAIT = 0.6;      // 모자를 던지고 다시 던지기까지(초)
  const KEEP = [5, 8];       // 상대가 나와 두려는 거리(칸)
  const LEAVE_DIST = 15;     // 이보다 멀어진 채로
  const LEAVE_TIME = 3;      // 이만큼(초) 지나면 전투가 끝난다
  const BANNER_TIME = 2.5;

  const hud = document.getElementById('chase');
  const banner = document.getElementById('banner');
  const aim = document.getElementById('aim');
  const hurt = document.getElementById('hurt');

  // 날아다니는 것들. 쓰지 않을 때는 감춰 둔다.
  const stars = [];
  for (let i = 0; i < STARS; i++) {
    stars.push({ x: 0, y: 0, img: scenes.paperStar[0], w: 0.2, h: 0.2, lift: 0.28, hidden: true, vx: 0, vy: 0, left: 0 });
  }
  const hat = { x: 0, y: 0, img: scenes.hat[0], w: 0.32, h: 0.2, lift: 0.3, hidden: true, vx: 0, vy: 0, left: 0 };

  let active = false;
  let foe = null;        // 상대 { body, mark, frames, target, done }. done에는 'won'이나 'lost'를 넘긴다.
  let rule = null;       // 상대의 전투 수치(story.js의 fight)
  let windupImg = null;
  let hp = 0, hearts = 0;
  let mode = 'move';     // move(움직임) → windup(팔을 듦) → move … / flinch(움찔함)
  let modeLeft = 0;
  let throwIn = 0;       // 다음 던지기까지 남은 시간(초)
  let goX = 0, goY = 0;  // 상대가 가려는 자리
  let safe = 0, guard = 0, hatWait = 0, away = 0, bannerLeft = 0, clock = 0;
  let lastX = 0, lastY = 0, velX = 0, velY = 0;  // 내 자리와 빠르기

  function between(range) {
    return range[0] + Math.random() * (range[1] - range[0]);
  }

  function place(x, y) {
    foe.body.x = foe.mark.x = x;
    foe.body.y = foe.mark.y = y;
  }

  function start(opponent) {
    foe = opponent;
    rule = foe.target.fight;
    windupImg = S.person(foe.target.look, false, 0, 'wallA');
    active = true;
    hp = rule.hp;
    hearts = HEARTS;
    mode = 'move';
    throwIn = between(rule.gap);
    goX = foe.body.x;
    goY = foe.body.y;
    safe = guard = hatWait = away = clock = 0;
    lastX = lastY = NaN;
    bannerLeft = BANNER_TIME;
    banner.innerHTML = CS.util.josa(foe.target.name, '이', '가') + ' 덤벼듭니다!<br><small><kbd>Space</kbd>로 모자를 던져 맞히세요</small>';
    banner.classList.remove('hidden');
    aim.classList.remove('hidden');
  }

  function end(result) {
    active = false;
    for (const s of stars) s.hidden = true;
    hat.hidden = true;
    foe.body.hidden = false;
    hud.classList.add('hidden');
    banner.classList.add('hidden');
    aim.classList.add('hidden');
    foe.done(result);
  }

  // 나를 둘러 돌며 거리를 두는 새 자리를 고른다
  function pickSpot(world, player) {
    const [x0, y0, x1, y1] = rule.arena;
    const from = Math.atan2(foe.body.y - player.y, foe.body.x - player.x);
    for (let i = 0; i < 8; i++) {
      const angle = from + (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.9);
      const dist = between(KEEP);
      const x = Math.max(x0, Math.min(x1, player.x + Math.cos(angle) * dist));
      const y = Math.max(y0, Math.min(y1, player.y + Math.sin(angle) * dist));
      if (Math.hypot(x - player.x, y - player.y) > KEEP[0] - 1.5 && world.clear(foe.body.x, foe.body.y, x, y)) {
        goX = x;
        goY = y;
        return;
      }
    }
  }

  function launch(angle) {
    const s = stars.find((star) => star.hidden);
    if (!s) return;
    s.hidden = false;
    s.x = foe.body.x;
    s.y = foe.body.y;
    s.vx = Math.cos(angle) * rule.starSpeed;
    s.vy = Math.sin(angle) * rule.starSpeed;
    s.left = STAR_RANGE;
    CS.sound.play('star');
  }

  // 표창을 던진다. 체력이 절반 아래면 세 갈래로 던진다.
  function throwStars(player) {
    let tx = player.x, ty = player.y;
    if (Math.random() < LEAD_CHANCE) {
      const time = Math.hypot(tx - foe.body.x, ty - foe.body.y) / rule.starSpeed;
      tx += velX * time;
      ty += velY * time;
    }
    const angle = Math.atan2(ty - foe.body.y, tx - foe.body.x);
    launch(angle);
    if (hp <= rule.hp / 2) {
      launch(angle - SPREAD);
      launch(angle + SPREAD);
    }
  }

  function gotHit() {
    hearts--;
    safe = SAFE_TIME;
    hurt.classList.remove('on');
    void hurt.offsetWidth;  // 번쩍임을 처음부터 다시 틀게 한다
    hurt.classList.add('on');
    CS.sound.play(hearts > 0 ? 'hurt' : 'fall');
    if (hearts > 0) return;
    end('lost');
  }

  function fly(world, thing, range, dt) {
    thing.x += thing.vx * dt;
    thing.y += thing.vy * dt;
    thing.left -= Math.hypot(thing.vx, thing.vy) * dt;
    if (thing.left <= 0 || world.cell(Math.floor(thing.x), Math.floor(thing.y))) thing.hidden = true;
  }

  // 걷는 동안 매 프레임
  function walkFrame(world, player, dt) {
    if (!active) return;
    clock += dt;
    const body = foe.body;

    // 내 빠르기(앞질러 던질 때 쓴다)
    if (dt > 0 && !Number.isNaN(lastX)) {
      velX = (player.x - lastX) / dt;
      velY = (player.y - lastY) / dt;
    }
    lastX = player.x;
    lastY = player.y;

    if (bannerLeft > 0) {
      bannerLeft -= dt;
      if (bannerLeft <= 0) banner.classList.add('hidden');
    }
    safe = Math.max(0, safe - dt);
    guard = Math.max(0, guard - dt);
    hatWait = Math.max(0, hatWait - dt);
    body.hidden = guard > 0 && (((clock * 14) | 0) & 1) === 1;

    // 상대: 자리를 옮기다가, 멈춰 서서 팔을 들고 던진다
    if (mode === 'move') {
      const dx = goX - body.x, dy = goY - body.y;
      const gap = Math.hypot(dx, dy);
      if (gap < 0.2) pickSpot(world, player);
      else {
        const step = Math.min(gap, rule.speed * dt);
        place(body.x + dx / gap * step, body.y + dy / gap * step);
      }
      body.img = foe.frames.front[((clock * 8) | 0) & 1];
      throwIn -= dt;
      if (throwIn <= 0) {
        mode = 'windup';
        modeLeft = WINDUP;
        body.img = windupImg;
      }
    } else {
      modeLeft -= dt;
      if (modeLeft <= 0) {
        if (mode === 'windup') {
          throwStars(player);
          // 체력이 줄수록 더 자주 던진다
          throwIn = between(rule.gap) * (0.55 + 0.45 * hp / rule.hp);
        } else {
          // 맞고 나면 곧바로 되받아친다. 계속 맞기만 하며 묶여 있지 않게 한다.
          throwIn = Math.min(throwIn, RETORT);
        }
        mode = 'move';
        pickSpot(world, player);
      }
    }

    // 표창
    for (const s of stars) {
      if (s.hidden) continue;
      fly(world, s, STAR_RANGE, dt);
      s.img = scenes.paperStar[((clock * 12) | 0) & 1];
      if (!s.hidden && safe <= 0 && Math.hypot(s.x - player.x, s.y - player.y) < STAR_HIT) {
        s.hidden = true;
        gotHit();
        if (!active) return;
      }
    }

    // 모자
    const wantThrow = input.consume('Space') || input.consume('Mouse');
    if (wantThrow && hat.hidden && hatWait <= 0) {
      hat.hidden = false;
      hat.x = player.x;
      hat.y = player.y;
      hat.vx = Math.cos(player.a) * HAT_SPEED;
      hat.vy = Math.sin(player.a) * HAT_SPEED;
      hat.left = HAT_RANGE;
      hatWait = HAT_WAIT;
      CS.sound.play('throw');
    }
    if (!hat.hidden) {
      fly(world, hat, HAT_RANGE, dt);
      hat.img = scenes.hat[((clock * 14) | 0) & 1];
      if (!hat.hidden && guard <= 0 && Math.hypot(hat.x - body.x, hat.y - body.y) < HAT_HIT) {
        hat.hidden = true;
        hp--;
        guard = GUARD;
        CS.sound.play(hp <= 0 ? 'down' : 'hatHit');
        mode = 'flinch';
        modeLeft = FLINCH;
        body.img = foe.frames.back[0];
        if (hp <= 0) return end('won');
      }
    }

    // 멀리 달아나면 전투가 끝난다
    const dist = Math.hypot(player.x - body.x, player.y - body.y);
    away = dist > LEAVE_DIST ? away + dt : 0;
    if (away > LEAVE_TIME) return end('left');

    hud.classList.remove('hidden');
    hud.classList.toggle('warn', hearts === 1);
    hud.textContent = foe.target.name + ' ' + '●'.repeat(hp) + '○'.repeat(rule.hp - hp) +
      ' · 나 ' + '♥'.repeat(hearts) + '♡'.repeat(HEARTS - hearts);
  }

  return { sprites: stars.concat([hat]), start, walkFrame, busy: () => active };
})();
