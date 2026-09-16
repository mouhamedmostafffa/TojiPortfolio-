/*!
 * TOJI Portfolio — © 2026 Mohamed Mostafa. All rights reserved.
 * This source is not licensed for reuse, redistribution, or resale.
 */
(function () {
    try {
        console.log(
            '%c© 2026 Mohamed Mostafa — TOJI Portfolio\n%cThis code is not open-source. Copying/reusing it without permission is a copyright violation.',
            'color:#c98787;font-weight:800;font-size:13px;',
            'color:#9fa1a6;font-size:11px;'
        );
    } catch {}
})();

document.addEventListener('DOMContentLoaded', () => {
    function deepMerge(base, override) {
        if (Array.isArray(base) || Array.isArray(override)) {
            return Array.isArray(override) ? [...override] : Array.isArray(base) ? [...base] : override;
        }
        if (!base || typeof base !== 'object') return override ?? base;
        if (!override || typeof override !== 'object') return { ...base };

        const result = { ...base };
        Object.keys(override).forEach((key) => {
            result[key] = key in base ? deepMerge(base[key], override[key]) : override[key];
        });
        return result;
    }

    const body = document.body;
    const scrollRoot = document.getElementById('pageScroll');
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const progress = document.querySelector('.scroll-progress');
    const themeToggle = document.getElementById('themeToggle');
    const languageToggle = document.getElementById('languageToggle');
    const typeTarget = document.getElementById('typewriter');
    let dockBtns = document.querySelectorAll('.dock-btn');
    let navLinks = document.querySelectorAll('.nav-link');
    let sections = document.querySelectorAll('.screen');
    let revealElements = document.querySelectorAll('.reveal-up');
    let tiltElements = document.querySelectorAll('.tilt-effect');
    let sectionObserver;
    let revealObserver;
    const toast = document.getElementById('toast');
    const shareProfile = document.getElementById('shareProfile');
    const qrCanvas = document.getElementById('profileQr');
    const qrFallback = document.getElementById('qrFallback');
    const downloadContact = document.getElementById('downloadContact');
    const downloadQr = document.getElementById('downloadQr');
    const copyProfileLink = document.getElementById('copyProfileLink');
    const generateShareImage = document.getElementById('generateShareImage');
    const qrModeBtns = document.querySelectorAll('.qr-mode');
    const quickMessageForm = document.getElementById('quickMessageFormInner');
    const messageName = document.getElementById('messageName');
    const messageType = document.getElementById('messageType');
    const messageText = document.getElementById('messageText');
    const accentSwatches = document.querySelectorAll('.accent-swatch');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const randomVibe = document.getElementById('randomVibe');
    const liveStatusText = document.getElementById('liveStatusText');
    const brandName = document.getElementById('brandName');
    const profileCardName = document.getElementById('profileCardName');
    const profilePhoto = document.getElementById('profilePhoto');
    const installApp = document.getElementById('installApp');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileViewport = window.matchMedia('(max-width: 720px)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const config = window.TOJI_CONFIG || {};
    const ownerCreditText = 'Website created by:';
    const ownerCreditHandle = '@mouhamedmostafffa';
    const ownerCreditUrl = 'https://www.instagram.com/mouhamedmostafffa';
    const urlParams = new URLSearchParams(window.location.search);
    const previewMode = urlParams.get('preview') === '1';
    let savedContent = {};

    // ---- تحميل المحتوى المحفوظ ----
    // الأولوية: 1) تعديلات الأدمن (toji_content_override)
    //            2) config من السيرفر (toji_live_config)
    //            3) content.js الاستاتيك
    try {
        const adminSaved  = localStorage.getItem('toji_content_override');
        const serverSaved = localStorage.getItem('toji_live_config');
        const raw = adminSaved || serverSaved || '{}';
        savedContent = JSON.parse(raw);
    } catch (error) {
        savedContent = {};
    }

    // ============================================================
    // جيب أحدث config من الـ backend
    // ✅ الإصلاح: لو المحتوى اتغيّر عن اللي في cache
    //    → احفظ + reload تلقائي (مرة واحدة في كل session)
    // ============================================================
    if (window.TojiAPI?.ConfigAPI) {
        const SESSION_FRESH_KEY = 'toji_config_checked';

        window.TojiAPI.ConfigAPI.get()
            .then((response) => {
                sessionStorage.setItem(SESSION_FRESH_KEY, '1');

                if (response?.data) {
                    const incoming = JSON.stringify(response.data);
                    const cached   = localStorage.getItem('toji_live_config');

                    if (incoming !== cached) {
                        // حفظ الـ config الجديد
                        localStorage.setItem('toji_live_config', incoming);

                        // لو الـ page اتعمل render من cache قديم (مش admin session)
                        // → reload عشان الزائر يشوف أحدث محتوى
                        const isAdmin = window.TojiAPI?.TokenManager?.isLoggedIn?.();
                        if (!isAdmin) {
                            location.reload();
                        }
                    }
                } else if (response?.data === null) {
                    // مفيش config في الـ backend بعد → مسح الـ cache القديم
                    localStorage.removeItem('toji_live_config');
                }
            })
            .catch(() => {
                sessionStorage.setItem(SESSION_FRESH_KEY, '1');
            });
    }
    const contentOverrides = deepMerge(window.TOJI_CONTENT || {}, savedContent);
    const profileConfig = deepMerge(config, contentOverrides.profile || {});
    const profilePlaceholderImage = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22320%22 height%3D%22320%22 viewBox%3D%220 0 320 320%22%3E%3Crect width%3D%22320%22 height%3D%22320%22 rx%3D%22160%22 fill%3D%22%23101722%22%2F%3E%3Ccircle cx%3D%22160%22 cy%3D%22125%22 r%3D%2252%22 fill%3D%22%236ec6ff%22 opacity%3D%22.55%22%2F%3E%3Cpath d%3D%22M70 276c16-55 52-85 90-85s74 30 90 85%22 fill%3D%22%236ec6ff%22 opacity%3D%22.38%22%2F%3E%3C%2Fsvg%3E';
    const sectionConfig = {
        about: true,
        work: true,
        projects: null,    // null = تلقائي: يظهر لما يكون في مشاريع
        services: false,
        pricing: false,
        testimonials: false,
        gallery: false,
        faq: false,
        connect: true,
        guestbook: true,
        form: true,
        themeControls: true,
        ...(contentOverrides.sections || {})
    };
    const designConfig = contentOverrides.design || {};
    const analyticsConfig = contentOverrides.analytics || {};
    const socials = {
        instagram: '',
        tiktok: '',
        snapchat: '',
        threads: '',
        ...(profileConfig.socials || {})
    };
    const profilePhone = profileConfig.phone || '201102550730';
    const profileName = profileConfig.name || 'Mohamed Mostafa';
    const profileNickname = profileConfig.nickname || 'TOJI';
    const profileImage = profileConfig.image || profilePlaceholderImage;
    const profileLoaderMark = profileConfig.loaderMark || profileNickname;

    // ============================================================
    // 🔤 Loader Letters — دايمًا تعكس اسم/علامة العميل من الأدمن (loaderMark)
    // بيتبنى بأسرع وقت ممكن (فور ما النص يتحدد) عشان الأنيميشن يبدأ فورًا
    // ============================================================
    (function buildLoaderLetters() {
        const mark = document.getElementById('loaderMark');
        if (!mark) return;

        // نص العلامة + نقطة اختيارية في الآخر، بحد أقصى معقول لعدد الحروف
        const raw  = String(profileLoaderMark || 'TOJI').trim().slice(0, 10);
        const word = /[.!؟?]$/.test(raw) ? raw : raw + '.';
        const centerIndex = (word.length - 1) / 2;

        mark.innerHTML = word.split('').map((ch, i) => {
            // اتجاه عشوائي مختلف لكل حرف — يبعد عن مكانه النهائي بمسافة كبيرة
            const angle    = (Math.random() * 360) * (Math.PI / 180);
            const distance = 90 + Math.random() * 70; // بكسل
            const dx = Math.round(Math.cos(angle) * distance);
            const dy = Math.round(Math.sin(angle) * distance) - 20; // ميل بسيط لفوق
            const rot   = Math.round((Math.random() - 0.5) * 140); // درجة دوران ابتدائية
            const delay = Math.round(Math.abs(i - centerIndex) * 40 + Math.random() * 40); // ms

            const isAccent = /[.!؟?]/.test(ch);
            const label = ch === ' ' ? '&nbsp;' : ch;

            return `<span class="loader-letter${isAccent ? ' is-accent' : ''}"
                style="--dx:${dx}px; --dy:${dy}px; --rot:${rot}deg; --delay:${delay}ms"
                aria-hidden="true">${label}</span>`;
        }).join('');
    })();

    function ensureOwnerCredit() {
        let credit = document.querySelector('[data-owner-credit]');
        if (!credit) {
            credit = document.createElement('footer');
        }

        credit.className = 'owner-credit';
        credit.setAttribute('data-owner-credit', '');
        credit.textContent = '';

        const label = document.createElement('span');
        label.textContent = ownerCreditText;

        const link = document.createElement('a');
        link.href = ownerCreditUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = ownerCreditHandle;

        credit.append(label, link);

        const creditParent = scrollRoot || document.querySelector('main') || body;
        if (credit.parentNode !== creditParent) {
            credit.remove();
            creditParent.appendChild(credit);
        } else if (creditParent.lastElementChild !== credit) {
            creditParent.appendChild(credit);
        }
    }

    ensureOwnerCredit();
    const defaultTranslations = {
        en: {
            meta: {
                title: 'TOJI | Mohamed Mostafa',
                description: 'Mohamed Mostafa, TOJI. Personal portfolio, links, QR contact, web page builds, and clean front-end details.'
            },
            lang: {
                nextLabel: 'عربي',
                switchLabel: 'Switch to Arabic'
            },
            nav: {
                home: 'Home',
                about: 'About',
                work: 'Work',
                links: 'Links'
            },
            hero: {
                eyebrow: 'Mohamed Mostafa / TOJI',
                title: 'I make simple pages that look good and feel easy.',
                working: 'Working on ',
                copy: 'I care about clean layouts, quick loading, and small details that make a profile feel like mine.',
                status: 'Available for custom pages',
                openLinks: 'Open Links'
            },
            typewriter: ['my profile', 'simple pages', 'mobile links', 'better details'],
            signals: {
                valueUi: 'UI',
                valueJs: 'JS',
                valueGym: 'Gym',
                ui: 'Clean screens',
                js: 'Small details',
                gym: 'Routine'
            },
            profile: {
                live: 'Profile is live',
                caption: 'Code, training, and better details.',
                mobile: 'Mobile-first',
                fast: 'Fast',
                personal: 'Personal'
            },
            about: {
                title: 'A few things I care about when I build.',
                card1: {
                    title: 'Good first impression',
                    copy: 'I like pages that say who you are fast, without making people search for the important stuff.'
                },
                card2: {
                    title: 'Clean build',
                    copy: 'Simple HTML, CSS, and JavaScript that stay easy to edit later.'
                },
                card3: {
                    title: 'Phone first',
                    copy: 'Most people open links from their phone, so the mobile view has to feel right.'
                },
                card4: {
                    title: 'Same routine',
                    copy: 'Training taught me that small upgrades add up when you keep showing up.'
                }
            },
            work: {
                title: 'Pages I can build or improve.',
                banner1: 'TOJI',
                banner2: 'CTA',
                banner3: 'QR',
                card1: {
                    title: 'Personal portfolio',
                    copy: 'A clean page for your name, links, work, and the first impression you want people to get.'
                },
                card2: {
                    title: 'Business landing page',
                    copy: 'A focused page for a service, offer, or shop, with clear buttons and no extra noise.'
                },
                card3: {
                    title: 'Creator link hub',
                    copy: 'One place for social accounts, contact, QR code, and share buttons that actually help.'
                }
            },
            tags: {
                profile: 'Profile',
                links: 'Links',
                mobile: 'Mobile',
                share: 'Share'
            },
            connect: {
                eyebrow: 'Connect',
                title: 'My links are here.',
                copyNumber: 'Copy Number',
                scanTitle: 'Scan this profile',
                scanCopy: 'Open the same page on another phone, or save my contact card for later.',
                saveContact: 'Save Contact',
                downloadQr: 'Download QR',
                copyLink: 'Copy Link',
                shareImage: 'Share Image',
                mediaKit: 'Media Kit',
                installApp: 'Install App',
                shareProfile: 'Share Profile'
            },
            qr: {
                profile: 'Profile'
            },
            form: {
                eyebrow: 'Quick Message',
                title: 'Send a WhatsApp brief.',
                name: 'Name',
                type: 'Page type',
                message: 'Message',
                namePlaceholder: 'Your name',
                messagePlaceholder: 'Tell me what you want to build',
                personal: 'Personal profile',
                business: 'Business page',
                linkHub: 'Link hub',
                send: 'Open WhatsApp'
            },
            accent: {
                label: 'Accent'
            },
            preset: {
                label: 'Theme',
                neon: 'Neon',
                midnight: 'Midnight',
                emerald: 'Emerald',
                sunset: 'Sunset',
                aurora: 'Aurora',
                royal: 'Royal',
                graphite: 'Graphite',
                shuffle: 'Shuffle'
            },
            aria: {
                scrollAbout: 'Scroll to about section',
                contactCard: 'Profile QR and contact actions',
                quickNav: 'Quick navigation',
                accentColors: 'Accent colors',
                themePresets: 'Theme presets'
            },
            share: {
                whatsappMessage: 'Hi, I saw your profile and wanted to ask about a page.',
                profileText: 'TOJI profile and links.',
                briefIntro: 'Hi, I want to build a page.'
            },
            toast: {
                numberCopied: 'Number copied',
                copyFailed: 'Copy failed',
                copyManual: 'Copy manually:',
                contactDownloaded: 'Contact card downloaded',
                qrLoading: 'QR is still loading',
                qrDownloadFailed: 'QR download failed',
                qrDownloaded: 'QR downloaded',
                shared: 'Shared',
                profileCopied: 'Profile link copied',
                shareFailed: 'Share failed',
                accentSaved: 'Accent saved',
                presetSaved: 'Theme saved',
                shareImageReady: 'Share image downloaded'
            },
            theme: {
                toLight: 'Switch to light theme',
                toDark: 'Switch to dark theme'
            }
        },
        ar: {
            meta: {
                title: 'TOJI | Mohamed Mostafa',
                description: 'قالب بروفايل شخصي وروابط وصفحات ويب صغيرة.'
            },
            lang: {
                nextLabel: 'EN',
                switchLabel: 'Switch to English'
            },
            nav: {
                home: 'الرئيسية',
                about: 'عني',
                work: 'شغلي',
                links: 'الروابط'
            },
            hero: {
                eyebrow: 'Mohamed Mostafa / TOJI',
                title: 'بعمل صفحات بسيطة شكلها حلو وسهلة الاستخدام.',
                working: 'بشتغل على ',
                copy: 'بهتم بالتصميم النضيف، التحميل السريع، والتفاصيل الصغيرة اللي تخلي البروفايل شبه صاحبه.',
                status: 'متاح لعمل صفحات مخصصة',
                openLinks: 'افتح الروابط'
            },
            typewriter: ['بروفايلي', 'صفحات بسيطة', 'روابط موبايل', 'تفاصيل أحسن'],
            signals: {
                valueUi: 'واجهة',
                valueJs: 'جافاسكربت',
                valueGym: 'جيم',
                ui: 'شاشات نضيفة',
                js: 'تفاصيل صغيرة',
                gym: 'روتين'
            },
            profile: {
                live: 'البروفايل شغال',
                caption: 'كود، تمرين، وتفاصيل أحسن.',
                mobile: 'مناسب للموبايل',
                fast: 'سريع',
                personal: 'شخصي'
            },
            about: {
                title: 'شوية حاجات بهتم بيها وأنا ببني.',
                card1: {
                    title: 'انطباع أول قوي',
                    copy: 'بحب الصفحات اللي تقول أنت مين بسرعة من غير ما الناس تدور على المهم.'
                },
                card2: {
                    title: 'بناء نضيف',
                    copy: 'HTML وCSS وJavaScript بشكل بسيط وسهل يتعدل بعدين.'
                },
                card3: {
                    title: 'الموبايل الأول',
                    copy: 'معظم الناس بتفتح الروابط من الموبايل، فشكل الموبايل لازم يبقى مظبوط.'
                },
                card4: {
                    title: 'نفس الروتين',
                    copy: 'التمرين علمني إن التحسينات الصغيرة بتفرق لما تفضل مكمل.'
                }
            },
            work: {
                title: 'صفحات أقدر أبنيها أو أطورها.',
                banner1: 'TOJI',
                banner2: 'CTA',
                banner3: 'QR',
                card1: {
                    title: 'بورتفوليو شخصي',
                    copy: 'صفحة نضيفة لاسمك وروابطك وشغلك والانطباع اللي عايز توصله.'
                },
                card2: {
                    title: 'صفحة خدمة أو بيزنس',
                    copy: 'صفحة مركزة لخدمة أو عرض أو شوب، بأزرار واضحة ومن غير زحمة.'
                },
                card3: {
                    title: 'تجميعة روابط لصانع محتوى',
                    copy: 'مكان واحد للسوشيال، التواصل، QR، وأزرار مشاركة مفيدة فعلًا.'
                }
            },
            tags: {
                profile: 'بروفايل',
                links: 'روابط',
                mobile: 'موبايل',
                share: 'مشاركة'
            },
            connect: {
                eyebrow: 'تواصل',
                title: 'روابطي هنا.',
                copyNumber: 'نسخ الرقم',
                scanTitle: 'امسح البروفايل',
                scanCopy: 'افتح نفس الصفحة من موبايل تاني، أو احفظ جهة الاتصال لوقت لاحق.',
                saveContact: 'حفظ جهة الاتصال',
                downloadQr: 'تحميل QR',
                copyLink: 'نسخ اللينك',
                shareImage: 'صورة مشاركة',
                mediaKit: 'ميديا كيت',
                installApp: 'تثبيت الموقع',
                shareProfile: 'مشاركة البروفايل'
            },
            qr: {
                profile: 'البروفايل'
            },
            form: {
                eyebrow: 'رسالة سريعة',
                title: 'ابعت brief على واتساب.',
                name: 'الاسم',
                type: 'نوع الصفحة',
                message: 'الرسالة',
                namePlaceholder: 'اسمك',
                messagePlaceholder: 'اكتب عايز تبني إيه',
                personal: 'بروفايل شخصي',
                business: 'صفحة بيزنس',
                linkHub: 'تجميعة روابط',
                send: 'افتح واتساب'
            },
            accent: {
                label: 'اللون'
            },
            preset: {
                label: 'الثيم',
                neon: 'نيون',
                midnight: 'ليلي',
                emerald: 'زمرد',
                sunset: 'غروب',
                aurora: 'أورورا',
                royal: 'ملكي',
                graphite: 'جرافيت',
                shuffle: 'بدل الستايل'
            },
            aria: {
                scrollAbout: 'انتقل إلى قسم عني',
                contactCard: 'QR البروفايل وأزرار التواصل',
                quickNav: 'تنقل سريع',
                accentColors: 'ألوان الموقع',
                themePresets: 'ثيمات الموقع'
            },
            share: {
                whatsappMessage: 'أهلًا، شوفت البروفايل وكنت عايز أسأل عن صفحة.',
                profileText: 'بروفايل وروابط TOJI.',
                briefIntro: 'أهلًا، عايز أعمل صفحة.'
            },
            toast: {
                numberCopied: 'اتنسخ الرقم',
                copyFailed: 'النسخ فشل',
                copyManual: 'انسخ يدويًا:',
                contactDownloaded: 'تم تحميل جهة الاتصال',
                qrLoading: 'الـ QR لسه بيتحمل',
                qrDownloadFailed: 'تحميل الـ QR فشل',
                qrDownloaded: 'تم تحميل الـ QR',
                shared: 'تمت المشاركة',
                profileCopied: 'اتنسخ لينك البروفايل',
                shareFailed: 'المشاركة فشلت',
                accentSaved: 'اتحفظ اللون',
                presetSaved: 'اتحفظ الثيم',
                shareImageReady: 'تم تحميل صورة المشاركة'
            },
            theme: {
                toLight: 'تبديل للوضع الفاتح',
                toDark: 'تبديل للوضع الداكن'
            }
        }
    };
    const translations = deepMerge(defaultTranslations, contentOverrides.translations || {});
    const defaultLang = contentOverrides.site?.defaultLang === 'ar' ? 'ar' : 'en';
    let currentLang = localStorage.getItem('toji_lang') || defaultLang;
    if (!['en', 'ar'].includes(currentLang)) currentLang = defaultLang;
    let currentQrMode = localStorage.getItem('toji_qr_mode') || 'profile';
    if (!['profile', 'whatsapp', 'instagram'].includes(currentQrMode)) currentQrMode = 'profile';

    if (window.lucide) {
        window.lucide.createIcons();
    }

    function t(path) {
        const fromLang = path.split('.').reduce((v, k) => v?.[k], translations[currentLang]);
        if (fromLang) return fromLang;
        // Fallback: English default
        const fromEn = path.split('.').reduce((v, k) => v?.[k], translations.en);
        if (fromEn) return fromEn;
        // Last resort: return the key itself
        return path;
    }

    function localized(value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return value[currentLang] || value.en || value.ar || '';
        }
        return value ?? '';
    }

    function refreshDomCollections() {
        dockBtns = document.querySelectorAll('.dock-btn');
        navLinks = document.querySelectorAll('.nav-link');
        sections = document.querySelectorAll('.screen:not([hidden]), .sub-screen:not([hidden])');
        revealElements = document.querySelectorAll('.reveal-up');
        tiltElements = document.querySelectorAll('.tilt-effect');
        requestAnimationFrame(() => requestAnimationFrame(syncIndicators));
    }

    function appendUtm(url, medium = 'link') {
        const utm = analyticsConfig.utm || {};
        if (!utm.enabled || !url || url.startsWith('#') || url.startsWith('tel:') || url.startsWith('mailto:')) return url;
        try {
            const next = new URL(url, window.location.href);
            next.searchParams.set('utm_source', utm.source || 'website');
            next.searchParams.set('utm_medium', utm.medium || medium);
            next.searchParams.set('utm_campaign', utm.campaign || 'personal-site');
            return next.toString();
        } catch (error) {
            return url;
        }
    }

    function iconName(name) {
        const map = {
            facebook: 'facebook',
            youtube: 'youtube',
            x: 'twitter',
            twitter: 'twitter',
            linkedin: 'linkedin',
            website: 'globe',
            tiktok: 'video',
            threads: 'at-sign'
        };
        return map[name] || name || 'link';
    }

    function iconMarkup(name, className = '') {
        return `<i data-lucide="${iconName(name)}" class="${className}" aria-hidden="true"></i>`;
    }

    function setElementVisible(selector, visible) {
        document.querySelectorAll(selector).forEach((node) => {
            node.hidden = !visible;
        });
    }

    function renderNavigation() {
        const nav  = document.querySelector('.nav-links');
        const dock = document.querySelector('.floating-dock');

        // ترتيب الأقسام الرئيسية كما هي في الصفحة
        const mainItems = [
            { id: 'home',         label: t('nav.home'),  icon: 'home',              enabled: true },
            { id: 'expertise',    label: t('nav.about'), icon: 'user-round',         enabled: sectionConfig.about },
            { id: 'work',         label: t('nav.work'),  icon: 'briefcase-business', enabled: sectionConfig.work },
            { id: 'services',     label: localized(contentOverrides.marketing?.services?.eyebrow)     || 'Services', icon: 'zap',         enabled: sectionConfig.services },
            { id: 'pricing',      label: localized(contentOverrides.marketing?.pricing?.eyebrow)      || 'Pricing',  icon: 'badge-dollar-sign', enabled: sectionConfig.pricing },
            { id: 'testimonials', label: localized(contentOverrides.marketing?.testimonials?.eyebrow) || 'Reviews',  icon: 'quote',            enabled: sectionConfig.testimonials },
            { id: 'gallery',      label: localized(contentOverrides.marketing?.gallery?.eyebrow)      || 'Gallery',  icon: 'images',           enabled: sectionConfig.gallery },
            { id: 'faq',          label: localized(contentOverrides.marketing?.faq?.eyebrow)          || 'FAQ',      icon: 'circle-help',      enabled: sectionConfig.faq },
            { id: 'connect',      label: t('nav.links'), icon: 'link-2',             enabled: sectionConfig.connect },
            { id: 'guestbook',    label: t('nav.guestbook'), icon: 'notebook-pen',   enabled: sectionConfig.guestbook }
        ].filter((item) => item.enabled);

        // أقسام ديناميكية — تظهر فقط لما في داتا من البيكاند
        // الخوارزمية تحت بتدرج كل قسم ديناميكي بعد أول قسم ثابت (mainItems) بيطابق
        // insertAfter، وبترتيب حسب ترتيبهم في المصفوفة دي — فالاتنين لازم يتحطوا
        // بعد نفس القسم الثابت (work) عشان يطلعوا بالترتيب الصح: work → projects → songs
        const dynamicSections = [
            { id: 'projects', label: 'Projects',  icon: 'layout-grid', dockId: 'dockProjects', navId: 'navProjects', startHidden: true, insertAfter: 'work' },
            { id: 'songs',    label: 'Fav Songs', icon: 'music',       dockId: 'dockSongs',    navId: 'navSongs',    startHidden: true, insertAfter: 'work' }
        ];

        // دمج الأقسام بالترتيب الصح
        const ordered = [];
        for (const item of mainItems) {
            ordered.push(item);
            for (const d of dynamicSections) {
                if (d.insertAfter === item.id) ordered.push(d);
            }
        }

        // الأقسام المستقلة الجديدة — WhatsApp و Themes — لها أزرار ثابتة في الـ DOM
        // مش محتاجين يتضافوا هنا لأن renderNavigation مش بتعيد بناء الديفايدر والصوت

        if (nav) {
            nav.innerHTML = ordered.map((item, i) => {
                const isExtra  = !!item.dockId;
                const idAttr   = isExtra ? ` id="${item.navId}"` : '';
                const hidden   = item.startHidden ? ' hidden' : '';
                const active   = !isExtra && i === 0 ? ' active' : '';
                return `<a class="nav-link${active}" href="#${item.id}" data-target="${item.id}"${idAttr}${hidden}>${item.label}</a>`;
            }).join('');
        }

        if (dock) {
            // احتفظ بالديفايدر + صوت + WhatsApp + Themes الثابتة في الـ DOM
            const savedTail = [];
            ['dockWhatsapp','dockThemes','.dock-bot-btn','.dock-messages-btn','.dock-tour-btn','.dock-divider','.dock-sound-btn'].forEach((sel) => {
                const el = dock.querySelector(sel.startsWith('.') ? sel : `#${sel}`);
                if (el) savedTail.push(el.outerHTML);
            });

            dock.innerHTML = ordered.map((item, i) => {
                const isExtra  = !!item.dockId;
                const idAttr   = isExtra ? ` id="${item.dockId}"` : '';
                const hidden   = item.startHidden ? ' hidden' : '';
                const active   = !isExtra && i === 0 ? ' active' : '';
                return `<button class="dock-btn${active}" type="button" data-target="${item.id}" aria-label="${item.label}"${idAttr}${hidden}>
                    ${iconMarkup(item.icon)}
                </button>`;
            }).join('') + savedTail.join('');
        }
    }

    function slugifyKey(str) {
        return String(str || '').toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
    }

    const REACTION_STORAGE_KEY = 'toji_reactions_given';
    function getGivenReactions() {
        try { return JSON.parse(localStorage.getItem(REACTION_STORAGE_KEY) || '[]'); } catch { return []; }
    }
    function setGivenReactions(list) {
        localStorage.setItem(REACTION_STORAGE_KEY, JSON.stringify(list));
    }

    let reactionCounts = {};

    async function loadReactions() {
        try {
            const res = await window.TojiAPI?.ReactionsAPI?.getAll();
            reactionCounts = res?.data || {};
        } catch (err) {
            reactionCounts = {};
        }
    }

    function reactionCountFor(key, type) {
        return reactionCounts[key]?.[type] || 0;
    }

    async function handleReactionClick(btn) {
        const key   = btn.closest('[data-project-key]')?.dataset.projectKey;
        const type  = btn.dataset.reaction;
        if (!key || !type) return;

        const given = getGivenReactions();
        const token = `${key}:${type}`;
        const alreadyGiven = given.includes(token);
        const action = alreadyGiven ? 'remove' : 'add';

        btn.disabled = true;
        btn.classList.toggle('active', !alreadyGiven);
        const countEl = btn.querySelector('.reaction-count');
        const current = parseInt(countEl.textContent, 10) || 0;
        countEl.textContent = Math.max(0, current + (alreadyGiven ? -1 : 1));

        // liquid bounce pop on the button + count, plus a floating +1/-1 hint
        btn.classList.remove('is-popping');
        void btn.offsetWidth; // restart animation if clicked again quickly
        btn.classList.add('is-popping');
        setTimeout(() => btn.classList.remove('is-popping'), 440);

        const delta = document.createElement('span');
        delta.className = 'reaction-delta';
        delta.textContent = alreadyGiven ? '−1' : '+1';
        btn.appendChild(delta);
        setTimeout(() => delta.remove(), 720);

        try {
            const res = await window.TojiAPI?.ReactionsAPI?.react(key, type, action);
            if (res?.data) {
                countEl.textContent = res.data[type] ?? countEl.textContent;
                reactionCounts[key] = res.data;
            }
            setGivenReactions(alreadyGiven ? given.filter((t) => t !== token) : [...given, token]);
        } catch (err) {
            // فشل الاتصال — نرجع الزرار زي ما كان
            btn.classList.toggle('active', alreadyGiven);
            countEl.textContent = current;
        } finally {
            btn.disabled = false;
        }
    }

    // ============================================================
    // 🦇 Easter Egg — اكتب "toji" في أي مكان في الصفحة
    // ============================================================
    (function initEasterEgg() {
        const TARGET = 'toji';
        let buffer = '';
        let cooldown = false;

        function showEasterEgg() {
            if (cooldown) return;
            cooldown = true;

            const MESSAGES = currentLang === 'ar'
                ? ['لقيتها! 🦇', 'أهو TOJI بنفسه 👀', 'حد بيدور على حاجة؟ 😄', 'يا هلا بيك هنا كمان 🙌']
                : ['You found it! 🦇', 'TOJI himself, hi 👀', 'Looking for something? 😄', 'Fancy seeing you here 🙌'];

            const overlay = document.createElement('div');
            overlay.className = 'easter-egg-overlay';
            overlay.innerHTML = `
                <div class="easter-egg-card">
                    <span class="easter-egg-bat">🦇</span>
                    <p>${MESSAGES[Math.floor(Math.random() * MESSAGES.length)]}</p>
                </div>
            `;
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('is-visible'));

            const dismiss = () => {
                overlay.classList.remove('is-visible');
                setTimeout(() => overlay.remove(), 300);
            };
            overlay.addEventListener('click', dismiss);
            setTimeout(dismiss, 2600);
            setTimeout(() => { cooldown = false; }, 3000);
        }

        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            const key = event.key?.toLowerCase();
            if (!key || key.length !== 1) return;
            buffer = (buffer + key).slice(-TARGET.length);
            if (buffer === TARGET) showEasterEgg();
        });
    })();

    // ============================================================
    // 🦇 Easter Egg — اكتب "toji" في أي مكان في الصفحة (end)
    // ============================================================

    // ============================================================
    // 🟣 Secret Mode — اكتب "domain" في أي مكان في الصفحة
    // ============================================================
    (function initDomainExpansion() {
        const TARGET = 'domain';
        let buffer = '';
        let active = false;
        let revertTimer = null;

        function trigger() {
            if (active) return;
            active = true;

            document.body.classList.add('domain-expansion');

            const overlay = document.createElement('div');
            overlay.className = 'domain-overlay';
            overlay.innerHTML = `
                <div class="domain-card">
                    <span class="domain-kanji">領域展開</span>
                    <p>${currentLang === 'ar' ? 'اتفتح المجال...' : 'Domain Expansion...'}</p>
                </div>
            `;
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('is-visible'));

            setTimeout(() => {
                overlay.classList.remove('is-visible');
                setTimeout(() => overlay.remove(), 400);
            }, 1400);

            clearTimeout(revertTimer);
            revertTimer = setTimeout(() => {
                document.body.classList.add('domain-reverting');
                document.body.classList.remove('domain-expansion');
                setTimeout(() => {
                    document.body.classList.remove('domain-reverting');
                    active = false;
                }, 700);
            }, 7000);
        }

        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            const key = event.key?.toLowerCase();
            if (!key || key.length !== 1) return;
            buffer = (buffer + key).slice(-TARGET.length);
            if (buffer === TARGET) trigger();
        });
    })();

    // ============================================================
    // 🟣 Secret Mode (end)
    // ============================================================

    document.addEventListener('click', (event) => {
        const btn = event.target.closest('.reaction-btn');
        if (btn) handleReactionClick(btn);
    });


    function renderWorkCards(apiCards) {
        const grid = document.querySelector('.project-grid');
        if (!grid) return;

        // Priority 1: Backend API projects (always wins)
        // Priority 2: Admin workCards (only if they have real content)
        // Priority 3: Keep static HTML as-is
        let cards = null;

        if (apiCards && apiCards.length) {
            cards = apiCards;
        } else {
            const wc = contentOverrides.workCards;
            if (Array.isArray(wc) && wc.length) {
                // فقط الكروت اللي عندها محتوى حقيقي
                const validCards = wc.filter((c) => {
                    const hasTitle = c.title?.en || c.title?.ar || (typeof c.title === 'string' && c.title);
                    const hasCopy  = c.copy?.en  || c.copy?.ar  || (typeof c.copy  === 'string' && c.copy);
                    return hasTitle && hasCopy;
                });
                if (validCards.length) cards = validCards;
            }
        }

        // لو مفيش داتا حقيقية → اترك الـ static HTML زي ما هو
        if (!cards) return;

        grid.innerHTML = cards.map((card, index) => {
            const tags = (card.tags || []).map((tag) => `<span>${localized(tag)}</span>`).join('');
            const liveBtn = card.liveUrl
                ? `<a href="${card.liveUrl}" target="_blank" rel="noreferrer" class="project-live-link">View Project →</a>`
                : '';
            const banner = localized(card.banner) || card.banner || String(index + 1).padStart(2, '0');
            return `
                <article class="project-card glass-card reveal-up tilt-effect ${index ? `delay-${Math.min(index, 3)}` : ''}">
                    <div class="project-preview preview-${index % 3}" aria-hidden="true">
                        <span>${banner}</span>
                    </div>
                    <span class="project-number">${String(index + 1).padStart(2, '0')}</span>
                    <h3>${localized(card.title) || ''}</h3>
                    <p>${localized(card.copy) || ''}</p>
                    <div class="project-tags">${tags}</div>
                    ${liveBtn}
                </article>
            `;
        }).join('');

        // إعادة تفعيل الـ animations والـ icons
        refreshDomCollections();
        if (window.lucide) window.lucide.createIcons();
    }


    // ============================================================
    // FAV SONGS — تحميل وعرض من الـ Backend
    // ============================================================
    // ============================================================
    // 📋 WORK IN PROGRESS BOARD
    // ============================================================
    async function loadWip() {
        if (!window.TojiAPI?.WipAPI) return;
        try {
            const res   = await window.TojiAPI.WipAPI.getAll();
            const items = res?.data || [];
            if (!items.length) return;

            const section = document.getElementById('wip');
            const dockBtn = document.getElementById('dockWip');
            const navLink = document.getElementById('navWip');
            if (!section) return;

            if (sectionConfig.wip === false) return;
            section.hidden = false;
            if (dockBtn) dockBtn.hidden = false;
            if (navLink) navLink.hidden = false;

            const cols = { next: 'wipNext', progress: 'wipProgress', done: 'wipDone' };
            const counts = { next: 0, progress: 0, done: 0 };

            // مسح الكولامنز
            Object.values(cols).forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '';
            });

            items.forEach((item) => {
                const colId = cols[item.status] || cols.next;
                const col   = document.getElementById(colId);
                if (!col) return;
                counts[item.status] = (counts[item.status] || 0) + 1;

                const link = item.link
                    ? `<a href="${item.link}" target="_blank" rel="noreferrer" class="wip-card-link">
                         <i data-lucide="external-link" aria-hidden="true"></i> View
                       </a>`
                    : '';

                const card = document.createElement('div');
                card.className = 'wip-card';
                card.innerHTML = `
                    <div class="wip-card-top">
                        <span class="wip-card-emoji">${item.emoji || '🔧'}</span>
                        <span class="wip-card-title">${item.title}</span>
                    </div>
                    ${item.description ? `<p class="wip-card-desc">${item.description}</p>` : ''}
                    ${link}`;
                col.appendChild(card);
            });

            // تحديث الأعداد
            ['next','progress','done'].forEach((s) => {
                const el = document.getElementById(`wipCount${s.charAt(0).toUpperCase()+s.slice(1)}`);
                if (el) el.textContent = counts[s] || 0;
            });

            refreshDomCollections();
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => { if (typeof syncObservedElements==='function') syncObservedElements(); }, 60);

        } catch (err) { console.warn('[TOJI] WIP board unavailable:', err.message); }
    }


    // ============================================================
    // AI chat assistant (زعزع) now lives on its own page: zaza.html / zaza.js
    // ============================================================

        async function loadSongs() {
        if (!window.TojiAPI?.SongsAPI) return;
        try {
            const response = await window.TojiAPI.SongsAPI.getPublic();
            if (response && Array.isArray(response.data) && response.data.length > 0) {
                renderSongsSection(response.data);
                console.info('[TOJI] ✅ Loaded ' + response.data.length + ' songs from backend.');
            }
        } catch (err) {
            console.warn('[TOJI] Songs API unavailable.', err.message);
        }
    }

    function extractYouTubeId(url) {
        if (!url) return '';
        var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
        return m ? m[1] : '';
    }

    function renderSongsSection(songs) {
        var section = document.getElementById('songs');
        var grid    = document.getElementById('songsGrid');
        var dockBtn = document.getElementById('dockSongs');
        var navLink = document.getElementById('navSongs');
        if (!section || !grid || !songs || !songs.length) return;

        var adminHid = sectionConfig.songs === false;
        section.hidden = adminHid;
        if (dockBtn) dockBtn.hidden = adminHid;
        if (navLink) navLink.hidden = adminHid;
        if (adminHid) return;

        var moodEmoji = { chill:'🧊', hype:'🔥', sad:'🌧️', focus:'⚡', vibe:'🎵' };

        grid.innerHTML = songs.map(function(song, i) {
            var emoji = song.moodEmoji || moodEmoji[song.mood] || '🎵';
            var desc  = song.description ? '<p class="song-desc">' + song.description + '</p>' : '';
            var mood  = song.mood ? '<span class="song-mood-pill">' + emoji + ' ' + song.mood + '</span>' : '';

            var spotify = song.spotifyUrl
                ? '<a class="song-pill spotify" href="' + song.spotifyUrl + '" target="_blank" rel="noreferrer" aria-label="Spotify">'
                  + '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>'
                  + '</a>' : '';
            var ytId = extractYouTubeId(song.youtubeUrl);
            var youtube = (song.youtubeUrl && ytId)
                ? '<a class="song-pill youtube js-mini-player" href="javascript:void(0)" data-yt="' + ytId + '" data-title="' + (song.title||'').replace(/"/g,'&quot;') + '" data-artist="' + (song.artist||'').replace(/"/g,'&quot;') + '" aria-label="Play">'
                  + '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'
                  + '</a>'
                : (song.youtubeUrl
                    ? '<a class="song-pill youtube" href="' + song.youtubeUrl + '" target="_blank" rel="noreferrer" aria-label="YouTube">'
                      + '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'
                      + '</a>'
                    : '');

            return '<article class="song-card-modern reveal-up ' + (i ? 'delay-' + Math.min(i%4,3) : '') + '" data-mood="' + (song.mood||'vibe') + '">'
                + '<div class="song-modern-cover">'
                +   '<span class="song-modern-emoji">' + emoji + '</span>'
                +   '<div class="song-eq-bars"><span></span><span></span><span></span><span></span></div>'
                + '</div>'
                + '<div class="song-modern-body">'
                +   '<div class="song-modern-head">'
                +     '<h3 class="song-modern-title">' + song.title + '</h3>'
                +     mood
                +   '</div>'
                +   '<p class="song-modern-artist">' + song.artist + '</p>'
                +   desc
                +   ((spotify || youtube) ? '<div class="song-modern-links">' + spotify + youtube + '</div>' : '')
                + '</div>'
                + '</article>';
        }).join('');

        refreshDomCollections();
        setTimeout(function() { if (typeof syncObservedElements==='function') syncObservedElements(); }, 50);
    }

    // ============================================================
    // 🎧 Mini Player — بوباب صغير قابل للسحب والتكبير، بيفتح جوه الموقع
    // بدل ما يودّي الزائر ليوتيوب في تاب/صفحة تانية
    // ============================================================
    var miniPlayerEl = null;

    function ensureMiniPlayer() {
        if (miniPlayerEl) return miniPlayerEl;

        var el = document.createElement('div');
        el.className = 'mini-player glass-panel';
        el.innerHTML =
            '<div class="mini-player-head" data-drag-handle>' +
                '<div class="mini-player-info">' +
                    '<span class="mini-player-title"></span>' +
                    '<span class="mini-player-artist"></span>' +
                '</div>' +
                '<button type="button" class="mini-player-close" aria-label="Close">&times;</button>' +
            '</div>' +
            '<div class="mini-player-body">' +
                '<div class="mini-player-shield"></div>' +
                '<div class="mini-player-resize" data-resize-handle></div>' +
            '</div>';
        document.body.appendChild(el);

        el.querySelector('.mini-player-close').addEventListener('click', closeMiniPlayer);
        makeDraggable(el, el.querySelector('[data-drag-handle]'));
        makeResizable(el, el.querySelector('[data-resize-handle]'));

        miniPlayerEl = el;
        return el;
    }

    function openMiniPlayer(ytId, title, artist) {
        if (!ytId) return;
        var el = ensureMiniPlayer();
        el.querySelector('.mini-player-title').textContent = title || '';
        el.querySelector('.mini-player-artist').textContent = artist || '';

        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube.com/embed/' + ytId + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        el.querySelector('.mini-player-body').insertBefore(iframe, el.querySelector('.mini-player-shield'));

        // لو أول مرة تتفتح، نحطها في مكان افتراضي (تحت يمين) بعيد عن الدوك
        if (!el.classList.contains('positioned')) {
            var safeBottom = Math.max(20, (window.visualViewport ? window.innerHeight - window.visualViewport.height : 0) + 20);
            el.style.right = '16px';
            el.style.bottom = safeBottom + 'px';
            el.style.left = 'auto';
            el.style.top = 'auto';
            el.classList.add('positioned');
        }

        el.classList.add('is-open');
    }

    function closeMiniPlayer() {
        if (!miniPlayerEl) return;
        // بنمسح الـ iframe فعليًا (مش بس نخفيه) عشان الصوت يوقف فعلاً
        var oldFrame = miniPlayerEl.querySelector('iframe');
        if (oldFrame) oldFrame.remove();
        miniPlayerEl.classList.remove('is-open');
    }

    // بيحول أي نقطة/إحداثي لمكان تابت (left/top) بدل right/bottom، عشان السحب يشتغل بحساب واحد بس
    function pinToLeftTop(el) {
        var rect = el.getBoundingClientRect();
        el.style.left = rect.left + 'px';
        el.style.top = rect.top + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        return rect;
    }

    // بنستخدم Touch/Mouse Events مباشرة (مش Pointer Events) عشان أقصى توافق
    // مع متصفحات الموبايل المدمجة (تليجرام/إنستجرام/واتساب...) اللي دعمها لـ
    // Pointer Events غالبًا ناقص أو غير مستقر.
    function bindDrag(handle, onStart, onMove, onEnd) {
        var touchId = null;

        function point(e) {
            if (e.touches && e.touches.length) return e.touches[0];
            if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0];
            return e;
        }

        function down(e) {
            if (e.target.closest && e.target.closest('.mini-player-close')) return;
            var p = point(e);
            if (e.touches) touchId = p.identifier;
            onStart(p.clientX, p.clientY);
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('touchend', up);
            document.addEventListener('touchcancel', up);
        }

        function move(e) {
            var p = point(e);
            if (e.touches) {
                var found = false;
                for (var i = 0; i < e.touches.length; i++) {
                    if (e.touches[i].identifier === touchId) { p = e.touches[i]; found = true; break; }
                }
                if (!found) return;
                e.preventDefault();
            }
            onMove(p.clientX, p.clientY);
        }

        function up(e) {
            touchId = null;
            onEnd();
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            document.removeEventListener('touchmove', move);
            document.removeEventListener('touchend', up);
            document.removeEventListener('touchcancel', up);
        }

        handle.addEventListener('mousedown', down);
        handle.addEventListener('touchstart', down, { passive: true });
    }

    function makeDraggable(el, handle) {
        var offsetX = 0, offsetY = 0;

        bindDrag(handle,
            function onStart(x, y) {
                var rect = pinToLeftTop(el);
                offsetX = x - rect.left;
                offsetY = y - rect.top;
                el.classList.add('dragging');
            },
            function onMove(x, y) {
                var w = el.offsetWidth, h = el.offsetHeight;
                var nx = Math.min(Math.max(4, x - offsetX), window.innerWidth  - w - 4);
                var ny = Math.min(Math.max(4, y - offsetY), window.innerHeight - h - 4);
                el.style.left = nx + 'px';
                el.style.top  = ny + 'px';
            },
            function onEnd() {
                el.classList.remove('dragging');
            }
        );
    }

    function makeResizable(el, handle) {
        var startW = 0, startX = 0;
        var MIN_W = 220, MAX_W = 520;

        bindDrag(handle,
            function onStart(x) {
                pinToLeftTop(el);
                startW = el.offsetWidth;
                startX = x;
                el.classList.add('resizing');
            },
            function onMove(x) {
                // السحب لبره (يمين) يكبر الكارت
                var delta = x - startX;
                var maxW = Math.min(MAX_W, window.innerWidth - 24);
                var newW = Math.min(maxW, Math.max(MIN_W, startW + delta));
                el.style.width = newW + 'px';
            },
            function onEnd() {
                el.classList.remove('resizing');
            }
        );
    }

    // تفويض الكليك على أزرار "شغّل" جوه كروت الأغاني
    document.addEventListener('click', function(e) {
        var btn = e.target.closest && e.target.closest('.js-mini-player');
        if (!btn) return;
        e.preventDefault();
        try {
            openMiniPlayer(btn.getAttribute('data-yt'), btn.getAttribute('data-title'), btn.getAttribute('data-artist'));
        } catch (err) {
            console.error('[MiniPlayer] failed to open:', err);
        }
    });

        // ---- Load projects from backend API (with graceful fallback) ----
    async function loadProjectsFromAPI() {
        if (!window.TojiAPI) return;
        try {
            const response = await window.TojiAPI.ProjectsAPI.getPublic();
            if (response && Array.isArray(response.data) && response.data.length > 0) {
                const apiCards = response.data.map((p) => ({
                    _id:      p._id,
                    banner:   p.banner,
                    title:    p.title,
                    copy:     p.copy,
                    tags:     p.tags || [],
                    liveUrl:  p.liveUrl || '',
                    imageUrl: p.imageUrl || ''
                }));
                // ✅ Projects section فقط — Work section مبيتأثرش
                renderProjectsSection(apiCards);
                console.info(`[TOJI] ✅ Loaded ${apiCards.length} projects from backend.`);
            } else {
                console.info('[TOJI] No backend projects yet.');
            }
        } catch (err) {
            console.warn('[TOJI] Projects API unavailable.', err.message);
        }
    }

    // ---- Render the dedicated #projects section ----
    function renderProjectsSection(cards) {
        const section = document.getElementById('projects');
        const grid    = document.getElementById('projectsGrid');
        const dockBtn = document.getElementById('dockProjects');
        const navLink = document.getElementById('navProjects');

        if (!section || !grid || !cards || !cards.length) return;

        // ✅ يظهر تلقائياً لما يكون في مشاريع
        // يتخبى بس لو الأدمن ضبطه على false صراحةً
        const adminHid = sectionConfig.projects === false;
        section.hidden  = adminHid;
        if (dockBtn) dockBtn.hidden = adminHid;
        if (navLink) navLink.hidden = adminHid;
        if (adminHid) return;

        grid.innerHTML = cards.map((card, i) => {
            const title = localized(card.title) || '';
            const copy  = localized(card.copy)  || '';
            const tags  = (card.tags || []).map((t) => `<span>${t}</span>`).join('');
            const link  = card.liveUrl
                ? `<a href="${card.liveUrl}" target="_blank" rel="noreferrer" class="live-project-link">View Project →</a>`
                : '';
            const detailLink = card._id
                ? `<a href="work.html?id=${card._id}" class="live-project-link live-project-detail-link">Read more →</a>`
                : '';
            const projectKey = card._id || slugifyKey(`${card.banner || i}-${title}`);
            const given = getGivenReactions();
            const fireActive  = given.includes(`${projectKey}:fire`)  ? 'active' : '';
            const heartActive = given.includes(`${projectKey}:heart`) ? 'active' : '';

            // ✅ لو عندها صورة مرفوعة من الأدمن، اعرضها فوق الكارت بدل صندوق البانر النصي
            const media = card.imageUrl
                ? `<div class="live-project-media">
                       <img src="${card.imageUrl}" alt="${title}" loading="lazy">
                       <span class="live-project-banner live-project-banner-overlay">${card.banner || String(i+1).padStart(2,'0')}</span>
                   </div>`
                : `<span class="live-project-banner">${card.banner || String(i+1).padStart(2,'0')}</span>`;

            return `
                <article class="live-project-card ${card.imageUrl ? 'has-media' : ''} reveal-up ${i ? `delay-${Math.min(i, 3)}` : ''}" data-project-key="${projectKey}">
                    ${media}
                    <h3>${title}</h3>
                    <p>${copy}</p>
                    <div class="live-project-tags">${tags}</div>
                    <div class="project-reactions">
                        <button type="button" class="reaction-btn ${fireActive}" data-reaction="fire" aria-label="Fire">
                            🔥 <span class="reaction-count">${reactionCountFor(projectKey, 'fire')}</span>
                        </button>
                        <button type="button" class="reaction-btn ${heartActive}" data-reaction="heart" aria-label="Love">
                            ❤️ <span class="reaction-count">${reactionCountFor(projectKey, 'heart')}</span>
                        </button>
                        ${card._id ? `<button type="button" class="bookmark-btn" data-project-id="${card._id}" aria-label="Save project" title="احفظ المشروع في حسابك">
                            <i data-lucide="bookmark" aria-hidden="true"></i>
                        </button>` : ''}
                    </div>
                    ${link}
                    ${detailLink}
                </article>`;
        }).join('');

        refreshDomCollections();
        setTimeout(() => { if (typeof syncObservedElements === 'function') syncObservedElements(); }, 50);
        if (window.lucide) window.lucide.createIcons();
        markSavedProjectButtons();
    }

    // ── علّم أزرار الحفظ اللي المشروع بتاعها محفوظ فعلًا في حساب الزائر ──
    function markSavedProjectButtons() {
        if (!window.TojiAccount?.isLoggedIn()) return;
        const user = window.TojiAccount.getUser();
        const saved = user?.savedProjectIds || [];
        document.querySelectorAll('.bookmark-btn').forEach((btn) => {
            btn.classList.toggle('active', saved.includes(btn.dataset.projectId));
        });
    }

    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.bookmark-btn');
        if (!btn) return;
        if (!window.TojiAccount?.isLoggedIn()) {
            window.TojiAccount?.openAuthModal?.();
            return;
        }
        btn.disabled = true;
        try {
            const res = await window.TojiAccount.AccountAPI.toggleSavedProject(btn.dataset.projectId);
            btn.classList.toggle('active', res.saved);
        } catch {} finally {
            btn.disabled = false;
        }
    });

    // ============================================================
    // ✦ LINKS GRID — قسم "Connect" الجديد
    //    كل لينك بييجي من الأدمن (اسم + رابط + صورة) عن طريق /api/links
    //    وبيتعرض كارت بصورته، ولو ضغطت في أي حتة فيه بيوديك على طول
    // ============================================================
    const DEFAULT_LINKS = [
        { title: 'Instagram', url: 'https://instagram.com/mouhamedmostafffa', icon: 'instagram' },
        { title: 'TikTok',    url: 'https://tiktok.com/@mouhamedmostafffa',   icon: 'video' },
        { title: 'Snapchat',  url: 'https://www.snapchat.com/add/dr.toji',    icon: 'ghost' },
        { title: 'Threads',   url: 'https://www.threads.net/@mouhamedmostafffa', icon: 'at-sign' },
        { title: 'WhatsApp',  url: '', icon: 'message-circle', isWhatsapp: true }
    ];

    function renderLinkCards(links) {
        const grid = document.getElementById('linksGrid');
        if (!grid) return;

        if (!links || !links.length) {
            grid.innerHTML = '<p class="links-grid-empty">مفيش لينكات لسه.</p>';
            return;
        }

        grid.innerHTML = links.map((item, index) => {
            const href  = item.isWhatsapp ? getWhatsappUrl() : appendUtm(item.url, 'link');
            const title = item.title || '';
            const media = item.imageUrl
                ? `<span class="link-card-media"><img src="${item.imageUrl}" alt="${title}" loading="lazy"></span>`
                : `<span class="link-card-media link-card-media-icon">${iconMarkup(item.icon || 'link')}</span>`;

            return `
                <a class="link-card glass-card hover-glow reveal-up ${index ? `delay-${Math.min(index, 3)}` : ''}"
                   href="${href}" target="_blank" rel="noreferrer">
                    ${media}
                    <span class="link-card-name">${title}</span>
                    <span class="link-card-arrow">${iconMarkup('arrow-up-right')}</span>
                </a>`;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
        refreshDomCollections();
        setTimeout(() => { if (typeof syncObservedElements === 'function') syncObservedElements(); }, 50);
    }

    async function loadLinksGrid() {
        const grid = document.getElementById('linksGrid');
        if (!grid) return;
        try {
            const res   = await window.TojiAPI?.LinksAPI?.getPublic();
            const links = res?.data || [];
            renderLinkCards(links.length ? links : DEFAULT_LINKS);
        } catch (err) {
            // لو السيرفر مش متاح، نعرض لينكات افتراضية بدل ما القسم يفضل فاضي
            renderLinkCards(DEFAULT_LINKS);
        }
    }

    // ============================================================
    // ✦ GUESTBOOK — دفتر الزوار
    // ============================================================
    function escapeHtml(str) {
        return String(str ?? '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function timeAgo(dateStr) {
        const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return currentLang === 'ar' ? 'دلوقتي' : 'just now';
        if (mins < 60) return currentLang === 'ar' ? `من ${mins} دقيقة` : `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return currentLang === 'ar' ? `من ${hours} ساعة` : `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return currentLang === 'ar' ? `من ${days} يوم` : `${days}d ago`;
    }

    let lastGuestbookEntries = [];

    function renderGuestbookEntries(entries) {
        lastGuestbookEntries = entries;
        const list = document.getElementById('guestbookList');
        if (!list) return;

        if (!entries.length) {
            list.innerHTML = `<p class="guestbook-empty">${escapeHtml(t('guestbook.empty'))}</p>`;
            return;
        }

        list.innerHTML = entries.map((entry, i) => `
            <article class="guestbook-entry glass-card ${i ? `reveal-up delay-${Math.min(i, 3)}` : ''}">
                <div class="guestbook-entry-head">
                    <span class="guestbook-entry-mood">${escapeHtml(entry.mood || '💬')}</span>
                    <span class="guestbook-entry-name">${escapeHtml(entry.name)}</span>
                    <span class="guestbook-entry-time">${timeAgo(entry.createdAt)}</span>
                </div>
                <p class="guestbook-entry-message">${escapeHtml(entry.message)}</p>
            </article>
        `).join('');
    }

    async function loadGuestbook() {
        const list = document.getElementById('guestbookList');
        if (!list) return;
        try {
            const res = await window.TojiAPI?.GuestbookAPI?.getPublic();
            renderGuestbookEntries(res?.data || []);
        } catch (err) {
            list.innerHTML = `<p class="guestbook-empty">${escapeHtml(t('guestbook.loadError'))}</p>`;
        }
    }

    async function generateGuestbookWallImage() {
        const entries = lastGuestbookEntries.slice(0, 6);
        if (!entries.length) {
            showToast(t('guestbook.empty'));
            return;
        }

        const width  = 1200;
        const rowH   = 130;
        const height = 220 + rowH * entries.length;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');

        context.fillStyle = '#0a0a0b';
        context.fillRect(0, 0, width, height);

        context.strokeStyle = 'rgba(255,255,255,0.06)';
        context.lineWidth = 1;
        for (let x = 100; x < width; x += 150) {
            context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
        }

        context.fillStyle = '#f7f5ef';
        context.font = '900 44px Arial, sans-serif';
        context.fillText(`${profileNickname} — ${t('guestbook.eyebrow')}`, 60, 90);

        context.fillStyle = '#8b8f98';
        context.font = '600 24px Arial, sans-serif';
        context.fillText(t('guestbook.title'), 60, 130);

        let y = 190;
        entries.forEach((entry) => {
            roundRect(context, 60, y, width - 120, rowH - 24, 20);
            context.fillStyle = 'rgba(255,255,255,0.045)';
            context.fill();
            context.strokeStyle = 'rgba(255,255,255,0.1)';
            context.stroke();

            context.font = '40px Arial, sans-serif';
            context.fillStyle = '#f7f5ef';
            context.fillText(entry.mood || '💬', 92, y + 66);

            context.font = '900 26px Arial, sans-serif';
            context.fillStyle = '#f7f5ef';
            context.fillText(entry.name, 150, y + 42);

            context.font = '400 24px Arial, sans-serif';
            context.fillStyle = '#a7acb7';
            const msg = entry.message.length > 68 ? entry.message.slice(0, 68) + '…' : entry.message;
            context.fillText(msg, 150, y + 78);

            y += rowH;
        });

        context.fillStyle = '#6d7178';
        context.font = '600 22px Arial, sans-serif';
        context.fillText(getProfileUrl().replace(/^https?:\/\//, ''), 60, height - 32);

        await downloadCanvasImageAs(canvas, `${profileNickname}-guestbook.png`);
    }

    function downloadCanvasImageAs(canvas, filename) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) { resolve(false); return; }
                downloadFile(filename, blob, 'image/png');
                showToast(t('toast.shareImageReady'));
                resolve(true);
            }, 'image/png');
        });
    }

    function initGuestbookForm() {
        document.getElementById('guestbookWallBtn')?.addEventListener('click', () => {
            generateGuestbookWallImage();
        });

        const form   = document.getElementById('guestbookForm');
        const submit = document.getElementById('guestbookSubmit');
        const picker = document.getElementById('guestbookMoodPicker');
        if (!form) return;

        let selectedMood = '👋';
        picker?.querySelectorAll('.guestbook-mood').forEach((btn) => {
            btn.addEventListener('click', () => {
                picker.querySelectorAll('.guestbook-mood').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                selectedMood = btn.dataset.mood;
            });
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const nameInput = document.getElementById('guestbookName');
            const msgInput  = document.getElementById('guestbookMessage');
            const statusEl  = document.getElementById('guestbookFormStatus');
            const name = nameInput.value.trim();
            const message = msgInput.value.trim();
            if (!name || !message) return;

            submit.disabled = true;
            const originalLabel = submit.querySelector('span').textContent;
            submit.querySelector('span').textContent = t('guestbook.sending');
            if (statusEl) statusEl.textContent = '';

            try {
                const res = await window.TojiAPI?.GuestbookAPI?.create({ name, message, mood: selectedMood });
                if (res?.success) {
                    nameInput.value = '';
                    msgInput.value = '';
                    if (statusEl) statusEl.textContent = res.zazaReply ? `🦇 زعزع: ${res.zazaReply}` : t('guestbook.pending');
                }
            } catch (err) {
                // silently fail — الفورم بيفضل زي ما هو عشان يحاول تاني
            } finally {
                submit.disabled = false;
                submit.querySelector('span').textContent = originalLabel;
            }
        });
    }

    function renderQuickMessages() {
        if (!messageType) return;
        const messages = Array.isArray(contentOverrides.quickMessages) && contentOverrides.quickMessages.length
            ? contentOverrides.quickMessages
            : [
                { value: 'personal', label: { en: t('form.personal'), ar: t('form.personal') }, message: { en: t('share.briefIntro'), ar: t('share.briefIntro') } },
                { value: 'business', label: { en: t('form.business'), ar: t('form.business') }, message: { en: t('share.briefIntro'), ar: t('share.briefIntro') } },
                { value: 'linkHub', label: { en: t('form.linkHub'), ar: t('form.linkHub') }, message: { en: t('share.briefIntro'), ar: t('share.briefIntro') } }
            ];

        messageType.innerHTML = messages.map((item) => `
            <option value="${item.value || localized(item.label)}" data-message="${localized(item.message)}">${localized(item.label)}</option>
        `).join('');
    }

    function renderHeroCtas() {
        const actions = document.querySelector('.hero-actions');
        if (!actions) return;
        actions.querySelectorAll('[data-dynamic-cta]').forEach((node) => node.remove());
        (contentOverrides.ctaButtons || []).filter((item) => item.enabled !== false && item.url).forEach((item) => {
            const link = document.createElement('a');
            link.className = 'action-btn action-secondary';
            link.href = appendUtm(item.url, item.type || 'cta');
            link.target = '_blank';
            link.rel = 'noreferrer';
            link.dataset.dynamicCta = item.type || 'cta';
            link.dataset.message = localized(item.message);
            link.innerHTML = `${iconMarkup(item.type === 'map' ? 'map-pin' : 'calendar-check')}<span>${localized(item.label)}</span>`;
            actions.appendChild(link);
        });
    }

    function renderMarketingSection(id, config, renderer) {
        let section = document.getElementById(id);
        if (!section) {
            const connectSection = document.getElementById('connect');
            section = document.createElement('section');
            section.className = 'screen dynamic-section';
            section.id = id;
            section.setAttribute('aria-labelledby', `${id}-title`);
            connectSection?.parentNode?.insertBefore(section, connectSection);
        }
        section.hidden = !sectionConfig[id];
        if (section.hidden) return;

        section.innerHTML = `
            <div class="section-shell">
                <div class="section-heading reveal-up">
                    <p class="eyebrow">${localized(config?.eyebrow) || id}</p>
                    <h2 class="section-title" id="${id}-title">${localized(config?.title) || id}</h2>
                </div>
                ${renderer(config)}
            </div>
        `;
    }

    function renderMarketingSections() {
        const marketing = contentOverrides.marketing || {};
        renderMarketingSection('services', marketing.services, (section) => `
            <div class="marketing-grid">
                ${(section?.items || []).map((item) => `
                    <article class="marketing-card glass-card reveal-up tilt-effect">
                        ${iconMarkup('zap')}
                        <h3>${localized(item.title)}</h3>
                        <p>${localized(item.copy)}</p>
                    </article>
                `).join('')}
            </div>
        `);
        renderMarketingSection('pricing', marketing.pricing, (section) => `
            <div class="pricing-grid">
                ${(section?.items || []).map((item) => `
                    <article class="pricing-card glass-card reveal-up">
                        <span>${localized(item.name)}</span>
                        <strong>${item.price || ''}</strong>
                        <ul>${(item.features || []).map((feature) => `<li>${localized(feature)}</li>`).join('')}</ul>
                    </article>
                `).join('')}
            </div>
        `);
        renderMarketingSection('testimonials', marketing.testimonials, (section) => `
            <div class="marketing-grid">
                ${(section?.items || []).map((item) => `
                    <article class="marketing-card glass-card reveal-up">
                        <p>${localized(item.quote)}</p>
                        <h3>${localized(item.name)}</h3>
                    </article>
                `).join('')}
            </div>
        `);
        renderMarketingSection('gallery', marketing.gallery, (section) => `
            <div class="gallery-grid">
                ${(section?.items || []).map((item) => `
                    <figure class="gallery-item glass-card reveal-up">
                        <img src="${item.image || 'assets/social-preview.png'}" alt="${localized(item.title)}" loading="lazy">
                        <figcaption>${localized(item.title)}</figcaption>
                    </figure>
                `).join('')}
            </div>
        `);
        renderMarketingSection('faq', marketing.faq, (section) => `
            <div class="faq-list">
                ${(section?.items || []).map((item) => `
                    <details class="faq-item glass-card reveal-up">
                        <summary>${localized(item.question)}</summary>
                        <p>${localized(item.answer)}</p>
                    </details>
                `).join('')}
            </div>
        `);
    }

    function applySectionVisibility() {
        setElementVisible('#expertise', sectionConfig.about);
        setElementVisible('#work', sectionConfig.work);
        setElementVisible('#connect', sectionConfig.connect);
        setElementVisible('#guestbook', sectionConfig.guestbook);
        // WhatsApp form و Themes بقوا أقسام مستقلة — نظهر/نخبّي القسم كله
        setElementVisible('#quickMessageForm', sectionConfig.form && sectionConfig.connect);
        setElementVisible('#themePanel',       sectionConfig.themeControls && sectionConfig.connect);
        // إظهار/إخفاء أزرار الدوك المقابلة
        const dockWa = document.getElementById('dockWhatsapp');
        const dockTh = document.getElementById('dockThemes');
        if (dockWa) dockWa.hidden = !(sectionConfig.form && sectionConfig.connect);
        if (dockTh) dockTh.hidden = !(sectionConfig.themeControls && sectionConfig.connect);
    }

    function applyDesignConfig() {
        if (designConfig.primaryColor) body.style.setProperty('--primary', designConfig.primaryColor);
        if (designConfig.accentColor) body.style.setProperty('--accent', designConfig.accentColor);
        if (designConfig.mintColor) body.style.setProperty('--mint', designConfig.mintColor);
        if (designConfig.fontFamily) {
            document.documentElement.style.setProperty('--site-font', designConfig.fontFamily);
            body.style.fontFamily = `'${designConfig.fontFamily}', cursive, system-ui, -apple-system, sans-serif`;
        }
        ['personal', 'business', 'creator', 'clinic', 'restaurant'].forEach((name) => {
            body.classList.toggle(`demo-${name}`, designConfig.presets?.currentDemo === name);
        });
    }

    function setupAnalytics() {
        if (analyticsConfig.googleAnalyticsId && !document.getElementById('gaScript')) {
            const ga = document.createElement('script');
            ga.id = 'gaScript';
            ga.async = true;
            ga.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsConfig.googleAnalyticsId)}`;
            document.head.appendChild(ga);

            const inline = document.createElement('script');
            inline.id = 'gaInline';
            inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${analyticsConfig.googleAnalyticsId}');`;
            document.head.appendChild(inline);
        }

        if (analyticsConfig.metaPixelId && !document.getElementById('metaPixelScript')) {
            const pixel = document.createElement('script');
            pixel.id = 'metaPixelScript';
            pixel.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${analyticsConfig.metaPixelId}');fbq('track','PageView');`;
            document.head.appendChild(pixel);
        }
    }

    function renderTemplateFeatures() {
        applyDesignConfig();
        applySectionVisibility();
        renderMarketingSections();
        renderNavigation();
        renderWorkCards();
        renderQuickMessages();
        renderHeroCtas();
        setupAnalytics();
        refreshDomCollections();
        window.lucide?.createIcons();
    }

    function isInsideScrollViewport(element) {
        const rect = element.getBoundingClientRect();
        const rootRect = scrollRoot
            ? scrollRoot.getBoundingClientRect()
            : { top: 0, bottom: window.innerHeight };

        return rect.bottom >= rootRect.top && rect.top <= rootRect.bottom;
    }

    function syncObservedElements() {
        refreshDomCollections();

        revealElements.forEach((element) => {
            if (element.closest('.hero-screen') || isInsideScrollViewport(element)) {
                element.classList.add('visible');
            }
        });

        if (sectionObserver) {
            sectionObserver.disconnect();
            sections.forEach((section) => sectionObserver.observe(section));
        }

        if (revealObserver) {
            revealObserver.disconnect();
            revealElements.forEach((element) => revealObserver.observe(element));
        }
    }

    function updateWhatsappLinks() {
        document.querySelectorAll('[data-whatsapp]').forEach((link) => {
            link.href = appendUtm(`https://wa.me/${profilePhone}?text=${encodeURIComponent(t('share.whatsappMessage'))}`, 'whatsapp');
        });
    }

    function applyConfigLinks() {
        // ✅ الكروت الحقيقية بتيجي من renderLinkCards()/#linksGrid ومالهاش دعوة
        // بالحقول القديمة (profile.socials) خالص — الجزء ده كان بيلاعب في href
        // بتاع كروت اللينكات الحقيقية أو يخفيها بناءً على قيم مش هي المصدر الفعلي.

        document.querySelectorAll('[data-copy]').forEach((button) => {
            button.dataset.copy = profilePhone;
        });

        const assets = profileConfig.assets || {};
        document.querySelectorAll('a[download]').forEach((link) => {
            if (link.getAttribute('href')?.includes('media-kit') && assets.mediaKit) {
                link.href = assets.mediaKit;
            }
        });
    }

    function applyProfileIdentity() {
        if (brandName) brandName.textContent = profileNickname;
        if (profileCardName) profileCardName.textContent = profileNickname;
        if (profilePhoto) {
            profilePhoto.src = profileImage;
            profilePhoto.alt = profileNickname;
        }
        if (qrFallback) qrFallback.textContent = profileNickname;
        document.querySelector('.brand')?.setAttribute('aria-label', `${profileNickname} home`);
    }

    function getWhatsappUrl(message = t('share.whatsappMessage')) {
        return `https://wa.me/${profilePhone}?text=${encodeURIComponent(message)}`;
    }

    function getQrValue() {
        if (currentQrMode === 'whatsapp') return `https://wa.me/${profilePhone}`;
        if (currentQrMode === 'instagram') return socials.instagram || getProfileUrl();
        return getProfileUrl();
    }

    function applyLiveStatus() {
        const status = profileConfig.status || window.TOJI_STATUS || {};
        const text = status[currentLang] || status.en || t('hero.status');

        if (liveStatusText) {
            liveStatusText.textContent = text;
        }
    }

    const presetTokens = {
        neon: () => ({
            primary: designConfig.primaryColor || '#36d6ff',
            accent: designConfig.accentColor || '#ff7a3d',
            mint: designConfig.mintColor || '#6df6b2',
            glow: 'rgba(57, 208, 255, 0.28)'
        }),
        midnight: () => ({ primary: '#8bd3ff', accent: '#c8a7ff', mint: '#7ef0c1', glow: 'rgba(139, 211, 255, 0.22)' }),
        emerald: () => ({ primary: '#5ee2a0', accent: '#f7c948', mint: '#39d0ff', glow: 'rgba(94, 226, 160, 0.24)' }),
        sunset: () => ({ primary: '#ff9f43', accent: '#ff5f7e', mint: '#39d0ff', glow: 'rgba(255, 122, 61, 0.26)' }),
        aurora: () => ({ primary: '#7dd3fc', accent: '#d8b4fe', mint: '#86efac', glow: 'rgba(125, 211, 252, 0.23)' }),
        royal: () => ({ primary: '#f6c95f', accent: '#a78bfa', mint: '#5ee2a0', glow: 'rgba(246, 201, 95, 0.22)' }),
        graphite: () => ({ primary: '#e5e7eb', accent: '#39d0ff', mint: '#ff7a3d', glow: 'rgba(229, 231, 235, 0.16)' })
    };

    // ✅ نسخة فاتحة من كل الثيمات — ألوان أغمق وأعلى تباين تصلح فوق خلفية فاتحة
    const presetTokensLight = {
        neon:     () => ({ primary: '#0077b6', accent: '#d85f2a', mint: '#07845d', glow: 'rgba(0, 119, 182, 0.18)' }),
        midnight: () => ({ primary: '#0369a1', accent: '#7c3aed', mint: '#047857', glow: 'rgba(3, 105, 161, 0.16)' }),
        emerald:  () => ({ primary: '#047857', accent: '#b45309', mint: '#0369a1', glow: 'rgba(4, 120, 87, 0.16)' }),
        sunset:   () => ({ primary: '#c2410c', accent: '#be123c', mint: '#0369a1', glow: 'rgba(194, 65, 12, 0.16)' }),
        aurora:   () => ({ primary: '#0e7490', accent: '#7e22ce', mint: '#047857', glow: 'rgba(14, 116, 144, 0.16)' }),
        royal:    () => ({ primary: '#a16207', accent: '#6d28d9', mint: '#047857', glow: 'rgba(161, 98, 7, 0.16)' }),
        graphite: () => ({ primary: '#374151', accent: '#0e7490', mint: '#c2410c', glow: 'rgba(55, 65, 81, 0.14)' })
    };

    const accentTokens = {
        orange: { primary: '#ff7a3d', accent: '#39d0ff', glow: 'rgba(255, 122, 61, 0.28)' },
        green: { primary: '#5ee2a0', accent: '#ff7a3d', glow: 'rgba(94, 226, 160, 0.28)' },
        violet: { primary: '#a78bfa', accent: '#39d0ff', glow: 'rgba(167, 139, 250, 0.28)' },
        gold: { primary: '#f6c95f', accent: '#39d0ff', glow: 'rgba(246, 201, 95, 0.26)' }
    };

    // ✅ نفس الفكرة للـ accent swatches — نسخة أغمق تصلح فوق خلفية فاتحة
    const accentTokensLight = {
        orange: { primary: '#c2410c', accent: '#0369a1', glow: 'rgba(194, 65, 12, 0.16)' },
        green:  { primary: '#047857', accent: '#c2410c', glow: 'rgba(4, 120, 87, 0.16)' },
        violet: { primary: '#6d28d9', accent: '#0369a1', glow: 'rgba(109, 40, 217, 0.16)' },
        gold:   { primary: '#a16207', accent: '#0369a1', glow: 'rgba(161, 98, 7, 0.14)' }
    };

    function applyColorTokens(preset = 'neon', accent = 'cyan') {
        // ✅ اختار مجموعة الألوان المناسبة حسب الوضع الحالي (فاتح/غامق)
        const isLight  = body.classList.contains('light-theme');
        const presets  = isLight ? presetTokensLight : presetTokens;
        const accents  = isLight ? accentTokensLight : accentTokens;

        const base = (presets[preset] || presets.neon)();
        body.style.setProperty('--primary', base.primary);
        body.style.setProperty('--accent', base.accent);
        body.style.setProperty('--mint', base.mint);
        body.style.setProperty('--glow-color', base.glow);

        const accentToken = accents[accent];
        if (accentToken) {
            body.style.setProperty('--primary', accentToken.primary);
            body.style.setProperty('--accent', accentToken.accent);
            body.style.setProperty('--glow-color', accentToken.glow);
        }
    }

    function setAccent(accent) {
        const accents = ['cyan', 'orange', 'green', 'violet', 'gold'];
        const safeAccent = accents.includes(accent) ? accent : 'cyan';
        accents.forEach((name) => {
            body.classList.toggle(`accent-${name}`, name === safeAccent && name !== 'cyan');
        });
        localStorage.setItem('toji_accent', safeAccent);
        applyColorTokens(localStorage.getItem('toji_theme_preset') || designConfig.presets?.currentStyle || profileConfig.themePreset || 'graphite', safeAccent);

        // sync both old swatches and new accent-tiles
        document.querySelectorAll('[data-accent]').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.accent === safeAccent);
        });

        window.tojiRenderQr?.();
    }

    function setThemePreset(preset) {
        const presets = ['neon', 'midnight', 'emerald', 'sunset', 'aurora', 'royal', 'graphite'];
        const safePreset = presets.includes(preset) ? preset : 'graphite';

        presets.forEach((name) => {
            body.classList.toggle(`preset-${name}`, name === safePreset && name !== 'neon');
        });

        localStorage.setItem('toji_theme_preset', safePreset);
        applyColorTokens(safePreset, localStorage.getItem('toji_accent') || profileConfig.accent || 'cyan');

        // sync both old preset-btns and new preset-cards
        document.querySelectorAll('[data-preset]').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.preset === safePreset);
        });
    }

    function shuffleVibe() {
        const combos = [
            { preset: 'aurora', accent: 'violet' },
            { preset: 'royal', accent: 'gold' },
            { preset: 'graphite', accent: 'cyan' },
            { preset: 'midnight', accent: 'violet' },
            { preset: 'emerald', accent: 'green' },
            { preset: 'sunset', accent: 'orange' },
            { preset: 'neon', accent: 'cyan' }
        ];
        const currentPreset = localStorage.getItem('toji_theme_preset') || 'graphite';
        const currentAccent = localStorage.getItem('toji_accent') || 'cyan';
        const currentIndex = combos.findIndex((combo) => combo.preset === currentPreset && combo.accent === currentAccent);
        const next = combos[(currentIndex + 1 + combos.length) % combos.length];

        setThemePreset(next.preset);
        setAccent(next.accent);
        showToast(t('toast.presetSaved'));
    }

    function applyLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('toji_lang', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        body.classList.toggle('lang-ar', lang === 'ar');

        /* ── Font swap: Arabic = Aref Ruqaa handwriting | English = Caveat handwriting ── */
        if (lang === 'ar') {
            body.style.fontFamily = "'Aref Ruqaa', cursive";
        } else {
            const enFont = (window.TOJI_CONTENT?.design?.fontFamily) || 'Caveat';
            body.style.fontFamily = `'${enFont}', cursive, system-ui, -apple-system, sans-serif`;
        }
        document.title = t('meta.title');
        document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
        document.querySelector('meta[name="author"]')?.setAttribute('content', profileName);
        document.querySelector('meta[name="application-name"]')?.setAttribute('content', profileNickname);
        document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', profileNickname);
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', t('meta.title'));
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', t('meta.description'));
        document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', t('meta.title'));
        document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', t('meta.description'));
        if (profileConfig.assets?.socialPreview) {
            document.querySelector('meta[property="og:image"]')?.setAttribute('content', profileConfig.assets.socialPreview);
            document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', profileConfig.assets.socialPreview);
        }
        const schema = document.getElementById('profileSchema');
        if (schema) {
            const sameAs = Object.values(socials).filter(Boolean);
            schema.textContent = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': contentOverrides.site?.schemaType || 'Person',
                name: profileName,
                alternateName: profileNickname,
                url: contentOverrides.site?.canonicalUrl || getProfileUrl(),
                image: profileConfig.assets?.socialPreview || profileImage,
                telephone: `+${profilePhone}`,
                description: t('meta.description'),
                sameAs
            }, null, 4);
        }
        languageToggle?.querySelector('span')?.replaceChildren(document.createTextNode(t('lang.nextLabel')));
        languageToggle?.setAttribute('aria-label', t('lang.switchLabel'));

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            element.textContent = t(element.dataset.i18n);
        });

        document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
            element.dataset.i18nAttr.split(',').forEach((pair) => {
                const [attribute, key] = pair.split(':').map((part) => part.trim());
                if (attribute && key) element.setAttribute(attribute, t(key));
            });
        });

        renderTemplateFeatures();
        // Fetch live projects from backend and overlay on static content
        loadReactions().then(() => loadProjectsFromAPI());
        loadSongs();
        loadWip();
        loadLinksGrid();
        loadGuestbook();
        initGuestbookForm();
        setThemePreset(localStorage.getItem('toji_theme_preset') || designConfig.presets?.currentStyle || profileConfig.themePreset || 'graphite');
        setAccent(localStorage.getItem('toji_accent') || profileConfig.accent || 'cyan');
        updateWhatsappLinks();
        applyLiveStatus();
        setTheme(body.classList.contains('light-theme') ? 'light' : 'dark');
        startTypewriter(true);
        window.tojiRenderQr?.();
        syncObservedElements();
        updateProgress();
    }

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    function getProfileUrl() {
        const url = new URL(window.location.href);
        url.searchParams.delete('preview');
        url.hash = '';
        return url.toString();
    }

    function downloadFile(filename, content, type) {
        const blob = content instanceof Blob ? content : new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
    }

    function setTheme(theme) {
        const isLight = theme === 'light';
        body.classList.toggle('light-theme', isLight);
        body.classList.toggle('dark-theme', !isLight);
        localStorage.setItem('toji_theme', theme);
        themeToggle?.setAttribute('aria-label', isLight ? t('theme.toDark') : t('theme.toLight'));
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isLight ? '#f7f5ef' : '#050506');

        // ✅ إعادة تطبيق ألوان البريست/الأكسنت الحالية — عشان تتحول لنسخة تناسب
        // الوضع الجديد (فاتح/غامق) بدل ما تفضل عالقة على ألوان الوضع القديم
        const currentPreset = localStorage.getItem('toji_theme_preset') || 'graphite';
        const currentAccent = localStorage.getItem('toji_accent') || 'cyan';
        applyColorTokens(currentPreset, currentAccent);
    }

    setTheme(localStorage.getItem('toji_theme') === 'light' ? 'light' : 'dark');

    themeToggle?.addEventListener('click', () => {
        setTheme(body.classList.contains('dark-theme') ? 'light' : 'dark');
    });

    languageToggle?.addEventListener('click', () => {
        applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
    });

    accentSwatches.forEach((button) => {
        button.addEventListener('click', () => {
            setAccent(button.dataset.accent);
            showToast(t('toast.accentSaved'));
        });
    });

    // ✅ إضافة accent-tile (التصميم الجديد)
    document.querySelectorAll('.accent-tile[data-accent]').forEach((button) => {
        button.addEventListener('click', () => {
            setAccent(button.dataset.accent);
            showToast(t('toast.accentSaved'));
        });
    });

    presetBtns.forEach((button) => {
        if (!button.dataset.preset) return;
        button.addEventListener('click', () => {
            setThemePreset(button.dataset.preset);
            showToast(t('toast.presetSaved'));
        });
    });

    // ✅ إضافة preset-card (التصميم الجديد)
    document.querySelectorAll('.preset-card[data-preset]').forEach((button) => {
        button.addEventListener('click', () => {
            setThemePreset(button.dataset.preset);
            showToast(t('toast.presetSaved'));
        });
    });

    randomVibe?.addEventListener('click', shuffleVibe);

    applyConfigLinks();
    applyProfileIdentity();
    setThemePreset(localStorage.getItem('toji_theme_preset') || designConfig.presets?.currentStyle || profileConfig.themePreset || 'graphite');
    setAccent(localStorage.getItem('toji_accent') || profileConfig.accent || 'cyan');

    const enableCustomCursor = true;

    if (enableCustomCursor && cursorDot && cursorOutline && finePointer.matches && !reducedMotion.matches && !mobileViewport.matches) {
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;
        let outlineX = x;
        let outlineY = y;
        let cursorFrame = 0;

        body.classList.add('cursor-ready');

        const moveCursor = (element, nextX, nextY) => {
            element.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) translate(-50%, -50%)`;
        };

        const renderCursor = () => {
            outlineX += (x - outlineX) * 0.16;
            outlineY += (y - outlineY) * 0.16;
            moveCursor(cursorOutline, outlineX, outlineY);
            cursorFrame = Math.abs(x - outlineX) > 0.25 || Math.abs(y - outlineY) > 0.25
                ? requestAnimationFrame(renderCursor)
                : 0;
        };

        const requestCursorRender = () => {
            if (!cursorFrame) cursorFrame = requestAnimationFrame(renderCursor);
        };

        window.addEventListener('pointermove', (event) => {
            x = event.clientX;
            y = event.clientY;
            moveCursor(cursorDot, x, y);
            requestCursorRender();
        }, { passive: true });

        document.addEventListener('pointerover', (event) => {
            if (event.target.closest?.('a, button, .tilt-effect')) body.classList.add('cursor-active');
        }, { passive: true });

        document.addEventListener('pointerout', (event) => {
            const nextTarget = event.relatedTarget instanceof Element ? event.relatedTarget : null;
            if (!nextTarget?.closest?.('a, button, .tilt-effect')) body.classList.remove('cursor-active');
        }, { passive: true });
    }

    function getTypewriterWords() {
        const list = translations[currentLang]?.typewriter;
        return Array.isArray(list) && list.length ? list : [profileNickname];
    }

    let words = getTypewriterWords();
    let wordIndex = 0;
    let charIndex = words[0].length;
    let isDeleting = false;
    let typeTimer;

    function typeEffect() {
        if (!typeTarget) return;
        const currentWord = words[wordIndex];
        typeTarget.textContent = currentWord.slice(0, charIndex);

        if (isDeleting) {
            charIndex -= 1;
        } else {
            charIndex += 1;
        }

        let speed = isDeleting ? 45 : 82;

        if (mobileViewport.matches) {
            speed = isDeleting ? 28 : 54;
        }

        if (!isDeleting && charIndex > currentWord.length) {
            speed = mobileViewport.matches ? 780 : 1300;
            isDeleting = true;
        }

        if (isDeleting && charIndex < 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            charIndex = 0;
            speed = mobileViewport.matches ? 160 : 300;
        }

        typeTimer = setTimeout(typeEffect, speed);
    }

    function startTypewriter(reset = false) {
        if (!typeTarget) return;
        clearTimeout(typeTimer);

        if (reset) {
            words = getTypewriterWords();
            wordIndex = 0;
            charIndex = words[0].length;
            isDeleting = false;
        }

        if (reducedMotion.matches) {
            typeTarget.textContent = words[0];
        } else {
            typeEffect();
        }
    }

    let progressBumpTimer = null;

    applyLanguage(currentLang);

    function updateProgress() {
        if (!scrollRoot || !progress) return;
        const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
        const amount = maxScroll > 0 ? scrollRoot.scrollTop / maxScroll : 0;
        progress.style.width = `${Math.min(1, Math.max(0, amount)) * 100}%`;

        progress.classList.add('is-bumping');
        clearTimeout(progressBumpTimer);
        progressBumpTimer = setTimeout(() => progress.classList.remove('is-bumping'), 260);
    }

    scrollRoot?.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    // ── Mobile-only: the bottom dock becomes a vertical dock on the left edge.
    // بدل ما تظهر تلقائي مع كل سكرول وتختفي بسرعة، دلوقتي زرار التاب هو اللي
    // بيتحكم فيها: دوسة تفتحها وتفضل مفتوحة، دوسة تانية أو برا تقفلها.
    (function setupMobileDockPeek() {
        const dockWrapper = document.querySelector('.floating-dock-wrapper');
        const peekBtn = document.getElementById('dockPeekBtn');
        if (!dockWrapper || !peekBtn) return;

        function isOpen() { return dockWrapper.classList.contains('dock-peeking'); }

        function showDock() {
            if (!mobileViewport.matches) return;
            dockWrapper.classList.add('dock-peeking');
            peekBtn.classList.add('is-hidden');
        }

        function hideDock() {
            dockWrapper.classList.remove('dock-peeking');
            peekBtn.classList.remove('is-hidden');
        }

        peekBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isOpen() ? hideDock() : showDock();
        });

        // اختيار عنصر من الدوك يقفلها لوحدها (بعد ما الانتقال يحصل)
        dockWrapper.addEventListener('click', (e) => {
            if (e.target.closest('.dock-btn')) {
                setTimeout(hideDock, 250);
            }
        });

        // دوسة برا الدوك تقفلها
        document.addEventListener('click', (e) => {
            if (!mobileViewport.matches) return;
            if (isOpen() && !dockWrapper.contains(e.target) && e.target !== peekBtn) {
                hideDock();
            }
        });

        mobileViewport.addEventListener?.('change', hideDock);
    })();

    function ensureIndicator(container, className) {
        if (!container) return null;
        let el = container.querySelector(`:scope > .${className}`);
        if (!el) {
            el = document.createElement('span');
            el.className = `liquid-indicator ${className}`;
            el.setAttribute('aria-hidden', 'true');
            container.prepend(el);
        }
        return el;
    }

    const indicatorBoxes = new Map();

    function computeBox(container, target, size) {
        const cRect = container.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();
        const cx = tRect.left - cRect.left + tRect.width / 2;
        const cy = tRect.top - cRect.top + tRect.height / 2;
        const w = size ?? tRect.width;
        const h = size ?? tRect.height;
        return { cx, cy, w, h, radius: size ? '50%' : getComputedStyle(target).borderRadius };
    }

    function placeIndicator(indicator, box) {
        indicator.style.width = `${box.w}px`;
        indicator.style.height = `${box.h}px`;
        indicator.style.borderRadius = box.radius;
        indicator.style.transform = `translate(${box.cx - box.w / 2}px, ${box.cy - box.h / 2}px)`;
        indicator.classList.add('is-visible');
    }

    const EASE_GROW = 'cubic-bezier(0.3, 0, 0.2, 1)';
    const EASE_TRAVEL = 'cubic-bezier(0.45, 0, 0.15, 1)';
    const EASE_SETTLE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

    // بنستنى الفريم الجاي قبل ما نغيّر الستايل، عشان التغيير يتزامن مع رسم
    // المتصفح الفعلي بدل ما يعتمد على توقيت setTimeout (اللي ممكن يتأخر شوية
    // ويعمل تقطيع بسيط) — نفس الحركة بالظبط، بس تنفيذها أدق وأنعم.
    function afterDelay(ms, fn) {
        setTimeout(() => requestAnimationFrame(fn), ms);
    }

    function animateStretch(indicator, prev, box, target, container) {
        const isDock = indicator.classList.contains('dock-indicator');
        // ⚡ مراحل أسرع من الأول بنسبة تقريبًا 25% — نفس الحركة (تكبير ثم انزلاق
        // ثم استقرار برجّة خفيفة)، بس أسرع وأخف حس
        const growDur = isDock ? 0.10 : 0.15;
        const travelDur = isDock ? 0.18 : 0.36;
        const settleDur = isDock ? 0.18 : 0.32;
        const travelEase = isDock ? EASE_TRAVEL : 'cubic-bezier(0.4, 0, 0.2, 1)';

        // Phase 1: grow big right where it already is — the magnifying-glass look
        let growW, growH, growRadius;
        if (isDock) {
            const growSize = prev.h * 1.18;
            growW = growSize;
            growH = growSize;
            growRadius = '50%';
        } else {
            growW = prev.w * 1.35;
            growH = prev.h * 1.4;
            growRadius = `${growH / 2}px`;
        }

        indicator.style.transition = `transform ${growDur}s ${EASE_GROW}, width ${growDur}s ${EASE_GROW}, height ${growDur}s ${EASE_GROW}, border-radius ${growDur}s ${EASE_GROW}`;
        placeIndicator(indicator, { cx: prev.cx, cy: prev.cy, w: growW, h: growH, radius: growRadius });

        afterDelay(growDur * 1000, () => {
            // Phase 2: glide across to the destination while it's still big — a smooth,
            // continuous travel, not a shrink-then-move
            indicator.style.transition = `transform ${travelDur}s ${travelEase}`;
            placeIndicator(indicator, { cx: box.cx, cy: box.cy, w: growW, h: growH, radius: growRadius });

            // Every word the glass glides over gets a quick magnify pulse as it passes;
            // the destination word stays magnified until the glass actually settles
            if (!isDock && target && container) {
                const links = Array.from(container.querySelectorAll('.nav-link'));
                const from = prev.cx;
                const to = box.cx;
                const lo = Math.min(from, to) - 2;
                const hi = Math.max(from, to) + 2;

                links.forEach((link) => {
                    const r = link.getBoundingClientRect();
                    const cRect = container.getBoundingClientRect();
                    const linkCx = r.left - cRect.left + r.width / 2;
                    if (linkCx < lo || linkCx > hi) return;

                    const progress = to === from ? 1 : (linkCx - from) / (to - from);
                    const delay = Math.max(0, Math.min(1, progress)) * travelDur;
                    const isFinal = link === target;

                    afterDelay(delay * 1000, () => {
                        link.style.transition = `transform 0.13s ${EASE_GROW}`;
                        link.style.transform = 'scale(1.12)';
                        if (!isFinal) {
                            afterDelay(120, () => {
                                link.style.transition = `transform 0.18s ${EASE_SETTLE}`;
                                link.style.transform = 'scale(1)';
                            });
                        }
                    });
                });
            }

            // Phase 3: arrive — shrink back down to the true final size, with a soft spring —
            // this is exactly when the destination word drops back to its normal size
            afterDelay(travelDur * 1000, () => {
                indicator.style.transition = `transform ${settleDur}s ${EASE_SETTLE}, width ${settleDur}s ${EASE_SETTLE}, height ${settleDur}s ${EASE_SETTLE}, border-radius ${settleDur}s ${EASE_SETTLE}`;
                placeIndicator(indicator, box);

                if (!isDock && target) {
                    target.style.transition = `transform ${settleDur}s ${EASE_SETTLE}`;
                    target.style.transform = 'scale(1)';
                }
            });
        });
    }

    function moveIndicator(container, indicator, target, size, animate = true) {
        if (!container || !indicator || !target) return;
        const box = computeBox(container, target, size);
        const prev = indicatorBoxes.get(indicator);
        const moved = prev && (Math.round(prev.cx) !== Math.round(box.cx) || Math.round(prev.cy) !== Math.round(box.cy));

        if (animate && moved) {
            animateStretch(indicator, prev, box, target, container);
        } else {
            indicator.style.transition = 'none';
            placeIndicator(indicator, box);
            requestAnimationFrame(() => { indicator.style.transition = ''; });
        }
        indicatorBoxes.set(indicator, box);
    }

    function syncIndicators(animate = true) {
        const navContainer = document.querySelector('.nav-links');
        const dockPanel = document.querySelector('.floating-dock');
        const activeNav = navContainer?.querySelector('.nav-link.active');
        const activeDock = dockPanel?.querySelector('.dock-btn.active');

        if (navContainer && activeNav) {
            moveIndicator(navContainer, ensureIndicator(navContainer, 'nav-indicator'), activeNav, undefined, animate);
        }
        if (dockPanel && activeDock) {
            const dockSize = activeDock.getBoundingClientRect().width;
            moveIndicator(dockPanel, ensureIndicator(dockPanel, 'dock-indicator'), activeDock, dockSize, animate);
        }
    }
    window.syncLiquidIndicators = syncIndicators;

    window.addEventListener('resize', () => requestAnimationFrame(() => syncIndicators(false)), { passive: true });

    function activateSection(id) {
        dockBtns.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.target === id);
        });
        navLinks.forEach((link) => {
            link.classList.toggle('active', link.dataset.target === id);
        });
        syncIndicators();
    }

    // ✅ rootMargin بيعمل "شريط رصد" قريب من أعلى الشاشة بدل ما نطلب نسبة
    // كبيرة من ارتفاع القسم كله — ده بيخلي الكشف يشتغل صح حتى لو القسم
    // طويل جدًا زي قسم Connect (مش بيوصل أبدًا لـ 55% ظاهر منه في الشاشة)
    sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                activateSection(entry.target.id);
            }
        });
    }, {
        root: scrollRoot,
        rootMargin: '-15% 0px -65% 0px',
        threshold: 0
    });

    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        root: scrollRoot,
        threshold: 0.12
    });

    syncObservedElements();

    function goToSection(targetId) {
        const target = document.getElementById(targetId);
        if (!target || !scrollRoot) return;

        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        scrollRoot.scrollTo({
            top: target.offsetTop,
            behavior: reducedMotion.matches ? 'auto' : 'smooth'
        });
        target.querySelectorAll('.reveal-up').forEach((element) => element.classList.add('visible'));
        activateSection(targetId);
    }

    document.addEventListener('click', (event) => {
        if (event.defaultPrevented) return;
        const dockButton = event.target.closest?.('.dock-btn');
        const navLink = event.target.closest?.('.nav-link');
        const targetId = dockButton?.dataset.target || navLink?.dataset.target;
        if (!targetId) return;

        event.preventDefault();
        goToSection(targetId);
        window.history.replaceState(null, '', `#${targetId}`);
    });

    dockBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            goToSection(btn.dataset.target);
            window.history.replaceState(null, '', `#${btn.dataset.target}`);
        });
    });

    navLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            goToSection(link.dataset.target);
            window.history.replaceState(null, '', `#${link.dataset.target}`);
        });
    });

    document.querySelectorAll('a[href^="#"]:not(.nav-link)').forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('href').slice(1) || 'home';
            if (!document.getElementById(targetId)) return;

            event.preventDefault();
            goToSection(targetId);
            window.history.replaceState(null, '', `#${targetId}`);
        });
    });

    if (window.location.hash) {
        const hashTarget = window.location.hash.slice(1);
        if (document.getElementById(hashTarget)) {
            setTimeout(() => goToSection(hashTarget), 80);
        }
    }

    if (finePointer.matches && !reducedMotion.matches && !mobileViewport.matches) {
        Array.from(tiltElements)
            .filter((element) => element.classList.contains('profile-panel'))
            .forEach((element) => {
            let tiltFrame = 0;
            let nextEvent;

            element.addEventListener('pointermove', (event) => {
                nextEvent = event;
                if (tiltFrame) return;

                tiltFrame = requestAnimationFrame(() => {
                    tiltFrame = 0;
                    if (!nextEvent) return;

                const rect = element.getBoundingClientRect();
                    const x = nextEvent.clientX - rect.left;
                    const y = nextEvent.clientY - rect.top;
                const rotateX = ((y / rect.height) - 0.5) * -8;
                const rotateY = ((x / rect.width) - 0.5) * 8;
                element.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
                });
            }, { passive: true });

            element.addEventListener('mouseleave', () => {
                element.style.transform = '';
            });
        });
    }

    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                // Fall back below when browser permissions block direct clipboard access.
            }
        }

        const field = document.createElement('textarea');
        field.value = text;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.top = '0';
        field.style.left = '0';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.focus();
        field.select();
        field.setSelectionRange(0, field.value.length);
        const copied = document.execCommand('copy');
        field.remove();

        return copied;
    }

    function manualCopyMessage(text) {
        const value = String(text || '').replace(/\s+/g, ' ').trim();
        const shortValue = value.length > 44 ? `${value.slice(0, 44)}...` : value;
        return `${t('toast.copyManual')} ${shortValue}`;
    }

    function showCopyResult(copied, successMessage, text) {
        showToast(copied ? successMessage : manualCopyMessage(text));
    }

    document.addEventListener('click', async (event) => {
        const button = event.target.closest?.('[data-copy]');
        if (!button) return;
        const value = button.dataset.copy || '';

        try {
            showCopyResult(await copyText(value), t('toast.numberCopied'), value);
        } catch (error) {
            showToast(manualCopyMessage(value));
        }
    });

    function renderLocalQr(canvas, value) {
        if (!canvas || !window.TextEncoder) return false;

        const specs = [
            { version: 1, size: 21, dataCodewords: 19, eccCodewords: 7, align: [] },
            { version: 2, size: 25, dataCodewords: 34, eccCodewords: 10, align: [6, 18] },
            { version: 3, size: 29, dataCodewords: 55, eccCodewords: 15, align: [6, 22] },
            { version: 4, size: 33, dataCodewords: 80, eccCodewords: 20, align: [6, 26] },
            { version: 5, size: 37, dataCodewords: 108, eccCodewords: 26, align: [6, 30] }
        ];
        const bytes = Array.from(new TextEncoder().encode(value));
        const spec = specs.find((item) => bytes.length <= item.dataCodewords - 2);

        if (!spec) return false;

        const dataCodewords = makeDataCodewords(bytes, spec);
        const eccCodewords = makeErrorCodewords(dataCodewords, spec.eccCodewords);
        const payloadBits = [];

        dataCodewords.concat(eccCodewords).forEach((byte) => {
            appendBits(payloadBits, byte, 8);
        });

        const modules = Array.from({ length: spec.size }, () => Array(spec.size).fill(false));
        const reserved = Array.from({ length: spec.size }, () => Array(spec.size).fill(false));

        function setFunctionModule(x, y, isDark) {
            if (x < 0 || y < 0 || x >= spec.size || y >= spec.size) return;
            modules[y][x] = Boolean(isDark);
            reserved[y][x] = true;
        }

        function drawFinder(left, top) {
            for (let y = -1; y <= 7; y += 1) {
                for (let x = -1; x <= 7; x += 1) {
                    const isDark = x >= 0 && x <= 6 && y >= 0 && y <= 6
                        && (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
                    setFunctionModule(left + x, top + y, isDark);
                }
            }
        }

        function drawAlignment(cx, cy) {
            if (reserved[cy]?.[cx]) return;

            for (let y = -2; y <= 2; y += 1) {
                for (let x = -2; x <= 2; x += 1) {
                    const isDark = Math.max(Math.abs(x), Math.abs(y)) === 2 || (x === 0 && y === 0);
                    setFunctionModule(cx + x, cy + y, isDark);
                }
            }
        }

        drawFinder(0, 0);
        drawFinder(spec.size - 7, 0);
        drawFinder(0, spec.size - 7);

        for (let i = 8; i < spec.size - 8; i += 1) {
            setFunctionModule(6, i, i % 2 === 0);
            setFunctionModule(i, 6, i % 2 === 0);
        }

        spec.align.forEach((y) => spec.align.forEach((x) => drawAlignment(x, y)));
        drawFormatBits(0);

        let bitIndex = 0;
        let upward = true;

        for (let right = spec.size - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5;

            for (let vertical = 0; vertical < spec.size; vertical += 1) {
                const y = upward ? spec.size - 1 - vertical : vertical;

                for (let offset = 0; offset < 2; offset += 1) {
                    const x = right - offset;
                    if (reserved[y][x]) continue;

                    const isDark = Boolean(payloadBits[bitIndex]);
                    const isMasked = (x + y) % 2 === 0;
                    modules[y][x] = isDark !== isMasked;
                    bitIndex += 1;
                }
            }

            upward = !upward;
        }

        drawCanvas();
        return true;

        function makeDataCodewords(inputBytes, qrSpec) {
            const bits = [];
            const capacityBits = qrSpec.dataCodewords * 8;
            appendBits(bits, 0x4, 4);
            appendBits(bits, inputBytes.length, qrSpec.version < 10 ? 8 : 16);
            inputBytes.forEach((byte) => appendBits(bits, byte, 8));

            const terminatorLength = Math.min(4, capacityBits - bits.length);
            for (let i = 0; i < terminatorLength; i += 1) bits.push(false);
            while (bits.length % 8 !== 0) bits.push(false);

            const codewords = [];
            for (let i = 0; i < bits.length; i += 8) {
                let codeword = 0;
                for (let j = 0; j < 8; j += 1) {
                    codeword = (codeword << 1) | (bits[i + j] ? 1 : 0);
                }
                codewords.push(codeword);
            }

            for (let pad = 0; codewords.length < qrSpec.dataCodewords; pad += 1) {
                codewords.push(pad % 2 === 0 ? 0xec : 0x11);
            }

            return codewords;
        }

        function makeErrorCodewords(data, degree) {
            const divisor = makeDivisor(degree);
            const result = Array(degree).fill(0);

            data.forEach((byte) => {
                const factor = byte ^ result.shift();
                result.push(0);

                divisor.forEach((coefficient, index) => {
                    result[index] ^= multiplyQrField(coefficient, factor);
                });
            });

            return result;
        }

        function makeDivisor(degree) {
            const result = Array(degree - 1).fill(0).concat(1);
            let root = 1;

            for (let i = 0; i < degree; i += 1) {
                for (let j = 0; j < result.length; j += 1) {
                    result[j] = multiplyQrField(result[j], root);
                    if (j + 1 < result.length) result[j] ^= result[j + 1];
                }
                root = multiplyQrField(root, 0x02);
            }

            return result;
        }

        function multiplyQrField(x, y) {
            let z = 0;

            for (let i = 7; i >= 0; i -= 1) {
                z = (z << 1) ^ ((z >>> 7) * 0x11d);
                z ^= ((y >>> i) & 1) * x;
            }

            return z;
        }

        function appendBits(bits, valueToAppend, length) {
            for (let i = length - 1; i >= 0; i -= 1) {
                bits.push(((valueToAppend >>> i) & 1) === 1);
            }
        }

        function drawFormatBits(mask) {
            const bits = getFormatBits(mask);

            for (let i = 0; i <= 5; i += 1) setFunctionModule(8, i, getBit(bits, i));
            setFunctionModule(8, 7, getBit(bits, 6));
            setFunctionModule(8, 8, getBit(bits, 7));
            setFunctionModule(7, 8, getBit(bits, 8));
            for (let i = 9; i < 15; i += 1) setFunctionModule(14 - i, 8, getBit(bits, i));
            for (let i = 0; i < 8; i += 1) setFunctionModule(spec.size - 1 - i, 8, getBit(bits, i));
            for (let i = 8; i < 15; i += 1) setFunctionModule(8, spec.size - 15 + i, getBit(bits, i));
            setFunctionModule(8, spec.size - 8, true);
        }

        function getFormatBits(mask) {
            const data = (1 << 3) | mask;
            let remainder = data;

            for (let i = 0; i < 10; i += 1) {
                remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
            }

            return ((data << 10) | remainder) ^ 0x5412;
        }

        function getBit(valueToRead, index) {
            return ((valueToRead >>> index) & 1) === 1;
        }

        function drawCanvas() {
            const context = canvas.getContext('2d');
            if (!context) return;

            const canvasSize = 220;
            const cellSize = Math.max(1, Math.floor(canvasSize / (spec.size + 8)));
            const qrSize = cellSize * spec.size;
            const offset = Math.floor((canvasSize - qrSize) / 2);

            canvas.width = canvasSize;
            canvas.height = canvasSize;
            context.fillStyle = '#f7f5ef';
            context.fillRect(0, 0, canvasSize, canvasSize);
            context.fillStyle = '#050506';

            modules.forEach((row, y) => {
                row.forEach((isDark, x) => {
                    if (!isDark) return;
                    context.fillRect(offset + x * cellSize, offset + y * cellSize, cellSize, cellSize);
                });
            });
        }
    }

    window.tojiRenderQr = function renderQr() {
        if (!qrCanvas) return;

        const url = getQrValue();
        const markReady = () => qrCanvas.closest('.qr-frame')?.classList.add('qr-ready');
        const markLoading = () => qrCanvas.closest('.qr-frame')?.classList.remove('qr-ready');
        const renderFallback = () => {
            if (renderLocalQr(qrCanvas, url)) {
                markReady();
                return;
            }

            markLoading();
            if (qrFallback) qrFallback.textContent = 'QR';
        };

        if (!window.QRCode?.toCanvas) {
            renderFallback();
            return;
        }

        window.QRCode.toCanvas(qrCanvas, url, {
            width: 220,
            margin: 1,
            color: {
                dark: '#050506',
                light: '#f7f5ef'
            }
        }, (error) => {
            if (error) {
                renderFallback();
                return;
            }

            markReady();
        });
    };

    qrModeBtns.forEach((button) => {
        const isActive = button.dataset.qrMode === currentQrMode;
        button.classList.toggle('active', isActive);

        button.addEventListener('click', () => {
            currentQrMode = button.dataset.qrMode || 'profile';
            localStorage.setItem('toji_qr_mode', currentQrMode);
            qrModeBtns.forEach((item) => item.classList.toggle('active', item === button));
            window.tojiRenderQr();
        });
    });

    window.tojiRenderQr();

    downloadContact?.addEventListener('click', () => {
        const url = getProfileUrl();
        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${profileName}`,
            `N:${profileName};;;;`,
            `NICKNAME:${profileNickname}`,
            `TEL;TYPE=CELL:+${profilePhone}`,
            `URL:${url}`,
            `X-SOCIALPROFILE;TYPE=instagram:${socials.instagram}`,
            `X-SOCIALPROFILE;TYPE=tiktok:${socials.tiktok}`,
            `X-SOCIALPROFILE;TYPE=snapchat:${socials.snapchat}`,
            'END:VCARD'
        ].join('\r\n');

        downloadFile(`${profileNickname}-contact.vcf`, `${vcard}\r\n`, 'text/vcard;charset=utf-8');
        showToast(t('toast.contactDownloaded'));
    });

    downloadQr?.addEventListener('click', () => {
        if (!qrCanvas || !qrCanvas.closest('.qr-frame')?.classList.contains('qr-ready')) {
            showToast(t('toast.qrLoading'));
            window.tojiRenderQr();
            return;
        }

        qrCanvas.toBlob((blob) => {
            if (!blob) {
                showToast(t('toast.qrDownloadFailed'));
                return;
            }

            downloadFile(`${profileNickname}-${currentQrMode}-qr.png`, blob, 'image/png');
            showToast(t('toast.qrDownloaded'));
        }, 'image/png');
    });

    copyProfileLink?.addEventListener('click', async () => {
        const profileUrl = getProfileUrl();
        try {
            showCopyResult(await copyText(profileUrl), t('toast.profileCopied'), profileUrl);
        } catch (error) {
            showToast(manualCopyMessage(profileUrl));
        }
    });

    async function generateShareCard() {
        const canvas = document.createElement('canvas');
        const width = 1200;
        const height = 630;
        const context = canvas.getContext('2d');
        const shareConfig = profileConfig.shareImage || {};

        canvas.width = width;
        canvas.height = height;

        const gradient = context.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#061c23');
        gradient.addColorStop(0.58, '#050506');
        gradient.addColorStop(1, '#271208');
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);

        context.globalAlpha = 0.26;
        context.fillStyle = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#39d0ff';
        context.beginPath();
        context.arc(250, 170, 280, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#ff7a3d';
        context.beginPath();
        context.arc(980, 420, 260, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 1;

        context.strokeStyle = 'rgba(255,255,255,0.12)';
        context.lineWidth = 1;
        for (let x = 120; x < width; x += 160) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, height);
            context.stroke();
        }
        for (let y = 105; y < height; y += 105) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(width, y);
            context.stroke();
        }

        roundRect(context, 70, 70, 1060, 490, 34);
        context.fillStyle = 'rgba(255,255,255,0.07)';
        context.fill();
        context.strokeStyle = 'rgba(255,255,255,0.16)';
        context.stroke();

        context.fillStyle = '#ff7a3d';
        context.font = '900 34px Arial, sans-serif';
        context.fillText(`${profileName.toUpperCase()} / ${profileNickname}`, 122, 142);

        context.fillStyle = '#f7f5ef';
        context.font = '900 92px Arial, sans-serif';
        context.fillText(shareConfig.title || profileNickname, 122, 265);

        context.fillStyle = '#a7acb7';
        context.font = '700 34px Arial, sans-serif';
        context.fillText(shareConfig.subtitle || t('share.profileText'), 122, 330);
        context.fillText(shareConfig.handle || socials.instagram.replace('https://instagram.com/', '@'), 122, 382);

        const qrImage = await canvasToImage(qrCanvas);
        context.fillStyle = '#f7f5ef';
        roundRect(context, 824, 142, 236, 236, 12);
        context.fill();
        if (qrImage) context.drawImage(qrImage, 840, 158, 204, 204);

        context.fillStyle = '#f7f5ef';
        context.font = '900 30px Arial, sans-serif';
        context.textAlign = 'center';
        context.fillText(shareConfig.scanLabel || 'Scan to connect', 942, 430);
        context.textAlign = 'left';

        context.fillStyle = 'rgba(255,255,255,0.09)';
        context.beginPath();
        context.arc(706, 300, 82, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#f7f5ef';
        context.font = '900 54px Arial, sans-serif';
        context.textAlign = 'center';
        context.fillText(profileNickname, 706, 316);
        context.textAlign = 'left';

        await downloadCanvasImage(canvas);
    }

    function roundRect(context, x, y, width, height, radius) {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.arcTo(x + width, y, x + width, y + height, radius);
        context.arcTo(x + width, y + height, x, y + height, radius);
        context.arcTo(x, y + height, x, y, radius);
        context.arcTo(x, y, x + width, y, radius);
        context.closePath();
    }

    function loadImage(src) {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => resolve(null);
            image.src = src;
        });
    }

    function canvasToImage(sourceCanvas) {
        if (!sourceCanvas) return Promise.resolve(null);
        return loadImage(sourceCanvas.toDataURL('image/png'));
    }

    function downloadCanvasImage(canvas) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    resolve(false);
                    return;
                }

                downloadFile(profileConfig.shareImage?.filename || `${profileNickname}-share-card.png`, blob, 'image/png');
                showToast(t('toast.shareImageReady'));
                resolve(true);
            }, 'image/png');
        });
    }

    generateShareImage?.addEventListener('click', () => {
        if (!qrCanvas?.closest('.qr-frame')?.classList.contains('qr-ready')) {
            window.tojiRenderQr();
        }

        generateShareCard();
    });

    shareProfile?.addEventListener('click', async () => {
        const url = getProfileUrl();
        const shareData = {
            title: `${profileNickname} | ${profileName}`,
            text: t('share.profileText'),
            url
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                showToast(t('toast.shared'));
            } else {
                showCopyResult(await copyText(url), t('toast.profileCopied'), url);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                showToast(t('toast.shareFailed'));
            }
        }
    });

    quickMessageForm?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const selectedOption = messageType?.selectedOptions[0];
        const nameVal        = messageName?.value.trim();
        const msgVal         = messageText?.value.trim();

        // Basic client-side validation
        if (!nameVal || !msgVal) {
            // Light feedback — no big UI disruption
            messageName?.reportValidity?.();
            messageText?.reportValidity?.();
            return;
        }

        // Disable submit button to prevent double sends
        const submitBtn   = quickMessageForm.querySelector('button[type="submit"]');
        const originalTxt = submitBtn?.textContent || 'إرسال';
        if (submitBtn) {
            submitBtn.disabled    = true;
            submitBtn.textContent = '...';
        }

        // Build WhatsApp message parts (kept exactly as before)
        const parts = [
            selectedOption?.dataset.message || t('share.briefIntro'),
            nameVal ? `${t('form.name')}: ${nameVal}` : '',
            selectedOption?.textContent?.trim() ? `${t('form.type')}: ${selectedOption.textContent.trim()}` : '',
            msgVal ? `${t('form.message')}: ${msgVal}` : ''
        ].filter(Boolean);

        // ---- Save to backend (fire-and-forget; never blocks WhatsApp) ----
        if (window.TojiAPI) {
            window.TojiAPI.MessagesAPI.send({
                name:     nameVal,
                pageType: selectedOption?.textContent?.trim() || 'Not specified',
                message:  msgVal
            }).catch((err) => {
                // Silently log — visitor experience is not affected
                console.warn('[TOJI] Message save failed:', err.message);
            });
        }

        // ---- Open WhatsApp (original behaviour preserved) ----
        window.open(getWhatsappUrl(parts.join('\n')), '_blank', 'noopener,noreferrer');

        // Reset form after opening WhatsApp
        quickMessageForm.reset();

        if (submitBtn) {
            submitBtn.disabled    = false;
            submitBtn.textContent = originalTxt;
        }
    });

    let installPromptEvent;

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        installPromptEvent = event;
        if (installApp) installApp.hidden = false;
    });

    installApp?.addEventListener('click', async () => {
        if (!installPromptEvent) return;
        installPromptEvent.prompt();
        await installPromptEvent.userChoice;
        installPromptEvent = null;
        installApp.hidden = true;
    });

    if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
        // ✅ مسح الـ cache القديم (v18) فورًا قبل ما نسجّل الـ SW الجديد
        caches.keys().then((keys) => {
            keys.forEach((key) => {
                if (key !== 'toji-site-v20') caches.delete(key);
            });
        });
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    // ============================================================
    // 🌀 Dock Intro — دايرة بتتفتح بسلاسة وتتحول لشريط الدوك
    // ============================================================
    function playDockIntro() {
        const dock = document.querySelector('.floating-dock');
        if (!dock || dock.dataset.introPlayed) return;
        dock.dataset.introPlayed = '1';

        // احترام تفضيل تقليل الحركة
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const items = Array.from(dock.children); // dock-btn + dock-divider
        const naturalWidth  = dock.offsetWidth;
        const naturalHeight = dock.offsetHeight || 62;
        if (!naturalWidth) return;

        // اخفي محتوى الدوك مؤقتًا
        items.forEach((item) => { item.style.opacity = '0'; });

        // الحالة الابتدائية: دايرة (العرض = الارتفاع)
        dock.style.transition = 'none';
        dock.style.overflow   = 'hidden';
        dock.style.width      = naturalHeight + 'px';

        // فورس reflow عشان التغيير ده ياخد تأثير قبل الانيميشن
        void dock.offsetWidth;

        requestAnimationFrame(() => {
            // ✅ back-ease: الشريط بيمتد لطول أكبر من طوله الطبيعي شوية
            // وبعدين يرجع يستقر عليه — حركة سبرينج ناعمة وأبطأ
            dock.style.transition = 'width 0.85s cubic-bezier(0.34, 1.56, 0.64, 1)';
            dock.style.width = naturalWidth + 'px';

            // الأيقونات تبان تدريجيًا قرب ما الشريط يوصل لأقصى مده
            setTimeout(() => {
                items.forEach((item, i) => {
                    item.style.transition = `opacity 0.33s ease ${i * 0.03}s`;
                    item.style.opacity = '1';
                });
            }, 365);

            // بعد ما الشريط يستقر تمامًا، رجّع العرض auto عشان يفضل responsive
            const cleanup = (event) => {
                if (event && event.propertyName !== 'width') return;
                dock.removeEventListener('transitionend', cleanup);
                dock.style.width      = '';
                dock.style.overflow   = '';
                dock.style.transition = '';
                items.forEach((item) => { item.style.transition = ''; });
            };
            dock.addEventListener('transitionend', cleanup);
            setTimeout(cleanup, 1180); // fallback لو الـ transitionend مطلعش
        });
    }

    function finishLoading() {
        body.classList.remove('is-loading');
        body.classList.add('is-ready');
        playDockIntro();
    }

    // ✅ الأنيميشن الجديد بياخد حوالي 1.9 ثانية (آخر حرف delay + مدة الحركة)
    // فبنستنى المدة دي كاملة قبل ما نقفل شاشة التحميل عشان الحركة تتفرج عليها كاملة
    const LOADER_MIN_DURATION = mobileViewport.matches ? 1650 : 1900;

    window.addEventListener('load', () => {
        setTimeout(finishLoading, LOADER_MIN_DURATION);
    }, { once: true });

    setTimeout(finishLoading, LOADER_MIN_DURATION + 600); // fallback لو load event اتأخر

    window.addEventListener('storage', (event) => {
        if (previewMode && event.key === 'toji_content_override') {
            window.location.reload();
        }
    });

    window.addEventListener('keydown', (event) => {
        if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(event.key)) return;
        if (event.target instanceof Element && event.target.closest('a, button, input, textarea, select')) return;

        const ids = Array.from(sections).map((section) => section.id);
        const current = ids.findIndex((id) => document.querySelector(`.dock-btn[data-target="${id}"]`)?.classList.contains('active'));
        const direction = ['ArrowDown', 'PageDown'].includes(event.key) ? 1 : -1;
        const next = Math.min(ids.length - 1, Math.max(0, current + direction));

        event.preventDefault();
        goToSection(ids[next]);
    });
});

// ========== ALL ENHANCEMENTS JS ==========

// RIPPLE
document.addEventListener('click', (e) => {
    if (e.target.closest('button, a, [role="button"]')) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = e.target.closest('button, a, [role="button"]').getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        e.target.closest('button, a, [role="button"]').appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
        if (navigator.vibrate) navigator.vibrate(10);
    }
});

// SCROLL ANIMATIONS
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('scroll-animate');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.hero-content, .section-title, .bento-item').forEach(el => {
    observer.observe(el);
});

// FORM VALIDATION
document.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('blur', () => {
        if (input.value.length > 0 && input.checkValidity && input.checkValidity()) {
            input.classList.add('valid');
        }
    });
});

// AUDIO CONTEXT
try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    window.playSound = (freq = 400, duration = 100) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + duration / 1000);
    };
} catch(e) {}

// TOUCH
document.addEventListener('touchstart', (e) => {
    const el = e.target.closest('button, a');
    if (el) el.style.opacity = '0.8';
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const el = e.target.closest('button, a');
    if (el) el.style.opacity = '';
}, { passive: true });

// LAZY LOADING
if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-lazy]');
    lazyImages.forEach(img => {
        const imgObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.src = entry.target.dataset.lazy;
                    entry.target.removeAttribute('data-lazy');
                    imgObserver.unobserve(entry.target);
                }
            });
        });
        imgObserver.observe(img);
    });
}

// SWIPE
let touchStartX = 0;
document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    if (touchEndX < touchStartX - 50) {
        // Swiped left
    } else if (touchEndX > touchStartX + 50) {
        // Swiped right
    }
});

// MAGNETIC HOVER — مش بيأثر على الـ dock أو الـ nav أو الـ tilt
document.querySelectorAll('button, a').forEach(element => {
    if (element.closest('.floating-dock, .nav-links, .tilt-effect, .profile-panel')) return;

    element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const distance = Math.sqrt(x * x + y * y);

        if (distance < 100) {
            const angle = Math.atan2(y, x);
            const pull = (100 - distance) / 100 * 8;
            element.style.transform = `translate(${Math.cos(angle) * pull}px, ${Math.sin(angle) * pull}px)`;
        }
    });

    element.addEventListener('mouseleave', () => {
        element.style.transform = ''; // ← مسح الـ inline style مش override
    });
});

// PROGRESS BAR ON PAGE LOAD
window.addEventListener('beforeunload', () => {
    const progress = document.createElement('div');
    progress.className = 'progress-bar';
    document.body.appendChild(progress);
});

// ============================================================
// 📊 VISITOR TRACKING — بيسجّل الزيارة في الباك اند
// ============================================================
(function initTracking() {
    if (!window.TojiAPI) return;
    const API = 'https://portfolio-backend-production-3dc5.up.railway.app/api/analytics';

    // كشف الجهاز
    function detectDevice() {
        const ua = navigator.userAgent;
        if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
        if (/Tablet|iPad/i.test(ua)) return 'tablet';
        return 'desktop';
    }

    function detectOS() {
        const ua = navigator.userAgent;
        if (/Windows/i.test(ua))     return 'Windows';
        if (/Mac OS/i.test(ua))      return 'Mac';
        if (/Linux/i.test(ua))       return 'Linux';
        if (/Android/i.test(ua))     return 'Android';
        if (/iPhone|iPad/i.test(ua)) return 'iOS';
        return 'Unknown';
    }

    function detectBrowser() {
        const ua = navigator.userAgent;
        if (/Edg\//i.test(ua))     return 'Edge';
        if (/Chrome/i.test(ua))    return 'Chrome';
        if (/Firefox/i.test(ua))   return 'Firefox';
        if (/Safari/i.test(ua))    return 'Safari';
        if (/Opera/i.test(ua))     return 'Opera';
        return 'Other';
    }

    const sessionData = {
        visitId:         null,
        sectionsViewed:  new Set(),
        projectsClicked: [],
        linksClicked:    [],
        startTime:       Date.now()
    };

    // هوية ثابتة للزائر (بتتحفظ في متصفحه) عشان نعرف نميز الزيارات
    // المتكررة لنفس الشخص
    function getVisitorId() {
        try {
            let id = localStorage.getItem('toji_visitor_id');
            if (!id) {
                id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
                    'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
                localStorage.setItem('toji_visitor_id', id);
            }
            return id;
        } catch { return ''; }
    }

    // تسجيل الزيارة الأولية
    async function trackVisit() {
        try {
            const res = await fetch(`${API}/visit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device:    detectDevice(),
                    os:        detectOS(),
                    browser:   detectBrowser(),
                    referrer:  document.referrer || '',
                    language:  navigator.language || '',
                    screen:    `${screen.width}x${screen.height}`,
                    timezone:  Intl.DateTimeFormat().resolvedOptions().timeZone || '',
                    visitorId: getVisitorId()
                })
            });
            const data = await res.json();
            if (data?.id) sessionData.visitId = data.id;
        } catch {}
    }

    // تحديث الجلسة (بيانات الوقت + الأقسام + المشاريع)
    // ✅ بنستخدم sendBeacon وقت الخروج (أضمن إنه يتبعت حتى لو الصفحة بتقفل)
    //    وكمان بنعمل تحديث دوري كل 20 ثانية بـ fetch عادي، عشان لو
    //    المتصفح (خصوصًا الموبايل) ملقاش فرصة يستدعي حدث الخروج أصلاً
    function buildSessionBody() {
        return JSON.stringify({
            sectionsViewed:  [...sessionData.sectionsViewed],
            projectsClicked: sessionData.projectsClicked,
            linksClicked:    sessionData.linksClicked,
            timeOnSite:      Math.round((Date.now() - sessionData.startTime) / 1000)
        });
    }

    function updateSession() {
        if (!sessionData.visitId) return;
        const body = buildSessionBody();
        // ✅ مهم جدًا: لازم "text/plain" مش "application/json".
        //    السبب: sendBeacon() لما بيبعت عبر نطاقات مختلفة (الفرونت إند
        //    على Vercel والباك إند على Railway)، أي Content-Type "غير بسيط"
        //    زي application/json بيحتاج CORS preflight (طلب OPTIONS الأول)،
        //    لكن sendBeacon() مقدرش يعمل preflight أصلاً — فبراوزرات زي
        //    Chrome كانت بتلغي الطلب بصمت من غير أي خطأ ظاهر في الكونسول.
        //    ده كان السبب إن "الوقت على الصفحة" و"الأقسام" و"المشاريع"
        //    كانوا دايمًا بيفضلوا فاضيين لأي زيارة قصيرة (تحت 20 ثانية).
        //    text/plain من الأنواع "البسيطة" اللي مبيحتاجش preflight،
        //    فالطلب بيتبعت فعليًا. الباك إند بيتعامل معاه كـ JSON برضو.
        navigator.sendBeacon(`${API}/visit/${sessionData.visitId}`, new Blob([body], { type: 'text/plain' }));
    }

    // نسخة عادية بـ fetch (للتحديث الدوري وقت ما الصفحة لسه مفتوحة)
    function syncSession() {
        if (!sessionData.visitId) return;
        fetch(`${API}/visit/${sessionData.visitId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: buildSessionBody(),
            keepalive: true
        }).catch(() => {});
    }

    // تتبع الأقسام بالـ IntersectionObserver
    function trackSections() {
        const sections = document.querySelectorAll('section[id]');
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) sessionData.sectionsViewed.add(e.target.id);
            });
        }, { threshold: 0.3 });
        sections.forEach((s) => obs.observe(s));
    }

    // تتبع نقرات المشاريع والروابط
    function trackClicks() {
        document.addEventListener('click', (e) => {
            const projectCard = e.target.closest('.live-project-card, .project-card');
            if (projectCard) {
                const title = projectCard.querySelector('h3')?.textContent || '';
                if (title) sessionData.projectsClicked.push(title);
            }
            const link = e.target.closest('a[href^="http"]');
            if (link && !link.href.includes(location.hostname)) {
                sessionData.linksClicked.push(link.href);
            }
        });
    }

    // ابدأ بعد ثانية (عشان مش يبطّل الـ page load)
    setTimeout(async () => {
        await trackVisit();
        trackSections();
        trackClicks();
        // تحديث دوري كل 20 ثانية — شبكة أمان لو الزائر ماقفلش التاب
        // بطريقة عادية (زي تبديل التطبيقات على الموبايل)
        setInterval(syncSession, 20000);
    }, 1000);

    window.addEventListener('beforeunload', updateSession);
    // pagehide أضمن من beforeunload على أغلب متصفحات الموبايل (خصوصًا Safari)
    window.addEventListener('pagehide', updateSession);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') updateSession();
    });

    // ============================================================
    // ✦ PAGES QUICK MENU — زرار في الدوك يفتح منيو فيها كل الصفحات
    //    الجديدة (Pricing, Blog, Stack...) متاح من أي مكان في الموقع
    // ============================================================
    (function initPagesMenu() {
        const btn = document.getElementById('dockPagesBtn');
        const menu = document.getElementById('pagesMenu');
        if (!btn || !menu) return;

        function closeMenu() {
            menu.hidden = true;
            btn.setAttribute('aria-expanded', 'false');
        }
        function openMenu() {
            menu.hidden = false;
            btn.setAttribute('aria-expanded', 'true');
        }

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (menu.hidden) openMenu(); else closeMenu();
        });

        document.addEventListener('click', (e) => {
            if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) closeMenu();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });
    })();
})();