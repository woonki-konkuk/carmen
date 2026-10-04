window.CS = window.CS || {};

// 휴대폰: 해커 플레이어의 메시지, 지도, 여행 도감, 설정(진행, 효과음과 배경음악, 새 게임).
CS.phone = (function () {
  const T = CS.textures, input = CS.input, save = CS.save;
  const REVEAL = 6;         // 지도에서 내 주변 이만큼(칸)이 밝혀진다
  const INTRO_DELAY = 2.5;  // 구역에 도착하고 메시지가 오기까지(초)
  const TOAST_TIME = 6;     // 새 메시지 알림이 떠 있는 시간(초)
  const CELL = 12;          // 지도 한 칸의 크기(픽셀)

  const APPS = [
    { id: 'messages', name: '메시지', color: '#2f9e5b', icon: '<path d="M4 5h16v11H10l-5 4v-4H4z"/>', render: renderMessages },
    { id: 'map', name: '지도', color: '#2f6fb3', icon: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/>', render: renderMap },
    { id: 'journal', name: '도감', color: '#d9822b', icon: '<path d="M6 4h10a3 3 0 0 1 3 3v13H9a3 3 0 0 1-3-3z"/>', render: renderJournal },
    { id: 'settings', name: '설정', color: '#6b7078', icon: '<path fill-rule="evenodd" d="M10.5 2h3l.5 2.6 2 .9 2.2-1.5 2.1 2.1-1.5 2.2.9 2 2.6.5v3l-2.6.5-.9 2 1.5 2.2-2.1 2.1-2.2-1.5-2 .9-.5 2.6h-3l-.5-2.6-2-.9-2.2 1.5-2.1-2.1 1.5-2.2-.9-2L2 13.5v-3l2.6-.5.9-2L4 5.8l2.1-2.1 2.2 1.5 2-.9zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>', render: renderSettings },
  ];
  const MAP_COLORS = {
    unseen: '#262b33', building: '#b7a888', cafe: '#a3222a', shop: '#3f5d7a',
    road: '#8f8c88', sidewalk: '#d6d0c3', grass: '#8fb878', metro: '#2f6b4f', tree: '#4f8a4a', me: '#e0182d', target: '#7b2fbf',
  };

  const screen = document.getElementById('screen');
  const root = document.getElementById('phone');
  const hud = document.getElementById('phone-button');
  const toast = document.getElementById('toast');

  root.innerHTML =
    '<div class="status"><span>PARIS</span><span class="notch"></span><button class="shut">✕ 닫기</button></div>' +
    '<div class="head"><button class="back">‹</button><b class="title"></b></div>' +
    '<div class="body"></div>' +
    '<button class="shut foot">✕ 휴대폰 닫기</button>';
  const head = root.querySelector('.head');
  const title = root.querySelector('.title');
  const body = root.querySelector('.body');

  let open = false;
  let app = null;      // 열려 있는 앱. null이면 첫 화면.
  let world = null, player = null;
  let seen = null;     // 지도에서 밝혀진 칸
  let clock = 0;
  let toastTimer = 0;

  // 받은 메시지. 지금은 없는 묶음 이름(옛 저장 기록)은 건너뛴다.
  function inbox() {
    return save.data.batches.flatMap((key) => CS.story.messages[key] || []);
  }

  function badge() {
    const unread = inbox().length - save.data.read;
    return unread > 0 ? '<i class="badge">' + unread + '</i>' : '';
  }

  function renderHud() {
    hud.innerHTML = '<kbd>Tab</kbd>휴대폰' + badge();
  }

  function renderHome() {
    let html = '<div class="home">';
    APPS.forEach((a, i) => {
      html += '<button class="app" data-app="' + a.id + '">' +
        '<span class="icon" style="background:' + a.color + '"><svg viewBox="0 0 24 24">' + a.icon + '</svg></span>' +
        (a.id === 'messages' ? badge() : '') + a.name + '<kbd>' + (i + 1) + '</kbd></button>';
    });
    // 배경의 모자 그림
    html += '<svg class="hat" viewBox="0 0 100 50"><ellipse cx="50" cy="40" rx="48" ry="8"/>' +
      '<path d="M26 40c0-22 8-32 24-32s24 10 24 32z"/></svg></div>';
    body.innerHTML = html;
  }

  function renderMessages() {
    const list = inbox();
    body.innerHTML = '<div class="thread">' +
      '<div class="who"><span class="avatar">P</span><span>플레이어<small>화이트햇 해커 · 나이아가라폴스</small></span></div>' +
      (list.length
        ? list.map((text) => '<p class="bubble">' + text + '</p>').join('')
        : '<p class="empty">아직 받은 메시지가 없습니다.</p>') +
      '</div>';
    body.scrollTop = body.scrollHeight;

    if (save.data.read !== list.length) {
      save.data.read = list.length;
      save.commit();
      renderHud();
    }
  }

  function renderMap() {
    const C = MAP_COLORS;
    body.innerHTML = '<div class="map"><canvas></canvas><div class="legend">' +
      '<span><i style="background:' + C.me + '"></i>나</span>' +
      '<span><i style="background:' + C.target + '"></i>표적</span>' +
      '<span><i style="background:' + C.cafe + '"></i>카페</span>' +
      '<span><i style="background:' + C.shop + '"></i>가게</span>' +
      '<span><i style="background:' + C.metro + '"></i>지하철</span>' +
      '</div><p class="empty">걸어 본 곳만 지도에 나타납니다.</p></div>';
    const canvas = body.querySelector('canvas');
    canvas.width = world.w * CELL;
    canvas.height = world.h * CELL;
    const g = canvas.getContext('2d');

    for (let y = 0; y < world.h; y++) {
      for (let x = 0; x < world.w; x++) {
        const i = y * world.w + x;
        let color = C.unseen;
        if (seen[i]) {
          const wall = world.walls[i], floor = world.floors[i];
          if (wall) {
            const ground = T.groundOf(wall - 1);
            color = ground === T.CAFE ? C.cafe : ground >= T.SHOP ? C.shop : C.building;
          } else {
            color = floor === T.ROAD ? C.road : floor === T.SIDEWALK ? C.sidewalk : floor === T.GRASS ? C.grass : C.metro;
          }
        }
        g.fillStyle = color;
        g.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }

    g.fillStyle = C.tree;
    for (const p of world.props) {
      if (p.kind === 'tree' && seen[Math.floor(p.y) * world.w + Math.floor(p.x)]) {
        CS.util.ellipse(g, p.x * CELL, p.y * CELL, CELL * 0.4, CELL * 0.4);
      }
    }

    // 표적: 플레이어가 알려 준 자리라 안 가 본 곳이어도 보인다
    const t = CS.chase.body;
    if (!t.hidden) {
      g.fillStyle = '#fff';
      CS.util.ellipse(g, t.x * CELL, t.y * CELL, CELL * 0.75, CELL * 0.75);
      g.fillStyle = C.target;
      CS.util.ellipse(g, t.x * CELL, t.y * CELL, CELL * 0.5, CELL * 0.5);
    }

    // 나: 바라보는 쪽을 가리키는 화살표
    g.save();
    g.translate(player.x * CELL, player.y * CELL);
    g.rotate(player.a);
    g.fillStyle = '#fff';
    CS.util.polygon(g, [CELL * 1.1, 0, -CELL * 0.8, -CELL * 0.8, -CELL * 0.4, 0, -CELL * 0.8, CELL * 0.8]);
    g.fillStyle = C.me;
    CS.util.polygon(g, [CELL * 0.8, 0, -CELL * 0.6, -CELL * 0.55, -CELL * 0.25, 0, -CELL * 0.6, CELL * 0.55]);
    g.restore();
  }

  function renderJournal() {
    const desserts = CS.catalog.desserts;
    const count = desserts.filter((item) => save.data.desserts[item.id]).length;
    let html = '<p class="count">디저트 ' + count + ' / ' + desserts.length + '</p>';
    for (const item of desserts) {
      const img = '<img alt="" src="' + CS.scenes.dessert(item.id, 0).toDataURL() + '">';
      html += save.data.desserts[item.id]
        ? '<div class="entry">' + img + '<div><b>' + item.name + '</b><small>' + item.fr + '</small><p>' + item.text + '</p></div></div>'
        : '<div class="entry unknown">' + img + '<div><b>???</b><small>아직 맛보지 못함</small></div></div>';
    }
    body.innerHTML = html;
  }

  // 설정: 지금까지의 진행, 효과음 켜고 끄기, 새 게임. asking이면 정말 지울지 한 번 더 묻는다.
  function renderSettings(asking) {
    const done = save.data.done;
    body.innerHTML = '<div class="settings">' +
      '<h3>진행</h3><p>되찾은 보석 ' + done + ' / 3' +
      CS.story.targets.slice(0, done).map((t) => '<br>「' + t.item + '」').join('') + '</p>' +
      '<h3>소리</h3><p>효과음이 ' + (CS.sound.quiet() ? '꺼져' : '켜져') + ' 있습니다.</p>' +
      '<button data-act="sound">' + (CS.sound.quiet() ? '소리 켜기' : '소리 끄기') + '</button>' +
      (CS.sound.quiet() ? '' : ' <button data-act="listen">소리 들어 보기</button>') +
      '<p>배경음악이 ' + (CS.music.still() ? '꺼져' : '켜져') + ' 있습니다.</p>' +
      '<button data-act="music">' + (CS.music.still() ? '음악 켜기' : '음악 끄기') + '</button>' +
      '<h3>새 게임</h3><p>돈, 도감, 메시지, 되찾은 보석을 모두 지우고 처음부터 시작합니다.</p>' +
      (asking === true
        ? '<p><b>정말 지울까요?</b></p><button class="danger" data-act="wipe">지우고 처음부터</button> <button data-act="keep">그만두기</button>'
        : '<button class="danger" data-act="ask">새 게임</button>') +
      '</div>';
  }

  function render() {
    const current = APPS.find((a) => a.id === app);
    head.classList.toggle('hidden', !current);
    body.scrollTop = 0;
    if (current) {
      title.textContent = current.name;
      current.render();
    } else {
      renderHome();
    }
  }

  function show(id) {
    open = true;
    app = id || null;
    toast.classList.add('hidden');
    if (document.exitPointerLock) document.exitPointerLock();
    screen.classList.add('phone-open');
    root.classList.add('open');
    CS.sound.play('open');
    render();
  }

  function hide() {
    open = false;
    CS.sound.play('close');
    screen.classList.remove('phone-open');
    root.classList.remove('open');
  }

  function back() {
    if (app) {
      app = null;
      render();
    } else {
      hide();
    }
  }

  // 메시지 묶음(story.js의 이름)을 받는다. 이미 받은 것은 무시한다.
  function deliver(key) {
    if (save.data.batches.includes(key)) return;
    save.data.batches.push(key);
    save.commit();
    CS.sound.play('message');
    renderHud();
    if (open) render();
    else notify('<b>플레이어</b> 새 메시지가 왔습니다 · <kbd>Tab</kbd>');
  }

  // 화면 위쪽에 잠깐 알림을 띄운다
  function notify(html) {
    toast.innerHTML = html;
    toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), TOAST_TIME * 1000);
  }

  // 걷는 동안 매 프레임
  function walkFrame(w, p, dt) {
    world = w;
    player = p;
    if (!seen) seen = new Uint8Array(world.w * world.h);

    // 내 주변을 지도에 밝힌다
    const px = Math.floor(p.x), py = Math.floor(p.y);
    for (let y = Math.max(0, py - REVEAL); y <= Math.min(world.h - 1, py + REVEAL); y++) {
      for (let x = Math.max(0, px - REVEAL); x <= Math.min(world.w - 1, px + REVEAL); x++) {
        if ((x - px) * (x - px) + (y - py) * (y - py) <= REVEAL * REVEAL) seen[y * world.w + x] = 1;
      }
    }

    clock += dt;
    // 구역에 도착하면 그 임무를 알리는 메시지가 온다
    if (clock > INTRO_DELAY && save.data.done < CS.story.targets.length) deliver(CS.story.target.hello);

    if (input.consume('Tab')) show();
    else if (input.consume('KeyQ')) show('journal');
  }

  // 휴대폰이 열려 있는 동안 매 프레임
  function frame() {
    if (input.consume('Tab')) return hide();
    if (input.consume('Escape')) return back();
    if (input.consume('KeyQ')) return app === 'journal' ? hide() : show('journal');
    if (!app) {
      APPS.forEach((a, i) => {
        if (input.consume('Digit' + (i + 1))) show(a.id);
      });
    }
  }

  root.querySelector('.back').addEventListener('click', back);
  // 닫는 방법: 위와 아래의 닫기 단추, 휴대폰 바깥(게임 화면)을 누르기, Tab
  for (const button of root.querySelectorAll('.shut')) button.addEventListener('click', hide);
  document.getElementById('view').addEventListener('click', () => {
    if (open) hide();
  });
  body.addEventListener('click', (e) => {
    const button = e.target.closest('[data-app]');
    if (button) show(button.dataset.app);

    const act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'ask') renderSettings(true);
    else if (act.dataset.act === 'keep') renderSettings(false);
    else if (act.dataset.act === 'wipe') save.reset();
    else if (act.dataset.act === 'sound') {
      CS.sound.toggle();
      renderSettings(false);
    } else if (act.dataset.act === 'listen') {
      CS.sound.play('chime');
    } else if (act.dataset.act === 'music') {
      CS.music.toggle();
      renderSettings(false);
    }
  });
  hud.addEventListener('click', () => show());
  renderHud();

  return {
    busy: () => open,
    walkFrame,
    frame,
    deliver,
    notify,
  };
})();
