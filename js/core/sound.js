window.CS = window.CS || {};

// 효과음. 소리 파일 없이 그때그때 만들어 낸다(짧은 음과 걸러 낸 잡음을 겹쳐서).
// CS.sound.play('hit')처럼 이름으로 튼다. 휴대폰 설정에서 끌 수 있다.
CS.sound = (function () {
  const save = CS.save;
  const VOLUME = 0.5;  // 전체 크기

  let ctx = null;      // 브라우저는 사람이 한 번 누른 뒤에야 소리를 낼 수 있게 한다
  let out = null;
  let hiss = null;     // 1초짜리 잡음

  // 처음 누를 때 소리 장치를 깨운다
  function wake() {
    if (!ctx) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      ctx = new Audio();
      out = ctx.createGain();
      out.gain.value = VOLUME;
      out.connect(ctx.destination);
      hiss = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = hiss.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
  }
  window.addEventListener('keydown', wake);
  window.addEventListener('mousedown', wake);

  // 음 하나. 높이가 from에서 to로 미끄러지며 사라진다. { wave, from, to, time, gain }
  function tone(at, o) {
    const osc = ctx.createOscillator(), amp = ctx.createGain();
    osc.type = o.wave || 'sine';
    osc.frequency.setValueAtTime(o.from, at);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, at + o.time);
    amp.gain.setValueAtTime(o.gain, at);
    amp.gain.exponentialRampToValueAtTime(0.001, at + o.time);
    osc.connect(amp);
    amp.connect(out);
    osc.start(at);
    osc.stop(at + o.time + 0.02);
  }

  // 잡음 한 줄기. 걸러 내는 높이가 from에서 to로 움직이며 사라진다. { kind, from, to, time, gain, q }
  function noise(at, o) {
    const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), amp = ctx.createGain();
    src.buffer = hiss;
    filter.type = o.kind || 'bandpass';
    filter.Q.value = o.q || 1;
    filter.frequency.setValueAtTime(o.from, at);
    if (o.to) filter.frequency.exponentialRampToValueAtTime(o.to, at + o.time);
    amp.gain.setValueAtTime(o.gain, at);
    amp.gain.exponentialRampToValueAtTime(0.001, at + o.time);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(out);
    src.start(at, Math.random() * 0.5);
    src.stop(at + o.time + 0.02);
  }

  // 높이가 다른 음을 차례로 낸다. 음 사이는 gap초, 음마다 설정 o를 쓴다.
  function run(notes, gap, o) {
    return notes.map((from, i) => [i * gap, tone, Object.assign({ from }, o)]);
  }

  // 소리마다 만드는 법. 한 줄은 [몇 초 뒤에, 음인지 잡음인지, 설정]이다.
  const SOUNDS = {
    // 화면과 휴대폰
    chime: run([660, 990], 0.16, { wave: 'triangle', time: 0.3, gain: 0.5 }),                   // 소리가 나는지 들어 보는 용도
    ui: [[0, tone, { wave: 'triangle', from: 740, time: 0.04, gain: 0.14 }]],                   // 확인, 다음
    open: [[0, tone, { wave: 'triangle', from: 520, to: 780, time: 0.07, gain: 0.16 }]],        // 휴대폰을 연다
    close: [[0, tone, { wave: 'triangle', from: 780, to: 520, time: 0.07, gain: 0.16 }]],       // 휴대폰을 닫는다
    message: run([1175, 1568], 0.1, { time: 0.2, gain: 0.3 }),                                  // 새 메시지
    start: run([523, 784, 1047], 0.1, { wave: 'triangle', time: 0.3, gain: 0.3 }),              // 게임을 시작한다

    // 걷기, 돈, 추격 게이지
    step: [[0, noise, { kind: 'lowpass', from: 420, to: 160, time: 0.06, gain: 0.22 }]],        // 발소리
    coin: run([1319, 1760], 0.07, { time: 0.2, gain: 0.3 }),                                    // 돈이 생겼다
    pay: run([1047, 784], 0.07, { time: 0.16, gain: 0.25 }),                                    // 돈을 냈다
    bite: [[0, noise, { from: 900, to: 500, time: 0.07, gain: 0.3, q: 3 }]],                    // 디저트를 한입 먹는다
    heat: run([330, 330], 0.1, { wave: 'square', time: 0.08, gain: 0.14 }),                     // 추격 게이지가 올랐다
    alarm: run([880, 880, 880], 0.16, { wave: 'square', time: 0.1, gain: 0.16 }),               // 게이지가 거의 찼다
    calm: [[0, tone, { from: 660, to: 440, time: 0.35, gain: 0.25 }]],                          // 게이지가 내려갔다

    // 추격과 소매치기
    alert: run([880, 1320], 0.07, { wave: 'square', time: 0.11, gain: 0.16 }),                  // 표적이 알아챘다
    cutin: [[0, noise, { from: 300, to: 2400, time: 0.28, gain: 0.35 }],                        // 얼굴 컷이 들어온다
      [0.22, tone, { from: 130, to: 60, time: 0.35, gain: 0.7 }]],
    reach: [[0, tone, { wave: 'triangle', from: 300, to: 520, time: 0.25, gain: 0.12 }]],       // 주머니로 손을 뻗는다
    good: run([784, 1047], 0.09, { wave: 'triangle', time: 0.2, gain: 0.3 }),                   // 성공
    perfect: run([784, 1047, 1568], 0.09, { wave: 'triangle', time: 0.3, gain: 0.3 }),          // 완벽한 성공
    bad: [[0, tone, { wave: 'sawtooth', from: 220, to: 150, time: 0.28, gain: 0.3 }]],          // 실패
    jewel: run([1047, 1319, 1568, 2093], 0.09, { wave: 'triangle', time: 0.28, gain: 0.28 })    // 보석을 되찾았다
      .concat([[0, noise, { kind: 'highpass', from: 6000, time: 0.6, gain: 0.08 }]]),
    siren: run([620, 470, 620, 470], 0.18, { wave: 'square', time: 0.17, gain: 0.15 }),         // 형사가 나타났다
    caught: [[0, tone, { wave: 'sawtooth', from: 392, to: 196, time: 0.45, gain: 0.35 }],       // 형사에게 붙잡혔다
      [0.1, noise, { kind: 'lowpass', from: 800, to: 200, time: 0.3, gain: 0.3 }]],
    escape: run([523, 659, 784, 1047], 0.1, { wave: 'triangle', time: 0.3, gain: 0.3 }),        // 지하철로 빠져나갔다

    // 모자 던지기 전투와 연습
    throw: [[0, noise, { from: 500, to: 1900, time: 0.16, gain: 0.3 }]],                        // 모자를 던진다
    hatHit: [[0, tone, { from: 330, to: 140, time: 0.1, gain: 0.6 }],                           // 모자가 맞는다
      [0, noise, { kind: 'lowpass', from: 1800, to: 500, time: 0.05, gain: 0.4 }]],
    star: [[0, noise, { kind: 'highpass', from: 2500, to: 5000, time: 0.1, gain: 0.18 }]],      // 표창이나 공이 날아온다

    // 엔딩과 감옥
    fanfare: run([523, 659, 784], 0.14, { wave: 'triangle', time: 0.2, gain: 0.3 })             // 엔딩이 열린다
      .concat(run([1047, 784, 523], 0, { wave: 'triangle', time: 0.7, gain: 0.22 }).map((n) => [0.42, n[1], n[2]])),
    gem: run([1568, 2093], 0.08, { time: 0.3, gain: 0.25 }),                                    // 보석이 하나 떠오른다
    jail: [[0, tone, { wave: 'square', from: 150, to: 90, time: 0.5, gain: 0.3 }],              // 감방 문이 닫힌다
      [0, noise, { from: 2600, time: 0.35, gain: 0.3, q: 8 }],
      [0.05, noise, { kind: 'lowpass', from: 500, to: 100, time: 0.5, gain: 0.5 }]],
    unlock: run([880, 1320], 0.1, { wave: 'square', time: 0.14, gain: 0.14 }),                  // 잠금장치가 풀린다

    // 주먹 전투
    // 주먹 전투
    punch: [[0, noise, { from: 1300, to: 400, time: 0.08, gain: 0.35 }]],                       // 주먹을 내지른다
    hit: [[0, tone, { from: 190, to: 55, time: 0.13, gain: 0.9 }],                              // 주먹이 맞는다
      [0, noise, { kind: 'lowpass', from: 2200, to: 300, time: 0.06, gain: 0.6 }]],
    blocked: [[0, tone, { wave: 'triangle', from: 240, to: 170, time: 0.06, gain: 0.35 }],      // 주먹이 막힌다
      [0, noise, { from: 700, time: 0.04, gain: 0.25 }]],
    dodge: [[0, noise, { from: 450, to: 1500, time: 0.13, gain: 0.25 }]],                       // 옆으로 비킨다
    raise: [[0, tone, { wave: 'triangle', from: 420, to: 760, time: 0.09, gain: 0.16 }]],       // 상대가 손을 치켜든다
    feint: [[0, tone, { wave: 'square', from: 900, time: 0.04, gain: 0.1 }],                    // 속임 동작
      [0.06, tone, { wave: 'square', from: 1250, time: 0.05, gain: 0.1 }]],
    swipe: [[0, noise, { from: 2800, to: 600, time: 0.14, gain: 0.45, q: 2 }]],                 // 상대가 휘두른다
    guard: [[0, tone, { wave: 'triangle', from: 320, to: 190, time: 0.09, gain: 0.5 }],         // 막아 냈다
      [0, noise, { kind: 'lowpass', from: 1200, to: 400, time: 0.06, gain: 0.4 }]],
    hurt: [[0, tone, { wave: 'sawtooth', from: 150, to: 45, time: 0.24, gain: 0.55 }],          // 내가 맞았다
      [0, noise, { kind: 'lowpass', from: 1500, to: 200, time: 0.16, gain: 0.6 }]],
    rage: [[0, tone, { wave: 'sawtooth', from: 110, to: 62, time: 0.8, gain: 0.45 }],           // 분노해 울부짖는다
      [0, tone, { wave: 'sawtooth', from: 116, to: 66, time: 0.8, gain: 0.3 }],
      [0, noise, { kind: 'lowpass', from: 700, to: 250, time: 0.8, gain: 0.35 }]],
    down: [[0, tone, { from: 220, to: 40, time: 0.5, gain: 0.8 }],                              // 상대가 쓰러진다
      [0.05, noise, { kind: 'lowpass', from: 900, to: 150, time: 0.4, gain: 0.5 }],
      [0.5, tone, { wave: 'triangle', from: 523, time: 0.12, gain: 0.3 }],
      [0.62, tone, { wave: 'triangle', from: 784, time: 0.25, gain: 0.3 }]],
    fall: [[0, tone, { wave: 'sawtooth', from: 200, to: 50, time: 0.6, gain: 0.5 }],            // 내가 쓰러진다
      [0.1, noise, { kind: 'lowpass', from: 600, to: 120, time: 0.5, gain: 0.5 }]],
  };

  function play(name) {
    if (!ctx || save.data.quiet) return;
    const now = ctx.currentTime;
    for (const [delay, make, o] of SOUNDS[name]) make(now + delay, o);
  }

  // 소리를 켜거나 끈다. 켤 때는 확인 삼아 소리를 하나 낸다.
  function toggle() {
    save.data.quiet = !save.data.quiet;
    save.commit();
    if (!save.data.quiet) play('chime');
  }

  return {
    play,
    toggle,
    quiet: () => save.data.quiet,
    // 소리 장치. 사람이 아직 한 번도 누르지 않았으면 없다(null). 배경음악(music.js)이 함께 쓴다.
    context: () => ctx,
  };
})();
