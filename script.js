const soundMap = {
  Bass: "music/Bass.mp3",
  Drum 1: "music/Drum 1.mp3",
  Drum 2: "music/Drum 2.mp3",
  Guitar: "music/Guitar.mp3",
  Lead: "music/Lead.mp3",
  Pad: "music/Pad.mp3",
  Piano+FX: "music/Piano+FX.mp3",
};

const stems = {};

Object.entries(stemMap).forEach(([key, src]) => {
  const audio = new Audio(src);
  audio.preload = "auto";

  // 전체 길이 스템을 끝나면 다시 반복하고 싶으면 true
  // 한 번만 2분 이상 재생하고 끝내고 싶으면 false
  audio.loop = true;

  audio.volume = 0;
  stems[key] = audio;
});

let stemsStarted = false;
const activeStems = new Set();


let currentAudio = null;
let currentWord = null;

const popupVideo = document.getElementById("popupVideo");

/* 스템 재생 */
async function playSound(key, clickedWord) {
  console.log("clicked:", key);

  // 기존 단어 색상 처리
  if (currentWord && !activeStems.has(currentWord.dataset.sound)) {
    currentWord.classList.remove("playing");
  }

  // 세상 클릭 시 영상만 표시
  if (key === "world") {
    popupVideo.classList.add("show");
    popupVideo.currentTime = 0;

    popupVideo.play().catch((error) => {
      console.error("영상 재생 실패:", error);
    });

    clickedWord.classList.add("playing");
    return;
  }

  // 다른 단어 클릭 시 영상 숨김
  popupVideo.pause();
  popupVideo.currentTime = 0;
  popupVideo.classList.remove("show");

  const stem = stems[key];
  if (!stem) return;

  // 첫 클릭 때 모든 스템을 0초부터 동시에 조용히 시작
  if (!stemsStarted) {
    Object.values(stems).forEach((audio) => {
      audio.currentTime = 0;
      audio.volume = 0;
    });

    await Promise.allSettled(
      Object.values(stems).map((audio) => audio.play())
    );

    stemsStarted = true;
  }

  // 이미 켜져 있으면 끄기
  if (activeStems.has(key)) {
    stem.volume = 0;
    activeStems.delete(key);
    clickedWord.classList.remove("playing");
    return;
  }

  // 꺼져 있으면 켜기
  stem.volume = 1;
  activeStems.add(key);
  clickedWord.classList.add("playing");
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

/* 009 클릭 */
navTrigger.addEventListener("click", (e) => {
  e.stopPropagation();
  infoImage.classList.toggle("show");
});

/* 네비 클릭 시 유지 */
infoImage.addEventListener("click", (e) => {
  e.stopPropagation();
});

/* 바깥 클릭 닫기 */
document.addEventListener("click", () => {
  infoImage.classList.remove("show");
});

const btn = document.getElementById("playBtn");
const icon = document.getElementById("playIcon");
const audio = document.getElementById("bgm");

let playing = false;

btn.addEventListener("click", () => {
  if (!playing) {
    audio.play();
    icon.textContent = "❚❚";
  } else {
    audio.pause();
    icon.textContent = "▶";
  }

  playing = !playing;
});

