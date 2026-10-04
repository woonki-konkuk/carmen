window.CS = window.CS || {};

// 여러 곳에서 함께 쓰는 작은 도구.
CS.util = {
  makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  },

  // 같은 씨앗이면 늘 같은 순서의 난수를 낸다.
  rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  // 칸 좌표로 정해지는 고정된 수. 같은 칸은 늘 같은 모습이 된다.
  hash(x, y) {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  },

  // (x, y)가 player에게서 reach(칸) 안에 있고, player가 그쪽을 바라보는가.
  // cos: 시선과 그 방향 사이 각도의 코사인이 이보다 커야 한다.
  faces(player, x, y, reach, cos) {
    const dx = x - player.x, dy = y - player.y;
    const dist = Math.hypot(dx, dy);
    return dist < reach && (dx * Math.cos(player.a) + dy * Math.sin(player.a)) / dist > cos;
  },

  // 낱말 끝 글자에 받침이 있으면 withFinal, 없으면 withoutFinal을 붙인다. 예: josa('마임 밤', '이', '가') → '마임 밤이'
  josa(word, withFinal, withoutFinal) {
    const code = word.charCodeAt(word.length - 1) - 0xAC00;
    const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
    return word + (hasFinal ? withFinal : withoutFinal);
  },

  ellipse(g, x, y, rx, ry) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
  },

  polygon(g, points) {
    g.beginPath();
    g.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) g.lineTo(points[i], points[i + 1]);
    g.closePath();
    g.fill();
  },
};
