/* MWASTECH Technologies — site interactions */
(() => {
    'use strict';

    const WHATSAPP = '254790019763';
    const EMAIL = 'info@mwastech.com';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];

    /* ---------- Header & navigation ---------- */
    const header = $('.site-header');
    const nav = $('#mainNav');
    const toggle = $('#navToggle');
    let holdHeader = 0;
    const setMenu = (open) => {
        nav.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        if (open) header.classList.remove('is-hidden');
    };
    toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    // after an in-page jump the header stays visible, so people can see where they landed
    // (smooth scrolling turns a jump into many small downward steps, so hold the header for the length of the glide)
    const holdForJump = () => { header.classList.remove('is-hidden'); holdHeader = Date.now() + 1800; };
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', holdForJump));
    window.addEventListener('hashchange', holdForJump);
    if (location.hash) holdForJump();

    // Highlight the nav link for the section in view
    const navLinks = $$('a[href^="#"]', nav);
    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section').forEach(s => sectionObserver.observe(s));   // sections without a nav link clear the highlight

    /* ---------- Reveal on scroll (groups stagger their children) ---------- */
    $$('[data-stagger]').forEach(group => {
        [...group.children].forEach((child, i) => {
            child.classList.add('reveal');
            child.style.setProperty('--d', (i * 0.09).toFixed(2) + 's');
        });
    });
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(el => revealObserver.observe(el));

    /* ---------- Scroll flow: one rAF loop for everything tied to scroll position ---------- */
    const TONES = { white: [255, 255, 255], stone: [246, 245, 241] };
    // only the light sections share the flowing page colour; the dark contact block keeps its own and rises as a sheet
    const toned = $$('[data-tone]').filter(el => el.dataset.tone !== 'ink');
    const sheet = $('.contact');
    const heroEl = $('.hero');
    const heroCopy = $('[data-hero-copy]');
    const heroMachine = $('.hero-machine');
    const heroShape = $('.hero-shape');
    const heroLine = $('.shape-line');
    const shopMedia = $$('.shop-media');
    const wide = window.matchMedia('(min-width: 1081px)');
    const stacked = window.matchMedia('(max-width: 900px)');
    const clamp01 = v => Math.min(1, Math.max(0, v));
    const smooth = t => t * t * (3 - 2 * t);
    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

    let bounds = [], docH = 0, lastY = window.scrollY, lineLive = false, ticking = false;
    const measure = () => {
        bounds = toned.map(el => ({ top: el.offsetTop, tone: TONES[el.dataset.tone] || TONES.white }));
        docH = document.documentElement.scrollHeight - window.innerHeight;
    };

    // The page colour glides between neighbouring sections' tones.
    const paintBackground = (y, vh) => {
        let colour = bounds[0].tone;
        for (let i = 0; i < bounds.length - 1; i++) {
            const cur = bounds[i], next = bounds[i + 1];
            const focus = y + vh * 0.6;
            const band = Math.min(vh * 0.5, 420);
            if (focus < next.top - band / 2) { colour = cur.tone; break; }
            if (focus <= next.top + band / 2) { colour = mix(cur.tone, next.tone, smooth(clamp01((focus - (next.top - band / 2)) / band))); break; }
            colour = next.tone;
        }
        document.body.style.backgroundColor = `rgb(${colour.join(',')})`;
    };

    const update = () => {
        ticking = false;
        const y = window.scrollY, vh = window.innerHeight;

        // header: solid once scrolled, tucks away going down, comes back going up
        header.classList.toggle('scrolled', y > 20);
        if (Math.abs(y - lastY) > vh) header.classList.remove('is-hidden');   // a jump (link, #hash, reload) is not "scrolling down"
        else if (Date.now() > holdHeader && !nav.classList.contains('open')) {
            if (y > lastY + 6 && y > vh * 0.6) header.classList.add('is-hidden');
            else if (y < lastY - 6 || y < vh * 0.6) header.classList.remove('is-hidden');
        }
        lastY = y;
        header.style.setProperty('--progress', docH > 0 ? (y / docH).toFixed(4) : 0);

        if (bounds.length) paintBackground(y, vh);
        if (reduceMotion) return;

        // contact sheet: inset and rounded while it enters, full width once it reaches the upper part of the screen
        if (sheet) {
            const top = sheet.getBoundingClientRect().top;
            if (top < vh && top > -vh) sheet.style.setProperty('--sheet', (1 - smooth(clamp01((vh - top) / (vh * 0.75)))).toFixed(3));
        }

        // hero hand-off: the copy lifts away faster, the drawing lags behind, the orange line finishes drawing
        if (heroEl && y < heroEl.offsetHeight * 1.2) {
            const p = clamp01(y / heroEl.offsetHeight);
            heroCopy.style.translate = `0 ${(-p * 90).toFixed(1)}px`;
            heroCopy.style.opacity = (1 - smooth(clamp01(p * 1.4))).toFixed(3);
            heroShape.style.translate = `0 ${(p * 40).toFixed(1)}px`;
            heroMachine.style.translate = stacked.matches ? `-50% ${(p * 30).toFixed(1)}px` : `0 ${(p * 70).toFixed(1)}px`;
            if (lineLive) heroLine.style.strokeDashoffset = (560 * (1 - smooth(clamp01(p * 1.8)))).toFixed(1);
        }

        // machine photos float at slightly different speeds (wide screens only)
        if (wide.matches) {
            shopMedia.forEach((m, i) => {
                const r = m.getBoundingClientRect();
                if (r.bottom < -200 || r.top > vh + 200) return;
                const off = (r.top + r.height / 2 - vh / 2) * (i % 2 ? 0.05 : -0.035);
                m.style.translate = `0 ${off.toFixed(1)}px`;
            });
        } else if (shopMedia.length && shopMedia[0].style.translate) {
            shopMedia.forEach(m => { m.style.translate = ''; });
        }
    };
    const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

    // the load animation draws most of the hero line; after it ends, scrolling draws the rest
    if (heroLine && !reduceMotion) {
        heroLine.addEventListener('animationend', () => {
            heroLine.style.animation = 'none';
            lineLive = true;
            update();
        }, { once: true });
    }

    document.documentElement.classList.add('flow');
    measure();
    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', () => { measure(); requestUpdate(); });
    window.addEventListener('load', () => { measure(); requestUpdate(); });
    if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); requestUpdate(); }).observe(document.body);

    /* ---------- How it works: machine switcher ---------- */
    const tabs = $$('.machine-tab');
    if (tabs.length) {
        const panels = $$('.machine-panel');
        const explainSets = $$('.explain-set');
        const productSelect = $('#fProduct');

        const select = (tab, focus) => {
            const id = tab.dataset.machine;
            tabs.forEach(t => {
                const on = t === tab;
                t.setAttribute('aria-selected', String(on));
                t.tabIndex = on ? 0 : -1;
            });
            panels.forEach(p => { p.hidden = p.dataset.machine !== id; });
            explainSets.forEach(s => { s.hidden = s.dataset.machine !== id; });
            if (productSelect && tab.dataset.product) productSelect.value = tab.dataset.product;
            if (focus) tab.focus();
            if (window.innerWidth < 640) tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
        };

        tabs.forEach((tab, i) => {
            tab.addEventListener('click', () => select(tab));
            tab.addEventListener('keydown', e => {
                const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
                if (e.key in keys) { e.preventDefault(); select(tabs[(i + keys[e.key] + tabs.length) % tabs.length], true); }
                else if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
                else if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
            });
        });
    }

    /* ---------- Revenue estimator ---------- */
    const inL = $('#inLitres'), inP = $('#inPrice'), inD = $('#inDays');
    if (inL) {
        const kes = n => 'KES ' + Math.round(n).toLocaleString('en-KE');
        const fill = el => el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min) * 100) + '%');
        // result figures glide to their new value instead of jumping
        const shown = { month: 0, day: 0, jerry: 0 };
        let raf = 0;
        const glide = (target) => {
            cancelAnimationFrame(raf);
            const from = { ...shown }, start = performance.now(), dur = reduceMotion ? 0 : 420;
            const step = (now) => {
                const t = dur ? Math.min(1, (now - start) / dur) : 1, k = 1 - Math.pow(1 - t, 3);
                for (const key in target) shown[key] = from[key] + (target[key] - from[key]) * k;
                $('#resMonth').textContent = kes(shown.month);
                $('#resDay').textContent = kes(shown.day);
                $('#resJerry').textContent = Math.round(shown.jerry).toLocaleString('en-KE');
                if (t < 1) raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
        };
        const calc = () => {
            const litres = +inL.value, price = +inP.value, days = +inD.value;
            $('#outLitres').textContent = litres.toLocaleString('en-KE') + ' L';
            $('#outPrice').textContent = 'KES ' + price.toFixed(2);
            $('#outDays').textContent = days + ' days';
            glide({ month: litres * price * days, day: litres * price, jerry: litres / 20 });
            [inL, inP, inD].forEach(fill);
        };
        [inL, inP, inD].forEach(el => el.addEventListener('input', calc));
        calc();

        $('#calcCta').addEventListener('click', () => {
            const msg = $('#fMsg');
            if (msg && !msg.value.trim()) {
                msg.value = `I'm planning to sell about ${(+inL.value).toLocaleString('en-KE')} litres a day at KES ${(+inP.value).toFixed(2)} per litre. What machine and running costs would you recommend?`;
            }
            const sel = $('#fProduct');
            if (sel) sel.value = 'Not sure yet';
        });
    }

    /* ---------- Product buttons pre-select the form ---------- */
    const productSelect = $('#fProduct');
    $$('[data-product]').forEach(btn => btn.addEventListener('click', () => {
        const name = btn.dataset.product;
        if (productSelect && [...productSelect.options].some(o => o.value === name)) productSelect.value = name;
    }));

    /* ---------- Quote form → WhatsApp ---------- */
    const form = $('#quoteForm');
    if (form) {
        const errorEl = $('#formError');
        const fields = () => ({
            name: form.name.value.trim(),
            phone: form.phone.value.trim(),
            town: form.town.value.trim(),
            product: form.product.value,
            message: form.message.value.trim()
        });
        const compose = f => [
            `Hello MWASTECH, my name is ${f.name || '(not given)'}.`,
            `I'm interested in: ${f.product}`,
            f.town && `Location: ${f.town}`,
            f.phone && `Phone: ${f.phone}`,
            f.message && `\n${f.message}`
        ].filter(Boolean).join('\n');

        const validate = f => {
            form.name.removeAttribute('aria-invalid');
            form.phone.removeAttribute('aria-invalid');
            if (f.name.length < 2) { form.name.setAttribute('aria-invalid', 'true'); form.name.focus(); return 'Please enter your name.'; }
            if (f.phone && f.phone.replace(/\D/g, '').length < 9) { form.phone.setAttribute('aria-invalid', 'true'); form.phone.focus(); return 'Please check your phone number.'; }
            return '';
        };

        form.addEventListener('submit', e => {
            e.preventDefault();
            const f = fields();
            const err = validate(f);
            errorEl.textContent = err;
            if (err) return;
            const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(compose(f))}`;
            const win = window.open(url, '_blank', 'noopener');
            if (!win) window.location.href = url;
        });

        $('#mailAlt').addEventListener('click', e => {
            const f = fields();
            e.currentTarget.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Quote request: ' + f.product)}&body=${encodeURIComponent(compose(f))}`;
        });
    }

    /* ---------- Floating WhatsApp button steps aside on the contact section (it already has WhatsApp) ---------- */
    const fab = $('.wa-fab'), contactSec = $('#contact');
    if (fab && contactSec) {
        new IntersectionObserver(([e]) => fab.classList.toggle('is-away', e.isIntersecting), { rootMargin: '0px 0px -35% 0px' }).observe(contactSec);
    }

    /* ---------- Footer year ---------- */
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
})();
