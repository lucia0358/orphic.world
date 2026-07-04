const stemMap = {
  Guitar: "music/Guitar.mp3",
  Bass: "music/Bass.mp3",
  Drum: "music/Drum.mp3",
  Pad: "music/Pad.mp3",
  Lead: "music/Lead.mp3",
};

const popupVideo = document.getElementById("popupVideo");

let videoFadeTimer = null;
let currentWord = null;

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
const syncTime = stem.duration
  ? loopClock.currentTime % stem.duration
  : loopClock.currentTime;

stem.currentTime = syncTime;
stem.volume = 1;

stem.play().catch((error) => {
  console.error("스템 재생 실패:", key, error);
});
  syncActiveStems();
}

/* 단어 클릭 */
document.querySelectorAll(".word").forEach((word) => {
  word.addEventListener("click", (event) => {
    event.stopPropagation();
    playSound(word.dataset.sound, word);
  });
});

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

/* 글자 흩어짐 → 문장 정렬 효과 */
(() => {
  const poemEl = document.getElementById("poem");
  const stageEl = document.querySelector(".stage");

  if (!poemEl || !stageEl) {
    console.error("poem 또는 stage 요소를 찾을 수 없음");
    return;
  }

  function splitTextIntoChars(element) {
    const childNodes = [...element.childNodes];

    childNodes.forEach((node) => {
      // 일반 텍스트 노드일 때
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const fragment = document.createDocumentFragment();

        [...text].forEach((char) => {
          // 공백, 줄바꿈은 그대로 유지
          if (char.trim() === "") {
            fragment.appendChild(document.createTextNode(char));
            return;
          }

          const span = document.createElement("span");
          span.className = "char";
          span.textContent = char;

          const x = `${Math.random() * 320 - 160}px`;
          const y = `${Math.random() * 260 - 130}px`;
          const r = `${Math.random() * 90 - 45}deg`;

          span.style.setProperty("--scatter-x", x);
          span.style.setProperty("--scatter-y", y);
          span.style.setProperty("--scatter-r", r);

          fragment.appendChild(span);
        });

        node.replaceWith(fragment);
      }

      // span.word 같은 요소 안쪽 글자도 다시 쪼갬
      if (node.nodeType === Node.ELEMENT_NODE) {
        splitTextIntoChars(node);
      }
    });
  }

  splitTextIntoChars(poemEl);

  stageEl.addEventListener("mousemove", (event) => {
    const rect = stageEl.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 일단 책 중앙 기준
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 숫자가 클수록 더 멀리서도 문장이 모임
    const gatherDistance = 260;

    if (distance < gatherDistance) {
      poemEl.classList.add("gathered");
    } else {
      poemEl.classList.remove("gathered");
    }
  });
})();
