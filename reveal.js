/* -------------------------------------------------------------------------
   Scroll-reveal for the overlay sections.
   - Each [data-reveal] element flies into place from its direction
     (left / right / bottom) the first time it enters the viewport.
   - The gallery rows get a subtle scroll-linked parallax drift so the
     top row and bottom row glide in opposite directions, echoing the
     reference motion.
   ------------------------------------------------------------------------- */

(function () {
    // --- Directional reveal on enter -------------------------------------
    const revealItems = document.querySelectorAll('[data-reveal]');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    observer.unobserve(entry.target); // reveal once
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px 0px -8% 0px'
        });

        revealItems.forEach((el) => observer.observe(el));
    } else {
        // No IO support: just show everything
        revealItems.forEach((el) => el.classList.add('in'));
    }

    // --- Opposite-direction scroll movement of the two gallery rows ------
    //     Top row slides RIGHT, bottom row slides LEFT as you scroll.
    const row1 = document.getElementById('gallery-row-1');
    const row2 = document.getElementById('gallery-row-2');
    const gallery = document.querySelector('.gallery-section');

    const SHIFT = 120; // max horizontal travel in px

    let ticking = false;

    function parallax() {
        ticking = false;
        if (!gallery || !row1 || !row2) return;

        const rect = gallery.getBoundingClientRect();
        const vh = window.innerHeight;

        // progress: -1 (section entering from below) .. 1 (section leaving above)
        let progress = (vh / 2 - (rect.top + rect.height / 2)) / (vh * 0.9);
        progress = Math.max(-1, Math.min(1, progress));

        const shift = progress * SHIFT;

        row1.style.transform = `translateX(${shift}px)`;   // top row → right
        row2.style.transform = `translateX(${-shift}px)`;  // bottom row → left
    }

    function onScroll() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(parallax);
        }
    }

    // --- Interactive Video Playback & Auto-Resume Handler -------------------
    const videoCards = document.querySelectorAll('.video-card');

    videoCards.forEach((card) => {
        const video = card.querySelector('.hover-video');
        const badgeText = card.querySelector('.badge-icon');
        if (!video) return;

        // Ensure video is set to loop and muted for reliable background autoplay
        video.muted = true;
        video.loop = true;
        video.playsInline = true;

        const forcePlayMuted = () => {
            if (!video.src && video.dataset.src) video.src = video.dataset.src;
            video.muted = true;
            video.play().catch(() => {});
        };

        // If the browser pauses the video for any reason (e.g. unmuting policy),
        // instantly auto-resume playback in muted mode so it NEVER freezes!
        video.addEventListener('pause', () => {
            // Only auto-resume if modal is not active
            const activeModal = document.querySelector('.modal-container.active');
            if (!activeModal) {
                forcePlayMuted();
            }
        });

        // Playback starts lazily via the shared observer below (only when the
        // card is near the viewport), so nothing downloads on first paint.

        // Mouse Hover Interaction
        card.addEventListener('mouseenter', () => {
            card.classList.add('has-sound');
            if (badgeText) badgeText.innerHTML = '🔊 Sound Active';

            // Attempt unmuting sound safely
            video.muted = false;
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Browser blocked unmuted autoplay -> instantly resume muted playback
                    forcePlayMuted();
                });
            }
        });

        // Mouse Leave Interaction
        card.addEventListener('mouseleave', () => {
            card.classList.remove('has-sound');
            if (badgeText) badgeText.innerHTML = '🔇 Hover to unmute';
            forcePlayMuted();
        });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    // --- Lazy-load & play every video only when near the viewport ----------
    //     Videos use data-src (not src) so they never download until scrolled
    //     into view — keeping bandwidth free for the background animation.
    const lazyVideos = document.querySelectorAll('video[data-src]');
    if ('IntersectionObserver' in window) {
        const vObs = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                const v = e.target;
                if (e.isIntersecting) {
                    if (!v.src) v.src = v.dataset.src;
                    v.muted = true;
                    v.play().catch(() => {});
                } else if (!v.paused) {
                    v.pause();  // save CPU when off-screen
                }
            });
        }, { rootMargin: '200px 0px', threshold: 0.1 });
        lazyVideos.forEach((v) => vObs.observe(v));
    } else {
        lazyVideos.forEach((v) => { v.src = v.dataset.src; v.play().catch(() => {}); });
    }
})();
