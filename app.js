/* -------------------------------------------------------------------------
   Cinematic scroll-driven image sequence
   - Preloads the frames, maps scroll position to a frame index, and glides
     toward it with damped interpolation for fluid motion.
   ------------------------------------------------------------------------- */

// --- Configuration --------------------------------------------------------
const TOTAL_FRAMES = 148;
const FRAME_PATH   = (i) => `images/ezgif-frame-${String(i).padStart(3, '0')}.jpg`;
const SMOOTHING    = 0.09; // 0 = frozen, 1 = instant. Lower = smoother/heavier glide.

// --- State ----------------------------------------------------------------
const images = [];
let targetProgress  = 0;   // where the scroll wants to be (0..1)
let currentProgress = 0;   // where the animation actually is (0..1)
let lastFrame = -1;
let rafId = null;

// --- DOM ------------------------------------------------------------------
const canvas  = document.getElementById('scroll-canvas');
const context = canvas.getContext('2d', { alpha: false });

// --- Canvas sizing (Retina/high-DPI aware) --------------------------------
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(window.innerWidth  * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
}

// --- Draw one frame, cover-cropped to fill the viewport -------------------
function drawFrame(index) {
    const img = images[index];
    if (!img || !img.complete || !img.naturalWidth) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const scale = Math.max(cw / iw, ch / ih); // cover
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    context.drawImage(img, dx, dy, dw, dh);
}

// --- Render loop: glide currentProgress toward targetProgress -------------
function tick() {
    const diff = targetProgress - currentProgress;

    if (Math.abs(diff) < 0.00005) {
        currentProgress = targetProgress; // settle exactly
        renderCurrent();
        rafId = null;                     // sleep until next scroll
        return;
    }

    currentProgress += diff * SMOOTHING;
    renderCurrent();
    rafId = requestAnimationFrame(tick);
}

function renderCurrent() {
    const frame = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(currentProgress * (TOTAL_FRAMES - 1)))
    );
    if (frame !== lastFrame) {
        drawFrame(frame);
        lastFrame = frame;
    }
}

function wake() {
    if (rafId === null) rafId = requestAnimationFrame(tick);
}

// --- Scroll input ---------------------------------------------------------
function onScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    targetProgress = maxScroll > 0 ? scrollTop / maxScroll : 0;
    wake();
}

// --- Preload all frames ---------------------------------------------------
function preload() {
    return new Promise((resolve) => {
        let loaded = 0;
        const done = () => { if (++loaded === TOTAL_FRAMES) resolve(); };
        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const img = new Image();
            img.onload = done;
            img.onerror = done; // don't hang if one frame is missing
            img.src = FRAME_PATH(i);
            images[i - 1] = img;
        }
    });
}

// --- Init -----------------------------------------------------------------
async function init() {
    resizeCanvas();

    window.addEventListener('resize', () => {
        resizeCanvas();
        lastFrame = -1;      // force redraw at new resolution
        renderCurrent();
    });

    await preload();

    drawFrame(0);
    lastFrame = 0;

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // sync to any restored scroll position
}

window.addEventListener('DOMContentLoaded', init);
