window.CS = window.CS || {};

// 거리에 세우는 그림판(가로등, 나무, 사람)을 코드로 그린다.
// w, h는 세상에서 차지하는 크기(칸)이다.
CS.sprites = (function () {
  const U = CS.util;
  const PERSON_PX_W = 48, PERSON_PX_H = 96;
  const PERSON_W = 0.3, PERSON_H = 0.6;  // 사람이 세상에서 차지하는 크기(칸)
  const HORN_ROOM = 14;                  // 뿔 머리를 그릴 머리 위의 여백(픽셀)

  const SKINS = ['#f1d0b0', '#e2b58e', '#c98f62', '#8d5a3b'];
  const HAIRS = ['#2a2420', '#5a3b25', '#8a5a2b', '#c9a45c', '#b9b3aa', '#7a2e1f'];
  const COATS = ['#2f3e5c', '#b58a4f', '#6f7378', '#5b6b47', '#7a2e3a', '#2b2b2e', '#d9cfb8', '#2f6f73', '#c46a3a'];
  const PANTS = ['#2b2f3a', '#4a4038', '#5a6470', '#cfc6b2'];
  const HATS = [null, null, null, 'beret', 'fedora', 'cap'];
  const HAT_COLORS = ['#2b2b2e', '#7a2e3a', '#2f3e5c', '#b58a4f', '#5b6b47'];
  const SCARVES = [null, null, '#c23b3b', '#e0b84a', '#f0ece0', '#3f6b4a'];
  const BAGS = [null, null, 'shoulder', 'backpack'];
  const BAG_COLORS = ['#6b4a2e', '#2b2b2e', '#a33b2e', '#3f5d7a'];

  function makeLamp() {
    const c = U.makeCanvas(24, 112), g = c.getContext('2d');
    const IRON = '#1f2a26';
    g.fillStyle = 'rgba(0,0,0,0.22)';
    U.ellipse(g, 12, 109, 10, 2.5);
    g.fillStyle = IRON;
    g.fillRect(8, 103, 8, 7);
    g.fillRect(9, 97, 6, 6);
    g.fillRect(10.5, 30, 3, 68);
    g.fillRect(9, 62, 6, 3);
    g.fillRect(8, 28, 8, 3);
    g.fillStyle = '#f6e7a8';
    U.polygon(g, [7, 28, 17, 28, 19, 12, 5, 12]);
    g.fillStyle = IRON;
    g.fillRect(11.5, 12, 1, 16);
    g.fillRect(4, 9, 16, 3);
    U.polygon(g, [6, 9, 18, 9, 14, 3, 10, 3]);
    g.fillRect(11, 0, 2, 3);
    return c;
  }

  function makeTree() {
    const c = U.makeCanvas(96, 160), g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0.22)';
    U.ellipse(g, 48, 156, 24, 4);
    g.fillStyle = '#6e5b4b';
    U.polygon(g, [43, 157, 53, 157, 51, 70, 45, 70]);
    U.polygon(g, [47, 90, 30, 62, 33, 60, 50, 84]);
    U.polygon(g, [49, 90, 66, 62, 63, 60, 47, 84]);
    g.fillStyle = '#3f7340';
    U.ellipse(g, 48, 48, 42, 38);
    U.ellipse(g, 26, 62, 20, 16);
    U.ellipse(g, 70, 62, 20, 16);
    g.fillStyle = '#55934d';
    U.ellipse(g, 36, 40, 24, 21);
    U.ellipse(g, 62, 44, 22, 19);
    U.ellipse(g, 48, 26, 20, 15);
    g.fillStyle = '#6fae5c';
    U.ellipse(g, 36, 30, 11, 8);
    U.ellipse(g, 60, 34, 9, 7);
    return c;
  }

  // 지하철 입구. 등불 달린 초록 기둥 둘이 간판을 들고 있고, 그 아래로 지나간다.
  function makeMetro() {
    const c = U.makeCanvas(128, 144), g = c.getContext('2d');
    const GREEN = '#2f6b4f', DARK = '#234f3b';

    g.fillStyle = 'rgba(0,0,0,0.22)';
    U.ellipse(g, 16, 141, 12, 3);
    U.ellipse(g, 112, 141, 12, 3);

    for (const flip of [false, true]) {
      g.save();
      if (flip) {
        g.translate(128, 0);
        g.scale(-1, 1);
      }
      // 기둥
      g.strokeStyle = GREEN;
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(16, 142);
      g.bezierCurveTo(16, 96, 7, 62, 21, 36);
      g.quadraticCurveTo(29, 22, 21, 13);
      g.stroke();
      // 밑동 장식
      g.fillStyle = DARK;
      U.polygon(g, [8, 144, 24, 144, 22, 106, 16, 97, 10, 106]);
      // 등불
      g.fillStyle = '#e8662a';
      U.ellipse(g, 19, 12, 6, 9);
      g.fillStyle = '#f7a64a';
      U.ellipse(g, 18, 10, 3, 5);
      g.restore();
    }

    // 간판
    g.fillStyle = '#ecdca0';
    g.strokeStyle = GREEN;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(20, 60);
    g.lineTo(20, 46);
    g.quadraticCurveTo(64, 34, 108, 46);
    g.lineTo(108, 60);
    g.closePath();
    g.fill();
    g.stroke();
    g.font = 'bold 9px Helvetica, Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = DARK;
    g.fillText('MÉTROPOLITAIN', 64, 51);
    return c;
  }

  // 에펠탑. 네 다리가 벌어져 올라가 뾰족한 꼭대기로 모인다.
  function makeEiffel() {
    const c = U.makeCanvas(140, 300), g = c.getContext('2d');
    const IRON = '#7a6654', DARK = '#5a4a3c';

    for (const flip of [false, true]) {
      g.save();
      if (flip) {
        g.translate(140, 0);
        g.scale(-1, 1);
      }
      // 다리
      g.fillStyle = IRON;
      g.beginPath();
      g.moveTo(4, 300);
      g.quadraticCurveTo(34, 262, 43, 214);
      g.lineTo(61, 214);
      g.quadraticCurveTo(54, 268, 40, 300);
      g.closePath();
      g.fill();
      // 가운데 몸통과 꼭대기까지
      U.polygon(g, [44, 208, 70, 208, 70, 150, 57, 150]);
      U.polygon(g, [59, 145, 70, 145, 70, 38, 67, 38]);
      // 철골의 엇갈린 선
      g.strokeStyle = DARK;
      g.lineWidth = 1;
      g.beginPath();
      for (let y = 222; y < 296; y += 16) {
        g.moveTo(10 + (300 - y) * 0.36, y);
        g.lineTo(34 + (300 - y) * 0.24, y + 14);
      }
      for (let y = 156; y < 204; y += 12) {
        g.moveTo(46 + (208 - y) * 0.2, y + 10);
        g.lineTo(70, y);
      }
      for (let y = 48; y < 140; y += 12) {
        g.moveTo(60 + (145 - y) * 0.07, y + 10);
        g.lineTo(70, y);
      }
      g.stroke();
      g.restore();
    }

    // 다리 사이의 둥근 아치
    g.strokeStyle = IRON;
    g.lineWidth = 4;
    g.beginPath();
    g.arc(70, 262, 34, Math.PI * 1.08, Math.PI * 1.92);
    g.stroke();

    // 전망대 세 층과 안테나
    g.fillStyle = DARK;
    g.fillRect(34, 206, 72, 9);
    g.fillRect(52, 144, 36, 7);
    g.fillRect(63, 34, 14, 6);
    g.fillRect(69, 6, 2, 28);
    return c;
  }

  // 루브르의 유리 피라미드
  function makePyramid() {
    const c = U.makeCanvas(200, 128), g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0.2)';
    U.ellipse(g, 100, 124, 100, 4);
    g.fillStyle = 'rgba(176,220,238,0.82)';
    U.polygon(g, [2, 124, 100, 2, 198, 124]);
    g.fillStyle = 'rgba(120,178,206,0.82)';
    U.polygon(g, [100, 2, 198, 124, 118, 124]);
    // 유리판을 나누는 마름모 살
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = 1;
    g.beginPath();
    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      g.moveTo(2 + 98 * t, 124 - 122 * t);
      g.lineTo(2 + 196 * t, 124);
      g.moveTo(198 - 98 * t, 124 - 122 * t);
      g.lineTo(198 - 196 * t, 124);
    }
    g.stroke();
    g.strokeStyle = '#e9f4f8';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(2, 124);
    g.lineTo(100, 2);
    g.lineTo(198, 124);
    g.closePath();
    g.stroke();
    return c;
  }

  // 시민 한 사람의 생김새를 무작위로 정한다.
  function randomLook(rand) {
    const pick = (list) => list[(rand() * list.length) | 0];
    const look = {
      skin: pick(SKINS),
      hair: pick(HAIRS),
      longHair: rand() < 0.4,
      coat: pick(COATS),
      pants: pick(PANTS),
      hat: pick(HATS),
      hatColor: pick(HAT_COLORS),
      scarf: pick(SCARVES),
      bag: pick(BAGS),
      bagColor: pick(BAG_COLORS),
      stripes: null,
    };
    if (rand() < 0.15) {
      look.coat = '#f0ece0';
      look.stripes = '#2f3e5c';
    }
    return look;
  }

  // 팔의 소매와 손을 사각형 [x, y, 너비, 높이]으로 돌려준다.
  //   wallA/wallB  두 손을 들어 보이지 않는 벽을 짚는다(두 손의 높이가 서로 바뀐다)
  //   ropeA/ropeB  두 손을 왼쪽으로 뻗어 보이지 않는 줄을 당긴다
  function armShapes(pose, swing, cuff) {
    if (pose === 'wallA' || pose === 'wallB') {
      const drop = pose === 'wallA' ? [0, 6] : [6, 0];  // 왼손, 오른손이 내려온 정도
      return {
        sleeves: [[9, 33, 6, 8], [5, 26 + drop[0], 5, 14], [33, 33, 6, 8], [38, 26 + drop[1], 5, 14]],
        hands: [[4, 19 + drop[0], 7, 8], [37, 19 + drop[1], 7, 8]],
      };
    }
    if (pose === 'ropeA' || pose === 'ropeB') {
      const pull = pose === 'ropeA' ? 0 : 5;  // 당긴 정도
      return {
        sleeves: [[4 + pull, 36, 12, 5], [7 + pull, 44, 26 - pull, 5]],
        hands: [[pull, 35, 5, 7], [3 + pull, 43, 5, 7]],
      };
    }
    return {
      sleeves: [[10, 33, 5, 26 + swing], [33, 33, 5, 26 - swing]],
      hands: [[10, 59 + swing - cuff, 5, 4 + cuff], [33, 59 - swing - cuff, 5, 4 + cuff]],
    };
  }

  function drawArms(g, look, pose, swing) {
    // 장갑(gloves)을 끼면 손목까지 덮는다. hands: 얼굴과 손 색이 다를 때(분칠한 얼굴).
    const shapes = armShapes(pose, swing, look.gloves ? 3 : 0);
    for (const [x, y, w, h] of shapes.sleeves) {
      g.fillStyle = look.coat;
      g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(0,0,0,0.16)';
      g.fillRect(x, y, w, h);
    }
    g.fillStyle = look.gloves || look.hands || look.skin;
    for (const [x, y, w, h] of shapes.hands) g.fillRect(x, y, w, h);
  }

  // 머리 색. 두 가지 색(hair2)이면 보는 쪽에서 왼쪽이 hair, 오른쪽이 hair2다. 뒷모습에서는 서로 바뀐다.
  function hairSide(look, back, right) {
    return right !== back ? (look.hair2 || look.hair) : look.hair;
  }

  // 앞을 풀어 입은 짧은 재킷(look.jacket). 안에 입은 옷이 가운데로 보이고, 깃을 세웠다.
  //   inner: 안에 입은 옷, accent: 가슴의 무늬, trim: 깃과 밑단의 밝은 색
  function drawJacket(g, look, back) {
    const j = look.jacket;
    g.fillStyle = j.inner;
    U.polygon(g, [14, 31, 34, 31, 35, 63, 13, 63]);

    g.fillStyle = look.coat;
    if (back) {
      U.polygon(g, [13, 31, 35, 31, 37, 56, 11, 56]);
      g.fillStyle = j.trim;
      g.fillRect(11, 54, 26, 2);
      U.polygon(g, [15, 32, 33, 32, 30, 27, 18, 27]);
    } else {
      U.polygon(g, [13, 31, 21, 31, 20, 56, 11, 56]);
      U.polygon(g, [27, 31, 35, 31, 37, 56, 28, 56]);
      g.fillStyle = j.accent;
      U.polygon(g, [21, 39, 27, 39, 24, 47]);
      g.fillStyle = j.trim;
      U.polygon(g, [14, 31, 20, 31, 21, 43, 16, 39]);
      U.polygon(g, [34, 31, 28, 31, 27, 43, 32, 39]);
      U.polygon(g, [14, 32, 19, 32, 15, 24]);
      U.polygon(g, [34, 32, 29, 32, 33, 24]);
    }

    // 징
    g.fillStyle = look.spikes || j.trim;
    const studs = back
      ? [[16, 50], [20, 50], [24, 50], [28, 50], [32, 50], [15, 36], [33, 36]]
      : [[13, 43], [14, 47], [16, 51], [35, 43], [34, 47], [32, 51]];
    for (const [x, y] of studs) g.fillRect(x - 0.75, y, 1.5, 1.5);
  }

  // 사람 그림. back: 뒷모습, step: 걷는 동작 0/1, pose: 마임 동작(없으면 팔을 내린다)
  // look에 넣을 수 있는 꾸밈: hair2(머리의 두 번째 색), bangs(일자 앞머리), horns(뿔처럼 틀어 올린 머리),
  // liner(짙은 눈꼬리), eyeRings(눈 둘레의 검은 화장. 값은 눈동자 색), lips(입술 색), turtleneck(목 폴라),
  // visor(눈꼬리가 솟은 검은 가면 위 눈 유리의 색), ponytail(뒤로 묶은 머리), sweep(옆으로 넘긴 앞머리),
  // chevrons(가슴으로 모이는 줄무늬의 색),
  // jacket(앞을 푼 재킷), spikes(어깨의 뾰족한 징의 색), choker(목의 고리 색)
  function drawPerson(look, back, step, pose) {
    const room = look.horns ? HORN_ROOM : 0;
    const c = U.makeCanvas(PERSON_PX_W, PERSON_PX_H + room), g = c.getContext('2d');
    const lift = step ? [0, 3] : [3, 0];
    const swing = step ? 2 : -2;
    g.translate(0, room);

    g.fillStyle = 'rgba(0,0,0,0.22)';
    U.ellipse(g, 24, 93, 13, 3);

    // 다리와 신발
    for (let i = 0; i < 2; i++) {
      const x = i ? 25 : 18;
      g.fillStyle = look.pants;
      g.fillRect(x, 60, 6, 29 - lift[i]);
      g.fillStyle = '#2a2623';
      g.fillRect(x - 0.5, 88 - lift[i], 7, 4);
    }

    // 내린 팔은 몸보다 먼저 그린다. 마임 동작(pose)의 팔은 몸 앞으로 내밀므로 코트를 그린 다음에 그린다.
    if (!pose) drawArms(g, look, null, swing);

    // 몸통
    if (look.jacket) {
      drawJacket(g, look, back);
    } else {
      g.fillStyle = look.coat;
      U.polygon(g, [14, 31, 34, 31, 36, 66, 12, 66]);
      if (look.stripes) {
        g.fillStyle = look.stripes;
        for (let y = 35; y < 64; y += 5) g.fillRect(14, y, 20, 2);
      }
      if (look.chevrons) {
        g.fillStyle = look.chevrons;
        for (let y = 34; y < 60; y += 6) {
          U.polygon(g, [13.5, y, 22, y + 3.5, 22, y + 5.5, 13.5, y + 2]);
          U.polygon(g, [34.5, y, 26, y + 3.5, 26, y + 5.5, 34.5, y + 2]);
        }
      }
      if (look.suspenders) {
        g.fillStyle = '#2b2b2e';
        g.fillRect(17, 31, 2, 31);
        g.fillRect(29, 31, 2, 31);
      }
    }
    if (pose) drawArms(g, look, pose, swing);
    if (!back && !look.jacket) {
      g.fillStyle = 'rgba(0,0,0,0.22)';
      g.fillRect(23.5, 33, 1, 33);
    }
    if (look.spikes) {
      g.fillStyle = look.spikes;
      for (const x of [11.5, 14.5, 33.5, 36.5]) U.polygon(g, [x - 2, 33, x, 27.5, x + 2, 33]);
    }

    if (look.bag === 'backpack') {
      g.fillStyle = look.bagColor;
      if (back) {
        g.fillRect(16, 32, 16, 21);
        g.fillStyle = 'rgba(0,0,0,0.2)';
        g.fillRect(18, 43, 12, 1);
      } else {
        g.fillRect(16, 31, 2, 17);
        g.fillRect(30, 31, 2, 17);
      }
    } else if (look.bag === 'shoulder') {
      // 가방은 사람의 왼쪽 허리에 있다. 앞에서 보면 오른쪽, 뒤에서 보면 왼쪽.
      const hip = back ? 9 : 29;
      g.strokeStyle = look.bagColor;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(back ? 31 : 17, 31);
      g.lineTo(hip + 5, 54);
      g.stroke();
      g.fillStyle = look.bagColor;
      g.fillRect(hip, 53, 10, 9);
    }

    // 목, 목도리, 목의 고리
    g.fillStyle = look.turtleneck ? look.coat : look.skin;
    g.fillRect(21, 26, 6, 6);
    if (look.scarf) {
      g.fillStyle = look.scarf;
      g.fillRect(17, 27, 14, 6);
      g.fillRect(back ? 19 : 26, 32, 4, 13);
    }
    if (look.choker && !back) {
      g.fillStyle = '#16181d';
      g.fillRect(20.5, 28.5, 7, 2.5);
      g.fillStyle = look.choker;
      U.ellipse(g, 24, 32, 2.4, 2.4);
      g.fillStyle = '#16181d';
      U.ellipse(g, 24, 32, 1.1, 1.1);
    }

    // 머리
    const leftHair = hairSide(look, back, false), rightHair = hairSide(look, back, true);
    if (back) {
      g.fillStyle = leftHair;
      U.ellipse(g, 24, 18, 8.5, 9.5);
      if (look.longHair) g.fillRect(16, 18, 16, 14);
      g.fillStyle = rightHair;
      g.beginPath();
      g.ellipse(24, 18, 8.5, 9.5, 0, -Math.PI / 2, Math.PI / 2);
      g.fill();
      if (look.longHair) g.fillRect(24, 18, 8, 14);
      if (look.ponytail) {
        g.fillStyle = leftHair;
        U.polygon(g, [20.5, 13, 27.5, 13, 28.5, 31, 24, 37, 19.5, 31]);
        g.fillStyle = 'rgba(0,0,0,0.25)';
        g.fillRect(21, 13.5, 6, 1.5);
      }
    } else {
      if (look.ponytail) {
        g.fillStyle = leftHair;
        U.polygon(g, [26, 8, 35, 10, 39, 20, 37, 32, 34, 22, 30, 15]);
      }
      if (look.longHair) {
        g.fillStyle = leftHair;
        g.fillRect(15, 14, 9, 17);
        g.fillStyle = rightHair;
        g.fillRect(24, 14, 9, 17);
      }
      g.fillStyle = look.skin;
      U.ellipse(g, 24, 18, 8, 9.5);
      // 윗머리: 왼쪽과 오른쪽 반씩
      g.fillStyle = leftHair;
      g.beginPath();
      g.ellipse(24, 15, 8.5, 7, 0, Math.PI, Math.PI * 1.5);
      g.lineTo(24, 15);
      g.fill();
      g.fillStyle = rightHair;
      g.beginPath();
      g.ellipse(24, 15, 8.5, 7, 0, Math.PI * 1.5, Math.PI * 2);
      g.lineTo(24, 15);
      g.fill();
      if (look.bangs) {
        g.fillStyle = leftHair;
        g.fillRect(16, 11, 8, 6.5);
        g.fillStyle = rightHair;
        g.fillRect(24, 11, 8, 6.5);
      }
      // 눈과 입
      g.fillStyle = '#2a2623';
      g.fillRect(20, 19, 2, 2);
      g.fillRect(26, 19, 2, 2);
      if (look.eyeRings) {
        // 눈 둘레를 검게 칠하고 위아래로 뾰족하게 뺐다. 가운데는 눈동자 색.
        for (const x of [18.5, 25.5]) {
          g.fillStyle = '#17181c';
          g.fillRect(x, 17.5, 4, 4);
          g.fillRect(x + 1.5, 15.5, 1, 2);
          g.fillRect(x + 1.5, 21.5, 1, 2);
          g.fillStyle = look.eyeRings;
          g.fillRect(x + 1, 18.5, 2, 2);
        }
      }
      if (look.liner) {
        g.fillRect(19, 18.5, 3.5, 1);
        g.fillRect(25.5, 18.5, 3.5, 1);
        g.fillRect(18, 18, 1.5, 1);
        g.fillRect(28.5, 18, 1.5, 1);
      }
      if (look.lips) {
        g.fillStyle = look.lips;
        g.fillRect(22.5, 23.5, 3, 1.5);
      }
      if (look.sweep) {
        // 옆으로 넘긴 앞머리
        g.fillStyle = leftHair;
        U.polygon(g, [30, 9.5, 20, 10.5, 15.5, 14, 15, 20, 17, 16.5, 23, 14, 31, 13]);
      }
      if (look.visor) {
        // 눈을 가린 검은 가면. 눈꼬리 쪽 끝이 위로 뾰족하게 솟고, 그 위에 눈 유리가 있다.
        g.fillStyle = '#1d1d22';
        U.polygon(g, [24, 17.5, 20, 16.5, 14.5, 11.5, 15.5, 21, 19, 23, 24, 21.5, 29, 23, 32.5, 21, 33.5, 11.5, 28, 16.5]);
        g.fillStyle = look.visor;
        U.polygon(g, [17.5, 18, 22.5, 18.8, 22, 21.2, 18.5, 20.8]);
        U.polygon(g, [30.5, 18, 25.5, 18.8, 26, 21.2, 29.5, 20.8]);
      }
    }

    // 뿔처럼 틀어 올린 머리: 양옆으로 벌어졌다가 위에서 안쪽으로 말린다
    if (look.horns) {
      g.lineCap = 'round';
      for (const right of [false, true]) {
        const side = right ? 1 : -1;
        g.strokeStyle = right ? rightHair : leftHair;
        g.lineWidth = 8;
        g.beginPath();
        g.moveTo(24 + side * 4, 9);
        g.quadraticCurveTo(24 + side * 19, 10, 24 + side * 17, -2);
        g.stroke();
        g.lineWidth = 5;
        g.beginPath();
        g.moveTo(24 + side * 17, -2);
        g.quadraticCurveTo(24 + side * 16, -11, 24 + side * 9, -10.5);
        g.stroke();
      }
    }

    // 모자
    g.fillStyle = look.hatColor;
    if (look.hat === 'beret') {
      U.ellipse(g, back ? 22 : 26, 9, 10.5, 4.5);
      g.fillRect(23, 3, 2, 3);
    } else if (look.hat === 'fedora') {
      g.fillRect(17, 3, 14, 9);
      U.ellipse(g, 24, 12, 12.5, 3);
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(17, 8, 14, 2);
    } else if (look.hat === 'cap') {
      g.beginPath();
      g.ellipse(24, 13, 9, 9, 0, Math.PI, 0);
      g.fill();
      if (!back) g.fillRect(15, 12, 18, 2);
    }

    return c;
  }

  // 사람 그림판이 세상에서 차지하는 크기(칸). 뿔 머리는 그만큼 키가 크다.
  function personSize(look) {
    const room = look.horns ? HORN_ROOM : 0;
    return { w: PERSON_W, h: PERSON_H * (PERSON_PX_H + room) / PERSON_PX_H };
  }

  // 앞·뒤 모습 × 걷는 동작 2컷
  function personFrames(look) {
    return {
      front: [drawPerson(look, false, 0), drawPerson(look, false, 1)],
      back: [drawPerson(look, true, 0), drawPerson(look, true, 1)],
    };
  }

  return {
    // solid: 몸으로 막히는가
    lamp: { img: makeLamp(), w: 0.375, h: 1.75, solid: true },
    tree: { img: makeTree(), w: 1.5, h: 2.5, solid: true },
    metro: { img: makeMetro(), w: 1.25, h: 1.4, solid: false },
    // nofog: 멀리 있어도 안개에 묻히지 않는다
    eiffel: { img: makeEiffel(), w: 7, h: 15, solid: false, nofog: true },
    // gap: 몸이 막히는 거리(칸). 없으면 기둥 굵기만큼만 막힌다.
    pyramid: { img: makePyramid(), w: 5.6, h: 3.6, solid: true, gap: 2.3, nofog: true },
    PERSON_W,
    PERSON_H,
    randomLook,
    person: drawPerson,
    personSize,
    personFrames,
  };
})();
