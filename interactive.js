/* -------------------------------------------------------------------------
   AIfy Interactive UI Controller
   - Toast notification system
   - Modal management (Get Started, Pricing, Resources, Roadmap details, Video Lightbox)
   - Dynamic Hero visual card interactions (Task checklist toggle, Analytics tooltips)
   - Smooth scroll handling
   ------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Toast Notification System ---------------------------------------
    const toastContainer = document.getElementById('toast-container');

    window.showToast = function (message, type = 'info') {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? '✓' : type === 'warning' ? '!' : 'ℹ';
        toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${message}</span>`;
        
        toastContainer.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3500);
    };

    // --- 2. Modal Helper Functions -------------------------------------------
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock background scrolling
    }

    function closeModal(modal) {
        if (typeof modal === 'string') modal = document.getElementById(modal);
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Pause any video playing in lightbox
        const video = modal.querySelector('video');
        if (video) {
            video.pause();
            video.currentTime = 0;
        }

        // Resume background showcase videos
        document.querySelectorAll('.hover-video').forEach(v => {
            v.muted = true;
            v.play().catch(() => {});
        });
    }

    // Close modals on clicking overlay or element with data-close
    document.querySelectorAll('.modal-overlay, [data-close]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            if (e.target === trigger || trigger.hasAttribute('data-close')) {
                const modal = trigger.closest('.modal-container');
                if (modal) closeModal(modal);
            }
        });
    });

    // Close on Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal-container.active');
            if (activeModal) closeModal(activeModal);
        }
    });

    // --- 3. Navigation Actions ----------------------------------------------
    const brandBtn = document.getElementById('nav-brand');
    if (brandBtn) {
        brandBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const navFeatures = document.getElementById('nav-features');
    if (navFeatures) {
        navFeatures.addEventListener('click', (e) => {
            e.preventDefault();
            const sec = document.querySelector('.roadmap-section');
            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
        });
    }

    const navPricing = document.getElementById('nav-pricing');
    if (navPricing) {
        navPricing.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('pricing-modal');
        });
    }

    const navResources = document.getElementById('nav-resources');
    if (navResources) {
        navResources.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('resources-modal');
        });
    }

    const navAbout = document.getElementById('nav-about');
    if (navAbout) {
        navAbout.addEventListener('click', (e) => {
            e.preventDefault();
            const sec = document.querySelector('.about-section');
            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // --- 4. Get Started / Sign Up Modal Triggers -----------------------------
    const getStartedBtns = document.querySelectorAll('.trigger-get-started, #nav-get-started, #hero-get-started');
    getStartedBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('get-started-modal');
        });
    });

    const getStartedForm = document.getElementById('get-started-form');
    if (getStartedForm) {
        getStartedForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('gs-email');
            const email = emailInput ? emailInput.value.trim() : '';
            if (email) {
                closeModal('get-started-modal');
                showToast(`Welcome to AIfy! Activation link sent to ${email}`, 'success');
                if (emailInput) emailInput.value = '';
            }
        });
    }

    // --- 5. See It In Action (Demo Video Lightbox) ---------------------------
    const seeActionBtn = document.getElementById('hero-see-action');
    const videoModal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video');

    if (seeActionBtn && videoModal && modalVideo) {
        seeActionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modalVideo.src = 'videos/video1.mp4';
            openModal('video-modal');
            modalVideo.play().catch(() => {});
        });
    }

    // --- 6. Hover Video Cards ------------------------------------------------
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach(card => {
        const video = card.querySelector('video');
        const badge = card.querySelector('.badge-icon');

        if (!video) return;

        card.addEventListener('mouseenter', () => {
            if (!video.src && video.dataset.src) {
                video.src = video.dataset.src;
            }
            video.muted = false;
            video.play().then(() => {
                if (badge) badge.textContent = '🔊 Playing Audio';
            }).catch(() => {
                video.muted = true;
                video.play();
                if (badge) badge.textContent = '🔇 Hover to unmute';
            });
        });

        card.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0;
            video.muted = true;
            if (badge) badge.textContent = '🔇 Hover to unmute';
        });

        card.addEventListener('click', () => {
            if (!video.src && video.dataset.src) {
                video.src = video.dataset.src;
            }
            if (modalVideo) {
                modalVideo.src = video.src || video.dataset.src;
                openModal('video-modal');
                modalVideo.muted = false;
                modalVideo.play().catch(() => {});
            }
        });
    });

    // --- 7. Interactive Sliding Tiles (Gallery) ------------------------------
    const galleryTiles = document.querySelectorAll('.tile');
    galleryTiles.forEach(tile => {
        const video = tile.querySelector('video');
        if (!video) return;

        tile.addEventListener('mouseenter', () => {
            if (!video.src && video.dataset.src) {
                video.src = video.dataset.src;
            }
            video.muted = true;
            video.play().catch(() => {});
        });

        tile.addEventListener('mouseleave', () => {
            video.pause();
        });

        tile.addEventListener('click', () => {
            if (!video.src && video.dataset.src) {
                video.src = video.dataset.src;
            }
            if (modalVideo) {
                modalVideo.src = video.src || video.dataset.src;
                openModal('video-modal');
                modalVideo.muted = false;
                modalVideo.play().catch(() => {});
            }
        });
    });

    // --- 8. Pricing Modal Calculations ---------------------------------------
    const billingToggle = document.getElementById('billing-toggle');
    const pricePro = document.getElementById('price-pro');
    const priceEnt = document.getElementById('price-ent');
    const billingLabel = document.querySelectorAll('.billing-period');

    if (billingToggle) {
        billingToggle.addEventListener('change', () => {
            const isYearly = billingToggle.checked;
            if (pricePro) pricePro.textContent = isYearly ? '$29' : '$39';
            if (priceEnt) priceEnt.textContent = isYearly ? '$79' : '$99';
            billingLabel.forEach(el => el.textContent = isYearly ? '/mo (billed annually)' : '/month');
            showToast(isYearly ? 'Switched to Annual Billing (Save 25%!)' : 'Switched to Monthly Billing', 'info');
        });
    }

    // Pricing plan selection buttons
    document.querySelectorAll('.select-plan-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const plan = btn.getAttribute('data-plan') || 'Pro';
            closeModal('pricing-modal');
            showToast(`Selected the ${plan} Plan! Redirecting to setup...`, 'success');
        });
    });

    // --- 7. Hero UI Cards Interactions ---------------------------------------
    // Task list check toggles
    const taskRows = document.querySelectorAll('.card-tasklists .uc-row');
    taskRows.forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => {
            const chk = row.querySelector('.chk');
            if (chk) {
                const isDone = chk.classList.contains('done');
                if (isDone) {
                    chk.classList.remove('done');
                    chk.innerHTML = '';
                    showToast('Task marked incomplete', 'info');
                } else {
                    chk.classList.add('done');
                    chk.innerHTML = '&#10003;';
                    showToast('Task completed! 🎉', 'success');
                }
            }
        });
    });

    // Analytics Chart Bar Tooltips
    const chartBars = document.querySelectorAll('.card-analytics .bars span');
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const values = ['$12.4k', '$18.2k', '$24.5k', '$32.1k', '$48.9k'];

    chartBars.forEach((bar, idx) => {
        bar.style.cursor = 'pointer';
        bar.addEventListener('click', () => {
            showToast(`${months[idx]} Revenue: ${values[idx]} (+${20 + idx * 10}% vs prev)`, 'success');
        });
    });

    // Insight pills click
    const insightPills = document.querySelectorAll('.card-insights .pill');
    insightPills.forEach(pill => {
        pill.style.cursor = 'pointer';
        pill.addEventListener('click', () => {
            showToast(`Filter applied: "${pill.textContent.trim()}"`, 'info');
        });
    });

    // --- 8. Roadmap Chip Popover / Modal --------------------------------------
    const roadmapChips = document.querySelectorAll('.roadmap-chip');
    const roadmapModal = document.getElementById('roadmap-modal');
    const rmTitle = document.getElementById('rm-modal-title');
    const rmDesc = document.getElementById('rm-modal-desc');

    const roadmapData = {
        'Business audit': 'We map your current sales, marketing, and tech stack to find exactly where AI will move the needle fastest.',
        'AI opportunity map': 'A prioritized plan showing which AI systems — sales, video, ads, web, or data — deliver the highest ROI for your business.',
        'AI sales system': 'We build AI that qualifies leads, personalizes outreach, and books meetings around the clock.',
        'Video & ad content': 'AI-generated ad videos, product reels, and brand stories, edited and ready for Instagram, Facebook, and TikTok.',
        'Website & database': 'Custom high-converting websites backed by smart, structured databases we design and deploy for you.',
        'Launch campaigns': 'We launch and manage your Instagram and Facebook ad campaigns, optimizing creative and spend for maximum ROAS.',
        'Automate workflows': 'Repetitive work handed to AI — follow-ups, reporting, publishing, and lead routing run automatically.',
        'Optimize & grow revenue': 'Continuous testing and tuning across every channel to compound your growth month over month.'
    };

    roadmapChips.forEach(chip => {
        chip.style.cursor = 'pointer';
        chip.addEventListener('click', () => {
            const rawText = chip.textContent.replace('✓', '').trim();
            const text = Object.keys(roadmapData).find(k => rawText.includes(k)) || rawText;
            const desc = roadmapData[text] || `Detailed specification and execution roadmap for ${text}.`;

            if (rmTitle) rmTitle.textContent = text;
            if (rmDesc) rmDesc.textContent = desc;

            openModal('roadmap-modal');
        });
    });

    // --- 9. Copy Phone Number Handler ----------------------------------------
    document.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.btn-copy-num');
        if (copyBtn) {
            const num = copyBtn.getAttribute('data-copy');
            if (num) {
                const formattedNum = `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(num).then(() => {
                        showToast(`Copied ${formattedNum} to clipboard!`, 'success');
                    }).catch(() => {
                        showToast(`Phone number: ${formattedNum}`, 'info');
                    });
                } else {
                    showToast(`Phone number: ${formattedNum}`, 'info');
                }
            }
        }
    });

    // --- 10. Cursor-Following Glow Effect for Pricing Cards -------------------
    const quotePanels = document.querySelectorAll('.quote-cta');
    quotePanels.forEach(panel => {
        panel.addEventListener('mousemove', (e) => {
            const rect = panel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            panel.style.setProperty('--glow-x', `${x}px`);
            panel.style.setProperty('--glow-y', `${y}px`);
            panel.style.setProperty('--glow-opacity', '1');
        });

        panel.addEventListener('mouseleave', () => {
            panel.style.setProperty('--glow-opacity', '0.75');
            panel.style.setProperty('--glow-x', '50%');
            panel.style.setProperty('--glow-y', '30%');
        });
    });

    const phoneCards = document.querySelectorAll('.phone-card');
    phoneCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--card-glow-x', `${x}px`);
            card.style.setProperty('--card-glow-y', `${y}px`);
            card.style.setProperty('--card-glow-opacity', '1');
        });

        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--card-glow-opacity', '0');
        });
    });

});
