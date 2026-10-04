window.CS = window.CS || {};

// 얼굴을 크게 보여 주는 컷에 쓰는 그림. 320×180 눈금으로 그리고 두 배 크기로 만든다.
CS.portraits = (function () {
  const U = CS.util;
  const W = 320, H = 180, SCALE = 2;

  function start() {
    const c = U.makeCanvas(W * SCALE, H * SCALE), g = c.getContext('2d');
    g.scale(SCALE, SCALE);
    g.lineCap = g.lineJoin = 'round';
    return [c, g];
  }

  function star(g, x, y, r) {
    U.polygon(g, [x, y - r, x + r * 0.28, y - r * 0.28, x + r, y, x + r * 0.28, y + r * 0.28,
      x, y + r, x - r * 0.28, y + r * 0.28, x - r, y, x - r * 0.28, y - r * 0.28]);
  }

  function line(g, color, width, points) {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    g.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) g.lineTo(points[i], points[i + 1]);
    g.stroke();
  }

  // 눈 하나. side: 얼굴 왼쪽(-1)인지 오른쪽(1)인지. 눈꼬리가 바깥으로 길게 올라간다.
  function eye(g, x, y, side) {
    g.fillStyle = '#14161a';
    U.polygon(g, [x - side * 10, y + 1, x + side * 2, y - 7, x + side * 11, y - 4, x + side * 19, y - 10, x + side * 12, y + 2, x + side * 2, y + 5]);
    g.fillStyle = '#f4f1e6';
    U.polygon(g, [x - side * 7, y + 1, x + side * 2, y - 3.5, x + side * 9, y - 1, x + side * 2, y + 3.5]);
    g.fillStyle = '#2f5f58';
    U.ellipse(g, x + side * 2.5, y - 0.2, 3.4, 3.4);
    g.fillStyle = '#14161a';
    U.ellipse(g, x + side * 2.5, y - 0.2, 1.6, 1.6);
    g.fillStyle = '#fff';
    U.ellipse(g, x + side * 1.4, y - 1.4, 0.9, 0.9);
  }

  // 페이퍼 스타: 반반 나뉜 머리를 뿔처럼 틀어 올리고, 징 박힌 연두 재킷을 검은 옷 위에 걸쳤다.
  function makePaperStar() {
    const [c, g] = start();
    const DARK = '#1f3140', TEAL = '#8fc9c2', TEAL_HI = '#b5e0da', SKIN = '#ecd9c6', SKIN_SHADE = '#d9bfa8';
    const MINT = '#a8d5a0', MINT_HI = '#c7e6bb', MINT_SHADE = '#86bd84', BLACK = '#16181d', STUD = '#f1f5ee';
    const cx = 132;

    // 배경: 비스듬한 줄과 종이 표창
    g.fillStyle = '#12303a';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#1b4450';
    for (let x = -H; x < W; x += 34) U.polygon(g, [x, H, x + 14, H, x + 14 + H, 0, x + H, 0]);
    g.fillStyle = 'rgba(255,255,255,0.8)';
    for (const [x, y, r] of [[24, 30, 7], [44, 132, 5], [268, 26, 6], [292, 96, 9], [248, 150, 5], [18, 84, 4]]) star(g, x, y, r);

    // 뿔처럼 틀어 올린 머리(화면 위로 넘어간다)
    for (const side of [-1, 1]) {
      g.strokeStyle = side < 0 ? DARK : TEAL;
      g.lineWidth = 24;
      g.beginPath();
      g.moveTo(cx + side * 20, 34);
      g.bezierCurveTo(cx + side * 64, 44, cx + side * 96, 22, cx + side * 74, -14);
      g.stroke();
      g.strokeStyle = side < 0 ? '#2c4558' : TEAL_HI;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(cx + side * 30, 30);
      g.bezierCurveTo(cx + side * 62, 36, cx + side * 84, 20, cx + side * 72, -8);
      g.stroke();
    }

    // 어깨와 재킷
    g.fillStyle = MINT;
    U.polygon(g, [26, H, 48, 132, 96, 112, 168, 112, 216, 132, 238, H]);
    g.fillStyle = MINT_SHADE;
    U.polygon(g, [26, H, 48, 132, 70, 124, 62, H]);
    U.polygon(g, [238, H, 216, 132, 194, 124, 202, H]);
    // 어깨의 뾰족한 징
    g.fillStyle = STUD;
    for (const [x, y] of [[52, 130], [64, 124], [76, 119], [188, 119], [200, 124], [212, 130]]) {
      U.polygon(g, [x - 5, y + 3, x + (x < cx ? -3 : 3), y - 15, x + 5, y + 3]);
    }
    // 소매의 격자무늬
    g.fillStyle = BLACK;
    g.fillRect(52, 150, 20, 20);
    for (let i = 5; i < 20; i += 5) {
      line(g, MINT, 1, [52 + i, 150, 52 + i, 170]);
      line(g, MINT, 1, [52, 150 + i, 72, 150 + i]);
    }

    // 안에 입은 검은 옷과 붉은 무늬
    g.fillStyle = BLACK;
    U.polygon(g, [108, 116, 156, 116, 166, H, 98, H]);
    g.fillStyle = '#c9502e';
    U.polygon(g, [116, 146, 132, 164, 148, 146, 148, 156, 132, 174, 116, 156]);
    g.fillStyle = '#8f3a22';
    U.polygon(g, [120, 136, 132, 150, 144, 136, 144, 141, 132, 155, 120, 141]);

    // 세운 깃과 그 가장자리의 징
    g.fillStyle = MINT_HI;
    U.polygon(g, [92, 120, 104, 76, 124, 124, 110, 150]);
    U.polygon(g, [172, 120, 160, 76, 140, 124, 154, 150]);
    g.fillStyle = MINT;
    U.polygon(g, [98, 122, 106, 92, 118, 124, 110, 140]);
    U.polygon(g, [166, 122, 158, 92, 146, 124, 154, 140]);
    g.fillStyle = STUD;
    for (let i = 0; i < 5; i++) {
      U.ellipse(g, 106 - i * 2.2, 132 + i * 10, 1.8, 1.8);
      U.ellipse(g, 158 + i * 2.2, 132 + i * 10, 1.8, 1.8);
    }

    // 뒤로 내려온 옆머리
    g.fillStyle = DARK;
    U.polygon(g, [98, 48, 116, 36, 116, 112, 102, 110]);
    g.fillStyle = TEAL;
    U.polygon(g, [166, 48, 148, 36, 148, 112, 162, 110]);

    // 목과 목의 고리
    g.fillStyle = SKIN_SHADE;
    g.fillRect(121, 92, 22, 28);
    g.fillStyle = BLACK;
    g.fillRect(118, 106, 28, 9);
    g.fillStyle = '#d9dde0';
    U.ellipse(g, cx, 119, 7, 7);
    g.fillStyle = BLACK;
    U.ellipse(g, cx, 119, 4, 4);

    // 얼굴
    g.fillStyle = SKIN;
    U.ellipse(g, 104, 76, 5, 8);
    U.ellipse(g, 160, 76, 5, 8);
    U.ellipse(g, cx, 68, 28, 32);
    U.polygon(g, [108, 82, 156, 82, 136, 106, 128, 106]);
    g.fillStyle = 'rgba(214,120,110,0.4)';
    U.ellipse(g, 114, 84, 8, 4);
    U.ellipse(g, 150, 84, 8, 4);

    // 눈썹, 눈, 코, 입
    line(g, '#14161a', 2, [108, 61, 116, 57, 126, 59]);
    line(g, '#14161a', 2, [156, 61, 148, 57, 138, 59]);
    eye(g, 118, 73, -1);
    eye(g, 146, 73, 1);
    line(g, SKIN_SHADE, 1.5, [131, 82, 133, 86, 130, 87]);
    g.fillStyle = '#5a3d78';
    U.polygon(g, [123, 95, 128, 92.5, 132, 94, 136, 92.5, 141, 95, 132, 97]);
    g.fillStyle = '#6f4f92';
    U.ellipse(g, cx, 97.5, 7, 3.2);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    U.ellipse(g, 130, 97, 2.2, 1);

    // 윗머리와 일자 앞머리: 왼쪽은 짙은 색, 오른쪽은 민트색
    g.fillStyle = DARK;
    g.beginPath();
    g.ellipse(cx, 48, 31, 26, 0, Math.PI, Math.PI * 1.5);
    g.lineTo(cx, 48);
    g.fill();
    g.fillRect(101, 44, 31, 16);
    g.fillStyle = TEAL;
    g.beginPath();
    g.ellipse(cx, 48, 31, 26, 0, Math.PI * 1.5, Math.PI * 2);
    g.lineTo(cx, 48);
    g.fill();
    g.fillRect(cx, 44, 31, 16);
    // 앞머리의 결
    for (let x = 106; x < 162; x += 7) line(g, x < cx ? '#2c4558' : TEAL_HI, 1, [x, 46, x, 59]);

    return c;
  }

  // 마임 밤: 하얗게 칠한 얼굴에 검은 눈 화장, 붉은 갈색 머리 위에 크고 납작한 검은 베레모, 어두운 줄무늬 목 폴라.
  function makeMimeBomb() {
    const [c, g] = start();
    const FACE = '#ece9f2', FACE_SHADE = '#d6d0e4', HAIR = '#8a3b24', HAIR_DARK = '#6f2d1b';
    const BLACK = '#17181c', KNIT = '#2f3138', KNIT_STRIPE = '#474a54';
    const cx = 132;

    // 배경: 비스듬한 줄과 말 없는 말풍선
    g.fillStyle = '#2a2f38';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#343a45';
    for (let x = -H; x < W; x += 34) U.polygon(g, [x, H, x + 14, H, x + 14 + H, 0, x + H, 0]);
    for (const [x, y] of [[238, 30], [16, 96]]) {
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.fillRect(x, y, 46, 26);
      U.polygon(g, [x + 10, y + 26, x + 22, y + 26, x + 8, y + 36]);
      g.fillStyle = '#2a2f38';
      for (let i = 0; i < 3; i++) U.ellipse(g, x + 12 + i * 11, y + 13, 3, 3);
    }

    // 얼굴이 띠를 가득 채우게 사람을 조금 키운다(베레모 꼭대기를 기준으로)
    g.translate(cx, 30);
    g.scale(1.2, 1.2);
    g.translate(-cx, -30);

    // 줄무늬 니트와 목 폴라
    g.save();
    g.beginPath();
    g.moveTo(18, H);
    g.lineTo(44, 142);
    g.lineTo(100, 126);
    g.lineTo(164, 126);
    g.lineTo(220, 142);
    g.lineTo(246, H);
    g.closePath();
    g.clip();
    g.fillStyle = KNIT;
    g.fillRect(0, 100, W, 80);
    g.fillStyle = KNIT_STRIPE;
    for (let y = 136; y < H; y += 18) {
      g.beginPath();
      g.ellipse(cx, y + 60, 150, 62, 0, Math.PI, 0);
      g.ellipse(cx, y + 68, 150, 62, 0, 0, Math.PI, true);
      g.fill();
    }
    g.restore();

    // 목
    g.fillStyle = FACE_SHADE;
    U.polygon(g, [121, 92, 143, 92, 146, 116, 118, 116]);
    g.fillStyle = KNIT;
    U.polygon(g, [112, 110, 152, 110, 158, 132, 106, 132]);
    line(g, '#22242a', 1.5, [113, 118, 151, 118]);

    // 옆머리
    g.fillStyle = HAIR;
    U.polygon(g, [100, 50, 110, 44, 108, 92, 103, 104, 99, 94, 94, 98, 96, 70]);
    U.polygon(g, [164, 50, 154, 44, 156, 92, 161, 104, 165, 94, 170, 98, 168, 70]);
    g.fillStyle = HAIR_DARK;
    U.polygon(g, [100, 50, 104, 48, 103, 90, 99, 94]);
    U.polygon(g, [164, 50, 160, 48, 161, 90, 165, 94]);

    // 귀
    g.fillStyle = '#e6cbd0';
    U.ellipse(g, 101, 76, 6, 10);
    U.ellipse(g, 163, 76, 6, 10);
    g.fillStyle = '#d2a9b2';
    U.ellipse(g, 101, 77, 2.5, 5.5);
    U.ellipse(g, 163, 77, 2.5, 5.5);

    // 얼굴: 광대가 넓고 턱이 뾰족하다
    g.fillStyle = FACE;
    U.ellipse(g, cx, 60, 29, 24);
    U.polygon(g, [103, 58, 161, 58, 162, 80, 150, 102, 132, 114, 114, 102, 102, 80]);
    g.fillStyle = FACE_SHADE;
    U.polygon(g, [161, 60, 162, 80, 150, 102, 132, 114, 146, 96, 154, 78]);

    // 눈썹: 한쪽을 치켜올렸다
    line(g, BLACK, 4, [107, 62, 116, 56, 126, 59]);
    line(g, BLACK, 4, [139, 57, 149, 52, 158, 58]);

    // 눈: 검게 칠한 동그라미에서 위아래와 바깥으로 뾰족하게 뺐다
    for (const side of [-1, 1]) {
      const x = cx + side * 15, y = 77;
      g.fillStyle = BLACK;
      U.ellipse(g, x, y, 10.5, 10.5);
      U.polygon(g, [x - 3.5, y - 9, x, y - 17, x + 3.5, y - 9]);
      U.polygon(g, [x - 3.5, y + 9, x, y + 18, x + 3.5, y + 9]);
      U.polygon(g, [x + side * 9, y - 3, x + side * 17, y, x + side * 9, y + 3]);
      g.fillStyle = '#e4e8f2';
      U.ellipse(g, x, y, 6.2, 6.2);
      g.fillStyle = '#7f9cc4';
      U.ellipse(g, x, y, 3.8, 3.8);
      g.fillStyle = BLACK;
      U.ellipse(g, x, y, 1.7, 1.7);
      g.fillStyle = '#fff';
      U.ellipse(g, x - 1.4, y - 1.6, 1, 1);
    }

    // 코와 꾹 다문 입
    g.fillStyle = '#c9c2da';
    U.polygon(g, [128, 91, 136, 91, 132, 96]);
    g.fillStyle = '#b8667a';
    U.polygon(g, [124, 104, 129, 101, 132, 102.5, 135, 101, 140, 104, 132, 105.5]);
    g.fillStyle = '#cf8494';
    U.ellipse(g, cx, 106.5, 5.5, 2.6);

    // 크고 납작한 베레모: 왼쪽으로 기울었다
    g.fillStyle = BLACK;
    U.polygon(g, [66, 50, 90, 22, 150, 8, 200, 20, 206, 34, 188, 46, 150, 54, 100, 60]);
    U.ellipse(g, 102, 14, 7, 5);
    g.fillRect(100, 14, 4, 10);
    g.fillStyle = '#2b2d33';
    U.polygon(g, [66, 50, 100, 60, 150, 54, 188, 46, 206, 34, 186, 40, 150, 47, 100, 53]);

    return c;
  }

  // 타이거리스: 눈꼬리가 위로 솟은 검은 가면에 초록 눈 유리, 옆으로 넘겨 뒤로 묶은 흰 금발, 보라 입술,
  // 적갈색 호랑이 줄무늬의 검은 옷, 치켜든 발톱.
  function makeTigress() {
    const [c, g] = start();
    const SUIT = '#1d1d22', STRIPE = '#c9602a', SKIN = '#f0d2bc', HAIR = '#ece8e0', HAIR_DARK = '#c9c3b8';
    const LENS = '#a6e05a', LIPS = '#8e4a9e', CLAW = '#d9dde0';
    const cx = 132;

    // 배경: 타오르는 주황빛, 비스듬한 줄과 발톱 자국
    g.fillStyle = '#b8431a';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#c95220';
    for (let x = -H; x < W; x += 34) U.polygon(g, [x, H, x + 14, H, x + 14 + H, 0, x + H, 0]);
    g.fillStyle = 'rgba(255, 176, 84, 0.3)';
    U.ellipse(g, cx + 14, 80, 100, 100);
    for (let i = 0; i < 3; i++) line(g, 'rgba(255,255,255,0.8)', 3, [246 + i * 16, 24, 276 + i * 16, 88]);

    // 사람을 조금 키운다(머리 꼭대기를 기준으로)
    g.translate(cx, 14);
    g.scale(1.15, 1.15);
    g.translate(-cx, -14);

    // 뒤로 묶은 머리
    g.fillStyle = HAIR;
    U.polygon(g, [150, 40, 208, 48, 236, 108, 214, 160, 202, 112, 170, 76]);
    g.fillStyle = HAIR_DARK;
    U.polygon(g, [170, 76, 202, 112, 214, 160, 206, 118, 180, 84]);

    // 어깨와 목, 가슴으로 모이는 호랑이 줄무늬
    g.fillStyle = SUIT;
    U.polygon(g, [22, H, 46, 140, 100, 122, 164, 122, 218, 140, 242, H]);
    g.fillRect(120, 96, 24, 30);
    g.fillStyle = STRIPE;
    for (const side of [-1, 1]) {
      U.polygon(g, [cx + side * 86, 136, cx + side * 50, 150, cx + side * 53, 157, cx + side * 90, 145]);
      U.polygon(g, [cx + side * 36, 124, cx + side * 6, 146, cx + side * 9, 153, cx + side * 42, 129]);
      U.polygon(g, [cx + side * 15, 110, cx + side * 3, 120, cx + side * 5, 125, cx + side * 15, 117]);
    }

    // 얼굴
    g.fillStyle = SKIN;
    U.ellipse(g, cx, 74, 29, 33);
    U.polygon(g, [108, 86, 156, 86, 138, 108, 126, 108]);

    // 옆으로 넘긴 앞머리
    g.fillStyle = HAIR;
    g.beginPath();
    g.ellipse(cx, 62, 30.5, 23, 0, Math.PI, 0);
    g.fill();
    U.polygon(g, [cx + 16, 42, cx - 8, 44, cx - 27, 56, cx - 35, 86, cx - 29, 88, cx - 22, 66, cx - 4, 57, cx + 20, 54]);
    U.polygon(g, [cx + 8, 44, cx + 29, 56, cx + 33, 82, cx + 27, 66, cx + 14, 56]);
    line(g, HAIR_DARK, 1.5, [cx + 14, 44, cx - 12, 51, cx - 27, 68]);
    line(g, HAIR_DARK, 1.2, [cx + 20, 48, cx, 54]);

    // 눈꼬리가 위로 솟은 가면. 가장자리는 적갈색.
    for (const side of [-1, 1]) {
      const mask = [cx, 65, cx + side * 10, 62, cx + side * 21, 59, cx + side * 37, 40, cx + side * 31, 68,
        cx + side * 26, 80, cx + side * 14, 83, cx + side * 4, 78, cx, 75];
      g.fillStyle = SUIT;
      U.polygon(g, mask);
      line(g, STRIPE, 1.6, mask);
    }

    // 빛나는 눈 유리
    for (const side of [-1, 1]) {
      g.fillStyle = LENS;
      U.polygon(g, [cx + side * 24, 63, cx + side * 6, 69, cx + side * 8, 78, cx + side * 21, 76]);
      g.fillStyle = 'rgba(255,255,255,0.6)';
      U.polygon(g, [cx + side * 21, 65.5, cx + side * 12, 68.5, cx + side * 13, 71, cx + side * 20, 68.5]);
    }

    // 코와 비웃는 입
    line(g, '#d3ae96', 1.5, [131, 87, 133, 91, 130, 92]);
    g.fillStyle = LIPS;
    U.polygon(g, [119, 98, 146, 93, 141, 102, 126, 103]);
    g.fillStyle = '#fff';
    U.polygon(g, [139, 95, 143, 94.5, 141.5, 99.5]);

    // 치켜든 발톱
    g.strokeStyle = SUIT;
    g.lineWidth = 24;
    g.beginPath();
    g.moveTo(52, H);
    g.lineTo(56, 104);
    g.stroke();
    g.fillStyle = STRIPE;
    g.fillRect(43, 134, 26, 6);
    g.fillRect(42, 150, 26, 6);
    g.fillStyle = CLAW;
    for (const [x, y] of [[32, 46], [54, 38], [76, 46]]) U.polygon(g, [x, y, (x + 56 * 2) / 3 - 5, 92, (x + 56 * 2) / 3 + 5, 92]);
    g.fillStyle = '#2b2b31';
    U.ellipse(g, 56, 100, 18, 17);

    return c;
  }

  return { paperStar: makePaperStar(), mimeBomb: makeMimeBomb(), tigress: makeTigress() };
})();
