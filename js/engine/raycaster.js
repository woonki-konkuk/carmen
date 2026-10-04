window.CS = window.CS || {};

// 격자 지도에 광선을 쏘아 벽은 세로줄 단위로, 바닥은 가로줄 단위로 그리고,
// 그 위에 그림판(사람, 가로등, 나무)을 세운다.
CS.raycaster = (function () {
  const T = CS.textures;
  const PLANE = 0.75;   // tan(가로 시야각 / 2)
  const WALL_H = 3;     // 벽 높이(칸) — 3층 건물
  const EYE_H = 0.55;   // 눈높이(칸)
  const FOG_START = 6;  // 이 거리부터 안개가 끼기 시작해
  const FOG_END = 30;   // 이 거리에서 완전히 묻힌다
  const HAZE = [214, 221, 226];

  const FOG_STEPS = 16;
  const FOG_STYLES = [];
  for (let i = 0; i <= FOG_STEPS; i++) {
    FOG_STYLES.push('rgba(' + HAZE.join(',') + ',' + i / FOG_STEPS + ')');
  }

  const hit = { type: 0, dist: 0, side: 0, u: 0 };
  let floorImage = null, floorPixels = null;
  let wallDist = null;    // 세로줄마다 벽까지의 거리. 그림판이 벽에 가리는지 볼 때 쓴다.
  let skyOffsets = null;  // 세로줄마다 화면 가운데와 벌어진 각도(한 바퀴 = 1)
  const visible = [];

  let skyPlane = 0;       // skyOffsets를 계산할 때 쓴 시야 폭

  // plane: tan(가로 시야각 / 2). 당겨 볼수록 작아진다.
  function prepare(W, plane) {
    if (!wallDist || wallDist.length !== W) {
      wallDist = new Float32Array(W);
      skyOffsets = new Float32Array(W);
      skyPlane = 0;
    }
    if (skyPlane === plane) return;
    skyPlane = plane;
    for (let x = 0; x < W; x++) {
      skyOffsets[x] = Math.atan((2 * (x + 0.5) / W - 1) * plane) / (Math.PI * 2);
    }
  }

  function fogAt(dist) {
    const t = (dist - FOG_START) / (FOG_END - FOG_START);
    return t <= 0 ? 0 : t >= 1 ? 1 : t;
  }

  // (px, py)에서 (rayX, rayY) 방향으로 첫 벽을 찾아 hit에 채운다. 못 찾으면 false.
  function cast(world, px, py, rayX, rayY) {
    let mapX = Math.floor(px), mapY = Math.floor(py);
    const deltaX = Math.abs(1 / rayX), deltaY = Math.abs(1 / rayY);
    let stepX, stepY, sideX, sideY;

    if (rayX < 0) { stepX = -1; sideX = (px - mapX) * deltaX; }
    else { stepX = 1; sideX = (mapX + 1 - px) * deltaX; }
    if (rayY < 0) { stepY = -1; sideY = (py - mapY) * deltaY; }
    else { stepY = 1; sideY = (mapY + 1 - py) * deltaY; }

    let side = 0;
    for (;;) {
      if (sideX < sideY) { sideX += deltaX; mapX += stepX; side = 0; }
      else { sideY += deltaY; mapY += stepY; side = 1; }
      if (mapX < 0 || mapY < 0 || mapX >= world.w || mapY >= world.h) return false;
      const type = world.walls[mapY * world.w + mapX];
      if (type) {
        const dist = side === 0 ? sideX - deltaX : sideY - deltaY;
        const along = side === 0 ? py + dist * rayY : px + dist * rayX;
        let u = along - Math.floor(along);
        // 벽을 바깥에서 볼 때 그림(간판 글자)이 뒤집히지 않게 한다
        if (side === 0 ? rayX < 0 : rayY > 0) u = 1 - u;
        hit.type = type;
        hit.dist = dist;
        hit.side = side;
        hit.u = u;
        return true;
      }
    }
  }

  function drawSky(ctx, player, W, horizon, zoom) {
    const sky = CS.sky;
    const tall = sky.PH * zoom;
    const top = horizon - tall;
    if (top > 0) {
      ctx.fillStyle = sky.TOP;
      ctx.fillRect(0, 0, W, top);
    }
    const turn = player.a / (Math.PI * 2);
    for (let x = 0; x < W; x++) {
      let u = (turn + skyOffsets[x]) % 1;
      if (u < 0) u += 1;
      const sx = Math.min(sky.PW - 1, (u * sky.PW) | 0);
      ctx.drawImage(sky.canvas, sx, 0, 1, sky.PH, x, top, 1, tall);
    }
  }

  function drawFloor(ctx, world, player, W, H, horizon, focal, rayX0, rayY0, spanX, spanY) {
    if (!floorImage || floorImage.width !== W || floorImage.height !== H) {
      floorImage = ctx.createImageData(W, H);
      floorPixels = new Uint32Array(floorImage.data.buffer);
    }
    const w = world.w, h = world.h, floors = world.floors;
    const size = T.FLOOR_SIZE, mask = size - 1;

    for (let y = horizon; y < H; y++) {
      const rowDist = EYE_H * focal / (y - horizon + 0.5);
      const stepX = rowDist * spanX, stepY = rowDist * spanY;
      let fx = player.x + rowDist * rayX0 + stepX * 0.5;
      let fy = player.y + rowDist * rayY0 + stepY * 0.5;

      const fog = fogAt(rowDist), keep = 1 - fog;
      const hr = HAZE[0] * fog, hg = HAZE[1] * fog, hb = HAZE[2] * fog;

      let o = y * W;
      for (let x = 0; x < W; x++, o++, fx += stepX, fy += stepY) {
        const cx = Math.floor(fx), cy = Math.floor(fy);
        const inside = cx >= 0 && cy >= 0 && cx < w && cy < h;
        const tex = T.floorTex[inside ? floors[cy * w + cx] : 0];
        const c = tex[((fy * size) & mask) * size + ((fx * size) & mask)];
        floorPixels[o] = 0xff000000 |
          (((c >> 16 & 255) * keep + hb) << 16) |
          (((c >> 8 & 255) * keep + hg) << 8) |
          ((c & 255) * keep + hr);
      }
    }
    ctx.putImageData(floorImage, 0, 0, 0, horizon, W, H - horizon);
  }

  function drawWalls(ctx, world, player, W, H, horizon, focal, dirX, dirY, planeX, planeY) {
    for (let x = 0; x < W; x++) {
      const camX = 2 * (x + 0.5) / W - 1;
      if (!cast(world, player.x, player.y, dirX + planeX * camX, dirY + planeY * camX)) {
        wallDist[x] = Infinity;
        continue;
      }
      wallDist[x] = hit.dist;

      const scale = focal / hit.dist;
      const top = horizon - (WALL_H - EYE_H) * scale;
      const full = WALL_H * scale;

      // 화면 밖으로 나간 부분은 그림에서도 잘라 낸다
      let y0 = Math.floor(top), y1 = Math.ceil(top + full);
      let sy0 = 0, sy1 = T.TH;
      if (y0 < 0) { sy0 = -top / full * T.TH; y0 = 0; }
      if (y1 > H) { sy1 = (H - top) / full * T.TH; y1 = H; }

      const texX = Math.min(T.TW - 1, (hit.u * T.TW) | 0);
      ctx.drawImage(T.wall(hit.type - 1, hit.side), texX, sy0, 1, sy1 - sy0, x, y0, 1, y1 - y0);

      const fog = (fogAt(hit.dist) * FOG_STEPS) | 0;
      if (fog) {
        ctx.fillStyle = FOG_STYLES[fog];
        ctx.fillRect(x, y0, 1, y1 - y0);
      }
    }
  }

  // 그림판(사람, 가로등, 나무)을 먼 것부터 그린다. 벽에 가린 세로줄은 건너뛴다.
  function drawSprites(ctx, sprites, player, W, horizon, focal, dirX, dirY) {
    visible.length = 0;
    for (const s of sprites) {
      if (s.hidden) continue;
      const dx = s.x - player.x, dy = s.y - player.y;
      const depth = dx * dirX + dy * dirY;
      if (depth < 0.15 || (depth >= FOG_END && !s.nofog)) continue;
      s.depth = depth;
      s.offset = dy * dirX - dx * dirY;  // 시선에서 오른쪽으로 벗어난 거리
      visible.push(s);
    }
    visible.sort((a, b) => b.depth - a.depth);

    for (const s of visible) {
      const scale = focal / s.depth;
      const width = s.w * scale;
      const left = W / 2 + s.offset * scale - width / 2;
      const x0 = Math.max(0, Math.round(left)), x1 = Math.min(W, Math.round(left + width));
      if (x0 >= x1) continue;

      // lift: 땅에서 떠 있는 높이(칸)
      const foot = EYE_H - (s.lift || 0);
      const bottom = Math.round(horizon + foot * scale);
      const top = Math.round(horizon + (foot - s.h) * scale);
      const perPx = s.img.width / width;

      // 먼 것은 뒤 배경에 옅게 섞여 안개에 묻힌 것처럼 보인다
      ctx.globalAlpha = s.nofog ? 1 : 1 - fogAt(s.depth);
      let run = -1;
      for (let x = x0; x <= x1; x++) {
        const open = x < x1 && s.depth < wallDist[x];
        if (open) {
          if (run < 0) run = x;
        } else if (run >= 0) {
          const sx = Math.max(0, (run - left) * perPx);
          const sw = Math.min(s.img.width - sx, (x - run) * perPx);
          ctx.drawImage(s.img, sx, 0, sw, s.img.height, run, top, x - run, bottom - top);
          run = -1;
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // 정면으로 바라보는 벽. { type, dist } 또는 null.
  function probe(world, player) {
    if (!cast(world, player.x, player.y, Math.cos(player.a), Math.sin(player.a))) return null;
    return hit;
  }

  function render(ctx, world, player, sprites) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const horizon = Math.round(H / 2 + (player.bob || 0));
    // player.zoom: 당겨 보는 배율(없으면 1)
    const zoom = player.zoom || 1;
    const plane = PLANE / zoom;
    const focal = (W / 2) / plane;
    const dirX = Math.cos(player.a), dirY = Math.sin(player.a);
    const planeX = -dirY * plane, planeY = dirX * plane;

    prepare(W, plane);
    ctx.imageSmoothingEnabled = false;
    drawSky(ctx, player, W, horizon, zoom);
    drawFloor(ctx, world, player, W, H, horizon, focal,
      dirX - planeX, dirY - planeY, 2 * planeX / W, 2 * planeY / W);
    drawWalls(ctx, world, player, W, H, horizon, focal, dirX, dirY, planeX, planeY);
    drawSprites(ctx, sprites, player, W, horizon, focal, dirX, dirY);
  }

  return { render, probe };
})();
