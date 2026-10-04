window.CS = window.CS || {};

// 거리를 걸어다니는 시민. 칸에서 칸으로 걸으며 주로 보도를 따라간다.
CS.npc = (function () {
  const T = CS.textures, S = CS.sprites, U = CS.util;
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const wander = U.rng(99);

  // 다음에 갈 방향. 가던 길을 주로 잇고, 도로로 내려서거나 되돌아가는 일은 드물다.
  // 갈 곳이 없으면 -1.
  function pickDir(world, c) {
    const weights = [0, 0, 0, 0];
    let total = 0;
    for (let d = 0; d < 4; d++) {
      const nx = c.cx + DIRS[d][0], ny = c.cy + DIRS[d][1];
      if (world.cell(nx, ny)) continue;
      let weight = d === c.dir ? 6 : d === (c.dir + 2) % 4 ? 0.05 : 1.5;
      if (world.floors[ny * world.w + nx] !== T.SIDEWALK) weight *= 0.12;
      weights[d] = weight;
      total += weight;
    }
    if (!total) return -1;
    let r = wander() * total;
    for (let d = 0; d < 4; d++) {
      if (!weights[d]) continue;
      r -= weights[d];
      if (r <= 0) return d;
    }
    return c.dir;
  }

  function spawn(world, count, seed) {
    const rand = U.rng(seed);
    const spots = [];
    for (let i = 0; i < world.floors.length; i++) {
      if (world.floors[i] === T.SIDEWALK) spots.push(i);
    }

    const list = [];
    for (let n = 0; n < count; n++) {
      const spot = spots[(rand() * spots.length) | 0];
      const look = S.randomLook(rand);
      const c = {
        cx: spot % world.w,
        cy: (spot / world.w) | 0,
        dir: (rand() * 4) | 0,
        t: 0,                          // 다음 칸까지 간 정도(0~1)
        ox: (rand() - 0.5) * 0.5,      // 칸 한가운데에서 비켜 걷는 정도
        oy: (rand() - 0.5) * 0.5,
        speed: 0.8 + rand() * 0.5,
        clock: rand() * 10,
        look,
        frames: S.personFrames(look),
        x: 0, y: 0, img: null,
        w: S.PERSON_W, h: S.PERSON_H,
      };
      c.dir = pickDir(world, c);
      list.push(c);
    }
    return list;
  }

  function update(list, world, player, dt) {
    for (const c of list) {
      if (c.dir >= 0) {
        c.t += c.speed * dt;
        while (c.t >= 1) {
          c.t -= 1;
          c.cx += DIRS[c.dir][0];
          c.cy += DIRS[c.dir][1];
          c.dir = pickDir(world, c);
          if (c.dir < 0) { c.t = 0; break; }
        }
      }
      const d = c.dir >= 0 ? DIRS[c.dir] : DIRS[0];
      c.x = c.cx + 0.5 + c.ox + d[0] * c.t;
      c.y = c.cy + 0.5 + c.oy + d[1] * c.t;

      // 나를 향해 걸어오면 앞모습, 멀어지면 뒷모습
      c.clock += dt;
      const toward = d[0] * (player.x - c.x) + d[1] * (player.y - c.y) > 0;
      const step = ((c.clock * c.speed * 2.4) | 0) & 1;
      c.img = (toward ? c.frames.front : c.frames.back)[c.dir >= 0 ? step : 0];
    }
  }

  return { spawn, update };
})();
