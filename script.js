function starString(rating) {
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = Math.round(r);
    return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}

function setupNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu?.classList.remove('active');
        });
    });
}

function getAuthUser() {
    try {
        return JSON.parse(localStorage.getItem('auth_user') || 'null');
    } catch {
        return null;
    }
}

function setupNavAuth() {
    const li = document.getElementById('navAuthItem');
    if (!li) return;
    const user = getAuthUser();
    if (!user) {
        const link = document.getElementById('navAuthLink');
        if (link) {
            link.textContent = 'Вход';
            link.setAttribute('href', 'auth.html');
        }
        return;
    }

    li.innerHTML = `
        <div class="nav-user">
            <span class="nav-user-name">${escapeHtml(user.name || user.email || 'Пользователь')}</span>
            <button type="button" class="nav-logout-btn" id="navLogoutBtn">Выход</button>
        </div>
    `;
    const btn = document.getElementById('navLogoutBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            window.location.href = 'index.html';
        });
    }
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

class BooksCarousel {
    constructor() {
        this.track = document.querySelector('.books-track');
        this.prevBtn = document.querySelector('.carousel-btn-prev');
        this.nextBtn = document.querySelector('.carousel-btn-next');
        this.dotsContainer = document.querySelector('.carousel-dots');

        this.currentIndex = 0;
        this.cardsPerView = this.getCardsPerView();
        this.refreshCards();

        this.init();
    }

    refreshCards() {
        this.cards = document.querySelectorAll('.book-card');
        this.totalCards = this.cards.length;
        this.maxIndex = Math.max(0, this.totalCards - this.cardsPerView);
    }

    getCardsPerView() {
        const width = window.innerWidth;
        if (width <= 768) return 1;
        if (width <= 1024) return 2;
        return 3;
    }

    init() {
        this.createDots();
        this.updateCarousel();
        this.attachEventListeners();
        this.handleResize();
    }

    createDots() {
        if (!this.dotsContainer) return;
        const dotsCount = Math.max(1, Math.ceil(this.totalCards / this.cardsPerView));
        this.dotsContainer.innerHTML = '';

        for (let i = 0; i < dotsCount; i++) {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot';
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.goToSlide(i));
            this.dotsContainer.appendChild(dot);
        }
    }

    updateCarousel() {
        if (!this.track) return;
        this.refreshCards();

        const cardWidth = this.cards[0]?.offsetWidth || 0;
        const gap = 32; // 2rem
        const translateX = -(this.currentIndex * (cardWidth + gap));

        this.track.style.transform = `translateX(${translateX}px)`;
        this.updateDots();
        this.updateButtons();
    }

    updateDots() {
        if (!this.dotsContainer) return;
        const dots = this.dotsContainer.querySelectorAll('.carousel-dot');
        const activeDotIndex = Math.floor(this.currentIndex / this.cardsPerView);
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeDotIndex);
        });
    }

    updateButtons() {
        if (this.prevBtn) {
            this.prevBtn.style.opacity = this.currentIndex === 0 ? '0.5' : '1';
            this.prevBtn.style.pointerEvents = this.currentIndex === 0 ? 'none' : 'auto';
        }
        if (this.nextBtn) {
            this.nextBtn.style.opacity = this.currentIndex >= this.maxIndex ? '0.5' : '1';
            this.nextBtn.style.pointerEvents = this.currentIndex >= this.maxIndex ? 'none' : 'auto';
        }
    }

    goToSlide(index) {
        this.currentIndex = Math.min(index * this.cardsPerView, this.maxIndex);
        this.updateCarousel();
    }

    next() {
        if (this.currentIndex < this.maxIndex) {
            this.currentIndex = Math.min(this.currentIndex + this.cardsPerView, this.maxIndex);
            this.updateCarousel();
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex = Math.max(this.currentIndex - this.cardsPerView, 0);
            this.updateCarousel();
        }
    }

    attachEventListeners() {
        if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());
        if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prev());

        const carouselWrapper = document.querySelector('.books-carousel-wrapper');
        if (carouselWrapper) {
            let isScrolling = false;
            let scrollTimeout;

            carouselWrapper.addEventListener('wheel', (e) => {
                const rect = carouselWrapper.getBoundingClientRect();
                const isOverCarousel = (
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom
                );
                if (!isOverCarousel) return;

                const isHorizontalScroll = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
                e.preventDefault();

                if (isScrolling) return;
                isScrolling = true;

                const scrollDelta = isHorizontalScroll ? (e.deltaX !== 0 ? e.deltaX : e.deltaY) : e.deltaY;
                if (scrollDelta > 0) this.next();
                else this.prev();

                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    isScrolling = false;
                }, 500);
            }, { passive: false });
        }

        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        if (this.track) {
            this.track.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
            });

            this.track.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                currentX = e.touches[0].clientX;
            });

            this.track.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;

                const diffX = startX - currentX;
                const threshold = 50;
                if (Math.abs(diffX) > threshold) {
                    if (diffX > 0) this.next();
                    else this.prev();
                }
            });
        }
    }

    handleResize() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.cardsPerView = this.getCardsPerView();
                this.refreshCards();
                this.currentIndex = Math.min(this.currentIndex, this.maxIndex);
                this.createDots();
                this.updateCarousel();
            }, 250);
        });
    }
}

async function loadLanding() {
    const res = await fetch('/api/public/landing');
    if (!res.ok) throw new Error('Не удалось загрузить данные');
    const data = await res.json();

    const cover = data.cover || {};
    const about = data.about || {};
    const footer = data.footer || {};

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? '';
    };

    const setImg = (id, src, fallback) => {
        const el = document.getElementById(id);
        if (el && el.tagName === 'IMG') el.src = src || fallback;
    };

    const setHrefAndText = (id, href, text) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (href) el.setAttribute('href', href);
        if (text) el.textContent = text;
    };

    setText('heroAuthorName', cover.author_name || 'Имя Автора');
    setText('navBrand', cover.author_name || 'Автор');
    setText('heroSubtitle', cover.subtitle || '');
    setText('heroDescription', cover.description || '');
    setText('statBooks', cover.stat_books || '');
    setText('statReaders', cover.stat_readers || '');
    setText('statRating', cover.stat_rating || '');
    setImg('heroAuthorPhoto', cover.author_photo_path, 'https://via.placeholder.com/400x500/8B7355/FFFFFF?text=Автор');

    setText('aboutTitle', about.title || 'Об авторе');
    setText('aboutP1', about.paragraph_1 || '');
    setText('aboutP2', about.paragraph_2 || '');
    setText('aboutP3', about.paragraph_3 || '');
    setImg('aboutImage', about.image_path, 'https://via.placeholder.com/500x600/8B7355/FFFFFF?text=Автор');

    // Footer
    setText('footerEmail', footer.contact_email || 'author@example.com');
    setText('footerPhone', footer.contact_phone || '+7 (XXX) XXX-XX-XX');
    setHrefAndText('footerVk', footer.vk_url, footer.vk_label);
    setHrefAndText('footerTg', footer.tg_url, footer.tg_label);
    setHrefAndText('footerIg', footer.ig_url, footer.ig_label);
    setText('footerCopyright', footer.copyright_text || '© 2024 [Имя Автора]. Все права защищены.');

    const achievementsEl = document.getElementById('aboutAchievements');
    if (achievementsEl) {
        achievementsEl.innerHTML = '';
        (data.achievements || []).forEach(a => {
            const item = document.createElement('div');
            item.className = 'achievement-item';
            item.innerHTML = `<h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.body)}</p>`;
            achievementsEl.appendChild(item);
        });
    }

    const booksTrack = document.getElementById('booksTrack');
    if (booksTrack) {
        booksTrack.innerHTML = '';
        (data.books || []).forEach((b, idx) => {
            const card = document.createElement('div');
            card.className = 'book-card';
            const fallback = `https://via.placeholder.com/300x450/6B5B73/FFFFFF?text=Книга+${idx + 1}`;
            card.innerHTML = `
                <div class="book-cover">
                    <img src="${escapeAttr(b.cover_path || fallback)}" alt="Обложка книги ${idx + 1}">
                </div>
                <div class="book-info">
                    <h3 class="book-title">${escapeHtml(b.title)}</h3>
                    <p class="book-genre">${escapeHtml(b.genre)}</p>
                    <p class="book-description">${escapeHtml(b.description)}</p>
                    <div class="book-rating">
                        <span class="stars">${starString(b.rating)}</span>
                        <span class="rating-text">${escapeHtml(String(b.rating ?? ''))}</span>
                    </div>
                </div>
            `;
            booksTrack.appendChild(card);
        });
    }

    const reviewsGrid = document.getElementById('reviewsGrid');
    if (reviewsGrid) {
        reviewsGrid.innerHTML = '';
        (data.reviews || []).forEach((r, idx) => {
            const card = document.createElement('div');
            card.className = 'review-card';
            const fallback = `https://via.placeholder.com/60x60/8B7355/FFFFFF?text=${encodeURIComponent((r.reviewer_name || 'А')[0] || 'А')}`;
            card.innerHTML = `
                <div class="review-header">
                    <div class="reviewer-avatar">
                        <img src="${escapeAttr(r.avatar_path || fallback)}" alt="${escapeAttr(r.reviewer_name || 'Читатель')}">
                    </div>
                    <div class="reviewer-info">
                        <h4 class="reviewer-name">${escapeHtml(r.reviewer_name)}</h4>
                        <p class="reviewer-location">${escapeHtml(r.reviewer_location)}</p>
                    </div>
                    <div class="review-rating">
                        <span class="stars">${starString(r.rating)}</span>
                    </div>
                </div>
                <p class="review-text">"${escapeHtml(r.body)}"</p>
                <p class="review-book">— О книге "${escapeHtml(r.book_title)}"</p>
            `;
            reviewsGrid.appendChild(card);
        });
    }
}

function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function escapeAttr(str) {
    return escapeHtml(str).replaceAll('`', '&#096;');
}

function setupAnimations() {
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const sections = document.querySelectorAll('.books-section, .about-section, .reviews-section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    const reviewCards = document.querySelectorAll('.review-card');
    reviewCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

function setupSubscribeForm() {
    const subscribeForm = document.querySelector('.subscribe-form');
    if (!subscribeForm) return;
    subscribeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = subscribeForm.querySelector('input[type="email"]').value;
        alert(`Спасибо за подписку! Мы отправим новости на ${email}`);
        subscribeForm.reset();
    });
}

function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    setupNav();
    setupNavAuth();
    setupSmoothScroll();
    setupSubscribeForm();
    setupNavbarScroll();

    try {
        await loadLanding();
        new BooksCarousel();
        setupAnimations();
    } catch (e) {
        console.error(e);
    }
});
