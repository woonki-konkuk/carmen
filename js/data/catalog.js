window.CS = window.CS || {};

// 게임에 나오는 물건들.
//   desserts  카페의 디저트. price: 값(유로), calm: 먹으면 내려가는 추격 게이지
//   loot      행인에게서 훔치는 물건. value: 값(유로), weight: 나올 확률의 비중
CS.catalog = {
  desserts: [
    {
      id: 'crepe',
      name: '크레페',
      fr: 'Crêpe',
      verb: '먹기',
      price: 4,
      calm: 12,
      text: '얇게 부친 반죽에 초콜릿과 딸기를 올려 접은 프랑스 길거리 간식. 브르타뉴 지방에서 시작됐다.',
    },
    {
      id: 'brulee',
      name: '크렘 브륄레',
      fr: 'Crème brûlée',
      verb: '먹기',
      price: 6,
      calm: 18,
      text: '차가운 커스터드 위에 설탕을 뿌리고 불로 그을려 얇은 캐러멜 층을 만든다. 숟가락으로 톡 깨서 먹는다.',
    },
    {
      id: 'chocolat',
      name: '쇼콜라 쇼',
      fr: 'Chocolat chaud',
      verb: '마시기',
      price: 5,
      calm: 15,
      text: '녹인 초콜릿에 우유를 넣어 진하게 끓인 프랑스식 핫초콜릿. 휘핑크림을 얹어 마신다.',
    },
  ],

  loot: [
    { name: '동전 지갑', value: 3, weight: 40 },
    { name: '지갑', value: 6, weight: 35 },
    { name: '손목시계', value: 9, weight: 17 },
    { name: '반지', value: 12, weight: 8 },
  ],
};
