// ============================================================
// TOJI — Optional Account System (Frontend)
// حساب اختياري بالكامل: تسجيل/دخول عادي أو بجوجل، ذاكرة شات زعزع،
// حفظ المشاريع، نظام نقط يومي، صورة بروفايل.
// شغال في كل صفحات الموقع (لازم يتحمل بعد api.js).
// ============================================================
(function () {
    'use strict';

    const API_BASE_URL = window.TojiAPI?.API_BASE_URL ||
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000/api'
            : 'https://portfolio-backend-production-3dc5.up.railway.app/api');

    // ── إدارة توكن المستخدم — منفصل تمامًا عن توكن الأدمن ──────
    const USER_TOKEN_KEY = 'toji_user_token';
    const USER_KEY        = 'toji_user_data';

    const UserToken = {
        get:    () => localStorage.getItem(USER_TOKEN_KEY),
        set:    (t) => localStorage.setItem(USER_TOKEN_KEY, t),
        remove: () => localStorage.removeItem(USER_TOKEN_KEY)
    };

    function getCachedUser() {
        try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
    }
    function setCachedUser(u) {
        try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch {}
    }
    function clearCachedUser() {
        localStorage.removeItem(USER_KEY);
    }

    // ── لو الرابط فيه ?ref=CODE، نحفظه محليًا عشان نستخدمه لو الزائر عمل حساب ──
    function getStoredRefCode() {
        try {
            const fromUrl = new URLSearchParams(window.location.search).get('ref');
            if (fromUrl) localStorage.setItem('toji_ref_code', fromUrl.trim().toUpperCase());
            return localStorage.getItem('toji_ref_code') || '';
        } catch { return ''; }
    }
    getStoredRefCode(); // نسجّل الكود لو موجود من أول تحميل للصفحة

    async function accountFetch(endpoint, options = {}) {
        const token = UserToken.get();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(options.headers || {})
        };
        // حد أقصى 25 ثانية — لو السيرفر واقع/بطيء، منوقفش على اللودينج للأبد
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        let res;
        try {
            res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers, signal: controller.signal });
        } catch (e) {
            const err = new Error(e.name === 'AbortError' ? 'السيرفر مش بيرد دلوقتي، جرب تاني.' : 'مشكلة في الاتصال بالسيرفر.');
            err.status = 0;
            throw err;
        } finally {
            clearTimeout(timeoutId);
        }
        let data;
        try { data = await res.json(); } catch { data = {}; }
        if (!res.ok) {
            const err = new Error(data.message || 'حصل خطأ في السيرفر');
            err.status = res.status;
            throw err;
        }
        return data;
    }

    const AccountAPI = {
        settings:   () => accountFetch('/account/settings'),
        register:   (name, email, password) => accountFetch('/account/register', { method: 'POST', body: JSON.stringify({ name, email, password, refCode: getStoredRefCode() }) }),
        login:      (email, password) => accountFetch('/account/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
        google:     (credential) => accountFetch('/account/google', { method: 'POST', body: JSON.stringify({ credential, refCode: getStoredRefCode() }) }),
        me:         () => accountFetch('/account/me'),
        updateName: (name) => accountFetch('/account/me', { method: 'PUT', body: JSON.stringify({ name }) }),
        updateProfile: (data) => accountFetch('/account/me', { method: 'PUT', body: JSON.stringify(data) }),
        changePassword: (currentPassword, newPassword) => accountFetch('/account/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
        changeEmail: (newEmail, currentPassword) => accountFetch('/account/email', { method: 'PUT', body: JSON.stringify({ newEmail, currentPassword }) }),
        logoutAllDevices: () => accountFetch('/account/logout-all-devices', { method: 'POST' }),
        unlinkGoogle: () => accountFetch('/account/google-link', { method: 'DELETE' }),
        updateNotifyPrefs: (prefs) => accountFetch('/account/notify-prefs', { method: 'PUT', body: JSON.stringify(prefs) }),
        updateTheme: (theme) => accountFetch('/account/theme', { method: 'PUT', body: JSON.stringify({ theme }) }),
        getBlocked: () => accountFetch('/account/blocked'),
        blockUser: (username) => accountFetch(`/account/block/${encodeURIComponent(username)}`, { method: 'POST' }),
        unblockUser: (username) => accountFetch(`/account/block/${encodeURIComponent(username)}`, { method: 'DELETE' }),
        addSong: (title, artist, url) => accountFetch('/account/songs', { method: 'POST', body: JSON.stringify({ title, artist, url }) }),
        removeSong: (songId) => accountFetch(`/account/songs/${songId}`, { method: 'DELETE' }),

        // ريأكشنز + مؤشر الكتابة
        reactToMessage: (messageId, emoji) => accountFetch(`/account/messages/${messageId}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }),
        unreactToMessage: (messageId) => accountFetch(`/account/messages/${messageId}/react`, { method: 'DELETE' }),
        setTyping: (username) => accountFetch(`/account/messages/${username}/typing`, { method: 'POST' }),
        getTyping: (username) => accountFetch(`/account/messages/${username}/typing`),

        // ليدر بورد + مقارنة نشاط
        getLeaderboard: () => accountFetch('/account/leaderboard'),
        getPercentile: () => accountFetch('/account/me/percentile'),

        // اكتشف حسابات
        discover: () => accountFetch('/account/discover'),

        // تخصيص البروفايل — غلاف، لون، تصنيف، تثبيت
        customizeProfile: (data) => accountFetch('/account/customize', { method: 'PUT', body: JSON.stringify(data) }),
        uploadCover: async (file) => {
            const formData = new FormData();
            formData.append('image', file);
            const res = await fetch(`${API_BASE_URL}/account/cover`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getToken()}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'فشل رفع الصورة');
            return data;
        },

        // ستوريز
        addStory: (text, imageUrl) => accountFetch('/account/stories', { method: 'POST', body: JSON.stringify({ text, imageUrl }) }),
        uploadStoryImage: async (file) => {
            const formData = new FormData();
            formData.append('image', file);
            const res = await fetch(`${API_BASE_URL}/account/stories/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getToken()}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'فشل رفع الصورة');
            return data;
        },
        getStories: (username) => accountFetch(`/account/stories/${encodeURIComponent(username)}`),
        viewStory: (storyId) => accountFetch(`/account/stories/${storyId}/view`, { method: 'POST' }),
        getStoriesFeed: () => accountFetch('/account/stories-feed'),

        // تنبيهات المتصفح
        getVapidKey: () => accountFetch('/account/push/vapid-key'),
        subscribePush: (subscription) => accountFetch('/account/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription }) }),
        unsubscribePush: (endpoint) => accountFetch('/account/push/subscribe', { method: 'DELETE', body: JSON.stringify({ endpoint }) }),
        claimDaily: () => accountFetch('/account/claim-daily-points', { method: 'POST' }),
        claimWeeklyChallenge: () => accountFetch('/account/claim-weekly-challenge', { method: 'POST' }),
        claimSurpriseBox: () => accountFetch('/account/claim-surprise-box', { method: 'POST' }),
        redeemPoints: () => accountFetch('/account/redeem-points', { method: 'POST' }),
        updatePreferences: (mode, moodKey) => accountFetch('/account/preferences', { method: 'PUT', body: JSON.stringify({ mode, moodKey }) }),
        updateNotes: (notes) => accountFetch('/account/notes', { method: 'PUT', body: JSON.stringify({ notes }) }),
        toggleSavedProject: (projectId) => accountFetch('/account/saved-projects/toggle', { method: 'POST', body: JSON.stringify({ projectId }) }),
        getBadges: () => accountFetch('/account/badges'),
        searchUsers: (q) => accountFetch(`/account/search?q=${encodeURIComponent(q)}`),
        exportData: () => accountFetch('/account/export-data'),
        deleteAccount: () => accountFetch('/account/me', { method: 'DELETE' }),
        chatHistory: () => accountFetch('/account/chat-history'),
        claimChat:   (clientId) => accountFetch('/account/claim-chat', { method: 'POST', body: JSON.stringify({ clientId }) }),
        myProjects:  () => accountFetch('/account/my-projects'),

        // بروفايل عام + متابعة
        getPublicProfile: (username) => accountFetch(`/account/public/${encodeURIComponent(username)}`),
        follow:   (username) => accountFetch(`/account/follow/${encodeURIComponent(username)}`, { method: 'POST' }),
        unfollow: (username) => accountFetch(`/account/follow/${encodeURIComponent(username)}`, { method: 'DELETE' }),
        followers: () => accountFetch('/account/followers'),
        following: () => accountFetch('/account/following'),
        giftPoints: (username, amount) => accountFetch('/account/gift-points', { method: 'POST', body: JSON.stringify({ username, amount }) }),

        // رسايل
        getConversations: () => accountFetch('/account/messages'),
        getThread: (username) => accountFetch(`/account/messages/${encodeURIComponent(username)}`),
        getThreads: () => accountFetch('/account/messages'),
        sendMessage: (username, payload) => accountFetch(`/account/messages/${encodeURIComponent(username)}`, { method: 'POST', body: JSON.stringify(typeof payload === 'string' ? { text: payload } : payload) }),
        uploadDmMedia: async (file, type, duration) => {
            const formData = new FormData();
            formData.append('file', file);
            let url = `${API_BASE_URL}/account/messages/upload?type=${encodeURIComponent(type)}`;
            if (duration) url += `&duration=${Math.round(duration)}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getToken()}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'فشل رفع الملف');
            return data;
        },

        // إعلانات + رسالة ترحيب
        getBroadcasts: () => accountFetch('/account/broadcasts'),
        markWelcomeSeen: () => accountFetch('/account/welcome-message/seen', { method: 'PATCH' }),
        uploadAvatar: async (file) => {
            const token = UserToken.get();
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch(`${API_BASE_URL}/account/avatar`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: fd
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'فشل رفع الصورة');
            return data;
        }
    };

    let cachedSettings = null;
    async function getSettings() {
        if (cachedSettings) return cachedSettings;
        try {
            const res = await AccountAPI.settings();
            cachedSettings = res.data;
        } catch {
            cachedSettings = { enableAccounts: true, enableGoogleLogin: false, enablePoints: true };
        }
        return cachedSettings;
    }

    function isLoggedIn() { return Boolean(UserToken.get()); }
    function getUser() { return getCachedUser(); }
    function getToken() { return UserToken.get(); }

    function logout() {
        UserToken.remove();
        clearCachedUser();
        renderNavButton();
        window.dispatchEvent(new CustomEvent('toji-account-change', { detail: { user: null } }));
    }

    function setSession(token, user) {
        UserToken.set(token);
        setCachedUser(user);
        renderNavButton();
        window.dispatchEvent(new CustomEvent('toji-account-change', { detail: { user } }));
        claimDailyPointsQuietly();
        claimOldChatQuietly();
    }

    // ── ربط شات زعزع القديم (قبل الحساب) بالحساب الجديد تلقائيًا ──
    function claimOldChatQuietly() {
        try {
            const cid = localStorage.getItem('toji_ai_cid');
            if (cid) AccountAPI.claimChat(cid).catch(() => {});
        } catch {}
    }

    // ── نقطة الدخول اليومية — مرة واحدة كل يوم تلقائيًا ──────────
    async function claimDailyPointsQuietly() {
        try {
            const settings = await getSettings();
            if (!settings.enablePoints) return;
            const res = await AccountAPI.claimDaily();
            if (res && res.awarded > 0) {
                const user = getCachedUser();
                if (user) { user.points = { total: res.total }; setCachedUser(user); }
                renderNavButton();
                toast(`+${res.awarded} نقطة عشان دخولك النهارده 🎉`);
            }
        } catch {}
    }

    function toast(msg) {
        const el = document.createElement('div');
        el.className = 'toji-toast';
        el.textContent = msg;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3200);
    }

    // ============================================================
    // Nav button / dropdown
    // ============================================================
    function initials(name) {
        return String(name || '؟').trim().slice(0, 1).toUpperCase();
    }

    function renderNavButton() {
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;

        let wrap = document.getElementById('tojiAccountWrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'tojiAccountWrap';
            wrap.className = 'toji-account-wrap';
            navActions.insertBefore(wrap, navActions.firstChild);
        }

        const user = getCachedUser();

        if (!user) {
            wrap.innerHTML = `<button class="toji-account-btn toji-account-signin" id="tojiSignInBtn" type="button">
                <i data-lucide="user" aria-hidden="true"></i><span>دخول</span>
            </button>`;
            wrap.querySelector('#tojiSignInBtn').addEventListener('click', () => openAuthModal('login'));
        } else {
            const avatar = user.avatarUrl
                ? `<img src="${escapeAttr(user.avatarUrl)}" alt="" class="toji-account-avatar">`
                : `<span class="toji-account-avatar toji-account-avatar-fallback">${initials(user.name)}</span>`;
            wrap.innerHTML = `
                <div class="toji-account-pill" id="tojiAccountPill" tabindex="0">
                    ${avatar}
                    <span class="toji-account-name">${escapeHtml(user.name)}</span>
                    ${user.points ? `<span class="toji-account-points" title="نقطك">${user.points.total} ⭐</span>` : ''}
                </div>
                <div class="toji-account-menu" id="tojiAccountMenu" hidden>
                    <a href="account.html" class="toji-account-menu-item"><i data-lucide="layout-dashboard" aria-hidden="true"></i> حسابي</a>
                    <a href="messages.html" class="toji-account-menu-item"><i data-lucide="message-circle" aria-hidden="true"></i> الرسايل</a>
                    <a href="settings.html" class="toji-account-menu-item"><i data-lucide="settings" aria-hidden="true"></i> إعدادات الحساب</a>
                    <button type="button" class="toji-account-menu-item" id="tojiLogoutBtn"><i data-lucide="log-out" aria-hidden="true"></i> تسجيل خروج</button>
                </div>`;
            const pill = wrap.querySelector('#tojiAccountPill');
            const menu = wrap.querySelector('#tojiAccountMenu');
            pill.addEventListener('click', (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; });
            document.addEventListener('click', () => { menu.hidden = true; }, { once: true });
            wrap.querySelector('#tojiLogoutBtn').addEventListener('click', logout);
        }

        if (window.lucide) window.lucide.createIcons();
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function escapeAttr(str) { return escapeHtml(str); }

    // ============================================================
    // Auth Modal — تصميم متناسق مع استايل الموقع (glass-panel)
    // ============================================================
    let modalEl = null;

    async function openAuthModal(initialTab) {
        // ✅ نفتح المودال فورًا من غير ما نستنى أي طلب شبكة —
        //    الانتظار هنا كان بيخلي الشاشة تبان متجمدة على النت البطيء (خصوصًا الموبايل)
        //    لأن اللمسة/الضغطة ماكانش بيحصلها أي رد فعل بصري لحد ما الطلب يخلص.
        if (!modalEl) buildModal();
        modalEl.hidden = false;
        requestAnimationFrame(() => modalEl.classList.add('open'));
        setTab(initialTab || 'login');
        modalEl.querySelectorAll('.toji-google-slot').forEach((el) => { el.hidden = true; });

        try {
            const settings = await getSettings();
            if (!settings.enableAccounts) { closeAuthModal(); return; }
            if (settings.enableGoogleLogin && settings.googleClientId) {
                renderGoogleButtons(settings.googleClientId);
            }
        } catch {
            // لو الإعدادات فشلت تتحمل، سيب الفورم شغالة زي ما هي (إيميل/باسورد لسه متاحة)
        }
    }

    function closeAuthModal() {
        if (!modalEl) return;
        modalEl.classList.remove('open');
        setTimeout(() => { modalEl.hidden = true; }, 200);
    }

    function setTab(tab) {
        modalEl.querySelectorAll('.toji-auth-tab').forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tab));
        modalEl.querySelectorAll('.toji-auth-form').forEach((f) => f.hidden = f.dataset.form !== tab);
        modalEl.querySelector('.toji-auth-error').textContent = '';
        const switchEl = modalEl.querySelector('#tojiAuthSwitch');
        if (switchEl) {
            switchEl.innerHTML = (tab === 'login')
                ? 'لسه معملتش حساب؟ <a data-switch-to="register">اعمل واحد دلوقتي</a>'
                : 'عندك حساب بالفعل؟ <a data-switch-to="login">سجّل دخولك</a>';
            switchEl.querySelector('[data-switch-to]').addEventListener('click', (e) => {
                e.preventDefault();
                setTab(e.target.dataset.switchTo);
            });
        }
    }

    function buildModal() {
        modalEl = document.createElement('div');
        modalEl.className = 'toji-auth-overlay';
        modalEl.hidden = true;
        modalEl.innerHTML = `
        <div class="toji-auth-card" role="dialog" aria-modal="true" aria-label="تسجيل الدخول أو إنشاء حساب">
            <div class="toji-auth-visual">
                <span class="toji-auth-visual-orb toji-auth-visual-orb-1"></span>
                <span class="toji-auth-visual-orb toji-auth-visual-orb-2"></span>
                <span class="toji-auth-visual-orb toji-auth-visual-orb-3"></span>
                <div class="toji-auth-brand">TOJI<span class="dot">.</span></div>
                <p class="toji-auth-visual-eyebrow">أهلًا بيك 👋</p>
                <h2 class="toji-auth-visual-title">يلا نبدأ سوا</h2>
                <p class="toji-auth-visual-text">اعمل حساب مجاني وخد ذاكرة شات مع زعزع، نقط يومية بتتحول لخصومات، وحفظ مشاريعك — كله اختياري تمامًا.</p>
            </div>

            <div class="toji-auth-panel">
                <button class="toji-auth-close" type="button" aria-label="إغلاق">
                    <i data-lucide="x" aria-hidden="true"></i>
                </button>

                <div class="toji-auth-tabs">
                    <button class="toji-auth-tab active" data-tab="login" type="button">تسجيل دخول</button>
                    <button class="toji-auth-tab" data-tab="register" type="button">حساب جديد</button>
                </div>
                <p class="toji-auth-error" role="alert"></p>

                <form class="toji-auth-form" data-form="login">
                    <label class="toji-auth-field">
                        <span>الإيميل</span>
                        <span class="toji-auth-input-wrap">
                            <input type="email" name="email" required autocomplete="email" maxlength="120" placeholder="you@example.com">
                            <span class="toji-auth-check" aria-hidden="true"><i data-lucide="check" aria-hidden="true"></i></span>
                        </span>
                    </label>
                    <label class="toji-auth-field">
                        <span>كلمة المرور</span>
                        <span class="toji-auth-input-wrap">
                            <input type="password" name="password" required autocomplete="current-password" maxlength="100" placeholder="••••••••">
                            <span class="toji-auth-check" aria-hidden="true"><i data-lucide="check" aria-hidden="true"></i></span>
                        </span>
                    </label>
                    <button type="submit" class="toji-auth-submit">دخول</button>
                </form>

                <form class="toji-auth-form" data-form="register" hidden>
                    <label class="toji-auth-field">
                        <span>الاسم</span>
                        <span class="toji-auth-input-wrap">
                            <input type="text" name="name" required maxlength="60" placeholder="اسمك">
                            <span class="toji-auth-check" aria-hidden="true"><i data-lucide="check" aria-hidden="true"></i></span>
                        </span>
                    </label>
                    <label class="toji-auth-field">
                        <span>الإيميل</span>
                        <span class="toji-auth-input-wrap">
                            <input type="email" name="email" required autocomplete="email" maxlength="120" placeholder="you@example.com">
                            <span class="toji-auth-check" aria-hidden="true"><i data-lucide="check" aria-hidden="true"></i></span>
                        </span>
                    </label>
                    <label class="toji-auth-field">
                        <span>كلمة المرور</span>
                        <span class="toji-auth-input-wrap">
                            <input type="password" name="password" required autocomplete="new-password" minlength="8" maxlength="100" placeholder="8 حروف على الأقل">
                            <span class="toji-auth-check" aria-hidden="true"><i data-lucide="check" aria-hidden="true"></i></span>
                        </span>
                    </label>
                    <button type="submit" class="toji-auth-submit">إنشاء حساب</button>
                </form>

                <div class="toji-auth-divider toji-google-slot"><span>أو</span></div>
                <div class="toji-google-btn-slot toji-google-slot" id="tojiGoogleBtnSlot"></div>

                <p class="toji-auth-switch" id="tojiAuthSwitch">لسه معملتش حساب؟ <a data-switch-to="register">اعمل واحد دلوقتي</a></p>
            </div>
        </div>`;
        document.body.appendChild(modalEl);

        modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeAuthModal(); });
        modalEl.querySelector('.toji-auth-close').addEventListener('click', closeAuthModal);
        modalEl.querySelectorAll('.toji-auth-tab').forEach((btn) => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
        modalEl.querySelector('[data-switch-to]')?.addEventListener('click', (e) => {
            e.preventDefault();
            setTab(e.target.dataset.switchTo);
        });

        // ── علامة الصح جنب كل حقل اتملى ──
        modalEl.querySelectorAll('.toji-auth-field input').forEach((input) => {
            input.addEventListener('input', () => {
                input.closest('.toji-auth-input-wrap').classList.toggle('has-value', input.value.trim().length > 0);
            });
        });

        modalEl.querySelector('[data-form="login"]').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const errEl = modalEl.querySelector('.toji-auth-error');
            errEl.textContent = '';
            try {
                const res = await AccountAPI.login(form.email.value.trim(), form.password.value);
                setSession(res.token, res.user);
                closeAuthModal();
                toast('أهلاً بيك تاني! 👋');
            } catch (err) {
                errEl.textContent = err.message;
            }
        });

        modalEl.querySelector('[data-form="register"]').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const errEl = modalEl.querySelector('.toji-auth-error');
            errEl.textContent = '';
            try {
                const res = await AccountAPI.register(form.name.value.trim(), form.email.value.trim(), form.password.value);
                setSession(res.token, res.user);
                closeAuthModal();
                toast('اتعمل حسابك! 🎉');
            } catch (err) {
                errEl.textContent = err.message;
            }
        });

        if (window.lucide) window.lucide.createIcons();
    }

    // ── Google Identity Services — بيتحمّل بس لو مفعّل من الأدمن ──
    let gisLoaded = false;
    let gisLoading = null;
    function loadGis() {
        if (gisLoaded) return Promise.resolve();
        if (gisLoading) return gisLoading;
        gisLoading = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://accounts.google.com/gsi/client';
            s.async = true;
            s.defer = true;
            s.onload = () => { gisLoaded = true; resolve(); };
            s.onerror = reject;
            document.head.appendChild(s);
        });
        return gisLoading;
    }

    async function renderGoogleButtons(clientId) {
        const slot = document.getElementById('tojiGoogleBtnSlot');
        if (!slot) return;
        modalEl.querySelectorAll('.toji-google-slot').forEach((el) => { el.hidden = false; });
        try {
            await loadGis();
            if (!window.google?.accounts?.id) return;
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: async (response) => {
                    const errEl = modalEl.querySelector('.toji-auth-error');
                    try {
                        const res = await AccountAPI.google(response.credential);
                        setSession(res.token, res.user);
                        closeAuthModal();
                        toast('أهلاً بيك! 👋');
                    } catch (err) {
                        errEl.textContent = err.message;
                    }
                }
            });
            slot.innerHTML = '';
            window.google.accounts.id.renderButton(slot, { theme: 'filled_black', size: 'large', shape: 'pill', width: 280 });
        } catch {
            modalEl.querySelectorAll('.toji-google-slot').forEach((el) => { el.hidden = true; });
        }
    }

    // ============================================================
    // Init
    // ============================================================
    async function init() {
        renderNavButton();
        // لو معاه توكن، نتأكد إنه لسه صالح ونحدّث بياناته (points ممكن تتغير)
        if (isLoggedIn()) {
            try {
                const res = await AccountAPI.me();
                setCachedUser(res.user);
                renderNavButton();
                claimDailyPointsQuietly();
            } catch (err) {
                // بس لو التوكن فعلاً غير صالح (401) — مش لو المشكلة شبكة/سيرفر بطيء
                if (err.status === 401) logout();
            }
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    window.TojiAccount = {
        AccountAPI,
        isLoggedIn,
        getUser,
        getToken,
        logout,
        openAuthModal,
        getSettings,
        toast
    };
})();
