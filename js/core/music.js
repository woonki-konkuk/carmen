window.CS = window.CS || {};

// 배경음악. 소리 파일 없이 악보(아래 TRACKS)를 그때그때 연주한다.
// CS.music.want('street')처럼 지금 어울리는 곡을 알려 주면, 곡이 바뀔 때 앞의 곡은 잦아들고 새 곡이 시작된다.
// 휴대폰 설정에서 끌 수 있다.
CS.music = (function () {
  const save = CS.save;
  const VOLUME = 0.16;  // 효과음보다 작게 깐다
  const AHEAD = 1.5;    // 이만큼(초) 앞까지 미리 연주를 걸어 둔다
  const TICK = 200;     // 걸어 둘 것이 있는지 살피는 간격(밀리초)
  const FADE = 0.7;     // 곡이 바뀔 때 잦아드는 시간(초)
  const HALF = 2;       // 악보의 길이 단위: 한 박의 절반

  // 화음마다 [베이스 음, 반주로 짚는 세 음]
  const CHORDS = {
    Am: ['A2', ['A3', 'C4', 'E4']],
    Dm: ['D3', ['A3', 'D4', 'F4']],
    E7: ['E2', ['G#3', 'B3', 'D4']],
    G: ['G2', ['G3', 'B3', 'D4']],
    C: ['C3', ['G3', 'C4', 'E4']],
    F: ['F2', ['A3', 'C4', 'F4']],
    Em: ['E2', ['G3', 'B3', 'E4']],
    D: ['D3', ['F#3', 'A3', 'D4']],
    B7: ['B2', ['A3', 'B3', 'D#4']],
  };

  // 곡. beat: 한 박의 길이(초), beats: 한 마디의 박 수, comp: 반주의 꼴, lead: 가락을 내는 악기,
  // loud: 곡의 크기, bars: 마디마다 [화음, 가락].
  // 가락은 '음이름:길이'를 띄어 적는다. 길이는 반 박 단위이고, 쉼표는 '-'다.
  const TRACKS = {
    // 거리를 걸을 때: 아코디언풍의 느긋한 왈츠
    street: {
      beat: 0.4, beats: 3, comp: 'waltz', lead: 'accordion', loud: 1,
      bars: [
        ['Am', 'E5:2 A5:2 C6:2'],
        ['Am', 'B5:2 A5:2 E5:2'],
        ['Dm', 'F5:2 A5:2 D6:2'],
        ['Dm', 'C6:2 A5:2 F5:2'],
        ['E7', 'E5:2 G#5:2 B5:2'],
        ['E7', 'D6:2 B5:2 G#5:2'],
        ['Am', 'A5:6'],
        ['Am', '-:2 E5:1 A5:1 C6:1 B5:1'],
        ['Am', 'C6:2 B5:1 A5:1 E5:2'],
        ['Dm', 'D6:2 C6:1 A5:1 F5:2'],
        ['G', 'B5:2 A5:1 G5:1 D5:2'],
        ['C', 'E5:2 G5:2 C6:2'],
        ['F', 'A5:2 G5:1 F5:1 C5:2'],
        ['Dm', 'D5:2 F5:2 A5:2'],
        ['E7', 'G#5:2 B5:1 A5:1 G#5:2'],
        ['Am', 'A5:4 -:2'],
      ],
    },

    // 추격, 전투, 도망: 빠르게 몰아치는 곡
    action: {
      beat: 0.36, beats: 4, comp: 'drive', lead: 'square', loud: 1,
      bars: [
        ['Em', 'E5:1 G5:1 B5:1 E5:1 G5:1 B5:1 A5:1 G5:1'],
        ['Em', 'F#5:1 G5:1 E5:2 B4:2 E5:2'],
        ['C', 'C5:1 E5:1 G5:1 C5:1 E5:1 G5:1 F#5:1 E5:1'],
        ['D', 'D5:1 F#5:1 A5:2 F#5:2 D5:2'],
        ['Em', 'E5:1 G5:1 B5:1 E6:1 D6:1 B5:1 A5:1 G5:1'],
        ['Em', 'B5:2 A5:1 G5:1 E5:4'],
        ['C', 'C5:1 E5:1 G5:1 C6:1 B5:1 G5:1 E5:1 C5:1'],
        ['B7', 'B4:1 D#5:1 F#5:1 A5:1 B5:2 -:2'],
      ],
    },

    // 시작 화면: 느긋하고 비밀스러운 곡
    title: {
      beat: 0.5, beats: 4, comp: 'stroll', lead: 'accordion', loud: 0.9,
      bars: [
        ['Am', 'A4:2 C5:2 E5:3 D5:1'],
        ['F', 'C5:2 A4:2 F4:4'],
        ['Dm', 'D5:2 F5:2 A5:3 G5:1'],
        ['E7', 'F5:1 E5:1 D5:2 B4:4'],
        ['Am', 'A4:2 C5:2 E5:2 A5:2'],
        ['F', 'G5:1 F5:1 E5:2 C5:4'],
        ['E7', 'B4:2 D5:2 G#5:3 E5:1'],
        ['Am', 'A5:6 -:2'],
      ],
    },

    // 회상: 오르골 같은 느린 왈츠
    memory: {
      beat: 0.5, beats: 3, comp: 'waltz', lead: 'bell', loud: 0.8,
      bars: [
        ['C', 'G5:2 E5:2 C5:2'],
        ['Am', 'A5:2 E5:2 C5:2'],
        ['F', 'A5:2 F5:2 C5:2'],
        ['G', 'B5:2 G5:2 D5:2'],
        ['C', 'C6:2 G5:2 E5:2'],
        ['Am', 'C6:2 A5:2 E5:2'],
        ['G', 'B5:2 D6:2 G5:2'],
        ['C', 'C6:4 -:2'],
      ],
    },

    // 엔딩: 밝고 따뜻한 곡
    ending: {
      beat: 0.48, beats: 4, comp: 'harp', lead: 'bell', loud: 1,
      bars: [
        ['C', 'E5:2 G5:2 C6:4'],
        ['G', 'B5:2 A5:2 G5:4'],
        ['Am', 'A5:2 C6:2 E6:3 D6:1'],
        ['F', 'C6:2 A5:2 F5:4'],
        ['C', 'E5:2 G5:2 C6:2 E6:2'],
        ['G', 'D6:3 C6:1 B5:4'],
        ['F', 'A5:2 C6:2 F6:2 E6:2'],
        ['C', 'C6:6 -:2'],
      ],
    },

    // 감옥: 느리고 쓸쓸한 곡
    jail: {
      beat: 0.6, beats: 4, comp: 'stroll', lead: 'reed', loud: 0.9,
      bars: [
        ['Am', 'E5:3 D5:1 C5:2 A4:2'],
        ['Dm', 'F5:3 E5:1 D5:4'],
        ['Am', 'E5:2 C5:2 A4:3 B4:1'],
        ['E7', 'G#4:4 B4:2 -:2'],
      ],
    },
  };

  const NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  // 'G#5' 같은 음이름을 떨림수(Hz)로
  function pitch(name) {
    const sharp = name[1] === '#';
    const octave = Number(name.slice(sharp ? 2 : 1));
    const midi = 12 * (octave + 1) + NAMES[name[0]] + (sharp ? 1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // 반주의 꼴마다, 한 마디에서 낼 반주 음들: [때(박), 길이(박), 떨림수, 악기]
  const COMPS = {
    // 쿵-짝-짝
    waltz(beats, bass, triad) {
      const list = [[0, 1, pitch(bass), 'bass']];
      for (let b = 1; b < beats; b++) for (const name of triad) list.push([b, 0.5, pitch(name), 'chord']);
      return list;
    },
    // 느긋한 걸음: 첫 박과 셋째 박에 베이스, 그 사이에 화음
    stroll(beats, bass, triad) {
      const list = [];
      for (let b = 0; b < beats; b += 2) {
        list.push([b, 1.5, pitch(bass), 'bass']);
        for (const name of triad) list.push([b + 1, 0.6, pitch(name), 'chord']);
      }
      return list;
    },
    // 펼친 화음: 베이스를 길게 깔고 화음의 음을 하나씩 뜯는다
    harp(beats, bass, triad) {
      const list = [[0, beats, pitch(bass), 'bass']];
      for (let b = 1; b < beats; b++) list.push([b, 1.2, pitch(triad[(b - 1) % triad.length]), 'pluck']);
      return list;
    },
    // 몰아치기: 반 박마다 베이스, 둘째·넷째 박에 화음, 북과 심벌
    drive(beats, bass, triad) {
      const list = [];
      for (let b = 0; b < beats; b += 0.5) {
        list.push([b, 0.45, pitch(bass) * (b % 1 ? 2 : 1), 'bass']);
        list.push([b, 0.1, 0, 'hat']);
      }
      for (let b = 0; b < beats; b++) {
        list.push([b, 0.3, 0, b % 2 ? 'snare' : 'kick']);
        if (b % 2) for (const name of triad) list.push([b, 0.3, pitch(name), 'chord']);
      }
      return list;
    },
  };

  // 한 마디에서 낼 음들: [마디 안에서의 때(박), 길이(박), 떨림수, 악기]
  function notesOf(piece, bar) {
    const [chord, tune] = piece.bars[bar];
    const [bass, triad] = CHORDS[chord];
    const list = COMPS[piece.comp](piece.beats, bass, triad);
    let at = 0;
    for (const token of tune.split(' ')) {
      const [name, length] = token.split(':');
      const beats = Number(length) / HALF;
      if (name !== '-') list.push([at, beats, pitch(name), piece.lead]);
      at += beats;
    }
    return list;
  }

  let ctx = null;
  let master = null;
  let hiss = null;     // 북과 심벌에 쓰는 잡음
  let wanted = null;   // 틀고 싶은 곡의 이름
  let playing = null;  // 지금 트는 곡 { name, piece, gain, bar, at }

  // 떨리는 소리 하나를 amp(또는 거르개)에 잇는다
  function wave(type, freq, cents, to, at, end) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = cents;
    osc.connect(to);
    osc.start(at);
    osc.stop(end + 0.05);
    return osc;
  }

  function lowpass(freq, to) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    filter.connect(to);
    return filter;
  }

  // 길게 이어지는 소리의 크기: 빨리 커졌다가 끝에서 잦아든다
  function hold(amp, loud, at, end) {
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.linearRampToValueAtTime(loud, at + 0.03);
    amp.gain.setValueAtTime(loud, Math.max(at + 0.03, end - 0.06));
    amp.gain.linearRampToValueAtTime(0.0001, end + 0.04);
  }

  // 튕기는 소리의 크기: 바로 났다가 사라진다
  function pluck(amp, loud, at, end) {
    amp.gain.setValueAtTime(loud, at);
    amp.gain.exponentialRampToValueAtTime(0.001, end);
  }

  // 잡음으로 내는 북과 심벌
  function drum(amp, kind, at) {
    if (kind === 'kick') {
      const osc = wave('sine', 140, 0, amp, at, at + 0.14);
      osc.frequency.exponentialRampToValueAtTime(45, at + 0.12);
      return pluck(amp, 0.7, at, at + 0.14);
    }
    const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter();
    const snare = kind === 'snare', time = snare ? 0.11 : 0.03;
    src.buffer = hiss;
    filter.type = snare ? 'bandpass' : 'highpass';
    filter.frequency.value = snare ? 1800 : 6000;
    src.connect(filter);
    filter.connect(amp);
    src.start(at, Math.random() * 0.5);
    src.stop(at + time + 0.02);
    pluck(amp, snare ? 0.3 : 0.1, at, at + time);
  }

  // 음 하나를 건다. 악기마다 소리의 결이 다르다.
  function sound(bus, at, length, freq, kind) {
    const amp = ctx.createGain();
    amp.connect(bus);
    const end = at + length;
    if (kind === 'kick' || kind === 'snare' || kind === 'hat') return drum(amp, kind, at);
    if (kind === 'accordion') {
      // 살짝 어긋난 두 톱니 소리를 부드럽게 걸러서
      const filter = lowpass(1700, amp);
      wave('sawtooth', freq, -7, filter, at, end);
      wave('sawtooth', freq, 7, filter, at, end);
      return hold(amp, 0.32, at, end);
    }
    if (kind === 'square') {
      // 옛 게임기 같은 또렷한 소리
      wave('square', freq, 0, lowpass(2400, amp), at, end);
      return hold(amp, 0.2, at, end);
    }
    if (kind === 'reed') {
      // 하모니카처럼 어둡고 가는 소리
      wave('sawtooth', freq, 0, lowpass(1100, amp), at, end);
      return hold(amp, 0.34, at, end);
    }
    if (kind === 'bell') {
      // 오르골처럼 맑게 울리고 길게 남는다
      wave('sine', freq, 0, amp, at, end + 0.5);
      wave('sine', freq * 2, 0, amp, at, end + 0.5);
      return pluck(amp, 0.3, at, end + 0.5);
    }
    wave('triangle', freq, 0, amp, at, end);
    pluck(amp, kind === 'bass' ? 0.55 : kind === 'pluck' ? 0.3 : 0.14, at, end);
  }

  // 지금 곡을 잦아들게 하고 멈춘다
  function fadeOut() {
    if (!playing) return;
    const gain = playing.gain;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE);
    setTimeout(() => gain.disconnect(), (FADE + AHEAD + 1) * 1000);
    playing = null;
  }

  // 틀고 싶은 곡과 트는 곡이 다르면 바꾸고, 앞으로 AHEAD초 안에 시작할 마디들을 걸어 둔다
  function tick() {
    if (!ctx) {
      ctx = CS.sound.context();
      if (!ctx) return;
      master = ctx.createGain();
      master.gain.value = VOLUME;
      master.connect(ctx.destination);
      hiss = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = hiss.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const name = save.data.still ? null : wanted;
    if (playing && playing.name !== name) fadeOut();
    if (!playing && name) {
      const gain = ctx.createGain();
      gain.gain.value = TRACKS[name].loud;
      gain.connect(master);
      playing = { name, piece: TRACKS[name], gain, bar: 0, at: ctx.currentTime + 0.1 };
    }
    if (!playing) return;

    const piece = playing.piece, barTime = piece.beat * piece.beats;
    if (playing.at < ctx.currentTime) playing.at = ctx.currentTime + 0.05;  // 한동안 멈춰 있었으면 지금부터 잇는다
    while (playing.at < ctx.currentTime + AHEAD) {
      for (const [beat, length, freq, kind] of notesOf(piece, playing.bar)) {
        sound(playing.gain, playing.at + beat * piece.beat, length * piece.beat, freq, kind);
      }
      playing.bar = (playing.bar + 1) % piece.bars.length;
      playing.at += barTime;
    }
  }
  setInterval(tick, TICK);

  // 지금 어울리는 곡을 알려 준다. 없으면(null) 음악이 잦아든다.
  function want(name) {
    wanted = name;
  }

  // 음악을 켜거나 끈다
  function toggle() {
    save.data.still = !save.data.still;
    save.commit();
    tick();
  }

  return {
    want,
    toggle,
    still: () => save.data.still,
    // 곡 이름들과, 곡의 악보를 풀어 본 것(마디마다 낼 음들). 악보가 맞게 적혔는지 살필 때 쓴다.
    names: () => Object.keys(TRACKS),
    piece: (name) => TRACKS[name],
    score: (name) => TRACKS[name].bars.map((bar, i) => notesOf(TRACKS[name], i)),
  };
})();
