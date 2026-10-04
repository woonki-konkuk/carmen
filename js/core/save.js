window.CS = window.CS || {};

// 진행 상황을 브라우저에 저장한다. data를 고친 뒤 commit()을 부른다.
CS.save = (function () {
  const KEY = 'carmen-paris';
  const PLAYING = 'carmen-playing';  // 이 창에서 시작 화면을 넘겼다는 표시. 구역을 옮기느라 새로 열려도 남는다.
  const data = {
    desserts: {},  // 맛본 디저트 id → true
    batches: [],   // 받은 메시지 묶음의 이름(story.js), 받은 순서대로
    read: 0,       // 읽은 메시지 수
    heat: 0,       // ACME 추격 게이지 0~100
    money: 6,      // 가진 돈(유로). 디저트 하나 값을 갖고 시작한다.
    done: 0,       // 끝낸 임무 수(되찾은 보석 수)
    lessons: 0,    // 본 회상(튜토리얼) 수. 구역마다 하나씩 본다.
    quiet: false,  // 효과음을 껐는가
    still: false,  // 배경음악을 껐는가
    heatTold: false,  // 추격 게이지가 무엇인지 알려 주었는가
  };

  try {
    Object.assign(data, JSON.parse(localStorage.getItem(KEY)));
  } catch (e) {
    // 저장소를 쓸 수 없으면 저장 없이 진행한다
  }

  function commit() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      // 위와 같음
    }
  }

  // 이 창에서 시작 화면을 이미 넘겼는가
  function playing() {
    try {
      return sessionStorage.getItem(PLAYING) === '1';
    } catch (e) {
      return false;
    }
  }

  function play() {
    try {
      sessionStorage.setItem(PLAYING, '1');
    } catch (e) {
      // 위와 같음
    }
  }

  // 저장한 것을 모두 지우고 처음부터 다시 시작한다. 시작 화면부터 다시 나온다.
  function reset() {
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(PLAYING);
    } catch (e) {
      // 위와 같음
    }
    location.reload();
  }

  return { data, commit, reset, playing, play };
})();
