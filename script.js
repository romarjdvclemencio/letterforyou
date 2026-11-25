const defaultMessage = `To my favorite person,

Somehow, every ordinary day feels a little brighter with you in it. Thank you for the laughter, the kindness, and all the little moments that mean so much.

I hope you never forget how loved and appreciated you are. Today, tomorrow, and all the days after.

Always yours,`;

const storageKey = "a-little-love-letter";
const messageInput = document.querySelector("#message-input");
const fontSelect = document.querySelector("#font-select");
const letterContent = document.querySelector("#letter-content");
const letterPaper = document.querySelector("#letter-paper");
const letterOverlay = document.querySelector("#letter-overlay");
const envelope = document.querySelector("#open-letter");
const envelopeHint = document.querySelector("#envelope-hint");
const settingsPanel = document.querySelector("#settings-panel");
const settingsTrigger = document.querySelector("#settings-trigger");
const settingsBackdrop = document.querySelector("#settings-backdrop");
const musicInput = document.querySelector("#music-input");
const musicUrlInput = document.querySelector("#music-url-input");
const musicLabel = document.querySelector("#music-label");
const musicStatus = document.querySelector("#music-status");
const music = document.querySelector("#letter-music");
const removeMusic = document.querySelector("#remove-music");
const shareLinkOutput = document.querySelector("#share-link-output");
const scrollHint = document.querySelector("#scroll-hint");
let musicUrl = null;
let externalMusicUrl = "";
let scrollFrame = 0;
let scrollDelay = 0;
let scrollStartedAt = 0;
let userHasScrolled = false;

function renderMessage(message) {
    letterContent.replaceChildren();
    const paragraphs = message.split(/\n\s*\n/);

    paragraphs.forEach((text) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        letterContent.append(paragraph);
    });
}

function saveSettings() {
    const settings = { message: messageInput.value, font: fontSelect.value };

    try {
        localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch (error) {
        musicStatus.textContent = "Your browser couldn't save these changes. They will last until you close this page.";
        console.error("Could not save letter settings.", error);
    }

    renderMessage(settings.message);
    letterPaper.classList.remove("font-playfair", "font-dancing", "font-baskerville");
    letterPaper.classList.add(`font-${settings.font}`);
}

try {
    const savedSettings = JSON.parse(localStorage.getItem(storageKey) || "null");
    messageInput.value = typeof savedSettings?.message === "string" ? savedSettings.message : defaultMessage;

    if (["playfair", "dancing", "baskerville"].includes(savedSettings?.font)) {
        fontSelect.value = savedSettings.font;
    }
} catch (error) {
    messageInput.value = defaultMessage;
    musicStatus.textContent = "Saved settings couldn't be read; using the default letter instead.";
    console.error("Could not read saved letter settings.", error);
}

const sharedSettings = new URLSearchParams(window.location.search);
if (sharedSettings.has("message")) messageInput.value = sharedSettings.get("message");
if (["playfair", "dancing", "baskerville"].includes(sharedSettings.get("font"))) {
    fontSelect.value = sharedSettings.get("font");
}

saveSettings();

messageInput.addEventListener("input", saveSettings);
fontSelect.addEventListener("change", saveSettings);

function setSettingsOpen(isOpen) {
    settingsPanel.classList.toggle("is-open", isOpen);
    settingsPanel.setAttribute("aria-hidden", String(!isOpen));
    settingsPanel.inert = !isOpen;
    settingsTrigger.setAttribute("aria-expanded", String(isOpen));
    settingsBackdrop.hidden = !isOpen;
    settingsBackdrop.classList.toggle("is-visible", isOpen);

    if (isOpen) {
        document.querySelector("#close-settings").focus();
    } else {
        settingsTrigger.focus();
    }
}

settingsTrigger.addEventListener("click", () => setSettingsOpen(true));
document.querySelector("#close-settings").addEventListener("click", () => setSettingsOpen(false));
document.querySelector("#done-settings").addEventListener("click", () => setSettingsOpen(false));
settingsBackdrop.addEventListener("click", () => setSettingsOpen(false));

function stopAutoScroll() {
    window.clearTimeout(scrollDelay);
    scrollDelay = 0;
    if (scrollFrame) {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = 0;
    }
    scrollHint.classList.remove("is-visible");
}

function animateLetterScroll(timestamp) {
    if (!scrollStartedAt) scrollStartedAt = timestamp;
    const elapsed = timestamp - scrollStartedAt;
    scrollStartedAt = timestamp;
    letterPaper.scrollTop += elapsed * 0.022;

    if (letterPaper.scrollTop + letterPaper.clientHeight < letterPaper.scrollHeight - 1) {
        scrollFrame = requestAnimationFrame(animateLetterScroll);
    } else {
        scrollFrame = 0;
        scrollHint.classList.remove("is-visible");
    }
}

function startAutoScroll() {
    stopAutoScroll();
    userHasScrolled = false;
    letterPaper.scrollTop = 0;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    scrollHint.classList.add("is-visible");
    scrollDelay = window.setTimeout(() => {
        scrollDelay = 0;
        if (letterOverlay.classList.contains("is-open") && !userHasScrolled) {
            scrollStartedAt = 0;
            scrollFrame = requestAnimationFrame(animateLetterScroll);
        }
    }, 1400);
}

["wheel", "touchstart", "pointerdown"].forEach((eventName) => {
    letterPaper.addEventListener(eventName, () => {
        userHasScrolled = true;
        stopAutoScroll();
    }, { passive: true });
});

letterPaper.addEventListener("keydown", (event) => {
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
        userHasScrolled = true;
        stopAutoScroll();
    }
});

function openLetter() {
    envelope.classList.add("is-open");
    envelopeHint.classList.add("is-hidden");
    letterOverlay.classList.add("is-open");
    letterOverlay.setAttribute("aria-hidden", "false");
    letterOverlay.inert = false;
    document.querySelector("#close-letter").focus();
    startAutoScroll();

    if (music.src) {
        music.play().then(() => {
            musicStatus.textContent = "Music is playing.";
        }).catch((error) => {
            musicStatus.textContent = "Your browser couldn't play this song. Try a different audio file.";
            console.error("Could not play the selected song.", error);
        });
    }
}

function closeLetter() {
    stopAutoScroll();
    letterOverlay.classList.remove("is-open");
    letterOverlay.setAttribute("aria-hidden", "true");
    letterOverlay.inert = true;
    envelope.classList.remove("is-open");
    envelopeHint.classList.remove("is-hidden");
    envelope.focus();
    music.pause();
}

envelope.addEventListener("click", openLetter);
document.querySelector("#close-letter").addEventListener("click", closeLetter);
letterOverlay.addEventListener("click", (event) => {
    if (event.target === letterOverlay) closeLetter();
});

musicInput.addEventListener("change", () => {
    const [file] = musicInput.files || [];
    if (!file) return;

    if (file.type && !file.type.startsWith("audio/")) {
        musicStatus.textContent = "Please choose an audio file.";
        musicInput.value = "";
        return;
    }

    if (musicUrl) URL.revokeObjectURL(musicUrl);
    music.pause();
    musicUrl = URL.createObjectURL(file);
    externalMusicUrl = "";
    musicUrlInput.value = "";
    music.src = musicUrl;
    musicLabel.textContent = file.name;
    musicStatus.textContent = "Song ready. It will play when the envelope opens.";
    removeMusic.hidden = false;
});

function clearMusic(statusMessage = "Song removed.") {
    music.pause();
    music.removeAttribute("src");
    music.load();
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    musicUrl = null;
    externalMusicUrl = "";
    musicInput.value = "";
    musicUrlInput.value = "";
    musicLabel.textContent = "Choose an audio file";
    musicStatus.textContent = statusMessage;
    removeMusic.hidden = true;
}

function setHostedMusic(rawUrl) {
    let parsedUrl;

    try {
        parsedUrl = new URL(rawUrl);
    } catch {
        musicStatus.textContent = "Enter a valid song URL beginning with http:// or https://.";
        return false;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        musicStatus.textContent = "Song links must begin with http:// or https://.";
        return false;
    }

    if (musicUrl) URL.revokeObjectURL(musicUrl);
    musicUrl = null;
    musicInput.value = "";
    music.pause();
    externalMusicUrl = parsedUrl.href;
    music.src = externalMusicUrl;
    musicStatus.textContent = "Hosted song ready. It will play when the envelope opens.";
    removeMusic.hidden = false;
    return true;
}

musicUrlInput.addEventListener("change", () => {
    const value = musicUrlInput.value.trim();
    if (value) {
        setHostedMusic(value);
    } else if (externalMusicUrl) {
        clearMusic();
    }
});

removeMusic.addEventListener("click", () => clearMusic());

const linkedMusic = sharedSettings.get("music");
if (linkedMusic) {
    musicUrlInput.value = linkedMusic;
    if (setHostedMusic(linkedMusic)) {
        musicStatus.textContent = "Shared song ready. It will play when the envelope opens.";
    }
}

document.querySelector("#share-letter").addEventListener("click", () => {
    const enteredMusicUrl = musicUrlInput.value.trim();
    if (enteredMusicUrl && enteredMusicUrl !== externalMusicUrl && !setHostedMusic(enteredMusicUrl)) return;

    saveSettings();
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set("message", messageInput.value);
    shareUrl.searchParams.set("font", fontSelect.value);
    if (externalMusicUrl) {
        shareUrl.searchParams.set("music", externalMusicUrl);
    } else {
        shareUrl.searchParams.delete("music");
    }

    shareLinkOutput.value = shareUrl.href;
    shareLinkOutput.hidden = false;

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(shareUrl.href).then(() => {
            musicStatus.textContent = musicUrl && !externalMusicUrl
                ? "Share link copied. The uploaded audio file will stay on this device."
                : "Share link copied. Send it to your special someone.";
        }).catch((error) => {
            musicStatus.textContent = "Link ready below, but copying was blocked. Select the link to copy it.";
            shareLinkOutput.focus();
            shareLinkOutput.select();
            console.error("Could not copy the share link.", error);
        });
    } else {
        musicStatus.textContent = "Link ready below. Select the link to copy it.";
        shareLinkOutput.focus();
        shareLinkOutput.select();
    }
});

music.addEventListener("error", () => {
    if (music.src) musicStatus.textContent = "This audio file couldn't be played. Try a different file.";
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (settingsPanel.classList.contains("is-open")) {
        setSettingsOpen(false);
    } else if (letterOverlay.classList.contains("is-open")) {
        closeLetter();
    }
});

window.addEventListener("beforeunload", () => {
    if (musicUrl) URL.revokeObjectURL(musicUrl);
});
