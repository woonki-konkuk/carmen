window.CS = window.CS || {};

// 얼굴을 크게 보여 주는 컷. 가로 띠가 미끄러져 들어와 얼굴과 이름을 보여 주고 사라진다.
CS.cutin = (function () {
  const SHOW = 2.3;  // 컷이 떠 있는 시간(초)
  const OUT = 0.25;  // 그중 사라지는 데 쓰는 마지막 시간(초)

  const panel = document.getElementById('cutin');
  let active = false;
  let clock = 0;
  let after = null;

  // who: { name, title, portrait(portraits.js의 그림 이름), band(띠 색) }. 끝나면 done을 부른다.
  function show(who, done) {
    active = true;
    clock = 0;
    after = done;
    CS.sound.play('cutin');
    if (document.exitPointerLock) document.exitPointerLock();
    panel.innerHTML =
      '<div class="band" style="background:' + who.band + '">' +
      '<img alt="" src="' + CS.portraits[who.portrait].toDataURL() + '">' +
      '<div class="name"><b>' + who.name + '</b><span>' + who.title + '</span></div></div>';
    panel.className = 'panel';
  }

  // 컷이 떠 있는 동안 매 프레임. E나 Space로 넘길 수 있다.
  function frame(ctx, dt) {
    clock += dt;
    const input = CS.input;
    if (clock > 0.4 && (input.consume('KeyE') || input.consume('Space') || input.consume('Enter'))) clock = Math.max(clock, SHOW - OUT);
    panel.classList.toggle('out', clock > SHOW - OUT);
    if (clock < SHOW) return;
    active = false;
    panel.className = 'panel hidden';
    after();
  }

  return { show, busy: () => active, frame };
})();
