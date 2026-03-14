// ============================================================
// HERO WEBGL SHADER BACKGROUND (Ported from React Three Fiber)
// Native Three.js — PERFORMANCE-OPTIMIZED
// ============================================================

// Shared debounce utility
function debounce(fn, ms) {
    let t; return function() { clearTimeout(t); t = setTimeout(() => fn.apply(this, arguments), ms); };
}

function initWebGLBackground() {
    const canvas = document.getElementById('hero-mesh-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // Disable antialias for significant mobile perf gain; cap pixel ratio
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    function resize() {
        const parent = canvas.parentElement;
        renderer.setSize(parent.clientWidth, parent.clientHeight);
    }
    // Debounce resize to avoid thrashing during scroll/orientation change
    window.addEventListener('resize', debounce(resize, 200));
    resize();

    const vertexShader = `
      uniform float time;
      uniform float intensity;
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        vec3 pos = position;
        pos.y += sin(pos.x * 10.0 + time) * 0.1 * intensity;
        pos.x += cos(pos.y * 8.0 + time * 1.5) * 0.05 * intensity;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform float intensity;
      uniform vec3 color1;
      uniform vec3 color2;
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vec2 uv = vUv;
        float noise = sin(uv.x * 20.0 + time) * cos(uv.y * 15.0 + time * 0.8);
        noise += sin(uv.x * 35.0 - time * 2.0) * cos(uv.y * 25.0 + time * 1.2) * 0.5;
        vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
        color = mix(color, vec3(1.0), pow(abs(noise), 2.0) * intensity);
        float glow = 1.0 - length(uv - 0.5) * 2.0;
        glow = pow(glow, 2.0);
        gl_FragColor = vec4(color * glow, glow * 0.45);
      }
    `;

    const uniforms = {
        time: { value: 0 },
        intensity: { value: 1.0 },
        color1: { value: new THREE.Color('#bd895b') },
        color2: { value: new THREE.Color('#d6c5b3') }
    };

    const material = new THREE.ShaderMaterial({
        uniforms, vertexShader, fragmentShader,
        transparent: true, side: THREE.DoubleSide
    });

    // Reduced geometry complexity: 16×16 is plenty for a soft background
    const geometry = new THREE.PlaneGeometry(2, 2, 16, 16);
    scene.add(new THREE.Mesh(geometry, material));

    const clock = new THREE.Clock();
    let webglVisible = true;
    let animFrameId = null;

    function animate() {
        animFrameId = requestAnimationFrame(animate);
        if (!webglVisible) return; // Skip GPU work when off-screen
        const t = clock.getElapsedTime();
        uniforms.time.value = t;
        uniforms.intensity.value = 1.0 + Math.sin(t * 2) * 0.3;
        renderer.render(scene, camera);
    }

    // Pause WebGL rendering when the hero section scrolls out of view
    const heroSection = document.getElementById('hero');
    if (heroSection && 'IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
            webglVisible = entry.isIntersecting;
            if (webglVisible) clock.start(); else clock.stop();
        }, { threshold: 0 }).observe(heroSection);
    }

    animate();
}

// Initialization managed in DOMContentLoaded

document.addEventListener('DOMContentLoaded', () => {
    // --- 0. PREVENT RELOAD SCROLL GLITCH ---
    // Force manual scroll restoration to prevent browser from snapping down on Cmd+R
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // --- 1. PRELOADER & REVEAL SEQUENCE ---
    const preloader = document.getElementById('preloader');

    // Lock scroll during preloader
    document.body.style.overflowY = 'hidden';
    document.body.style.overflowX = 'clip';

    // After 2.0s, fade out preloader and reveal content
    setTimeout(() => {
        preloader.classList.add('preloader-hidden');
        document.body.classList.add('loaded');
        
        // Use requestAnimationFrame to restore scrolling exactly when paint happens
        requestAnimationFrame(() => {
            document.body.style.overflowY = ''; // Restore vertical scrolling
            document.body.style.overflowX = 'clip'; // Ensure horizontal stays locked
        });

        // Fully remove from DOM tree after fade (0.5s transition in CSS)
        setTimeout(() => {
            preloader.classList.add('preloader-removed');
        }, 500);

        // Trigger GSAP animations and Marquees AFTER all assets (fonts/images) are guaranteed loaded
        initMarquees();
        initHeroAnimations();
        initWebGLBackground();

        // Force recalculation of all scroll triggers once DOM is fully stabilized
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 100);
    }, 2000);

    // --- 2. GSAP SCROLLTRIGGER ANIMATIONS ---
    gsap.registerPlugin(ScrollTrigger);

    function initHeroAnimations() {
        // --- 3. HERO DASHBOARD ANIMATIONS ---
        const tl = gsap.timeline({
            defaults: { ease: "power3.out", duration: 1 }
        });

        // Intro sequence for Hero
        tl.from(".hero-trust-badge", { y: -20, opacity: 0 })
          .from(".heading-hero", { y: 20, opacity: 0 }, "-=0.8")
          .from(".hero-sub", { y: 20, opacity: 0 }, "-=0.8")
          .from(".hero-cta", { y: 20, opacity: 0 }, "-=0.8")
          .from(".hero-assurance", { opacity: 0 }, "-=0.6")
          .from(".hero-right-pane", { x: 40, opacity: 0, duration: 1.2 }, "-=1.0")
          .from(".floating-card", {
              y: 20,
              opacity: 0,
              stagger: 0.15,
              duration: 0.8,
              ease: "back.out(1.5)"
          }, "-=0.5");

        // 🔥 Trust Badge Rapid CSS Counters (Phase 63)
        const heroCounters = document.querySelectorAll('.counter-value');
        heroCounters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            
            // Format number exactly like existing layout (e.g., 3700 -> "3,700")
            const formatNumber = (num) => {
                return num.toLocaleString('en-IN'); // Indian comma formatting
            };

            gsap.to(counter, {
                innerHTML: target,
                duration: 2.0, // Fast rapid spin
                snap: { innerHTML: 1 },
                ease: "power2.out",
                onUpdate: function() {
                    counter.innerHTML = formatNumber(Math.round(this.targets()[0].innerHTML));
                },
                delay: 0.5 // Start spinning right as the badge fades in
            });
        });
        // Bento grid cards stagger
        gsap.from('.bento-card', {
            scale: 0.8,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "back.out(1.5)",
            delay: 0.3
        });

        // Service Cards Reveal
        gsap.from('.service-card', {
            scrollTrigger: {
                trigger: '.services-track',
                start: 'top 80%',
            },
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out"
        });

        // How it Works Timeline Reveal
        gsap.utils.toArray('.timeline-item').forEach((item, i) => {
            gsap.fromTo(item,
                { x: -20, opacity: 0 },
                {
                    scrollTrigger: {
                        trigger: item,
                        start: 'top 85%',
                    },
                    x: 0,
                    opacity: 1,
                    duration: 0.6,
                    ease: "power2.out"
                }
            );
        });


        // Trust Metrics CountUp
        const counters = document.querySelectorAll('.count-up');
        let hasCounted = false;

        ScrollTrigger.create({
            trigger: '.trust-metrics',
            start: 'top 90%',
            onEnter: () => {
                if (hasCounted) return;
                hasCounted = true;

                counters.forEach(counter => {
                    const target = parseInt(counter.getAttribute('data-target'));
                    const suffix = counter.getAttribute('data-suffix') || '';

                    gsap.to(counter, {
                        innerHTML: target,
                        duration: 1.5,
                        snap: { innerHTML: 1 },
                        ease: "power2.out",
                        onUpdate: function () {
                            counter.innerHTML = Math.round(this.targets()[0].innerHTML) + suffix + (target >= 10 && !suffix ? '+' : '');
                        }
                    });
                });
            }
        });
    }

    // --- 3. STICKY NAVBAR LOGIC (DYNAMIC ISLAND) ---
    const navLinks = document.querySelectorAll('.nav-link');
    const indicator = document.querySelector('.nav-indicator');
    const navWrapper = document.querySelector('.nav-links-wrapper');

    function updateIndicator(link) {
        if (!link || !indicator) return;
        const width = link.offsetWidth;
        const left = link.offsetLeft;
        indicator.style.width = width + 'px';
        indicator.style.transform = `translateX(${left}px)`;
    }

    // Initialization
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) setTimeout(() => updateIndicator(activeLink), 100);

    // Hover & Click behavior for Dynamic Island feel
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            updateIndicator(this);
        });
        
        link.addEventListener('click', function (e) {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            updateIndicator(this);
        });
    });

    // Intercept Logo click to prevent #hero hash in URL (which causes reload jumps)
    const logoLink = document.querySelector('a.nav-logo');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Sync the "Home" indicator
            const homeLink = document.querySelector('.nav-link[href="#hero"]');
            if(homeLink) {
                navLinks.forEach(l => l.classList.remove('active'));
                homeLink.classList.add('active');
                updateIndicator(homeLink);
            }
        });
    }

    // Snap back to active link when mouse leaves the navbar wrapper
    if (navWrapper) {
        navWrapper.addEventListener('mouseleave', () => {
            const currentActive = document.querySelector('.nav-link.active');
            if (currentActive) updateIndicator(currentActive);
        });
    }

    // --- 4. MOBILE HAMBURGER MENU ---
    const mobileToggle = document.getElementById('mobile-toggle');
    const header = document.getElementById('navbar');

    if (mobileToggle && navWrapper) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navWrapper.classList.toggle('active');
            // Prevent body scroll when menu is open
            document.body.style.overflowY = navWrapper.classList.contains('active') ? 'hidden' : '';
        });

        // Close mobile overlay when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navWrapper.classList.remove('active');
                document.body.style.overflowY = '';
            });
        });
    }

    // Intersection Observer for scroll highlighting
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                if (!id) return;
                const correspondingLink = document.querySelector(`.nav-link[href="#${id}"]`);
                if (correspondingLink) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    correspondingLink.classList.add('active');
                    updateIndicator(correspondingLink);
                }
            }
        });
    }, { threshold: 0.3 });

    sections.forEach(section => observer.observe(section));


    // --- 4. FLATPICKR DATE SELECTION ---
    flatpickr("#prefDate", {
        minDate: "today",
        dateFormat: "Y-m-d",
        onChange: function (selectedDates, dateStr, instance) {
            updateTimeSlots(selectedDates[0]);
        }
    });

    const timeSelect = document.getElementById('prefTime');

    // Generate 1-hour slots from 8 AM to 7 PM
    function formatHour(h) {
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        return (hour12 < 10 ? '0' : '') + hour12 + ':00 ' + period;
    }

    const START_HOUR = 8;  // 8 AM
    const END_HOUR = 19;   // 7 PM

    function updateTimeSlots(selectedDate) {
        timeSelect.innerHTML = '';
        const today = new Date();
        const isToday = selectedDate && selectedDate.toDateString() === today.toDateString();
        const currentHour = today.getHours();

        let availableCount = 0;

        for (let h = START_HOUR; h < END_HOUR; h++) {
            const slotText = formatHour(h) + ' - ' + formatHour(h + 1);
            const option = document.createElement('option');
            option.value = slotText;
            option.text = slotText;

            if (isToday && currentHour >= h) {
                option.disabled = true;
                option.text = slotText + ' (Unavailable)';
            } else {
                availableCount++;
            }
            timeSelect.appendChild(option);
        }

        if (availableCount === 0) {
            const option = document.createElement('option');
            option.text = 'No slots left for today';
            option.disabled = true;
            option.selected = true;
            timeSelect.innerHTML = '';
            timeSelect.appendChild(option);
        }
    }

    // Init state
    updateTimeSlots(new Date());


    // --- 5. BOOKING FORM LOGIC ---
    const bookingForm = document.getElementById('bookingForm');
    const couponInput = document.getElementById('coupon');
    const couponBadge = document.getElementById('couponBadge');

    // Auto select service when coming from cards
    const bookBtns = document.querySelectorAll('.btn-service-book');
    const serviceSelect = document.getElementById('serviceType');

    bookBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.currentTarget.getAttribute('data-type');
            if (type && serviceSelect) {
                serviceSelect.value = type;
                document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Coupon live validation
    const validCoupons = ['REPAIRCURE10', 'WELCOME10', 'FIRST10'];
    couponInput.addEventListener('input', () => {
        const val = couponInput.value.trim().toUpperCase();
        if (validCoupons.includes(val)) {
            couponBadge.classList.add('visible');
        } else {
            couponBadge.classList.remove('visible');
        }
    });

    // Form submission mock
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Hide form fields visually (or just show success msg below)
        const successMsg = document.getElementById('formSuccess');
        const discountNote = document.getElementById('discountNote');

        if (couponBadge.classList.contains('visible')) {
            discountNote.textContent = "- 10% Discount Applied!";
        } else {
            discountNote.textContent = "";
        }

        successMsg.style.display = 'block';

        setTimeout(() => {
            successMsg.style.display = 'none';
            bookingForm.reset();
            couponBadge.classList.remove('visible');
            updateTimeSlots(new Date()); // Reset slots
        }, 5000);
    });

    // --- 6. MARQUEE GENERATION (Deferred until after preloader) ---
    function initMarquees() {
        const reviews = [
            { name: "Rahul Sharma", handle: "@rahulsharma", rating: 5, avatar: "avatar_male_1_1772736073796.png", text: "Using RepairCure has transformed how we handle appliance breakdowns. The speed and quality are unprecedented." },
            { name: "Priya Patel", handle: "@priyapatel", rating: 5, avatar: "avatar_female_1_1772736106678.png", text: "The booking process is flawless. The mechanic arrived within an hour and fixed our Fridge immediately." },
            { name: "Amit Kumar", handle: "@amitkumar", rating: 4, avatar: "avatar_male_2_1772736090596.png", text: "Finally, a repair service that actually understands customer value! Highly recommend." },
            { name: "Neha Gupta", handle: "@nehagupta", rating: 5, avatar: "avatar_female_2_1772736129761.png", text: "Very professional. Identified the AC gas leak in 5 minutes and resolved it same day." },
            { name: "Sanjay Rao", handle: "@sanjayrao", rating: 5, avatar: "avatar_male_1_1772736073796.png", text: "Reasonable pricing and a 90-day warranty giving us total peace of mind." },
            { name: "Anjali Desai", handle: "@anjalidesai", rating: 4, avatar: "avatar_female_1_1772736106678.png", text: "Our washing machine stopped spinning and RepairCure had it running perfectly by the evening." },
            { name: "Vikram Singh", handle: "@vikramsingh", rating: 5, avatar: "avatar_male_2_1772736090596.png", text: "Exceptional service. The technician was polite and cleaned up completely after the repair." },
            { name: "Kavita Reddy", handle: "@kavitareddy", rating: 5, avatar: "avatar_female_2_1772736129761.png", text: "I've tried many local mechanics but RepairCure is by far the most reliable." },
            { name: "Arjun Nair", handle: "@arjunnair", rating: 5, avatar: "avatar_male_1_1772736073796.png", text: "The water purifier was leaking. Fixed it quickly and even gave tips on maintenance." },
            { name: "Meera Menon", handle: "@meeramenon", rating: 4, avatar: "avatar_female_1_1772736106678.png", text: "Microwave button panel was dead. Replaced the board at a fraction of the cost of a new one." },
            { name: "Karthik Iyer", handle: "@karthikiyer", rating: 5, avatar: "avatar_male_2_1772736090596.png", text: "Customer support is incredibly fast. They tracked the technician to my door." },
            { name: "Sneha Joshi", handle: "@snehajoshi", rating: 5, avatar: "avatar_female_2_1772736129761.png", text: "Best appliance service in Hubballi without a doubt." }
        ];

        const reviewsTrack = document.querySelector('.reviews-section .marquee-track');

        function createReviewHTML(review) {
            return `
                <div class="review-card">
                    <div class="review-header">
                        <img src="${review.avatar}" alt="${review.name}" class="review-avatar" loading="lazy">
                        <div class="review-meta">
                            <h4>${review.name}</h4>
                            <span>${review.handle}</span>
                            <div class="star-rating">${'⭐'.repeat(review.rating)}</div>
                        </div>
                    </div>
                    <p class="review-body">"${review.text}"</p>
                </div>
            `;
        }

        if (reviewsTrack) {
            // Create full set — triple for seamless infinite loop (same as brands)
            let htmlBlock = reviews.map(r => createReviewHTML(r)).join('');
            reviewsTrack.innerHTML = htmlBlock + htmlBlock + htmlBlock;

            // Pure infinite scroll via GSAP — no hover/click interactions
            const marqueeW = reviewsTrack.scrollWidth / 3;
            gsap.to(reviewsTrack, {
                x: -marqueeW,
                duration: 40,
                ease: "none",
                repeat: -1
            });
            // No hover/click/touch pause — runs like an uninteractive background loop
        }

        // Brands Marquee Setup
        const brandLogos = [
            { file: 'lg.png', name: 'LG' }, { file: 'samsung.png', name: 'Samsung' },
            { file: 'whirlpool.png', name: 'Whirlpool' }, { file: 'bosch.png', name: 'Bosch' },
            { file: 'ifb.png', name: 'IFB' }, { file: 'godrej.png', name: 'Godrej' },
            { file: 'haier.png', name: 'Haier' }, { file: 'panasonic.png', name: 'Panasonic' },
            { file: 'voltas.png', name: 'Voltas' }, { file: 'blue_star.png', name: 'Blue Star' },
            { file: 'kent.png', name: 'Kent' }, { file: 'aquaguard.png', name: 'Aquaguard' },
            { file: 'daikin.png', name: 'Daikin' }, { file: 'hitachi.jpg', name: 'Hitachi' },
            { file: 'sharp.png', name: 'Sharp' }, { file: 'siemens.png', name: 'Siemens' },
            { file: 'carrier.png', name: 'Carrier' }, { file: 'lloyd.png', name: 'Lloyd' }
        ];

        function createBrandHTML(brand) {
            return `
                <div class="brand-card">
                    <img src="${brand.file}" alt="${brand.name}" loading="lazy">
                    <span>${brand.name}</span>
                </div>
            `;
        }

        const t1 = document.getElementById('brandsTrack1');
        const t2 = document.getElementById('brandsTrack2');

        if (t1 && t2) {
            const half = Math.ceil(brandLogos.length / 2);
            const row1Brands = brandLogos.slice(0, half);
            const row2Brands = brandLogos.slice(half);

            let h1 = row1Brands.map(b => createBrandHTML(b)).join('');
            let h2 = row2Brands.map(b => createBrandHTML(b)).join('');

            t1.innerHTML = h1 + h1 + h1; // triple to ensure smooth loop
            t2.innerHTML = h2 + h2 + h2;

            const w1 = t1.scrollWidth / 3;
            const w2 = t2.scrollWidth / 3;

            gsap.to(t1, { x: -w1, duration: 35, ease: "none", repeat: -1 });
            // Track 2 reverse map - start offset
            gsap.set(t2, { x: -w2 });
            gsap.to(t2, { x: 0, duration: 35, ease: "none", repeat: -1 });
            // Removed hover pause logic completely so brands pass like an uninteractive background video per user request
        }
    }

    // --- Interactive Hover Glows on Cards (RAF-throttled) ---
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        let rafPending = false;
        card.addEventListener('pointermove', (e) => {
            if (rafPending) return; // Skip until previous frame paints
            rafPending = true;
            requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const angle = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
                card.style.setProperty('--gradient-angle', `${angle + 90}deg`);
                rafPending = false;
            });
        });
    });

    // --- Star Button Native Port Logic ---
    const starBtn = document.getElementById('navStarBtn');
    if (starBtn) {
        const light = starBtn.querySelector('.star-btn-light');
        if (light) {
            // Function to recalculate path based on dimensions
            const updatePath = () => {
                const width = starBtn.offsetWidth;
                const height = starBtn.offsetHeight;
                // Instruct light beam to follow rectangular path equal to width x height
                light.style.setProperty(
                    'offset-path',
                    `path('M 0 0 H ${width} V ${height} H 0 V 0')`
                );
            };
            
            // Set initially and debounce resize
            updatePath();
            window.addEventListener('resize', debounce(updatePath, 200));
        }
    }

    /* =============================================
       HERO SLIDER – cinematic crossfade + Ken Burns
    ============================================= */
    const heroSlider = document.getElementById('heroSlider');
    if (heroSlider) {
        const slides = Array.from(heroSlider.querySelectorAll('.hero-slide'));
        const dots = Array.from(document.querySelectorAll('#heroSliderDots .hero-dot'));
        const labelEl = document.getElementById('heroSlideLabel');
        let current = 0;
        let sliderTimer = null;

        function goToSlide(index) {
            // remove active from current
            slides[current].classList.remove('active');
            slides[current].classList.add('exiting');
            dots[current].classList.remove('active');

            // after transition out, strip exiting class
            const prev = current;
            setTimeout(() => {
                slides[prev].classList.remove('exiting');
            }, 950);

            current = index;
            slides[current].classList.add('active');
            dots[current].classList.add('active');

            // animate label swap
            if (labelEl) {
                labelEl.style.opacity = '0';
                setTimeout(() => {
                    labelEl.textContent = slides[current].dataset.label || '';
                    labelEl.style.opacity = '0.75';
                }, 350);
            }
        }

        function nextSlide() {
            goToSlide((current + 1) % slides.length);
        }

        function startAutoplay() {
            sliderTimer = setInterval(nextSlide, 3000);
        }

        function resetAutoplay() {
            clearInterval(sliderTimer);
            startAutoplay();
        }

        // Dot click support
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                goToSlide(i);
                resetAutoplay();
            });
        });

        // Pause on hover
        heroSlider.addEventListener('mouseenter', () => clearInterval(sliderTimer));
        heroSlider.addEventListener('mouseleave', startAutoplay);

        startAutoplay();
    }

});


// FAQ Accordion
document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if(question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all other items
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                });

                // Toggle current item
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });
});

