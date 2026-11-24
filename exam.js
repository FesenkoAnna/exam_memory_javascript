class Cards {
    number;
    color;
    emoji;
    element_by_id;
    isOpen = false;
    isMatched = false;

    constructor(number, color, emoji, element_by_id) {
        this.number = number;
        this.color = color;
        this.emoji = emoji;
        this.element_by_id = element_by_id;
    }

    getWinColor(otherCard) {
        return this.color === otherCard.color && this.emoji === otherCard.emoji;
    }

    getIndex() {
        return this.number - 1;
    }

    openCard() {
        this.element_by_id.classList.add("is-open");
        this.isOpen = true;
    }

    closeCard() {
        this.element_by_id.classList.remove("is-open");
        this.isOpen = false;
    }
}

function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Звуковые эффекты (Web Audio API) + фоновая музыка из файла music.mp3
const SoundFX = {
    ctx: null,
    bgmAudio: null,

    ensureContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume().catch(() => {});
        }
    },

    initMusic() {
        if (!this.bgmAudio) {
            this.bgmAudio = new Audio("music.mp3");
            this.bgmAudio.loop = true;
            this.bgmAudio.volume = 0.35; // комфортная громкость фона (от 0.0 до 1.0)
        }
    },

    startMusic() {
        if (!settings.musicEnabled) return;
        this.initMusic();
        this.bgmAudio.play().catch(() => {});
    },

    stopMusic() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
        }
    },

    playTone({ freq, endFreq, duration, type = "sine", volume = 0.14, delay = 0 }) {
        if (!settings.soundEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (endFreq) {
            osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
        }

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.02);
    },

    flip(isOpening = true) {
        this.playTone({
            freq: isOpening ? 340 : 260,
            endFreq: isOpening ? 520 : 180,
            duration: 0.11,
            type: "triangle",
            volume: 0.12
        });
    },

    match() {
        this.playTone({ freq: 523.25, duration: 0.14, type: "sine", volume: 0.15, delay: 0 });
        this.playTone({ freq: 659.25, duration: 0.14, type: "sine", volume: 0.15, delay: 0.09 });
        this.playTone({ freq: 783.99, duration: 0.22, type: "triangle", volume: 0.16, delay: 0.18 });
    },

    win() {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
            this.playTone({
                freq,
                duration: idx === notes.length - 1 ? 0.36 : 0.16,
                type: "triangle",
                volume: 0.18,
                delay: idx * 0.11
            });
        });
    },

    achievement() {
        const notes = [587.33, 783.99, 987.77, 1174.66];
        notes.forEach((freq, idx) => {
            this.playTone({
                freq,
                duration: 0.2,
                type: "sine",
                volume: 0.16,
                delay: idx * 0.08
            });
        });
    }
};

// Стоковые иллюстрации (SVG -> Data URL)
function makeStockSvg(svgBody) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">${svgBody}</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const STOCK_BACKGROUNDS = {
    sea: makeStockSvg(`
        <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8"/>
                <stop offset="60%" stop-color="#bae6fd"/>
                <stop offset="100%" stop-color="#fef3c7"/>
            </linearGradient>
            <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#0284c7"/>
                <stop offset="100%" stop-color="#0f172a"/>
            </linearGradient>
        </defs>
        <rect width="1600" height="540" fill="url(#sky)"/>
        <circle cx="1220" cy="210" r="95" fill="#fde047" opacity="0.9"/>
        <rect y="540" width="1600" height="360" fill="url(#water)"/>
        <path d="M0 600 Q 400 565, 800 600 T 1600 600 L1600 900 L0 900 Z" fill="#0369a1" opacity="0.65"/>
        <path d="M0 710 Q 450 675, 900 710 T 1600 710 L1600 900 L0 900 Z" fill="#075985" opacity="0.75"/>
    `),
    sunset: makeStockSvg(`
        <defs>
            <linearGradient id="sunSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#312e81"/>
                <stop offset="45%" stop-color="#db2777"/>
                <stop offset="85%" stop-color="#fb923c"/>
                <stop offset="100%" stop-color="#fde047"/>
            </linearGradient>
        </defs>
        <rect width="1600" height="900" fill="url(#sunSky)"/>
        <circle cx="800" cy="540" r="170" fill="#fef08a" opacity="0.92"/>
        <polygon points="0,900 320,560 640,900" fill="#4c1d95" opacity="0.75"/>
        <polygon points="420,900 840,510 1260,900" fill="#3b0764" opacity="0.8"/>
        <polygon points="960,900 1320,590 1600,900" fill="#2e1065" opacity="0.85"/>
    `),
    forest: makeStockSvg(`
        <defs>
            <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#86efac"/>
                <stop offset="55%" stop-color="#22c55e"/>
                <stop offset="100%" stop-color="#14532d"/>
            </linearGradient>
        </defs>
        <rect width="1600" height="900" fill="url(#mist)"/>
        <g fill="#166534" opacity="0.55">
            <polygon points="120,900 240,420 360,900"/>
            <polygon points="340,900 480,350 620,900"/>
            <polygon points="980,900 1130,380 1280,900"/>
            <polygon points="1220,900 1390,320 1560,900"/>
        </g>
        <g fill="#14532d">
            <polygon points="40,900 150,520 260,900"/>
            <polygon points="220,900 350,470 480,900"/>
            <polygon points="620,900 760,440 900,900"/>
            <polygon points="1110,900 1250,490 1390,900"/>
            <polygon points="1340,900 1480,450 1620,900"/>
        </g>
        <rect y="810" width="1600" height="90" fill="#052e16"/>
    `),
    waterfall: makeStockSvg(`
        <defs>
            <linearGradient id="fall" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#e0f2fe"/>
                <stop offset="100%" stop-color="#38bdf8"/>
            </linearGradient>
        </defs>
        <rect width="1600" height="900" fill="#0f766e"/>
        <polygon points="0,0 560,0 440,650 0,720" fill="#134e4a"/>
        <polygon points="1600,0 1040,0 1160,650 1600,720" fill="#115e59"/>
        <rect x="640" y="0" width="320" height="680" fill="url(#fall)" opacity="0.92"/>
        <rect y="660" width="1600" height="240" fill="#0284c7"/>
        <ellipse cx="800" cy="675" rx="260" ry="36" fill="#ffffff" opacity="0.75"/>
    `),
    night: makeStockSvg(`
        <defs>
            <linearGradient id="cosmos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#050816"/>
                <stop offset="60%" stop-color="#1e1b4b"/>
                <stop offset="100%" stop-color="#312e81"/>
            </linearGradient>
        </defs>
        <rect width="1600" height="900" fill="url(#cosmos)"/>
        <circle cx="1260" cy="190" r="78" fill="#fef9c3"/>
        <circle cx="1290" cy="170" r="72" fill="#131633"/>
        <g fill="#ffffff">
            <circle cx="180" cy="140" r="3"/><circle cx="340" cy="260" r="2.5"/><circle cx="520" cy="120" r="3.5"/>
            <circle cx="710" cy="210" r="2"/><circle cx="890" cy="110" r="3"/><circle cx="1040" cy="280" r="2.5"/>
            <circle cx="240" cy="430" r="2.5"/><circle cx="630" cy="370" r="3"/><circle cx="960" cy="420" r="2"/><circle cx="1420" cy="390" r="3"/>
        </g>
        <polygon points="0,900 420,620 840,900" fill="#090d1f"/>
        <polygon points="720,900 1200,590 1600,900" fill="#060917"/>
    `)
};

const CARD_THEMES = [
    { color: "#ef4444", emoji: "🦊" },
    { color: "#f97316", emoji: "🦁" },
    { color: "#eab308", emoji: "🐥" },
    { color: "#22c55e", emoji: "🐸" },
    { color: "#06b6d4", emoji: "🐬" },
    { color: "#3b82f6", emoji: "🐳" },
    { color: "#8b5cf6", emoji: "🐙" },
    { color: "#ec4899", emoji: "🌸" },
    { color: "#14b8a6", emoji: "🐢" },
    { color: "#84cc16", emoji: "🍏" },
    { color: "#f43f5e", emoji: "🍓" },
    { color: "#6366f1", emoji: "🌙" },
    { color: "#a855f7", emoji: "🦄" },
    { color: "#0ea5e9", emoji: "💎" },
    { color: "#10b981", emoji: "🍀" },
    { color: "#d97706", emoji: "🍯" },
    { color: "#e11d48", emoji: "🍒" },
    { color: "#4f46e5", emoji: "⭐" }
];

function generateCardItemsForCount(totalCards) {
    const pairCount = totalCards / 2;
    const items = [];

    for (let i = 0; i < pairCount; i++) {
        const theme = CARD_THEMES[i % CARD_THEMES.length];
        items.push({ ...theme }, { ...theme });
    }

    return shuffleArray(items);
}

const BOARD_CONFIGS = {
    "3x4": { rows: 3, cols: 4, total: 12 },
    "4x4": { rows: 4, cols: 4, total: 16 },
    "4x6": { rows: 4, cols: 6, total: 24 },
    "6x6": { rows: 6, cols: 6, total: 36 }
};

const settings = {
    memorizeSeconds: 3,
    boardSize: "3x4",
    timerEnabled: true,
    soundEnabled: true,
    musicEnabled: true,
    bgType: "color",
    bgValue: "#eef2f7"
};

// Рекорды по каждому размеру поля и последнее достижение
const recordsByBoard = {
    "3x4": { minMoves: null, minSeconds: null },
    "4x4": { minMoves: null, minSeconds: null },
    "4x6": { minMoves: null, minSeconds: null },
    "6x6": { minMoves: null, minSeconds: null }
};

let latestAchievementText = "Пока нет достижений";

const startScreen = document.getElementById("start-screen");
const settingsScreen = document.getElementById("settings-screen");
const gameScreen = document.getElementById("game-screen");

const playBtn = document.getElementById("play-btn");
const openSettingsStartBtn = document.getElementById("open-settings-start-btn");
const openSettingsGameBtn = document.getElementById("open-settings-game-btn");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const backToMenuBtn = document.getElementById("back-to-menu-btn");
const menuBtn = document.getElementById("menu-btn");
const restartBtn = document.getElementById("restart-btn");

const memorizeTimeInput = document.getElementById("memorize-time-input");
const memorizeTimeValue = document.getElementById("memorize-time-value");
const boardSizeSelect = document.getElementById("board-size-select");
const timerEnabledInput = document.getElementById("timer-enabled-input");
const soundEnabledInput = document.getElementById("sound-enabled-input");
const musicEnabledInput = document.getElementById("music-enabled-input");
const customBgColor = document.getElementById("custom-bg-color");
const customBgFile = document.getElementById("custom-bg-file");
const customBgUrl = document.getElementById("custom-bg-url");
const applyBgUrlBtn = document.getElementById("apply-bg-url-btn");
const bgPresetButtons = document.querySelectorAll(".bg-preset-btn");

const container = document.getElementById("cards-container");
const movesElement = document.getElementById("moves-count");
const timerBox = document.getElementById("timer-box");
const timerElement = document.getElementById("timer-count");
const statusBanner = document.getElementById("status-banner");
const achievementToast = document.getElementById("achievement-toast");
const menuLatestAchievement = document.getElementById("menu-latest-achievement");

let cards = [];
let twoCards = [];
let count = 0;
let moves = 0;
let elapsedSeconds = 0;
let matchedPairs = 0;
let isLocked = false;
let previewTimer = null;
let countdownInterval = null;
let gameTimerInterval = null;
let endNoticeTimer = null;
let toastTimer = null;

function updateMenuAchievementDisplay() {
    menuLatestAchievement.textContent = latestAchievementText;
}

function triggerAchievement(text) {
    latestAchievementText = text;
    updateMenuAchievementDisplay();
    SoundFX.achievement();

    clearTimeout(toastTimer);
    achievementToast.textContent = `🏆 Достижение: ${text}`;
    achievementToast.classList.add("show");

    toastTimer = setTimeout(() => {
        achievementToast.classList.remove("show");
    }, 3600);
}

function setStatusMessage(text, durationMs = null) {
    clearTimeout(endNoticeTimer);

    if (!text) {
        statusBanner.textContent = "";
        statusBanner.classList.remove("visible");
        return;
    }

    statusBanner.textContent = text;
    statusBanner.classList.add("visible");

    if (durationMs) {
        endNoticeTimer = setTimeout(() => {
            statusBanner.textContent = "";
            statusBanner.classList.remove("visible");
        }, durationMs);
    }
}

function showScreen(targetScreen) {
    [startScreen, settingsScreen, gameScreen].forEach((screen) => {
        screen.classList.remove("active");
    });
    targetScreen.classList.add("active");

    if (targetScreen === startScreen) {
        updateMenuAchievementDisplay();
    }
}

function stopGameTimers() {
    clearTimeout(previewTimer);
    clearInterval(countdownInterval);
    clearInterval(gameTimerInterval);
    clearTimeout(endNoticeTimer);
}

function syncTimerVisibility() {
    if (settings.timerEnabled) {
        timerBox.classList.remove("hidden");
    } else {
        timerBox.classList.add("hidden");
        clearInterval(gameTimerInterval);
    }
}

function startElapsedTimer() {
    clearInterval(gameTimerInterval);
    if (!settings.timerEnabled) return;

    gameTimerInterval = setInterval(() => {
        elapsedSeconds++;
        timerElement.textContent = formatTime(elapsedSeconds);
    }, 1000);
}

function applyBackground(type, value) {
    document.body.style.backgroundColor = "";
    document.body.style.backgroundImage = "";

    if (type === "color") {
        document.body.style.backgroundColor = value;
    } else if (type === "stock") {
        const stockUrl = STOCK_BACKGROUNDS[value];
        if (stockUrl) {
            document.body.style.backgroundColor = "#0f172a";
            document.body.style.backgroundImage = `url("${stockUrl}")`;
        }
    } else if (type === "image") {
        document.body.style.backgroundColor = "#111827";
        document.body.style.backgroundImage = `url("${value}")`;
    }
}

function syncSettingsForm() {
    memorizeTimeInput.value = settings.memorizeSeconds;
    memorizeTimeValue.textContent = settings.memorizeSeconds;
    boardSizeSelect.value = settings.boardSize;
    timerEnabledInput.checked = settings.timerEnabled;
    soundEnabledInput.checked = settings.soundEnabled;
    musicEnabledInput.checked = settings.musicEnabled;

    if (settings.bgType === "color") {
        customBgColor.value = settings.bgValue;
    }
    if (settings.bgType === "image" && !settings.bgValue.startsWith("data:")) {
        customBgUrl.value = settings.bgValue;
    }
}

memorizeTimeInput.addEventListener("input", () => {
    memorizeTimeValue.textContent = memorizeTimeInput.value;
});

soundEnabledInput.addEventListener("change", () => {
    settings.soundEnabled = soundEnabledInput.checked;
});

musicEnabledInput.addEventListener("change", () => {
    settings.musicEnabled = musicEnabledInput.checked;
    if (settings.musicEnabled) {
        SoundFX.startMusic();
    } else {
        SoundFX.stopMusic();
    }
});

bgPresetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        bgPresetButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        settings.bgType = btn.dataset.bgType;
        settings.bgValue = btn.dataset.bgValue;
        applyBackground(settings.bgType, settings.bgValue);
    });
});

customBgColor.addEventListener("input", () => {
    bgPresetButtons.forEach((b) => b.classList.remove("active"));
    settings.bgType = "color";
    settings.bgValue = customBgColor.value;
    applyBackground(settings.bgType, settings.bgValue);
});

customBgFile.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        bgPresetButtons.forEach((b) => b.classList.remove("active"));
        settings.bgType = "image";
        settings.bgValue = reader.result;
        applyBackground(settings.bgType, settings.bgValue);
    };
    reader.readAsDataURL(file);
});

applyBgUrlBtn.addEventListener("click", () => {
    const url = customBgUrl.value.trim();
    if (!url) return;

    bgPresetButtons.forEach((b) => b.classList.remove("active"));
    settings.bgType = "image";
    settings.bgValue = url;
    applyBackground(settings.bgType, settings.bgValue);
});

playBtn.addEventListener("click", () => {
    SoundFX.ensureContext();
    if (settings.musicEnabled) {
        SoundFX.startMusic();
    }
    showScreen(gameScreen);
    startGame();
});

openSettingsStartBtn.addEventListener("click", () => {
    syncSettingsForm();
    showScreen(settingsScreen);
});

openSettingsGameBtn.addEventListener("click", () => {
    stopGameTimers();
    syncSettingsForm();
    showScreen(settingsScreen);
});

backToMenuBtn.addEventListener("click", () => {
    showScreen(startScreen);
});

menuBtn.addEventListener("click", () => {
    stopGameTimers();
    showScreen(startScreen);
});

saveSettingsBtn.addEventListener("click", () => {
    settings.memorizeSeconds = Number(memorizeTimeInput.value);
    settings.boardSize = boardSizeSelect.value;
    settings.timerEnabled = timerEnabledInput.checked;
    settings.soundEnabled = soundEnabledInput.checked;
    settings.musicEnabled = musicEnabledInput.checked;

    if (settings.musicEnabled) {
        SoundFX.startMusic();
    } else {
        SoundFX.stopMusic();
    }

    showScreen(gameScreen);
    startGame();
});

function handleWinAchievements() {
    const rec = recordsByBoard[settings.boardSize];
    const earned = [];

    // Минимальное количество ходов (строго меньше предыдущего рекорда)
    if (rec.minMoves === null || moves < rec.minMoves) {
        rec.minMoves = moves;
        earned.push(`Минимум ходов на ${settings.boardSize}: ${moves}`);
    }

    // Минимальное время прохождения (строго меньше предыдущего рекорда)
    if (settings.timerEnabled && (rec.minSeconds === null || elapsedSeconds < rec.minSeconds)) {
        rec.minSeconds = elapsedSeconds;
        earned.push(`Рекордное время на ${settings.boardSize}: ${formatTime(elapsedSeconds)}`);
    }

    if (earned.length > 0) {
        triggerAchievement(earned.join(" • "));
    }
}

function startGame() {
    stopGameTimers();

    const boardConfig = BOARD_CONFIGS[settings.boardSize] || BOARD_CONFIGS["3x4"];
    const totalCards = boardConfig.total;

    container.style.gridTemplateColumns = `repeat(${boardConfig.cols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${boardConfig.rows}, 1fr)`;
    container.innerHTML = "";

    cards = [];
    twoCards = [];
    count = 0;
    moves = 0;
    elapsedSeconds = 0;
    matchedPairs = 0;
    isLocked = true;

    movesElement.textContent = moves;
    timerElement.textContent = formatTime(elapsedSeconds);
    syncTimerVisibility();

    const cardItems = generateCardItemsForCount(totalCards);

    for (let i = 0; i < totalCards; i++) {
        const cardNumber = i + 1;
        const { color, emoji } = cardItems[i];

        const box = document.createElement("div");
        box.id = `card${cardNumber}`;
        box.className = "card";

        const inner = document.createElement("div");
        inner.className = "card-inner";

        const front = document.createElement("div");
        front.className = "card-front";

        const back = document.createElement("div");
        back.className = "card-back";
        back.style.backgroundColor = color;

        const emojiSpan = document.createElement("span");
        emojiSpan.className = "card-emoji";
        emojiSpan.textContent = emoji;

        back.appendChild(emojiSpan);
        inner.appendChild(front);
        inner.appendChild(back);
        box.appendChild(inner);
        container.appendChild(box);

        const card = new Cards(cardNumber, color, emoji, box);
        card.openCard();
        cards.push(card);

        box.addEventListener("click", function () {
            if (isLocked || card.isOpen || card.isMatched) return;

            card.openCard();
            SoundFX.flip(true);
            twoCards.push(card.getIndex());
            count++;

            if (count === 2) {
                moves++;
                movesElement.textContent = moves;

                const firstCard = cards[twoCards[0]];
                const secondCard = cards[twoCards[1]];

                if (!firstCard.getWinColor(secondCard)) {
                    isLocked = true;
                    setTimeout(() => {
                        firstCard.closeCard();
                        secondCard.closeCard();
                        SoundFX.flip(false);
                        count = 0;
                        twoCards.length = 0;
                        isLocked = false;
                    }, 600);
                } else {
                    firstCard.isMatched = true;
                    secondCard.isMatched = true;
                    matchedPairs++;
                    count = 0;
                    twoCards.length = 0;

                    if (matchedPairs === totalCards / 2) {
                        clearInterval(gameTimerInterval);
                        SoundFX.win();
                        const timePart = settings.timerEnabled ? ` за ${formatTime(elapsedSeconds)}` : "";
                        setStatusMessage(`Победа! Все пары найдены за ${moves} ходов${timePart}.`);
                        handleWinAchievements();
                    } else {
                        SoundFX.match();
                    }
                }
            }
        });
    }

    let secondsLeft = settings.memorizeSeconds;
    setStatusMessage(`Запоминайте карточки: ${secondsLeft}...`);

    countdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
            setStatusMessage(`Запоминайте карточки: ${secondsLeft}...`);
        } else {
            clearInterval(countdownInterval);
        }
    }, 1000);

    previewTimer = setTimeout(() => {
        cards.forEach((card) => card.closeCard());
        SoundFX.flip(false);
        isLocked = false;
        startElapsedTimer();
        setStatusMessage("Время на запоминание вышло — игра началась!", 2000);
    }, settings.memorizeSeconds * 1000);
}

restartBtn.addEventListener("click", startGame);

applyBackground(settings.bgType, settings.bgValue);
updateMenuAchievementDisplay();