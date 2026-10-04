window.CS = window.CS || {};

// 가진 돈(유로). 행인에게서 훔쳐 벌고 카페에서 쓴다.
CS.wallet = (function () {
  const save = CS.save;
  const el = document.getElementById('money');

  function render() {
    el.textContent = save.data.money + '유로';
  }

  function add(amount) {
    if (amount > 0) CS.sound.play('coin');
    save.data.money += amount;
    save.commit();
    render();
  }

  // 돈이 모자라면 쓰지 않고 false를 돌려준다
  function spend(amount) {
    if (save.data.money < amount) return false;
    add(-amount);
    CS.sound.play('pay');
    return true;
  }

  // 가진 돈을 모두 내놓고, 얼마였는지 돌려준다
  function empty() {
    const had = save.data.money;
    add(-had);
    return had;
  }

  render();
  return { add, spend, empty, value: () => save.data.money };
})();
