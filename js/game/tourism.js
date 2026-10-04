window.CS = window.CS || {};

// 관광: 카페에서 돈을 내고 디저트를 먹는다. 여행 도감(휴대폰)에 기록되고, 쉬는 동안 추격 게이지가 내려간다.
CS.tourism = (function () {
  const T = CS.textures, input = CS.input, scenes = CS.scenes, save = CS.save;
  const desserts = CS.catalog.desserts;
  const REACH = 1.5;  // 이 거리(칸) 안에서 카페를 바라보면 들어갈 수 있다

  const cafe = document.getElementById('cafe');

  cafe.innerHTML =
    '<div class="cafe-name">카페 드 라 뷔트</div>' +
    '<button class="leave"><kbd>Esc</kbd>나가기</button>' +
    '<div class="bar"><p class="says"></p><div class="choices"></div></div>';
  const says = cafe.querySelector('.says');
  const choices = cafe.querySelector('.choices');
  cafe.querySelector('.leave').addEventListener('click', leave);

  let inside = false;
  let stage = null;    // 'menu' | 'eating' | 'done'
  let ordered = null;  // 주문한 디저트
  let eaten = 0;

  function button(html, onClick, className) {
    const b = document.createElement('button');
    b.innerHTML = html;
    if (className) b.className = className;
    b.addEventListener('click', onClick);
    choices.appendChild(b);
  }

  function showMenu() {
    stage = 'menu';
    ordered = null;
    says.innerHTML = '봉주르! 무엇을 드릴까요? <span class="purse">가진 돈 ' + CS.wallet.value() + '유로</span>';
    choices.innerHTML = '';
    desserts.forEach((item, i) => {
      const tasted = save.data.desserts[item.id] ? ' ✓' : '';
      const poor = CS.wallet.value() < item.price;
      button(
        '<img alt="" src="' + scenes.dessert(item.id, 0).toDataURL() + '">' +
        '<span><kbd>' + (i + 1) + '</kbd>' + item.name + tasted +
        '<small>' + item.price + '유로 · 추격 게이지 −' + item.calm + '</small></span>',
        () => order(item), poor ? 'card poor' : 'card');
    });
  }

  // 값을 치르고 주문한다. 돈이 모자라면 주문할 수 없다.
  function order(item) {
    if (!CS.wallet.spend(item.price)) {
      says.innerHTML = '돈이 모자랍니다. <b>' + item.name + '</b>는 ' + item.price + '유로예요. ' +
        '<span class="purse">가진 돈 ' + CS.wallet.value() + '유로</span>';
      return;
    }
    stage = 'eating';
    ordered = item;
    eaten = 0;
    says.innerHTML = '<b>' + item.name + '</b> — ' + item.text;
    choices.innerHTML = '';
    button('<kbd>E</kbd>' + item.verb, bite);
  }

  function bite() {
    eaten++;
    CS.sound.play('bite');
    if (eaten < scenes.BITES) return;

    stage = 'done';
    const fresh = !save.data.desserts[ordered.id];
    if (fresh) {
      save.data.desserts[ordered.id] = true;
      save.commit();
    }
    says.innerHTML = fresh
      ? '새로운 맛! 여행 도감에 <b>' + ordered.name + '</b> 기록.'
      : '잘 먹었습니다. 이미 도감에 있는 디저트예요.';
    choices.innerHTML = '';
    button('<kbd>E</kbd>하나 더 주문', showMenu);
    if (CS.heat.value() > 0) CS.heat.add(-ordered.calm, '카페에서 쉬었습니다');
  }

  function enter() {
    inside = true;
    if (document.exitPointerLock) document.exitPointerLock();
    cafe.classList.remove('hidden');
    showMenu();
  }

  function leave() {
    inside = false;
    cafe.classList.add('hidden');
  }

  // 걷는 동안 매 프레임: 카페 앞이면 들어갈 수 있다.
  function walkFrame(world, player) {
    const hit = CS.raycaster.probe(world, player);
    if (hit !== null && hit.dist < REACH && T.groundOf(hit.type - 1) === T.CAFE) {
      CS.hud.offer('카페에 들어가기', enter);
    }
  }

  // 카페 안에 있는 동안 매 프레임
  function frame(ctx) {
    ctx.drawImage(scenes.cafe, 0, 0);
    if (ordered) ctx.drawImage(scenes.dessert(ordered.id, eaten), 165, 96, 150, 100);

    if (input.consume('Escape')) {
      leave();
    } else if (stage === 'menu') {
      desserts.forEach((item, i) => {
        if (input.consume('Digit' + (i + 1))) order(item);
      });
    } else if (input.consume('KeyE')) {
      if (stage === 'eating') bite();
      else showMenu();
    }
  }

  return {
    busy: () => inside,
    walkFrame,
    frame,
  };
})();
