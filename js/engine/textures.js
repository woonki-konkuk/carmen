window.CS = window.CS || {};

// 벽과 바닥 그림을 실행할 때 코드로 그려 둔다.
CS.textures = (function () {
  const TW = 64, TH = 192;  // 벽 한 칸: 가로 1칸 × 세로 3층
  const FLOOR_SIZE = 64;

  // 1층 종류. SHOP부터 가게 종류 수만큼 이어진다.
  const WINDOW = 0, DOOR = 1, CAFE = 2, SHOP = 3;

  const GLASS = '#3d4f63', GLASS_HI = '#5c748b', FRAME = '#f3efe4', IRON = '#22252a';

  const PALETTES = [
    { stone: '#c2baad', trim: '#a8a093', roof: '#56616d', shutter: '#e6e2d6', door: '#3b4a5a' },
    { stone: '#eadfc8', trim: '#d3c5a8', roof: '#5b6b7a', shutter: '#9fb0b4', door: '#234a3c' },
    { stone: '#dccaa9', trim: '#c3ae89', roof: '#4f5d6b', shutter: '#f0ece0', door: '#6b2a2a' },
    { stone: '#e6d2c9', trim: '#ccb4a9', roof: '#655f6e', shutter: '#8e9f8a', door: '#2c4466' },
    { stone: '#d0d6da', trim: '#b3bbc1', roof: '#4c5a66', shutter: '#f0ece0', door: '#4a3526' },
  ];

  const SHOPS = [
    { name: 'PAIN', front: '#2f5d50', goods: drawBread },
    { name: 'FLEURS', front: '#7b3148', goods: drawFlowers },
    { name: 'LIVRES', front: '#2b4470', goods: drawBooks },
    { name: 'MODE', front: '#2c2c30', goods: drawFashion },
  ];
  const GROUNDS = SHOP + SHOPS.length;

  const { makeCanvas, rng, ellipse, polygon } = CS.util;

  function arch(g, x, y, w, h) {
    g.beginPath();
    g.moveTo(x, y + h);
    g.lineTo(x, y + w / 2);
    g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
    g.lineTo(x + w, y + h);
    g.closePath();
    g.fill();
  }

  function label(g, str, y, color, size) {
    g.font = 'bold ' + size + 'px Helvetica, Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = color;
    g.fillText(str, TW / 2, y);
  }

  // 지붕(망사르드)과 2층. 모든 건물이 함께 쓴다.
  function drawUpper(g, p) {
    g.fillStyle = p.roof;
    g.fillRect(0, 0, TW, 54);
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.fillRect(0, 0, TW, 3);
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 12; y < 54; y += 9) g.fillRect(0, y, TW, 1);

    // 지붕창
    g.fillStyle = p.trim;
    g.fillRect(19, 13, 26, 4);
    g.fillStyle = p.stone;
    g.fillRect(21, 17, 22, 37);
    g.fillStyle = GLASS;
    g.fillRect(25, 21, 14, 33);
    g.fillStyle = GLASS_HI;
    g.fillRect(25, 21, 6, 12);
    g.fillStyle = FRAME;
    g.fillRect(31, 21, 2, 33);
    g.fillRect(25, 36, 14, 1);

    // 처마
    g.fillStyle = p.trim;
    g.fillRect(0, 54, TW, 6);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(0, 60, TW, 2);

    // 2층 벽과 창
    g.fillStyle = p.stone;
    g.fillRect(0, 62, TW, 66);
    g.fillStyle = 'rgba(0,0,0,0.1)';
    g.fillRect(0, 62, 1, 66);
    g.fillStyle = p.trim;
    g.fillRect(17, 68, 30, 54);
    g.fillStyle = GLASS;
    g.fillRect(20, 72, 24, 48);
    g.fillStyle = GLASS_HI;
    g.fillRect(20, 72, 10, 18);
    g.fillStyle = FRAME;
    g.fillRect(31, 72, 2, 48);
    g.fillRect(20, 88, 24, 1);
    g.fillRect(20, 104, 24, 1);

    // 덧문
    g.fillStyle = p.shutter;
    g.fillRect(9, 70, 8, 50);
    g.fillRect(47, 70, 8, 50);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 73; y < 120; y += 4) {
      g.fillRect(9, y, 8, 1);
      g.fillRect(47, y, 8, 1);
    }

    // 발코니 난간과 바닥
    g.fillStyle = IRON;
    g.fillRect(0, 106, TW, 2);
    g.fillRect(0, 118, TW, 1);
    for (let x = 1; x < TW; x += 4) g.fillRect(x, 108, 1, 10);
    g.fillStyle = p.trim;
    g.fillRect(0, 120, TW, 5);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(0, 125, TW, 3);
  }

  // 1층의 거친 돌벽
  function drawStoneBase(g, p) {
    g.fillStyle = p.trim;
    g.fillRect(0, 128, TW, 64);
    g.fillStyle = 'rgba(0,0,0,0.13)';
    for (let y = 136; y < 184; y += 8) g.fillRect(0, y, TW, 1);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.fillRect(0, 184, TW, 8);
  }

  function groundWindow(g, p) {
    drawStoneBase(g, p);
    g.fillStyle = p.stone;
    arch(g, 18, 138, 28, 42);
    g.fillStyle = GLASS;
    arch(g, 21, 141, 22, 39);
    g.fillStyle = FRAME;
    g.fillRect(31, 141, 2, 39);
    g.fillRect(21, 158, 22, 1);
    g.fillStyle = IRON;
    g.fillRect(21, 170, 22, 1);
    for (let x = 22; x < 43; x += 3) g.fillRect(x, 171, 1, 9);
  }

  function groundDoor(g, p) {
    drawStoneBase(g, p);
    g.fillStyle = p.stone;
    arch(g, 13, 134, 38, 58);
    g.fillStyle = p.door;
    arch(g, 16, 137, 32, 55);
    g.fillStyle = GLASS;
    g.beginPath();
    g.arc(32, 152, 13, Math.PI, 0);
    g.fill();
    g.fillStyle = p.door;
    g.fillRect(31, 139, 2, 13);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.fillRect(31, 153, 2, 39);
    g.fillRect(16, 152, 32, 1);
    g.fillStyle = 'rgba(255,255,255,0.14)';
    g.fillRect(19, 157, 10, 13);
    g.fillRect(35, 157, 10, 13);
    g.fillRect(19, 174, 10, 13);
    g.fillRect(35, 174, 10, 13);
    g.fillStyle = '#d9b24a';
    g.fillRect(28, 171, 2, 2);
    g.fillRect(34, 171, 2, 2);
  }

  function groundCafe(g) {
    const RED = '#a3222a', CREAM = '#f3e7c9', WOOD = '#3a2a22';
    g.fillStyle = WOOD;
    g.fillRect(0, 128, TW, 64);

    g.fillStyle = RED;
    g.fillRect(0, 128, TW, 12);
    label(g, 'CAFÉ', 134.5, CREAM, 10);

    // 유리 안쪽의 불빛, 선반과 병
    g.fillStyle = '#f2cf7a';
    g.fillRect(4, 152, 56, 30);
    g.fillStyle = '#8a5a2b';
    g.fillRect(4, 168, 56, 1);
    const bottles = ['#3f6b4a', '#7b3148', '#c98f4a', '#2f5d8a'];
    for (let i = 0; i < 12; i++) {
      g.fillStyle = bottles[i % bottles.length];
      g.fillRect(7 + i * 4.3, 162, 2, 6);
    }
    g.fillStyle = WOOD;
    g.fillRect(31, 152, 2, 30);
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.fillRect(4, 152, 56, 6);

    // 줄무늬 차양
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? CREAM : RED;
      g.fillRect(i * 8, 140, 8, 12);
      g.beginPath();
      g.arc(i * 8 + 4, 152, 4, 0, Math.PI);
      g.fill();
    }

    g.fillStyle = '#7d1a20';
    g.fillRect(0, 182, TW, 10);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(0, 190, TW, 2);
  }

  function groundShop(g, shop) {
    g.fillStyle = shop.front;
    g.fillRect(0, 128, TW, 64);
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.fillRect(0, 140, TW, 2);
    label(g, shop.name, 134.5, '#f0d98a', 9);

    // 진열창
    g.fillStyle = '#f6ecd0';
    g.fillRect(5, 145, 54, 37);
    shop.goods(g);
    g.fillStyle = 'rgba(255,255,255,0.3)';
    g.fillRect(7, 147, 2, 33);

    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.fillRect(0, 185, TW, 7);
  }

  function drawBread(g) {
    g.fillStyle = '#d19a55';
    for (let i = 0; i < 4; i++) g.fillRect(11 + i * 4, 150 + (i % 2) * 2, 3, 20);
    g.fillStyle = '#8a5a2b';
    g.fillRect(9, 167, 18, 14);
    g.fillStyle = '#7a5a3a';
    g.fillRect(30, 165, 27, 2);
    g.fillRect(30, 180, 27, 2);
    g.fillStyle = '#c4853c';
    ellipse(g, 37, 161, 5, 4);
    ellipse(g, 50, 161, 5, 4);
    ellipse(g, 37, 176, 5, 4);
    g.fillStyle = '#e0b060';
    ellipse(g, 50, 176, 5, 4);
  }

  function drawFlowers(g) {
    const blooms = ['#e0527a', '#f2c230', '#ffffff', '#c23b3b', '#9a62c4'];
    for (let i = 0; i < 5; i++) {
      const x = 12 + i * 10;
      g.fillStyle = '#3f7a45';
      g.fillRect(x, 158, 1, 13);
      g.fillRect(x - 2, 160, 1, 11);
      g.fillRect(x + 2, 160, 1, 11);
      g.fillStyle = '#6b7f86';
      g.fillRect(x - 3, 171, 7, 10);
      g.fillStyle = blooms[i];
      ellipse(g, x, 156, 3, 3);
      ellipse(g, x - 3, 159, 2.5, 2.5);
      ellipse(g, x + 3, 159, 2.5, 2.5);
    }
  }

  function drawBooks(g) {
    const rand = rng(3);
    const spines = ['#a33b2e', '#2f5d8a', '#d9a441', '#3f6b4a', '#6a4a7a', '#c9c0a8'];
    for (let shelf = 0; shelf < 3; shelf++) {
      const base = 157 + shelf * 12;
      g.fillStyle = '#7a5a3a';
      g.fillRect(5, base, 54, 1);
      for (let x = 7; x < 55;) {
        const w = 2 + ((rand() * 3) | 0), h = 7 + ((rand() * 3) | 0);
        g.fillStyle = spines[(rand() * spines.length) | 0];
        g.fillRect(x, base - h, w, h);
        x += w + 1;
      }
    }
  }

  function drawFashion(g) {
    // 마네킹의 빨간 코트
    g.fillStyle = '#c9c0b0';
    g.fillRect(19, 151, 2, 5);
    g.fillStyle = '#b3262e';
    polygon(g, [14, 156, 26, 156, 30, 181, 10, 181]);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(19.5, 158, 1, 23);

    // 받침대 위의 빨간 모자
    g.fillStyle = '#8a8478';
    g.fillRect(45, 160, 1, 20);
    g.fillRect(41, 179, 9, 2);
    g.fillStyle = '#b3262e';
    g.fillRect(40, 151, 11, 7);
    ellipse(g, 45.5, 158, 10, 2.5);
    g.fillStyle = '#2a2a2a';
    g.fillRect(40, 155, 11, 2);

    g.fillStyle = '#d9b24a';
    g.fillRect(32, 173, 7, 8);
  }

  function makeWall(p, ground) {
    const c = makeCanvas(TW, TH), g = c.getContext('2d');
    drawUpper(g, p);
    if (ground === WINDOW) groundWindow(g, p);
    else if (ground === DOOR) groundDoor(g, p);
    else if (ground === CAFE) groundCafe(g);
    else groundShop(g, SHOPS[ground - SHOP]);
    return c;
  }

  // 그늘진 면에 쓸 어두운 사본
  function darken(src) {
    const c = makeCanvas(TW, TH), g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.fillStyle = 'rgba(18,22,40,0.2)';
    g.fillRect(0, 0, TW, TH);
    return c;
  }

  function pixels(c) {
    const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    return new Uint32Array(data.buffer);
  }

  // 돌을 엇갈려 깐 도로
  function makeRoad() {
    const c = makeCanvas(FLOOR_SIZE, FLOOR_SIZE), g = c.getContext('2d');
    const rand = rng(7);
    g.fillStyle = '#55524f';
    g.fillRect(0, 0, FLOOR_SIZE, FLOOR_SIZE);
    for (let row = 0; row < 8; row++) {
      const tones = [];
      for (let i = 0; i < 8; i++) tones.push(104 + ((rand() * 20) | 0));
      for (let col = -1; col < 8; col++) {
        const v = tones[(col + 8) % 8];
        g.fillStyle = 'rgb(' + v + ',' + (v - 2) + ',' + (v - 6) + ')';
        g.fillRect(col * 8 + (row % 2 ? 4 : 0) + 1, row * 8 + 1, 7, 7);
      }
    }
    return pixels(c);
  }

  // 큰 판석을 깐 보도
  function makeSidewalk() {
    const c = makeCanvas(FLOOR_SIZE, FLOOR_SIZE), g = c.getContext('2d');
    const rand = rng(11);
    g.fillStyle = '#c9c3b6';
    g.fillRect(0, 0, FLOOR_SIZE, FLOOR_SIZE);
    for (let i = 0; i < 4; i++) {
      const v = (rand() * 10) | 0;
      g.fillStyle = 'rgb(' + (196 + v) + ',' + (190 + v) + ',' + (178 + v) + ')';
      g.fillRect((i % 2) * 32, (i >> 1) * 32, 32, 32);
    }
    g.fillStyle = '#a69f92';
    for (let i = 0; i < FLOOR_SIZE; i += 32) {
      g.fillRect(i, 0, 1, FLOOR_SIZE);
      g.fillRect(0, i, FLOOR_SIZE, 1);
    }
    return pixels(c);
  }

  // 지하철로 내려가는 계단. 내려갈수록 어두워진다. vertical이면 아래쪽(+y)으로, 아니면 오른쪽(+x)으로 내려간다.
  function makeStairs(vertical) {
    const c = makeCanvas(FLOOR_SIZE, FLOOR_SIZE), g = c.getContext('2d');
    // along: 계단이 내려가는 방향, across: 그 가로 방향
    const rect = (along, across, length, breadth) => {
      if (vertical) g.fillRect(across, along, breadth, length);
      else g.fillRect(along, across, length, breadth);
    };
    g.fillStyle = '#cfc9bb';
    rect(0, 0, 64, 64);
    for (let i = 0; i < 8; i++) {
      const v = 150 - i * 17;
      g.fillStyle = 'rgb(' + v + ',' + (v - 2) + ',' + (v - 6) + ')';
      rect(i * 8, 6, 8, 52);
      g.fillStyle = 'rgb(' + (v + 30) + ',' + (v + 28) + ',' + (v + 24) + ')';
      rect(i * 8, 6, 1, 52);
    }
    // 양옆과 끝의 초록 난간
    g.fillStyle = '#2f6b4f';
    rect(0, 2, 64, 2);
    rect(0, 60, 64, 2);
    rect(61, 2, 3, 60);
    return pixels(c);
  }

  // 잔디밭
  function makeGrass() {
    const c = makeCanvas(FLOOR_SIZE, FLOOR_SIZE), g = c.getContext('2d');
    const rand = rng(17);
    g.fillStyle = '#6fa055';
    g.fillRect(0, 0, FLOOR_SIZE, FLOOR_SIZE);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = rand() < 0.5 ? '#63934b' : '#7cab60';
      g.fillRect((rand() * FLOOR_SIZE) | 0, (rand() * FLOOR_SIZE) | 0, 2, 3);
    }
    return pixels(c);
  }

  const lit = [], dark = [];
  for (const p of PALETTES) {
    for (let ground = 0; ground < GROUNDS; ground++) {
      const wall = makeWall(p, ground);
      lit.push(wall);
      dark.push(darken(wall));
    }
  }

  return {
    TW, TH, FLOOR_SIZE,
    WINDOW, DOOR, CAFE, SHOP,
    SHOP_COUNT: SHOPS.length,
    // 바닥 종류. floorTex의 순서와 같다(0은 건물 밑).
    ROAD: 1, SIDEWALK: 2, METRO_H: 3, METRO_V: 4, GRASS: 5,
    floorTex: (function () {
      const road = makeRoad();
      return [road, road, makeSidewalk(), makeStairs(false), makeStairs(true), makeGrass()];
    })(),
    wallId(palette, ground) {
      return palette * GROUNDS + ground;
    },
    // 벽 그림 번호에서 1층 종류를 되찾는다
    groundOf(id) {
      return id % GROUNDS;
    },
    wall(id, shaded) {
      return shaded ? dark[id] : lit[id];
    },
  };
})();
