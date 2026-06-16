const soundMap = {
  forget: "music/oblivion.mp3",
  time: "music/time.mp3",
  burden: "music/무거운책임.mp3",
  empty: "music/빈자리.mp3",
  memory: "music/memory.mp3",
  fade: "music/빛바래야.mp3",
  recall: "music/remember.mp3",
  grapefruit: "music/red.mp3",
  apple: "music/summer.mp3",
};

let currentAudio = null;
let currentWord = null;

const popupVideo = document.getElementById("popupVideo");

/* 사운드 재생 */
function playSound(key, clickedWord) {
  const src = soundMap[key];
  if (!src) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  if (currentWord) {
    currentWord.classList.remove("playing");
  }

  currentAudio = new Audio(src);

  currentAudio.play().catch((error) => {
    console.error("오디오 재생 실패:", error);
  });

  currentWord = clickedWord;
  currentWord.classList.add("playing");

  // 세상 클릭 시 영상 표시
  if (key === "world") {
    popupVideo.classList.add("show");
    popupVideo.currentTime = 0;

    popupVideo.play().catch((error) => {
      console.error("영상 재생 실패:", error);
    });
  } else {
    popupVideo.pause();
    popupVideo.currentTime = 0;
    popupVideo.classList.remove("show");
  }

  currentAudio.addEventListener("ended", () => {
    if (currentWord) {
      currentWord.classList.remove("playing");
      currentWord = null;
    }
  });
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

