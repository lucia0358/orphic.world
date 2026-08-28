const stemMap = {
  Drum: "music/Drum.mp3",
  Bass: "music/Bass.mp3",
  Pad: "music/Pad.mp3",
  Piano: "music/Piano.mp3",
  Lead: "music/Lead.mp3",
  Fx: "music/Fx.mp3",
};

const popupVideo = document.getElementById("popupVideo");

let videoFadeTimer = null;


/* =========================================================
   영상
========================================================= */

function showVideo() {
  clearTimeout(videoFadeTimer);

  popupVideo.classList.add("show");
  popupVideo.currentTime = 0;

  popupVideo.play().catch((error) => {
    console.error("영상 재생 실패:", error);
  });
}


function hideVideo() {
  popupVideo.classList.remove("show");

  clearTimeout(videoFadeTimer);

  videoFadeTimer = setTimeout(() => {
    if (!popupVideo.classList.contains("show")) {
      popupVideo.pause();
      popupVideo.currentTime = 0;
    }
  }, 800);
}


/* =========================================================
   기준 오디오
   Bass를 전체 음악의 기준 시계로 사용
========================================================= */

const loopClock = new Audio("music/Bass.mp3");

loopClock.loop = true;
loopClock.preload = "auto";
loopClock.volume = 0;
loopClock.load();


/* =========================================================
   스템 생성
========================================================= */

const stems = {};
const activeStems = new Set();

Object.entries(stemMap).forEach(([key, src]) => {
  const audio = new Audio(src);

  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;

  // 미리 로딩
  audio.load();

  stems[key] = audio;
});


let clockStarted = false;


/* =========================================================
   기준 오디오 시작
========================================================= */

async function startClock() {
  if (clockStarted) return true;

  loopClock.currentTime = 0;

  try {
    await loopClock.play();

    clockStarted = true;

    console.log("루프 기준 시작");

    return true;

  } catch (error) {
    console.error("루프 기준 재생 실패:", error);

    return false;
  }
}


/* =========================================================
   스템들을 기준 시간에 맞춤
========================================================= */

function syncActiveStems() {

  if (!clockStarted) return;

  const t = loopClock.currentTime;

  activeStems.forEach((key) => {

    const stem = stems[key];

    if (!stem || stem.paused) return;

    const duration = stem.duration;

    if (!Number.isFinite(duration) || duration <= 0) {
      return;
    }

    /*
      각 스템의 길이가 조금 다를 수 있으므로
      자신의 길이를 기준으로 loopClock 시간을 변환
    */
    const targetTime = t % duration;

    let diff = Math.abs(stem.currentTime - targetTime);

    /*
      루프 경계에서 생기는 차이 보정
      예:
      현재 0.02초
      목표 19.98초

      실제로는 거의 붙어있는 상태이므로
      19.96초 차이로 판단하지 않음
    */
    if (diff > duration / 2) {
      diff = duration - diff;
    }

    /*
      아주 작은 차이는 건드리지 않음.
      자꾸 currentTime을 바꾸면
      오히려 '득득' 끊기는 소리가 날 수 있음.
    */
    if (diff > 0.25) {
      stem.currentTime = targetTime;
    }
  });
}


/* =========================================================
   주기적인 싱크 보정
========================================================= */

setInterval(() => {

  if (!clockStarted) return;

  syncActiveStems();

}, 1000);


/* =========================================================
   세상 활성화 상태
========================================================= */

function updateWorldState() {

  const worldWord =
    document.querySelector('[data-sound="world"]');

  if (!worldWord) return;

  /*
    3개 이상 클릭하면 세상 활성화
  */
  if (activeStems.size >= 3) {

    worldWord.classList.remove("world-locked");
    worldWord.classList.add("world-open");

  } else {

    worldWord.classList.add("world-locked");
    worldWord.classList.remove("world-open");

  }
}


/* =========================================================
   단어 클릭 → 음악
========================================================= */

async function playSound(key, clickedWord) {

  console.log("clicked:", key);

  if (!key) return;


  /* -------------------------------------------------------
     세상
  ------------------------------------------------------- */

  if (key === "world") {

    /*
      음악 3개 이상 활성화되어야 세상 열림
    */
    if (activeStems.size < 3) {

      console.log(
        "아직 세상이 열리지 않음:",
        activeStems.size
      );

      return;
    }

    showVideo();

    clickedWord.classList.add("playing");

    return;
  }


  /* -------------------------------------------------------
     다른 단어 클릭
  ------------------------------------------------------- */

  hideVideo();


  /*
    세상 playing 표시 제거
  */
  document
    .querySelector('[data-sound="world"]')
    ?.classList.remove("playing");


  const stem = stems[key];

  if (!stem) {

    console.error(
      "해당 스템 없음:",
      key
    );

    return;
  }


  /* -------------------------------------------------------
     기준 오디오 시작
  ------------------------------------------------------- */

  const clockOK = await startClock();

  if (!clockOK) {
    return;
  }


  /* -------------------------------------------------------
     이미 켜져 있는 음악이면 끄기
  ------------------------------------------------------- */

  if (activeStems.has(key)) {

    stem.volume = 0;
    stem.pause();

    activeStems.delete(key);

    clickedWord.classList.remove("playing");

    updateWorldState();

    return;
  }


  /* -------------------------------------------------------
     오디오 로딩 확인
  ------------------------------------------------------- */

  const duration = stem.duration;

  if (
    !Number.isFinite(duration) ||
    duration <= 0
  ) {

    console.warn(
      "오디오 아직 로딩되지 않음:",
      key
    );

    /*
      다시 로드
    */
    stem.load();

    return;
  }


  /* -------------------------------------------------------
     기준 시간 계산
  ------------------------------------------------------- */

  const syncTime =
    loopClock.currentTime % duration;


  /*
    기준 시간에 먼저 위치시킴
  */
  stem.currentTime = syncTime;

  stem.volume = 1;


  /* -------------------------------------------------------
     재생
  ------------------------------------------------------- */

  try {

    await stem.play();

    /*
      실제 재생 성공 후 active 등록
    */
    activeStems.add(key);

    clickedWord.classList.add("playing");

    updateWorldState();

    /*
      처음 한 번만 아주 살짝 보정
    */
    syncActiveStems();

    console.log(
      `${key} 시작`,
      "clock:",
      loopClock.currentTime,
      "stem:",
      stem.currentTime
    );

  } catch (error) {

    console.error(
      "스템 재생 실패:",
      key,
      error
    );

  }
}


/* =========================================================
   시 본문
========================================================= */

const poemEl = document.getElementById("poem");
const stageEl = document.querySelector(".stage");


/* =========================================================
   전체 시 글자를 한 글자씩 쪼개기
========================================================= */

function splitTextIntoChars(element) {

  const childNodes = [...element.childNodes];

  childNodes.forEach((node) => {


    /* -----------------------------------------------------
       일반 텍스트
    ----------------------------------------------------- */

    if (node.nodeType === Node.TEXT_NODE) {

      const text = node.textContent;

      const fragment =
        document.createDocumentFragment();


      [...text].forEach((char) => {


        /*
          공백 / 줄바꿈은 그대로 둠
        */

        if (char.trim() === "") {

          fragment.appendChild(
            document.createTextNode(char)
          );

          return;
        }


        const span =
          document.createElement("span");

        span.className = "char";

        span.textContent = char;


        /*
          흩어지는 위치
        */

        const x =
          `${Math.random() * 320 - 160}px`;

        const y =
          `${Math.random() * 260 - 130}px`;

        const r =
          `${Math.random() * 90 - 45}deg`;


        span.style.setProperty(
          "--scatter-x",
          x
        );

        span.style.setProperty(
          "--scatter-y",
          y
        );

        span.style.setProperty(
          "--scatter-r",
          r
        );


        fragment.appendChild(span);

      });


      node.replaceWith(fragment);

    }


    /* -----------------------------------------------------
       word 같은 HTML 요소 안쪽
    ----------------------------------------------------- */

    if (node.nodeType === Node.ELEMENT_NODE) {

      /*
        이미 char이면 다시 쪼개지 않음
      */

      if (
        node.classList.contains("char")
      ) {
        return;
      }

      splitTextIntoChars(node);
    }

  });
}


/* =========================================================
   단어 클릭 이벤트
========================================================= */

function bindWordClicks() {

  document
    .querySelectorAll("#poem .word")
    .forEach((word) => {

      word.addEventListener(
        "click",
        (event) => {

          event.stopPropagation();

          playSound(
            word.dataset.sound,
            word
          );

        }
      );

    });
}


/* =========================================================
   마우스가 시에 가까워지면 정렬
========================================================= */

function bindGatherEffect() {

  stageEl.addEventListener(
    "mousemove",
    (event) => {

      const rect =
        poemEl.getBoundingClientRect();


      const centerX =
        rect.left + rect.width / 2;

      const centerY =
        rect.top + rect.height / 2;


      const dx =
        event.clientX - centerX;

      const dy =
        event.clientY - centerY;


      const distance =
        Math.sqrt(
          dx * dx + dy * dy
        );


      /*
        이 숫자가 클수록
        멀리서도 글자가 모임
      */

      const gatherDistance = 260;


      if (distance < gatherDistance) {

        poemEl.classList.add(
          "gathered"
        );

      } else {

        poemEl.classList.remove(
          "gathered"
        );

      }

    }
  );
}


/* =========================================================
   시 실행
========================================================= */

if (poemEl && stageEl) {

  splitTextIntoChars(poemEl);

  bindWordClicks();

  bindGatherEffect();

  updateWorldState();

  console.log(
    "char 개수:",
    poemEl.querySelectorAll(".char").length
  );

} else {

  console.error(
    "poem 또는 stage를 찾을 수 없음"
  );
}


/* =========================================================
   네비게이션
========================================================= */

const navTrigger =
  document.getElementById("navTrigger");

const infoImage =
  document.getElementById("infoImage");


if (navTrigger && infoImage) {

  navTrigger.addEventListener(
    "click",
    (e) => {

      e.stopPropagation();

      infoImage.classList.toggle(
        "show"
      );

    }
  );


  infoImage.addEventListener(
    "click",
    (e) => {

      e.stopPropagation();

    }
  );


  document.addEventListener(
    "click",
    () => {

      infoImage.classList.remove(
        "show"
      );

    }
  );

}
