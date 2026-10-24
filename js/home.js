(() => {
    'use strict';

    document.documentElement.classList.add('js');

    const header = document.querySelector('.site-nav--home');
    const toggle = document.querySelector('.home-nav-toggle');
    const nav = document.querySelector('.home-nav-panel');
    const mobileNav = window.matchMedia('(max-width: 900px)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (header && toggle && nav) {
        const setMenu = (open) => {
            header.classList.toggle('is-open', open);
            document.body.classList.toggle('nav-open', open && mobileNav.matches);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.querySelector('.sr-only').textContent = open ? 'Close navigation' : 'Open navigation';
        };

        toggle.addEventListener('click', () => {
            setMenu(toggle.getAttribute('aria-expanded') !== 'true');
        });

        nav.addEventListener('click', (event) => {
            if (event.target.closest('a')) setMenu(false);
        });

        document.addEventListener('click', (event) => {
            if (!header.contains(event.target)) setMenu(false);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && header.classList.contains('is-open')) {
                setMenu(false);
                toggle.focus();
            }
        });

        mobileNav.addEventListener('change', () => setMenu(false));
    }

    const marquee = document.querySelector('.home-marquee');
    const marqueeToggle = document.querySelector('.home-marquee-toggle');

    if (marquee && marqueeToggle) {
        marqueeToggle.addEventListener('click', () => {
            const paused = marquee.classList.toggle('is-paused');
            marqueeToggle.setAttribute('aria-pressed', String(paused));
            marqueeToggle.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} scrolling words`);
        });
    }

    const animatedElements = document.querySelectorAll(
        '.home-story, .home-highlight-card, .home-statement-inner, .folder-card, .home-final-cta'
    );

    if (!('IntersectionObserver' in window) || reduceMotion.matches) {
        animatedElements.forEach((element) => element.classList.add('is-visible'));
        return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

    animatedElements.forEach((element) => {
        element.classList.add('home-reveal');
        revealObserver.observe(element);
    });

    const stats = document.querySelectorAll('.home-stat-number[data-count]');
    const countUp = (element) => {
        const target = Number(element.dataset.count);
        if (!Number.isFinite(target)) return;

        const startedAt = performance.now();
        const duration = 850;
        const update = (now) => {
            const progress = Math.min(1, (now - startedAt) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = String(Math.round(target * eased)).padStart(2, '0');
            if (progress < 1) requestAnimationFrame(update);
        };

        requestAnimationFrame(update);
    };

    if (!('IntersectionObserver' in window) || reduceMotion.matches) return;

    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            countUp(entry.target);
        });
    }, { threshold: 0.6 });

    stats.forEach((stat) => statsObserver.observe(stat));
})();
