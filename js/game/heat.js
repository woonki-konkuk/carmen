window.CS = window.CS || {};

// ACME 추격 게이지(0~100). 소매치기하다 들키거나, 전투에서 지거나, 형사에게 붙잡히면 오르고, 카페에서 쉬면 내려간다.
// 가득 차면 형사에게 붙잡혀 가진 돈을 모두 빼앗기고 감옥에 갇힌다(jail.js). 다시 하면 이 구역의 처음부터다.
CS.heat = (function () {
  const save = CS.save;
  const el = document.getElementById('heat');
  const DANGER = 80;  // 이만큼 차면 경고하고 게이지가 깜박인다

  function render() {
    el.classList.toggle('danger', save.data.heat >= DANGER);
    el.innerHTML = 'ACME 추격<i><b style="width:' + save.data.heat + '%"></b></i>';
  }

  function bust() {
    const lost = CS.wallet.empty();
    save.data.heat = 0;
    save.commit();
    render();
    CS.jail.start(lost);
  }

  // 게이지가 처음 올랐을 때 한 번만, 게이지가 무엇이고 어떻게 낮추는지 알려 준다
  function explain() {
    save.data.heatTold = true;
    save.commit();
    CS.notice.show('ACME 추격 게이지',
      '<p>왼쪽 위의 빨간 막대입니다. ACME가 카르멘을 얼마나 바짝 쫓고 있는지를 나타냅니다.</p>' +
      '<p><b>오를 때</b> · 행인을 소매치기하다 들킬 때, 표적에게 손을 뿌리쳐질 때, 전투에서 쓰러질 때, 보석을 들고 달아나다 형사에게 붙잡힐 때. 들키지 않고 성공하면 오르지 않습니다.</p>' +
      '<p><b>가득 차면</b> · ACME에 붙잡혀 감옥에 갇히고, 가진 돈을 모두 빼앗깁니다.</p>' +
      '<p><b>낮추려면</b> · 카페에 들어가 디저트를 사 먹습니다. 값은 행인에게서 슬쩍한 돈으로 냅니다.</p>');
  }

  // why: 화면 위쪽 알림에 띄울 까닭
  function add(amount, why) {
    const before = save.data.heat;
    save.data.heat = Math.max(0, Math.min(100, before + amount));
    save.commit();
    render();
    const warn = before < DANGER && save.data.heat >= DANGER;
    CS.phone.notify(why + ' · 추격 게이지 ' + (amount > 0 ? '+' : '') + amount +
      (warn ? '<br><b>ACME가 바짝 따라붙었습니다. 게이지가 다 차면 감옥에 갑니다</b>' : ''));
    if (amount > 0) CS.sound.play(warn ? 'alarm' : 'heat');
    else if (amount < 0) CS.sound.play('calm');
    if (save.data.heat >= 100) bust();
    else if (amount > 0 && !save.data.heatTold) explain();
  }

  render();
  return { add, value: () => save.data.heat };
})();
