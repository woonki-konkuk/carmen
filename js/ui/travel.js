window.CS = window.CS || {};

// 구역 사이의 이동. 임무를 끝내면 화면이 어두워지며 되찾은 보석이 반짝이고, 다음 구역에서 다시 시작한다.
// 마지막 임무였으면 엔딩(ending.js)으로 넘어간다.
// 구역에 도착하면 구역 이름이 뜬 검은 화면이 걷힌다.
CS.travel = (function () {
  const save = CS.save, U = CS.util;
  const FADE = 0.9;   // 화면이 어두워지는 시간(초)
  const SHINE = 3;    // 보석이 반짝이는 시간(초)
  const RIDE = 1.8;   // 다음 장소 이름이 떠 있는 시간(초)
  const SIZE = 96;    // 보석 그림의 크기
  const TWINKLES = [[20, 26, 0], [76, 20, 1.7], [82, 62, 3.1], [14, 66, 4.4], [50, 8, 5.2], [64, 86, 2.4]];  // [x, y, 어긋난 박자]

  const curtain = document.getElementById('curtain');
  curtain.innerHTML = '<canvas width="' + SIZE + '" height="' + SIZE + '"></canvas><p class="line"></p><p class="sub"></p>';
  const g = curtain.querySelector('canvas').getContext('2d');
  const line = curtain.querySelector('.line'), sub = curtain.querySelector('.sub');

  let active = false;
  let clock = 0;
  let color = '#fff';
  let next = null;      // 다음 구역. 없으면 마지막 임무였다.
  let riding = false;   // 다음 장소 이름을 띄웠는가
  let leaving = false;

  // 도착: 구역 이름이 뜬 검은 화면이 저절로 걷힌다. 시작 화면이나 회상이 있으면 그것이 끝난 뒤에 부른다.
  function arrive() {
    lift(CS.district.name, '');
  }

  // 전투에서 쓰러졌다가 구역에 처음 도착한 자리에서 깨어난다
  function wake() {
    lift('얼마 뒤', '처음 도착한 자리에서 정신을 차렸다');
  }

  // 글이 뜬 검은 화면이 걷힌다
  function lift(title, note) {
    line.textContent = title;
    sub.textContent = note;
    curtain.className = '';
    void curtain.offsetWidth;  // 걷히는 움직임을 처음부터 다시 틀게 한다
    curtain.className = 'arrive';
  }

  // 임무를 끝냈다. 보석 장면을 보여 주고 다음 구역으로 간다.
  function depart(target) {
    active = true;
    clock = 0;
    riding = leaving = false;
    color = target.color;
    next = CS.districts[save.data.done + 1] || null;
    line.textContent = '「' + target.item + '」';
    sub.textContent = '되찾았다';
    curtain.style.opacity = 0;
    curtain.className = 'depart';
    if (document.exitPointerLock) document.exitPointerLock();
  }

  function star(g, x, y, r) {
    U.polygon(g, [x, y - r, x + r * 0.25, y - r * 0.25, x + r, y, x + r * 0.25, y + r * 0.25,
      x, y + r, x - r * 0.25, y + r * 0.25, x - r, y, x - r * 0.25, y - r * 0.25]);
  }

  // 눈물 모양 보석과 그 둘레의 빛살, 반짝임. g의 가로세로 SIZE인 칸에 그린다.
  function drawGem(g, color, clock) {
    const c = SIZE / 2;

    // 천천히 도는 빛살
    g.save();
    g.translate(c, c + 6);
    g.rotate(clock * 0.6);
    g.globalAlpha = 0.22 + Math.sin(clock * 3) * 0.06;
    g.fillStyle = color;
    for (let i = 0; i < 8; i++) {
      g.rotate(Math.PI / 4);
      U.polygon(g, [0, 0, -5, -46, 5, -46]);
    }
    g.restore();

    // 보석
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(c, 12);
    g.quadraticCurveTo(c - 26, 44, c - 22, 60);
    g.arc(c, 60, 22, Math.PI, 0, true);
    g.quadraticCurveTo(c + 26, 44, c, 12);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.45)';
    U.polygon(g, [c, 14, c - 14, 50, c - 4, 56, c + 2, 30]);
    g.fillStyle = 'rgba(255,255,255,0.8)';
    U.ellipse(g, c - 9, 62, 4, 6);
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.beginPath();
    g.arc(c, 60, 22, 0.15, Math.PI - 0.6);
    g.fill();

    // 반짝임
    g.fillStyle = '#fff';
    for (const [x, y, beat] of TWINKLES) {
      const size = Math.max(0, Math.sin(clock * 4 + beat)) * 7;
      if (size > 0.5) star(g, x, y, size);
    }
  }

  // 보석 장면이 나오는 동안 매 프레임
  function frame(ctx, dt) {
    clock += dt;
    curtain.style.opacity = Math.min(1, clock / FADE);
    if (clock > FADE && !curtain.classList.contains('shine')) CS.sound.play('jewel');
    curtain.classList.toggle('shine', clock > FADE);
    g.clearRect(0, 0, SIZE, SIZE);
    drawGem(g, color, clock);

    if (clock > FADE + SHINE && !next) {
      // 마지막 임무였다. 끝낸 임무 수를 올리고 엔딩으로 넘어간다.
      active = false;
      save.data.done += 1;
      save.commit();
      CS.ending.start();
      return;
    }
    if (clock > FADE + SHINE && !riding) {
      riding = true;
      line.textContent = next.name;
      sub.textContent = '지하철을 타고 다음 장소로 갑니다';
    }
    if (clock > FADE + SHINE + RIDE && !leaving) {
      // 끝낸 임무 수를 올리고 새로 연다. 구역과 표적은 그 수에 맞춰 정해진다.
      leaving = true;
      save.data.done += 1;
      save.commit();
      location.reload();
    }
  }

  return { arrive, wake, depart, busy: () => active, frame, drawGem, GEM_SIZE: SIZE };
})();
