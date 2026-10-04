window.CS = window.CS || {};

// 이야기 글.
//   targets   임무마다의 표적. 순서대로 한 구역에 한 명씩 나온다.
//     item·color  가진 보석과 그 빛깔
//     spot        서 있는 자리
//     mime        서 있을 때 마임을 하는가
//     speed       달아나는 빠르기(칸/초) [처음, 다 지쳤을 때]. 내가 뛰는 빠르기는 5.
//     sleight     손기술 게이지. fill: 다 차는 데 걸리는 시간(초), zone·perfect: 성공 칸과 완벽 칸의 너비
//                 (게이지 전체가 1), wait: 누르기 시작할 때까지 기다려 주는 시간(초)
//     fight       있으면 달아나지 않고 싸운다. hp: 체력, speed: 움직이는 빠르기(칸/초),
//                 gap: 표창을 던지는 간격(초) [가장 짧게, 가장 길게], starSpeed: 표창의 빠르기(칸/초),
//                 arena: 싸우며 돌아다니는 범위 [왼쪽, 위, 오른쪽, 아래]
//     brawl       있으면 맨주먹으로 싸운다. hp: 체력, tell: 발톱을 치켜들고 있는 시간(초) [처음, 체력이 바닥일 때],
//                 gap: 공격 사이의 간격(초) [가장 짧게, 가장 길게], open: 헛치고 비틀거리는 시간(초)
//     portrait    달아나거나 싸우기 직전에 얼굴을 크게 보여 줄 그림(portraits.js의 이름), title: 그때 이름 아래에 뜨는 글,
//                 band: 그 컷의 띠 색
//     hello       그 구역에 도착하면 오는 메시지 묶음, won: 보석을 되찾으면 오는 메시지 묶음
//   detective 보석을 되찾으면 쫓아오는 ACME 형사
//   messages  해커 플레이어가 보내는 메시지 묶음
CS.story = {
  targets: [
    {
      name: '마임 밤',
      item: '바르바토스의 눈물',
      color: '#3ad1c6',
      spot: [16.5, 9.6],  // 지하철 입구 앞
      mime: true,
      speed: [5.1, 4.2],
      sleight: { fill: 1.6, zone: 0.1, perfect: 0.035, wait: 4 },
      portrait: 'mimeBomb',
      title: '바일 조직원 · 말 없는 마임',
      band: '#23262d',
      hello: 'intro',
      won: 'won1',
      // 하얗게 칠한 얼굴에 검은 눈 화장, 붉은 갈색 머리, 검은 베레모, 어두운 줄무늬 목 폴라
      look: {
        skin: '#ece9f2', hands: '#e2b58e', hair: '#8a3b24', longHair: true,
        eyeRings: '#8fa8cf', lips: '#b8667a',
        coat: '#2f3138', stripes: '#474a54', turtleneck: true, pants: '#1d1e22',
        hat: 'beret', hatColor: '#17181c', gloves: '#fbfaf6',
        scarf: null, bag: null, bagColor: null,
      },
    },
    {
      name: '페이퍼 스타',
      item: '모락스의 눈물',
      color: '#f2c230',
      spot: [18.5, 10],  // 잔디밭 한가운데
      mime: false,
      speed: [5.3, 4.4],
      sleight: { fill: 1.5, zone: 0.085, perfect: 0.03, wait: 4 },
      fight: { hp: 5, speed: 2.8, gap: [1.7, 2.5], starSpeed: 6.5, arena: [4.5, 6.6, 28.5, 13.4] },
      portrait: 'paperStar',
      title: '바일 조직원 · 종이 표창의 달인',
      band: '#12303a',
      hello: 'eiffel',
      won: 'won2',
      // 반반 나뉜 머리를 뿔처럼 틀어 올리고, 징 박힌 연두 재킷을 검은 옷 위에 걸쳤다
      look: {
        skin: '#ecd9c6', hair: '#1f3140', hair2: '#8fc9c2', longHair: true, bangs: true, horns: true,
        liner: true, lips: '#6a4a8a',
        coat: '#a8d5a0', jacket: { inner: '#16181d', accent: '#c9502e', trim: '#c7e6bb' },
        spikes: '#f1f5ee', choker: '#d9dde0', pants: '#16181d', stripes: null,
        hat: null, hatColor: null, scarf: null, bag: null, bagColor: null,
      },
    },
    {
      name: '타이거리스',
      item: '에이의 눈물',
      color: '#a06cd5',
      spot: [19, 10],  // 유리 피라미드 앞
      mime: false,
      speed: [5.3, 4.4],
      sleight: { fill: 1.5, zone: 0.085, perfect: 0.03, wait: 4 },
      // 주먹 전투의 규칙. hp: 체력, tell: 발톱을 치켜드는 시간(체력이 가득할 때, 바닥일 때), gap: 공격 사이, open: 헛친 뒤의 틈(초),
      // feint: 속임 동작을 쓸 확률(평소, 분노했을 때), rage: 분노했을 때 시간이 줄어드는 배율
      brawl: { hp: 10, tell: [0.6, 0.4], gap: [0.8, 1.5], open: 1.3, feint: [0.3, 0.55], rage: 0.85 },
      portrait: 'tigress',
      title: '바일 조직원 · 발톱을 세운 고양이',
      band: '#b8431a',
      hello: 'louvre',
      won: 'won3',
      // 눈꼬리가 위로 솟은 검은 가면과 초록 눈 유리, 옆으로 넘겨 뒤로 묶은 흰 금발, 보라 입술,
      // 적갈색 호랑이 줄무늬가 있는 검은 옷
      look: {
        skin: '#f0d2bc', hair: '#ece8e0', ponytail: true, sweep: true, visor: '#a6e05a', lips: '#8e4a9e',
        coat: '#1d1d22', chevrons: '#c9602a', pants: '#1d1d22', gloves: '#b9bec4',
        hat: null, hatColor: null, scarf: null, bag: null, bagColor: null,
      },
    },
  ],

  detective: {
    name: '데비노 형사',
    look: {
      skin: '#f1d0b0', hair: '#3b2a20', longHair: false, coat: '#b99b6b', pants: '#2b2f3a',
      hat: null, hatColor: null, scarf: null, bag: null, bagColor: null, stripes: null,
    },
  },

  messages: {
    intro: [
      '레드, 파리에 잘 도착했어? 나야, 플레이어.',
      '바일이 루브르에 전시될 \'눈물\' 보석 세 개를 훔쳤어. 조직원 셋이 하나씩 들고 파리에 흩어져 있대.',
      '첫 번째는 마임 밤. 「바르바토스의 눈물」을 가지고 있어. 지금 지하철 입구 앞에서 공연하는 척하고 있어. 지도에 표시해 뒀어.',
      '눈치가 빠른 녀석이라 가까이 가면 달아날 거야. 놓치지 말고 쫓아가.',
      '보석을 되찾으면 ACME의 데비노 형사가 바로 쫓아올 거야. 지하철 입구 계단으로 빠져나와.',
      '그리고 왼쪽 위의 ACME 추격 게이지를 조심해. 소매치기하다 들키거나, 싸움에서 지거나, 형사에게 붙잡히면 크게 올라가는데, 가득 차면 감옥이야.',
      '게이지는 카페에서 디저트를 먹으면 내려가. 값은 행인 주머니에서 슬쩍한 돈으로 내면 돼. 파리까지 와서 디저트를 안 먹으면 섭섭하잖아.',
    ],
    won1: [
      '해냈어, 레드! 첫 번째 보석 「바르바토스의 눈물」 확보.',
    ],
    eiffel: [
      '에펠탑에 도착했네. 탑 앞의 긴 잔디밭이 샹드마르스야.',
      '두 번째는 페이퍼 스타. 「모락스의 눈물」을 가지고 잔디밭 한가운데에 있어. 지도에 표시해 뒀어.',
      '달아나는 대신 종이 표창을 던지며 덤빌 거야. 옆으로 피하면서 모자를 던져 맞혀. 표창에 세 번 맞으면 끝이야.',
    ],
    won2: [
      '두 번째 보석 「모락스의 눈물」도 확보! 이제 하나 남았어.',
    ],
    louvre: [
      '루브르에 도착했어. 뜰 한가운데의 유리 피라미드가 보이지?',
      '세 번째는 타이거리스. 「에이의 눈물」을 가지고 피라미드 앞에 있어. 지도에 표시해 뒀어.',
      '이번에는 맨주먹 싸움이야. 학교 때 대련처럼 피하고(A, D), 막고(S), 비틀거릴 때 때리면(Space) 돼.',
      '그런데 조심해. 이제는 발톱이 있고, 한쪽을 치켜들었다가 반대쪽으로 바꾸는 속임수를 써. 끝까지 보고 피해. 이미 피했어도 반대쪽 키를 누르면 다시 피할 수 있어.',
      '그리고 체력이 절반쯤 깎이면 분노해서 더 빨라질 거야. 침착하게.',
    ],
    won3: [
      '세 번째 보석 「에이의 눈물」까지! 세 개를 모두 되찾았어.',
      '수고했어, 레드. 파리 임무는 여기까지야.',
    ],
  },
};

// 지금 임무의 표적. 임무를 모두 끝냈으면 마지막 표적을 가리키지만 거리에 나타나지는 않는다(엔딩이 뜬다).
CS.story.target = CS.story.targets[Math.min(CS.save.data.done, CS.story.targets.length - 1)];
