const stemMap = {
  Guitar: "music/Guitar.mp3",
  Bass: "music/Bass.mp3",
  Drum: "music/Drum.mp3",
  Pad: "music/Pad.mp3",
  Lead: "music/Lead.mp3",
};

const popupVideo = document.getElementById("popupVideo");

let videoFadeTimer = null;

/* 영상 페이드인 */
function showVideo() {
  clearTimeout(videoFadeTimer);

  popupVideo.classList.add("show");
  popupVideo.currentTime = 0;

  popupVideo.play().catch((error) => {
    console.error("영상 재생 실패:", error);
  });
}

/* 영상 페이드아웃 */
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

/* 기준 시간용 오디오 */
const loopClock = new Audio("music/Bass.mp3");
loopClock.loop = true;
loopClock.preload = "auto";
loopClock.volume = 0;

const stems = {};
const activeStems = new Set();

Object.entries(stemMap).forEach(([key, src]) => {
  const audio = new Audio(src);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;
  stems[key] = audio;
});

let clockStarted = false;

/* 기준 오디오 시작 */
async function startClock() {
  if (clockStarted) return;

  loopClock.currentTime = 0;

  try {
    await loopClock.play();
    clockStarted = true;
    console.log("루프 기준 시작");
  } catch (error) {
    console.error("루프 기준 재생 실패:", error);
  }
}

/* 켜져 있는 스템들 기준 시간에 다시 맞추기 */
function syncActiveStems() {
  const t = loopClock.currentTime;

  activeStems.forEach((key) => {
    const stem = stems[key];
    if (!stem) return;

    const diff = Math.abs(stem.currentTime - t);

    if (diff > 0.05) {
      stem.currentTime = t;
    }
  });
}

/* 주기적으로 밀림 보정 */
setInterval(() => {
  if (clockStarted) {
    syncActiveStems();
  }
}, 500);

/* 단어 클릭 시 스템 볼륨 켜고 끄기 */
async function playSound(key, clickedWord) {
  console.log("clicked:", key);

  if (!key) return;

  // 세상 클릭 시 영상만 표시
  if (key === "world") {
    showVideo();
    clickedWord.classList.add("playing");
    return;
  }

  // 다른 단어 클릭 시 영상 숨김
  hideVideo();

  // world 단어 playing 표시 제거
  document.querySelector('[data-sound="world"]')?.classList.remove("playing");

  const stem = stems[key];

  if (!stem) {
    console.error("해당 스템 없음:", key);
    return;
  }

  await startClock();

  // 이미 켜져 있으면 끄기
  if (activeStems.has(key)) {
    stem.volume = 0;
    stem.pause();

    activeStems.delete(key);
    clickedWord.classList.remove("playing");
    return;
  }

  // 기준 시간에 맞춰서 켜기
  const syncTime =
    Number.isFinite(stem.duration) && stem.duration > 0
      ? loopClock.currentTime % stem.duration
      : loopClock.currentTime;

  stem.currentTime = syncTime;
  stem.volume = 1;

  try {
    await stem.play();

    activeStems.add(key);
    clickedWord.classList.add("playing");

    syncActiveStems();
  } catch (error) {
    console.error("스템 재생 실패:", key, error);
  }
}

/* 페이지 내용 */
const poemPages = [
  `
    우린 어째서 <span class="word" data-sound="Guitar">망각</span>해야 합니까?
    긴 <span class="word" data-sound="Bass">시간</span> 너머 내 파편을 두고 왔는데,
    언젠가 삶이 지치고 고되어
    날카로운 말과 무거운 책임이란 이름에
    한 줌 피 흘린 날,
    헤진 가슴 한구석 <span class="word" data-sound="Pad">빈자리</span>에 꿰매어 액자에 걸면
    나는 그 이상 바라지 않았는데
    
    <span class="word" data-sound="Lead">추억</span>은 어째서 빛바래야 합니까?
    내가 온전히 취하기엔
    과분하리만치 새콤한 <span class="word" data-sound="Drum">기억</span>만 고이 모아
    흐르는 시간 넘어 붉은빛 파편을 두고 왔는데,
    사무실 형광등과 퇴근길 가로등에 눈멀어버린 날
    보이지 않는 피 뚝 뚝 흘리며 붉은 자몽 빛 추억 찾았는데

    마치 한여름 그을린 사과처럼 상하고 부식되어
    더 이상 그 빛깔 온데간데없다면
    나는 이제 무엇으로 눈 뜨고 지혈하란 말입니까?

    내 조그마한 추억 한 움큼,
    가슴 한구석 듬성듬성 얽매인 사진 한 점
    그것이 나 세상 살아가게 하는
    내 <span class="word" data-sound="world">세상</span> 전부와도 같았는데
  `
];
const poemEl = document.getElementById("poem");
const stageEl = document.querySelector(".stage");

let currentPageIndex = 0;
let isPageChanging = false;

/* 글자를 자동으로 쪼개기 */
function splitTextIntoChars(element) {
  const childNodes = [...element.childNodes];

  childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const fragment = document.createDocumentFragment();

      [...text].forEach((char) => {
        if (char.trim() === "") {
          fragment.appendChild(document.createTextNode(char));
          return;
        }

        const span = document.createElement("span");
        span.className = "char";
        span.textContent = char;

        const x = `${Math.random() * 90 - 45}px`;
        const y = `${Math.random() * 70 - 35}px`;
        const r = `${Math.random() * 28 - 14}deg`;

        span.style.setProperty("--scatter-x", x);
        span.style.setProperty("--scatter-y", y);
        span.style.setProperty("--scatter-r", r);

        fragment.appendChild(span);
      });

      node.replaceWith(fragment);
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.classList.contains("char")) return;
      splitTextIntoChars(node);
    }
  });
}

/* 단어 클릭 이벤트 다시 연결 */
function bindWordClicks() {
  document.querySelectorAll("#poem .word").forEach((word) => {
    word.addEventListener("click", (event) => {
      event.stopPropagation();
      playSound(word.dataset.sound, word);
    });

    // 이미 켜져 있는 음악이면 페이지 바뀌어도 표시 유지
    const key = word.dataset.sound;
    if (activeStems.has(key)) {
      word.classList.add("playing");
    }
  });
}

/* 현재 페이지 그리기 */
function renderPage(index) {
  hideVideo();

  poemEl.classList.remove("gathered", "page-in", "page-out-left", "page-out-right");

  poemEl.innerHTML = poemPages[index];

  splitTextIntoChars(poemEl);
  bindWordClicks();

  // 새 페이지는 처음에 다시 흩어진 상태
  requestAnimationFrame(() => {
    poemEl.classList.add("page-in");
  });
}

/* 다음 페이지 */
function nextPage() {
  if (isPageChanging) return;
  if (currentPageIndex >= poemPages.length - 1) return;

  isPageChanging = true;
  poemEl.classList.add("page-out-left");

  setTimeout(() => {
    currentPageIndex++;
    renderPage(currentPageIndex);
    isPageChanging = false;
  }, 450);
}

/* 이전 페이지 */
function prevPage() {
  if (isPageChanging) return;
  if (currentPageIndex <= 0) return;

  isPageChanging = true;
  poemEl.classList.add("page-out-right");

  setTimeout(() => {
    currentPageIndex--;
    renderPage(currentPageIndex);
    isPageChanging = false;
  }, 450);
}

/* 마우스 가까워지면 문장 정렬 */
stageEl.addEventListener("mousemove", (event) => {
  const rect = stageEl.getBoundingClientRect();

  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const dx = mouseX - centerX;
  const dy = mouseY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const gatherDistance = 360;

  if (distance < gatherDistance) {
    poemEl.classList.add("gathered");
  } else {
    poemEl.classList.remove("gathered");
  }
});

/* 드래그로 페이지 넘김 */
let dragStartX = null;
let dragStartY = null;

stageEl.addEventListener("mousedown", (event) => {
  dragStartX = event.clientX;
  dragStartY = event.clientY;
});

stageEl.addEventListener("mouseup", (event) => {
  if (dragStartX === null || dragStartY === null) return;

  const diffX = event.clientX - dragStartX;
  const diffY = event.clientY - dragStartY;

  // 세로 움직임이 너무 크면 페이지 넘김으로 안 봄
  if (Math.abs(diffY) > 80) {
    dragStartX = null;
    dragStartY = null;
    return;
  }

  // 왼쪽으로 드래그 → 다음 페이지
  if (diffX < -90) {
    nextPage();
  }

  // 오른쪽으로 드래그 → 이전 페이지
  if (diffX > 90) {
    prevPage();
  }

  dragStartX = null;
  dragStartY = null;
});

/* 모바일 터치도 같이 지원 */
stageEl.addEventListener("touchstart", (event) => {
  const touch = event.touches[0];
  dragStartX = touch.clientX;
  dragStartY = touch.clientY;
});

stageEl.addEventListener("touchend", (event) => {
  if (dragStartX === null || dragStartY === null) return;

  const touch = event.changedTouches[0];
  const diffX = touch.clientX - dragStartX;
  const diffY = touch.clientY - dragStartY;

  if (Math.abs(diffY) > 80) {
    dragStartX = null;
    dragStartY = null;
    return;
  }

  if (diffX < -90) {
    nextPage();
  }

  if (diffX > 90) {
    prevPage();
  }

  dragStartX = null;
  dragStartY = null;
});

/* 첫 페이지 실행 */
renderPage(currentPageIndex);

/* 네비 */
const navTrigger = document.getElementById("navTrigger");
const infoImage = document.getElementById("infoImage");

navTrigger.addEventListener("click", (e) => {
  e.stopPropagation();
  infoImage.classList.toggle("show");
});

infoImage.addEventListener("click", (e) => {
  e.stopPropagation();
});

document.addEventListener("click", () => {
  infoImage.classList.remove("show");
});
