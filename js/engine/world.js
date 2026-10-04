window.CS = window.CS || {};

// 글자 격자 지도를 읽어 칸마다 벽 그림 번호와 바닥 종류를 정한다.
//   .        길
//   1~5      건물(돌 색 5가지). 1층은 칸마다 창이나 문이 된다.
//   a~d      2~5와 같은 색 건물의 가게 진열창
//   A~D      2~5와 같은 색 건물의 카페
//   g        잔디밭(걸을 수 있다)
//   l, t     길 위의 가로등, 나무
//   M        지하철 입구
CS.world = (function () {
  const T = CS.textures;
  const hash = CS.util.hash;
  const PROPS = { l: 'lamp', t: 'tree', M: 'metro' };
  const CURB = 0.3;         // 가로등과 나무를 도로 쪽으로 붙이는 거리(칸)
  const STAIR_HEAD = 0.08;  // 지하철 간판이 계단 칸의 위쪽 끝에서 떨어진 거리(칸)

  function wallFor(ch, x, y) {
    const n = hash(x, y);
    if (ch >= '1' && ch <= '5') {
      return T.wallId(Number(ch) - 1, n % 3 === 1 ? T.DOOR : T.WINDOW);
    }
    if (ch >= 'a' && ch <= 'd') {
      return T.wallId(ch.charCodeAt(0) - 96, T.SHOP + n % T.SHOP_COUNT);
    }
    if (ch >= 'A' && ch <= 'D') {
      return T.wallId(ch.charCodeAt(0) - 64, T.CAFE);
    }
    throw new Error('지도에 모르는 글자: ' + ch + ' (' + x + ', ' + y + ')');
  }

  function load(rows) {
    const h = rows.length, w = rows[0].length;
    const walls = new Uint8Array(w * h);   // 0 = 길, 그 밖 = 벽 그림 번호 + 1
    const floors = new Uint8Array(w * h);  // 0 = 건물 밑, T.ROAD, T.SIDEWALK
    const props = [];

    for (let y = 0; y < h; y++) {
      if (rows[y].length !== w) throw new Error('지도 ' + y + '번째 줄의 길이가 다릅니다');
      for (let x = 0; x < w; x++) {
        const ch = rows[y][x];
        if (ch === '.') continue;
        if (ch === 'g') floors[y * w + x] = T.GRASS;
        else if (PROPS[ch]) props.push({ kind: PROPS[ch], x: x + 0.5, y: y + 0.5 });
        else walls[y * w + x] = wallFor(ch, x, y) + 1;
      }
    }

    function cell(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return 1;
      return walls[y * w + x];
    }

    // 건물에 붙은 길은 보도, 나머지는 도로
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (cell(x, y) || floors[y * w + x]) continue;
        let nearWall = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (cell(x + dx, y + dy)) nearWall = true;
          }
        }
        floors[y * w + x] = nearWall ? T.SIDEWALK : T.ROAD;
      }
    }

    for (const p of props) {
      const x = Math.floor(p.x), y = Math.floor(p.y);

      // 지하철 입구: 그 칸의 바닥이 계단이 되고, 간판은 계단 위쪽 끝에 선다.
      // 계단은 보도가 이어지는 방향으로 내려간다.
      if (p.kind === 'metro') {
        const alongX = !cell(x - 1, y) && !cell(x + 1, y);
        floors[y * w + x] = alongX ? T.METRO_H : T.METRO_V;
        if (alongX) p.x = x + STAIR_HEAD;
        else p.y = y + STAIR_HEAD;
        continue;
      }

      // 가로등과 나무는 보도의 도로 쪽 가장자리에 선다
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        if (!cell(x + dx, y + dy) && floors[(y + dy) * w + x + dx] === T.ROAD) {
          p.x += dx * CURB;
          p.y += dy * CURB;
          break;
        }
      }
    }

    // 두 점 사이에 벽이 없는가
    function clear(x0, y0, x1, y1) {
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.25);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        if (cell(Math.floor(x0 + (x1 - x0) * t), Math.floor(y0 + (y1 - y0) * t))) return false;
      }
      return true;
    }

    return { w, h, walls, floors, props, cell, clear };
  }

  return { load };
})();
