window.CS = window.CS || {};

// 걷는 화면 밖에서 쓰는 2D 그림(카페 실내, 디저트)과 표적 머리 위의 표시.
CS.scenes = (function () {
  const U = CS.util;
  const DW = 120, DH = 80;  // 디저트 그림 크기. 접시에 닿는 밑바닥은 y = 70 근처.
  const BITES = 3;          // 다 먹기까지의 횟수

  function makeCafe() {
    const c = U.makeCanvas(480, 270), g = c.getContext('2d');
    const WOOD = '#3a2a22';

    // 벽과 징두리 판벽
    g.fillStyle = '#ead9b6';
    g.fillRect(0, 0, 480, 270);
    g.fillStyle = '#dcc79e';
    for (let x = 0; x < 480; x += 24) g.fillRect(x, 0, 1, 100);
    g.fillStyle = '#7a4a32';
    g.fillRect(0, 100, 480, 170);
    g.fillStyle = '#8d5a3e';
    g.fillRect(0, 100, 480, 4);
    g.fillStyle = 'rgba(0,0,0,0.15)';
    for (let x = 20; x < 480; x += 60) g.fillRect(x, 108, 1, 40);

    // 창과 창밖 풍경
    g.fillStyle = WOOD;
    g.fillRect(24, 16, 156, 82);
    const sky = g.createLinearGradient(0, 20, 0, 94);
    sky.addColorStop(0, '#7fb6e6');
    sky.addColorStop(1, '#dbe6ee');
    g.fillStyle = sky;
    g.fillRect(28, 20, 148, 74);
    g.fillStyle = '#f2f2ee';
    U.ellipse(g, 122, 58, 7, 12);
    g.fillRect(115, 58, 14, 14);
    g.fillRect(121, 42, 2, 6);
    U.ellipse(g, 110, 66, 4, 6);
    U.ellipse(g, 134, 66, 4, 6);
    g.fillRect(106, 70, 32, 10);
    g.fillStyle = '#d9c9a8';
    g.fillRect(28, 60, 62, 34);
    g.fillStyle = '#5b6b7a';
    g.fillRect(28, 52, 62, 8);
    g.fillStyle = '#3d4f63';
    for (let x = 34; x < 86; x += 12) g.fillRect(x, 66, 6, 11);
    g.fillStyle = '#cdbfa6';
    g.fillRect(146, 68, 30, 26);
    g.fillStyle = '#4f5d6b';
    g.fillRect(146, 62, 30, 6);
    g.fillStyle = WOOD;
    g.fillRect(100, 20, 4, 74);
    g.fillRect(28, 34, 148, 2);
    // 창 아래 반쯤 가린 흰 커튼
    g.fillStyle = '#f6efe2';
    g.fillRect(28, 78, 72, 16);
    g.fillRect(104, 78, 72, 16);
    for (let x = 32; x < 176; x += 8) U.ellipse(g, x, 78, 4, 2);
    g.fillStyle = '#c9a45c';
    g.fillRect(28, 76, 148, 1);

    // 선반의 병과 잔
    const bottles = ['#3f6b4a', '#7b3148', '#c98f4a', '#2f5d8a', '#a3222a'];
    g.fillStyle = '#5a3b25';
    g.fillRect(200, 52, 100, 3);
    g.fillRect(200, 88, 100, 3);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = bottles[i % bottles.length];
      g.fillRect(205 + i * 10, 36, 6, 16);
      g.fillRect(207 + i * 10, 30, 2, 6);
    }
    g.fillStyle = '#f6efe2';
    for (let i = 0; i < 7; i++) g.fillRect(206 + i * 13, 80, 8, 8);

    // 칠판
    g.fillStyle = '#5a3b25';
    g.fillRect(322, 18, 132, 78);
    g.fillStyle = '#2e3b36';
    g.fillRect(326, 22, 124, 70);
    g.fillStyle = '#f1eee8';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 11px Helvetica, Arial, sans-serif';
    g.fillText('MENU', 388, 33);
    g.font = '8px Helvetica, Arial, sans-serif';
    g.fillText('Crêpe', 388, 50);
    g.fillText('Crème brûlée', 388, 63);
    g.fillText('Chocolat chaud', 388, 76);
    g.fillRect(360, 40, 56, 1);

    // 전등
    for (const x of [190, 310]) {
      g.fillStyle = WOOD;
      g.fillRect(x - 0.5, 0, 1, 12);
      g.fillStyle = '#b3262e';
      U.polygon(g, [x - 9, 24, x + 9, 24, x + 4, 12, x - 4, 12]);
      g.fillStyle = 'rgba(255,224,150,0.4)';
      U.ellipse(g, x, 27, 14, 5);
    }

    // 대리석 탁자
    g.fillStyle = '#bdb6a8';
    U.ellipse(g, 240, 272, 306, 138);
    g.fillStyle = '#f1eee8';
    U.ellipse(g, 240, 277, 302, 136);
    g.strokeStyle = '#dcd6cc';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(40, 200);
    g.bezierCurveTo(120, 180, 150, 220, 210, 215);
    g.moveTo(300, 222);
    g.bezierCurveTo(350, 205, 400, 230, 450, 205);
    g.stroke();

    // 냅킨과 포크, 숟가락
    g.fillStyle = '#a3222a';
    U.polygon(g, [92, 166, 138, 160, 144, 194, 98, 200]);
    g.fillStyle = '#b8bcc0';
    U.polygon(g, [113, 172, 117, 171, 122, 197, 118, 198]);
    g.fillRect(111, 163, 1.5, 9);
    g.fillRect(114, 162.5, 1.5, 9);
    g.fillRect(117, 162, 1.5, 9);
    U.polygon(g, [356, 172, 360, 173, 354, 198, 350, 197]);
    U.ellipse(g, 360, 166, 5, 7);

    // 접시
    g.fillStyle = 'rgba(0,0,0,0.12)';
    U.ellipse(g, 240, 183, 87, 25);
    g.fillStyle = '#ffffff';
    U.ellipse(g, 240, 179, 85, 24);
    g.fillStyle = '#e9e4da';
    U.ellipse(g, 240, 179, 63, 17);
    g.fillStyle = '#ffffff';
    U.ellipse(g, 240, 179, 60, 15.5);
    return c;
  }

  function strawberry(g, x, y) {
    g.fillStyle = '#d6323a';
    U.polygon(g, [x - 6, y - 4, x + 6, y - 4, x, y + 7]);
    U.ellipse(g, x, y - 3, 6, 4);
    g.fillStyle = '#4f8a4a';
    g.fillRect(x - 3, y - 8, 6, 2);
    g.fillStyle = '#f4c9a0';
    g.fillRect(x - 2, y - 1, 1, 1);
    g.fillRect(x + 2, y, 1, 1);
  }

  function crumbs(g, color) {
    g.fillStyle = color;
    for (const [x, y] of [[40, 66], [52, 70], [68, 67], [80, 71], [92, 66], [60, 63]]) g.fillRect(x, y, 2, 1);
  }

  // eaten: 먹은 횟수 0~BITES
  function drawCrepe(g, eaten) {
    if (eaten < BITES) {
      g.fillStyle = '#e8bf73';
      U.polygon(g, [12, 64, 108, 68, 70, 22]);
      g.fillStyle = '#d7a454';
      U.polygon(g, [12, 64, 70, 22, 58, 58]);
      g.fillStyle = '#c48a3f';
      U.ellipse(g, 62, 46, 5, 3);
      U.ellipse(g, 84, 58, 6, 3);
      U.ellipse(g, 72, 34, 4, 2.5);
      U.ellipse(g, 36, 60, 4, 2);
      g.strokeStyle = '#4a2a18';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(34, 62);
      for (let i = 0; i < 7; i++) g.lineTo(42 + i * 9, i % 2 ? 62 : 44 + i);
      g.stroke();
      strawberry(g, 90, 46);
      strawberry(g, 100, 58);
      g.fillStyle = '#fffaf0';
      U.ellipse(g, 70, 27, 10, 7);
      U.ellipse(g, 70, 20, 7, 5);
      U.ellipse(g, 70, 15, 4, 3);

      // 베어 문 자리를 지운다
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = '#000';
      if (eaten >= 1) U.ellipse(g, 106, 52, 24, 28);
      if (eaten >= 2) {
        U.ellipse(g, 74, 28, 26, 30);
        U.ellipse(g, 78, 66, 18, 12);
      }
      g.globalCompositeOperation = 'source-over';
    }
    if (eaten >= 1) crumbs(g, '#c48a3f');
    if (eaten === BITES) {
      g.fillStyle = '#4a2a18';
      U.ellipse(g, 62, 67, 12, 2);
    }
  }

  function drawBrulee(g, eaten) {
    // 하얀 그릇
    g.fillStyle = '#f4f1ea';
    U.polygon(g, [22, 40, 98, 40, 90, 68, 30, 68]);
    g.fillStyle = '#dcd6cc';
    for (let x = 30; x < 92; x += 8) g.fillRect(x, 45, 2, 21);
    g.fillStyle = '#f4f1ea';
    U.ellipse(g, 60, 40, 39, 9);

    if (eaten === BITES) {
      g.fillStyle = '#e4dfd2';
      U.ellipse(g, 60, 41, 34, 7);
      g.fillStyle = '#efdf9f';
      U.ellipse(g, 50, 43, 8, 2);
      return;
    }

    // 커스터드 위에 캐러멜 층. 먹을수록 오른쪽부터 떠낸다.
    g.fillStyle = '#f3e3a8';
    U.ellipse(g, 60, 40, 34, 7);
    g.save();
    g.beginPath();
    g.rect(0, 0, [DW, 74, 46][eaten], DH);
    g.clip();
    g.fillStyle = '#d99a2b';
    U.ellipse(g, 60, 40, 34, 7);
    g.fillStyle = '#a8651a';
    U.ellipse(g, 46, 39, 9, 3);
    U.ellipse(g, 70, 42, 10, 2.5);
    U.ellipse(g, 60, 36.5, 5, 1.5);
    g.fillStyle = '#f3cf6a';
    U.ellipse(g, 36, 41, 4, 1.5);
    g.restore();

    if (eaten === 0) {
      g.fillStyle = '#c2283a';
      U.ellipse(g, 58, 36, 5, 4);
      g.fillStyle = '#4f8a4a';
      U.polygon(g, [62, 35, 73, 29, 69, 37]);
    }
  }

  function drawChocolat(g, eaten) {
    // 받침과 잔
    g.fillStyle = '#f4f1ea';
    U.ellipse(g, 60, 67, 42, 8);
    g.fillStyle = '#dcd6cc';
    U.ellipse(g, 60, 68, 30, 5);
    g.strokeStyle = '#f4f1ea';
    g.lineWidth = 5;
    g.beginPath();
    g.arc(85, 44, 9, -Math.PI / 2, Math.PI / 2);
    g.stroke();
    g.fillStyle = '#f4f1ea';
    U.polygon(g, [34, 30, 86, 30, 78, 66, 42, 66]);
    g.fillStyle = '#e6e1d6';
    U.polygon(g, [70, 30, 86, 30, 78, 66, 66, 66]);
    g.fillStyle = '#f4f1ea';
    U.ellipse(g, 60, 30, 26, 6);

    // 잔 속. 마실수록 초콜릿이 줄어든다.
    g.fillStyle = '#e4dfd2';
    U.ellipse(g, 60, 30, 23, 4.5);
    if (eaten === BITES) {
      g.fillStyle = '#8a5a3a';
      U.ellipse(g, 60, 32, 10, 1.5);
      return;
    }
    g.fillStyle = '#5a3320';
    U.ellipse(g, 60, 30 + eaten * 0.8, 23 - eaten * 3.5, 4.5 - eaten * 0.7);

    if (eaten <= 1) {
      // 휘핑크림과 코코아 가루
      const s = eaten ? 0.6 : 1;
      g.fillStyle = '#fffaf0';
      U.ellipse(g, 60, 28, 14 * s, 5 * s);
      U.ellipse(g, 60, 28 - 5 * s, 10 * s, 4 * s);
      U.ellipse(g, 60, 28 - 9 * s, 6 * s, 3 * s);
      U.ellipse(g, 60, 28 - 12 * s, 3 * s, 2 * s);
      g.fillStyle = '#7a4a2a';
      g.fillRect(56, 26, 1, 1);
      g.fillRect(63, 24, 1, 1);
      g.fillRect(60, 20, 1, 1);
    }
    if (eaten === 0) {
      // 김
      g.strokeStyle = 'rgba(255,255,255,0.75)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(48, 12);
      g.bezierCurveTo(44, 8, 52, 6, 48, 1);
      g.moveTo(72, 12);
      g.bezierCurveTo(76, 8, 68, 6, 72, 1);
      g.stroke();
    }
  }

  // 표적 머리 위의 빨간 세모
  function makeTargetMark() {
    const c = U.makeCanvas(16, 16), g = c.getContext('2d');
    g.fillStyle = '#fff';
    U.polygon(g, [0, 1, 16, 1, 8, 16]);
    g.fillStyle = '#c8102e';
    U.polygon(g, [3, 3, 13, 3, 8, 12.5]);
    return c;
  }

  // 종이 표창. turned이면 45도 돌린 모습.
  function makePaperStar(turned) {
    const c = U.makeCanvas(16, 16), g = c.getContext('2d');
    g.translate(8, 8);
    if (turned) g.rotate(Math.PI / 4);
    g.fillStyle = '#2a2623';
    U.polygon(g, [0, -8, 2.5, -2.5, 8, 0, 2.5, 2.5, 0, 8, -2.5, 2.5, -8, 0, -2.5, -2.5]);
    g.fillStyle = '#fbfaf6';
    U.polygon(g, [0, -6.5, 2, -2, 6.5, 0, 2, 2, 0, 6.5, -2, 2, -6.5, 0, -2, -2]);
    g.fillStyle = '#d9538c';
    U.polygon(g, [0, -2, 2, 0, 0, 2, -2, 0]);
    return c;
  }

  // 내가 던지는 빨간 모자. flipped이면 뒤집힌 모습.
  function makeHat(flipped) {
    const c = U.makeCanvas(24, 14), g = c.getContext('2d');
    if (flipped) {
      g.translate(0, 14);
      g.scale(1, -1);
    }
    g.fillStyle = '#b3101f';
    g.fillRect(7, 1, 10, 8);
    U.ellipse(g, 12, 10, 12, 3.5);
    g.fillStyle = '#2a2623';
    g.fillRect(7, 6, 10, 2);
    return c;
  }

  // 가야 할 곳 위에 띄우는 초록 화살표
  function makeGoalMark() {
    const c = U.makeCanvas(16, 16), g = c.getContext('2d');
    g.fillStyle = '#fff';
    U.polygon(g, [4, 0, 12, 0, 12, 7, 16, 7, 8, 16, 0, 7, 4, 7]);
    g.fillStyle = '#1f8a4c';
    U.polygon(g, [6, 2, 10, 2, 10, 9, 12.5, 9, 8, 13.5, 3.5, 9, 6, 9]);
    return c;
  }

  // 표적 머리 위에 띄우는 둥근 표시
  function makeAlertMark(text, back, front) {
    const c = U.makeCanvas(18, 18), g = c.getContext('2d');
    g.fillStyle = '#2a2623';
    U.ellipse(g, 9, 9, 9, 9);
    g.fillStyle = back;
    U.ellipse(g, 9, 9, 8, 8);
    g.fillStyle = front;
    g.font = 'bold 14px Helvetica, Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 9, 10);
    return c;
  }

  const DRAW = { crepe: drawCrepe, brulee: drawBrulee, chocolat: drawChocolat };
  const made = {};

  // 디저트 그림. 한 번 그린 것은 다시 쓴다.
  function dessert(id, eaten) {
    const key = id + eaten;
    if (!made[key]) {
      made[key] = U.makeCanvas(DW, DH);
      DRAW[id](made[key].getContext('2d'), eaten);
    }
    return made[key];
  }

  return {
    cafe: makeCafe(), dessert, BITES,
    targetMark: makeTargetMark(), alertMark: makeAlertMark('!', '#e0182d', '#fff'), goalMark: makeGoalMark(),
    paperStar: [makePaperStar(false), makePaperStar(true)], hat: [makeHat(false), makeHat(true)],
  };
})();
