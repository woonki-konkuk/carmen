window.CS = window.CS || {};

// 한 바퀴(360도)를 두르는 하늘 그림. 아래 끝이 지평선이다.
// 몽마르트르에서는 동쪽(각도 0) 멀리 사크레쾨르가 보인다.
CS.sky = (function () {
  const U = CS.util;
  const PW = 2048, PH = 150;
  const TOP = '#5f9fd8';

  const canvas = U.makeCanvas(PW, PH), g = canvas.getContext('2d');
  const rand = U.rng(21);

  // 그림의 양 끝이 이어지도록 좌우로 한 번씩 더 그린다
  function wrap(x, draw) {
    for (const shift of [-PW, 0, PW]) {
      g.save();
      g.translate(x + shift, 0);
      draw();
      g.restore();
    }
  }

  function drawSacreCoeur() {
    const LIT = '#f2f2ee', SHADE = '#d6dde1', DARK = '#a9b5be';
    const b = PH - 32;  // 성당 바닥선

    // 언덕과 나무
    g.fillStyle = '#b4c4b3';
    U.ellipse(g, 0, PH + 14, 200, 44);
    g.fillStyle = '#a2b5a3';
    for (let i = -6; i <= 6; i++) {
      if (i === 0) continue;
      U.ellipse(g, i * 24, PH - 12 - (6 - Math.abs(i)) * 2.4, 13, 7);
    }
    g.fillStyle = '#d3dad2';
    g.fillRect(-6, b, 12, 32);

    // 종탑
    g.fillStyle = LIT;
    g.fillRect(34, b - 66, 12, 66);
    U.ellipse(g, 40, b - 66, 6, 10);
    g.fillStyle = SHADE;
    g.fillRect(40, b - 66, 6, 66);
    g.fillStyle = DARK;
    g.fillRect(36, b - 58, 2, 8);
    g.fillRect(42, b - 58, 2, 8);

    // 몸체
    g.fillStyle = LIT;
    g.fillRect(-34, b - 30, 68, 30);
    g.fillStyle = SHADE;
    g.fillRect(10, b - 30, 24, 30);

    // 옆 돔
    for (const x of [-24, 24]) {
      g.fillStyle = x < 0 ? LIT : SHADE;
      U.ellipse(g, x, b - 32, 8, 13);
      g.fillRect(x - 1.5, b - 50, 3, 6);
    }

    // 가운데 큰 돔과 꼭대기
    g.fillStyle = LIT;
    g.fillRect(-13, b - 50, 26, 22);
    U.ellipse(g, 0, b - 52, 13, 24);
    g.fillRect(-3, b - 86, 6, 12);
    U.ellipse(g, 0, b - 86, 4, 5);
    g.fillStyle = SHADE;
    g.fillRect(5, b - 50, 8, 22);
    g.beginPath();
    g.ellipse(0, b - 52, 13, 24, 0, -Math.PI / 2, Math.PI / 2);
    g.ellipse(0, b - 52, 5, 24, 0, Math.PI / 2, -Math.PI / 2, true);
    g.fill();
    g.fillStyle = DARK;
    g.fillRect(-0.5, b - 98, 1, 8);
    g.fillRect(-2, b - 96, 4, 1);
    for (let x = -9; x <= 9; x += 6) g.fillRect(x - 1, b - 46, 2, 8);

    // 입구 아치 셋
    for (const x of [-16, -4, 8]) {
      g.fillRect(x, b - 12, 8, 12);
      U.ellipse(g, x + 4, b - 12, 4, 4);
    }
  }

  const sky = g.createLinearGradient(0, 0, 0, PH);
  sky.addColorStop(0, TOP);
  sky.addColorStop(1, '#d6dde2');
  g.fillStyle = sky;
  g.fillRect(0, 0, PW, PH);

  // 구름
  for (let i = 0; i < 14; i++) {
    const x = rand() * PW, y = 16 + rand() * 62, s = 0.7 + rand() * 0.9;
    wrap(x, () => {
      g.fillStyle = 'rgba(255,255,255,0.8)';
      U.ellipse(g, 0, y, 26 * s, 7 * s);
      U.ellipse(g, -15 * s, y + 2 * s, 16 * s, 5 * s);
      U.ellipse(g, 12 * s, y - 4 * s, 14 * s, 6 * s);
    });
  }

  // 먼 지붕들
  g.fillStyle = '#c3cdd6';
  for (let x = 0; x < PW;) {
    const w = 10 + rand() * 34, h = 5 + rand() * 12;
    g.fillRect(x, PH - h, w + 1, h);
    if (rand() < 0.4) g.fillRect(x + w * 0.3, PH - h - 3, 3, 3);
    x += w;
  }

  if (CS.district.skyline === 'sacre') wrap(0, drawSacreCoeur);

  return { canvas, PW, PH, TOP };
})();
