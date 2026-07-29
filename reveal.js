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

    // --- Interactive Video Sound Unmute on Hover -------------------------------
    const videoCards = document.querySelectorAll('.video-card');

    videoCards.forEach((card) => {
        const video = card.querySelector('.hover-video');
        const badgeText = card.querySelector('.badge-icon');
        if (!video) return;

        // Ensure video plays continuously muted
        video.muted = true;
        video.play().catch(() => {});

        card.addEventListener('mouseenter', () => {
            video.muted = false; // Unmute sound on pointer hover
            card.classList.add('has-sound');
            if (badgeText) badgeText.innerHTML = '🔊 Sound Active';
        });

        card.addEventListener('mouseleave', () => {
            video.muted = true; // Mute sound when pointer leaves (video keeps playing silently)
            card.classList.remove('has-sound');
            if (badgeText) badgeText.innerHTML = '🔇 Hover to unmute';
        });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
})();
