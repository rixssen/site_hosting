/* -------------------------------------------------------------------------
   Cinematic scroll-driven image sequence
   - Streams the frames progressively: the first frame paints the instant it
     arrives, and the rest fill in without ever blocking the page.
   - Maps scroll position to a frame index and glides toward it with damped
     interpolation for fluid motion.
   ------------------------------------------------------------------------- */

// --- Configuration --------------------------------------------------------
const TOTAL_FRAMES = 148;
const FRAME_PATH   = (i) => `frames/frame-${String(i).padStart(3, '0')}.webp`;
const SMOOTHING    = 0.09; // 0 = frozen, 1 = instant. Lower = smoother/heavier glide.

// --- State ----------------------------------------------------------------
const images = new Array(TOTAL_FRAMES);
const loaded = new Array(TOTAL_FRAMES).fill(false);
let targetProgress  = 0;   // where the scroll wants to be (0..1)
let currentProgress = 0;   // where the animation actually is (0..1)
let lastFrame = -1;
let rafId = null;
let canvasReady = false;

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
    if (!img || !img.complete || !img.naturalWidth) return false;

    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;

    context.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    return true;
}

// While the sequence is still streaming, fall back to the closest frame
// that HAS loaded, so the canvas is never blank mid-scrub.
function nearestLoaded(index) {
    if (loaded[index]) return index;
    for (let r = 1; r < TOTAL_FRAMES; r++) {
        if (index - r >= 0 && loaded[index - r]) return index - r;
        if (index + r < TOTAL_FRAMES && loaded[index + r]) return index + r;
    }
    return -1;
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
    const target = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(currentProgress * (TOTAL_FRAMES - 1)))
    );
    const frame = nearestLoaded(target);
    if (frame !== -1 && frame !== lastFrame) {
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

// --- Progressive streaming of frames --------------------------------------
function streamFrames() {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const idx = i - 1;
        const img = new Image();
        img.decoding = 'async';
        if (idx === 0 && 'fetchPriority' in img) img.fetchPriority = 'high';

        img.onload = () => {
            loaded[idx] = true;
            // Paint the very first available frame immediately, and upgrade
            // the current view whenever a nearer frame becomes ready.
            if (lastFrame === -1 || Math.abs(idx - lastFrame) <= 2) {
                lastFrame = -1;      // force a re-evaluation
                renderCurrent();
            }
            // Fade the background in smoothly once the first frame is on screen.
            if (!canvasReady && lastFrame !== -1) {
                canvasReady = true;
                canvas.classList.add('is-ready');
                document.body.classList.add('loaded');
            }
        };
        img.onerror = () => { loaded[idx] = false; };
        img.src = FRAME_PATH(i);
        images[idx] = img;
    }
}

// --- Init -----------------------------------------------------------------
function init() {
    resizeCanvas();

    window.addEventListener('resize', () => {
        resizeCanvas();
        lastFrame = -1;      // force redraw at new resolution
        renderCurrent();
    });

    window.addEventListener('scroll', onScroll, { passive: true });

    streamFrames();   // non-blocking — page stays responsive
    onScroll();       // sync to any restored scroll position

    // Safety net: never leave the page hidden if frames fail to load.
    setTimeout(() => document.body.classList.add('loaded'), 2500);
}

window.addEventListener('DOMContentLoaded', init);
