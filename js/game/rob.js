window.CS = window.CS || {};

// 행인 소매치기: 지나가는 행인 가까이에서 E를 누르면 손기술 게이지로 물건을 훔친다.
// 성공하면 돈이 생긴다. 들키면 추격 게이지가 오른다.
CS.rob = (function () {
  const loot = CS.catalog.loot;
  const REACH = 1.3;     // 이 거리(칸) 안에서
  const FACING = 0.5;    // 행인 쪽을 바라봐야 한다(시선과 방향의 코사인)
  const FAIL_HEAT = 25;  // 들켰을 때 오르는 추격 게이지. 들키지 않고 성공하면 오르지 않는다.

  const totalWeight = loot.reduce((sum, item) => sum + item.weight, 0);

  function pickLoot() {
    let r = Math.random() * totalWeight;
    for (const item of loot) {
      r -= item.weight;
      if (r <= 0) return item;
    }
    return loot[0];
  }

  // 한 사람은 한 번만 털 수 있다. 성공하든 실패하든 다시는 못 건드린다.
  function rob(citizen) {
    citizen.robbed = true;
    CS.pickpocket.start({ lead: '슬쩍 다가갔다!', prize: '물건', glint: '#ffd76a', look: citizen.look }, (quality) => {
      if (quality) {
        const item = pickLoot();
        CS.wallet.add(item.value);
        CS.phone.notify(item.name + ' +' + item.value + '유로');
      } else {
        CS.heat.add(FAIL_HEAT, '행인이 소리를 질렀습니다');
      }
    });
  }

  // 걷는 동안 매 프레임
  function walkFrame(citizens, player) {
    for (const c of citizens) {
      if (!c.robbed && CS.util.faces(player, c.x, c.y, REACH, FACING)) {
        CS.hud.offer('소매치기', () => rob(c));
        return;
      }
    }
  }

  return { walkFrame };
})();
