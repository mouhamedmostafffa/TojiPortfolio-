(function () {
    'use strict';

    const { TokenManager, API_BASE_URL } = window.TojiAPI;

    async function adminFetch(endpoint, options = {}) {
        const token = TokenManager.get();
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...(options.headers || {})
            }
        });
        if (res.status === 401) {
            TokenManager.remove();
            window.location.href = 'admin.html';
            throw new Error('غير مصرح');
        }
        let data;
        try { data = await res.json(); } catch { data = {}; }
        if (!res.ok) throw new Error(data.message || 'حصل خطأ');
        return data;
    }

    let currentPage = 1;
    let searchTimer = null;
    let detailUser = null;

    function $(id) { return document.getElementById(id); }

    async function checkServerStatus() {
        try {
            const r = await fetch(`${API_BASE_URL}/health`).catch(() => fetch(`${API_BASE_URL.replace('/api', '')}`));
            $('statusDot').classList.add('online');
            $('statusText').textContent = 'متصل';
        } catch {
            $('statusText').textContent = 'غير متصل';
        }
    }

    // ============================================================
    // Settings panel
    // ============================================================
    async function loadSettings() {
        const res = await adminFetch('/admin/users/settings');
        const s = res.data;
        const form = $('settingsForm');
        ['enableAccounts', 'enableRegistration', 'enableGoogleLogin', 'enableChatMemory', 'enableSavedProjects', 'enablePoints']
            .forEach((k) => { form.elements[k].checked = Boolean(s[k]); });
        form.elements.googleClientId.value = s.googleClientId || '';
        form.elements.pointsPerDay.value = s.pointsPerDay;
        form.elements.redeemThreshold.value = s.redeemThreshold;
        form.elements.discountPercent.value = s.discountPercent;
    }

    $('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = $('settingsMsg');
        msg.textContent = 'جارٍ الحفظ...';
        msg.className = 'acc-form-msg';
        const form = e.target;
        const payload = {
            enableAccounts: form.elements.enableAccounts.checked,
            enableRegistration: form.elements.enableRegistration.checked,
            enableGoogleLogin: form.elements.enableGoogleLogin.checked,
            enableChatMemory: form.elements.enableChatMemory.checked,
            enableSavedProjects: form.elements.enableSavedProjects.checked,
            enablePoints: form.elements.enablePoints.checked,
            googleClientId: form.elements.googleClientId.value.trim(),
            pointsPerDay: Number(form.elements.pointsPerDay.value),
            redeemThreshold: Number(form.elements.redeemThreshold.value),
            discountPercent: Number(form.elements.discountPercent.value)
        };
        try {
            await adminFetch('/admin/users/settings', { method: 'PUT', body: JSON.stringify(payload) });
            msg.textContent = 'اتحفظت الإعدادات ✅';
            msg.className = 'acc-form-msg is-success';
        } catch (err) {
            msg.textContent = err.message;
            msg.className = 'acc-form-msg is-error';
        }
    });

    // ============================================================
    // Users list
    // ============================================================
    async function loadUsers(page = 1) {
        currentPage = page;
        const search = $('searchInput').value.trim();
        const status = $('statusFilter')?.value || 'all';
        const sort   = $('sortSelect')?.value || 'newest';
        const qs = new URLSearchParams({ page, limit: 20, status, sort, ...(search && { search }) });
        const res = await adminFetch(`/admin/users?${qs.toString()}`);
        renderTable(res.data);
        renderPagination(res.pagination);
        $('resultCount').textContent = `${res.pagination.total} حساب`;
    }

    function renderTable(users) {
        const tbody = $('usersTableBody');
        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="acc-empty-row">مفيش حسابات.</td></tr>`;
            return;
        }
        tbody.innerHTML = users.map((u) => `
            <tr data-id="${u._id}">
                <td>${u.avatarUrl ? `<img class="acc-mini-avatar" src="${escapeAttr(u.avatarUrl)}" alt="">` : `<span class="acc-mini-avatar acc-mini-fallback">${escapeHtml((u.name || '؟')[0])}</span>`}</td>
                <td>${escapeHtml(u.name)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td>${u.points?.total ?? 0}</td>
                <td>${new Date(u.createdAt).toLocaleDateString('ar-EG')}</td>
                <td><span class="acc-badge ${u.isActive ? 'is-active' : 'is-inactive'}">${u.isActive ? 'مفعّل' : 'موقوف'}</span></td>
                <td><button class="btn-secondary acc-view-btn" data-id="${u._id}" type="button">عرض</button></td>
            </tr>`).join('');

        tbody.querySelectorAll('.acc-view-btn').forEach((btn) => {
            btn.addEventListener('click', () => openDetail(btn.dataset.id));
        });
    }

    function renderPagination(p) {
        const el = $('pagination');
        if (p.pages <= 1) { el.innerHTML = ''; return; }
        let html = '';
        for (let i = 1; i <= p.pages; i++) {
            html += `<button class="acc-page-btn ${i === p.page ? 'active' : ''}" data-page="${i}" type="button">${i}</button>`;
        }
        el.innerHTML = html;
        el.querySelectorAll('.acc-page-btn').forEach((btn) => {
            btn.addEventListener('click', () => loadUsers(Number(btn.dataset.page)));
        });
    }

    $('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => loadUsers(1), 350);
    });
    $('statusFilter')?.addEventListener('change', () => loadUsers(1));
    $('sortSelect')?.addEventListener('change', () => loadUsers(1));

    // ============================================================
    // Detail modal
    // ============================================================
    async function openDetail(id) {
        const res = await adminFetch(`/admin/users/${id}`);
        detailUser = res.data;
        $('detailName').textContent = detailUser.name;
        $('detailEmail').textContent = detailUser.email;
        $('detailActive').checked = detailUser.isActive;
        $('detailPoints').value = detailUser.points?.total ?? 0;
        $('detailUsername').value = detailUser.username || '';
        $('detailBio').value = detailUser.bio || '';
        $('detailPhone').value = detailUser.phone || '';
        $('detailNotes').value = detailUser.adminNotes || '';
        $('detailWelcomeMsg').value = detailUser.adminWelcomeMessage?.text || '';
        $('detailWelcomeMsgStatus').textContent = '';
        $('detailStats').innerHTML = `
            <span>💬 ${res.stats.chatCount} رسالة شات</span>
            <span>📋 ${res.stats.quoteCount} طلب عرض سعر</span>
            <span>📅 ${res.stats.bookingCount} طلب حجز</span>`;
        await renderDetailBadges();
        $('detailSaveMsg').textContent = '';
        $('detailPasswordMsg').textContent = '';
        $('detailNewPassword').value = '';
        $('detailGiftMsg').textContent = '';
        $('detailGiftPercent').value = '';
        $('detailOverlay').hidden = false;
    }

    $('detailClose').addEventListener('click', () => { $('detailOverlay').hidden = true; });
    $('detailOverlay').addEventListener('click', (e) => { if (e.target === $('detailOverlay')) $('detailOverlay').hidden = true; });

    $('detailSaveBtn').addEventListener('click', async () => {
        const msg = $('detailSaveMsg');
        msg.textContent = 'جارٍ الحفظ...';
        msg.className = 'acc-form-msg';
        try {
            await adminFetch(`/admin/users/${detailUser._id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    isActive: $('detailActive').checked,
                    pointsTotal: Number($('detailPoints').value),
                    username: $('detailUsername').value.trim(),
                    bio: $('detailBio').value,
                    phone: $('detailPhone').value,
                    adminNotes: $('detailNotes').value
                })
            });
            msg.textContent = 'اتحفظ ✅';
            msg.className = 'acc-form-msg is-success';
            loadUsers(currentPage);
        } catch (err) {
            msg.textContent = err.message;
            msg.className = 'acc-form-msg is-error';
        }
    });

    $('detailPasswordBtn').addEventListener('click', async () => {
        const msg = $('detailPasswordMsg');
        const newPassword = $('detailNewPassword').value;
        if (!newPassword || newPassword.length < 8) {
            msg.textContent = 'كلمة المرور لازم تكون 8 حروف على الأقل.';
            msg.className = 'acc-form-msg is-error';
            return;
        }
        msg.textContent = 'جارٍ التغيير...';
        msg.className = 'acc-form-msg';
        try {
            await adminFetch(`/admin/users/${detailUser._id}/password`, {
                method: 'PUT',
                body: JSON.stringify({ newPassword })
            });
            msg.textContent = 'اتغيّرت كلمة المرور ✅';
            msg.className = 'acc-form-msg is-success';
            $('detailNewPassword').value = '';
        } catch (err) {
            msg.textContent = err.message;
            msg.className = 'acc-form-msg is-error';
        }
    });

    $('detailGiftBtn').addEventListener('click', async () => {
        const msg = $('detailGiftMsg');
        const percent = Number($('detailGiftPercent').value);
        if (!percent || percent < 1 || percent > 100) {
            msg.textContent = 'اكتب نسبة خصم صحيحة (1-100).';
            msg.className = 'acc-form-msg is-error';
            return;
        }
        msg.textContent = 'جارٍ الإرسال...';
        msg.className = 'acc-form-msg';
        try {
            const res = await adminFetch(`/admin/users/${detailUser._id}/grant-discount`, {
                method: 'POST',
                body: JSON.stringify({ percent })
            });
            msg.textContent = `اتبعت الكود: ${res.code} ✅`;
            msg.className = 'acc-form-msg is-success';
            $('detailGiftPercent').value = '';
        } catch (err) {
            msg.textContent = err.message;
            msg.className = 'acc-form-msg is-error';
        }
    });

    // ── الإنجازات (Badges) — منح/سحب لكل حساب ──
    let allBadgesCache = null;
    async function renderDetailBadges() {
        const wrap = $('detailBadges');
        wrap.innerHTML = '⏳ جارٍ التحميل...';
        try {
            if (!allBadgesCache) {
                const res = await window.TojiAPI.BadgeAPI.getAll();
                allBadgesCache = res.data || [];
            }
            const myKeys = detailUser.badgeKeys || [];
            wrap.innerHTML = allBadgesCache.map((b) => `
                <label class="acc-badge-toggle">
                    <input type="checkbox" data-key="${b.key}" ${myKeys.includes(b.key) ? 'checked' : ''}>
                    ${b.emoji || '🏆'} ${b.label}
                </label>`).join('') || '<p class="projects-hint">لسه مفيش إنجازات متعرّفة. ضيفها من بانل الإنجازات فوق.</p>';
        } catch {
            wrap.innerHTML = '<p class="projects-hint is-error">تعذر تحميل الإنجازات.</p>';
        }
    }

    $('detailBadges').addEventListener('change', async (e) => {
        const input = e.target.closest('input[data-key]');
        if (!input) return;
        try {
            if (input.checked) {
                await window.TojiAPI.BadgeAPI.award(detailUser._id, input.dataset.key);
            } else {
                await window.TojiAPI.BadgeAPI.revoke(detailUser._id, input.dataset.key);
            }
        } catch (err) {
            alert(err.message);
            input.checked = !input.checked;
        }
    });

    $('detailWelcomeSendBtn').addEventListener('click', async () => {
        const msg = $('detailWelcomeMsgStatus');
        msg.textContent = 'جارٍ الإرسال...';
        msg.className = 'acc-form-msg';
        try {
            const res = await adminFetch(`/admin/users/${detailUser._id}/welcome-message`, {
                method: 'PUT',
                body: JSON.stringify({ text: $('detailWelcomeMsg').value.trim() })
            });
            msg.textContent = res.message;
            msg.className = 'acc-form-msg is-success';
        } catch (err) {
            msg.textContent = err.message;
            msg.className = 'acc-form-msg is-error';
        }
    });

    // ============================================================
    // إعلانات لكل الحسابات
    // ============================================================
    async function loadBroadcasts() {
        const listEl = $('broadcastList');
        listEl.innerHTML = '<p class="projects-hint">⏳ جارٍ التحميل...</p>';
        try {
            const res = await adminFetch('/admin/users/broadcast');
            const items = res.data || [];
            if (!items.length) { listEl.innerHTML = '<p class="projects-hint">لسه مفيش إعلانات.</p>'; return; }
            listEl.innerHTML = items.map((b) => {
                const isFuture = b.scheduledFor && new Date(b.scheduledFor) > new Date();
                const scheduleLabel = isFuture ? `<span class="acc-broadcast-scheduled">⏰ مجدول لـ ${new Date(b.scheduledFor).toLocaleString('ar-EG')}</span>` : '';
                return `
                <div class="acc-broadcast-item ${b.active ? '' : 'is-inactive'}" data-id="${b._id}">
                    <p>${escapeAttr(b.text)}${scheduleLabel}</p>
                    <div class="acc-broadcast-item-actions">
                        <button type="button" data-act="toggle">${b.active ? '⏸ إيقاف' : '▶️ تفعيل'}</button>
                        <button type="button" data-act="delete">🗑 حذف</button>
                    </div>
                </div>`;
            }).join('');
        } catch (err) {
            listEl.innerHTML = `<p class="projects-hint is-error">${err.message}</p>`;
        }
    }

    function escapeAttr(str) {
        const div = document.createElement('div');
        div.textContent = str ?? '';
        return div.innerHTML;
    }

    $('broadcastSendBtn')?.addEventListener('click', async () => {
        const text = $('broadcastText').value.trim();
        const msg = $('broadcastMsg');
        if (!text) { msg.textContent = 'اكتب نص الإعلان.'; msg.className = 'acc-form-msg is-error'; return; }
        msg.textContent = 'جارٍ النشر...';
        msg.className = 'acc-form-msg';
        try {
            const scheduledFor = $('broadcastSchedule').value ? new Date($('broadcastSchedule').value).toISOString() : null;
            await adminFetch('/admin/users/broadcast', { method: 'POST', body: JSON.stringify({ text, scheduledFor }) });
            $('broadcastText').value = '';
            $('broadcastSchedule').value = '';
            msg.textContent = scheduledFor ? 'اتجدول ✅' : 'اتنشر ✅';
            msg.className = 'acc-form-msg is-success';
            loadBroadcasts();
        } catch (err) {
            msg.textContent = err.message;
            msg.className = 'acc-form-msg is-error';
        }
    });

    $('broadcastList')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const item = btn.closest('.acc-broadcast-item');
        const id = item.dataset.id;
        try {
            if (btn.dataset.act === 'toggle') {
                const isActive = !item.classList.contains('is-inactive');
                await adminFetch(`/admin/users/broadcast/${id}`, { method: 'PATCH', body: JSON.stringify({ active: !isActive }) });
            } else if (btn.dataset.act === 'delete') {
                if (!confirm('متأكد؟')) return;
                await adminFetch(`/admin/users/broadcast/${id}`, { method: 'DELETE' });
            }
            loadBroadcasts();
        } catch (err) { alert(err.message); }
    });

    $('broadcastPanel')?.addEventListener('toggle', function () {
        if (this.open && !this.dataset.loaded) { this.dataset.loaded = '1'; loadBroadcasts(); }
    });

    // ============================================================
    // صندوق رسائل الزوار
    // ============================================================
    let inboxActiveUserId = null;

    async function loadInboxList() {
        const listEl = $('inboxList');
        listEl.innerHTML = '<p class="projects-hint">⏳ جارٍ التحميل...</p>';
        try {
            const res = await adminFetch('/admin/users/inbox');
            const msgs = res.data || [];
            if (!msgs.length) { listEl.innerHTML = '<p class="projects-hint">لسه مفيش رسايل من الزوار.</p>'; return; }

            // ── تجميع الرسايل المسطحة لثريدات لكل زائر (آخر رسالة + حالة قراءة) ──
            const threads = new Map();
            for (const m of msgs) {
                const uid = m.fromUser?._id;
                if (!uid || threads.has(uid)) continue;
                threads.set(uid, {
                    user: m.fromUser,
                    lastText: m.text,
                    unread: !m.isAdminReply && !m.readByRecipient
                });
            }
            listEl.innerHTML = Array.from(threads.values()).map((t) => `
                <button type="button" class="acc-inbox-thread-btn ${t.unread ? 'has-unread' : ''}" data-id="${t.user?._id}">
                    <strong>${escapeAttr(t.user?.name || 'زائر')}</strong>
                    <span>${escapeAttr((t.lastText || '').slice(0, 40))}</span>
                </button>`).join('');
        } catch (err) {
            listEl.innerHTML = `<p class="projects-hint is-error">${err.message}</p>`;
        }
    }

    async function openInboxThread(userId) {
        inboxActiveUserId = userId;
        document.querySelectorAll('.acc-inbox-thread-btn').forEach((b) => b.classList.toggle('active', b.dataset.id === userId));
        const el = $('inboxThread');
        el.innerHTML = '<p class="projects-hint">⏳ جارٍ التحميل...</p>';
        try {
            const res = await adminFetch(`/admin/users/inbox/${userId}`);
            const msgs = res.data || [];
            el.innerHTML = `
                <div class="acc-inbox-msgs">${msgs.map((m) => `
                    <div class="acc-inbox-msg ${m.isAdminReply ? 'from-admin' : 'from-user'}">${escapeAttr(m.text)}</div>
                `).join('')}</div>
                <div class="acc-inbox-templates" id="inboxTemplatesRow"></div>
                <div class="acc-inbox-reply-row">
                    <select id="inboxTemplateSelect" class="acc-inbox-template-select">
                        <option value="">📋 رد جاهز...</option>
                    </select>
                    <input type="text" id="inboxReplyInput" placeholder="اكتب رد...">
                    <button type="button" id="inboxReplyBtn" class="btn-primary">إرسال</button>
                </div>`;
            $('inboxReplyBtn').addEventListener('click', () => sendInboxReply(userId));
            $('inboxReplyInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendInboxReply(userId); });
            el.querySelector('.acc-inbox-msgs')?.scrollTo(0, 99999);
            loadTemplatesIntoSelect();
        } catch (err) {
            el.innerHTML = `<p class="projects-hint is-error">${err.message}</p>`;
        }
    }

    let templatesCache = null;
    async function loadTemplatesIntoSelect() {
        const select = $('inboxTemplateSelect');
        if (!select) return;
        try {
            if (!templatesCache) {
                const res = await window.TojiAPI.ReplyTemplateAPI.getAll();
                templatesCache = res.data || [];
            }
            templatesCache.forEach((t) => {
                const opt = document.createElement('option');
                opt.value = t.text;
                opt.textContent = t.title;
                select.appendChild(opt);
            });
        } catch {}
    }
    document.addEventListener('change', (e) => {
        if (e.target.id === 'inboxTemplateSelect' && e.target.value) {
            $('inboxReplyInput').value = e.target.value;
            e.target.value = '';
            $('inboxReplyInput').focus();
        }
    });

    async function sendInboxReply(userId) {
        const input = $('inboxReplyInput');
        const text = input.value.trim();
        if (!text) return;
        input.disabled = true;
        try {
            await adminFetch(`/admin/users/inbox/${userId}/reply`, { method: 'POST', body: JSON.stringify({ text }) });
            openInboxThread(userId);
            loadInboxList();
        } catch (err) { alert(err.message); }
        finally { input.disabled = false; }
    }

    $('inboxList')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.acc-inbox-thread-btn');
        if (btn) openInboxThread(btn.dataset.id);
    });

    $('inboxPanel')?.addEventListener('toggle', function () {
        if (this.open && !this.dataset.loaded) { this.dataset.loaded = '1'; loadInboxList(); }
    });

    $('detailDeleteBtn').addEventListener('click', async () => {
        if (!confirm(`متأكد إنك عايز تمسح حساب "${detailUser.name}" نهائيًا؟`)) return;
        try {
            await adminFetch(`/admin/users/${detailUser._id}`, { method: 'DELETE' });
            $('detailOverlay').hidden = true;
            loadUsers(currentPage);
        } catch (err) {
            alert(err.message);
        }
    });

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function escapeAttr(str) { return escapeHtml(str); }

    $('logoutBtn').addEventListener('click', () => {
        TokenManager.remove();
        window.location.href = 'admin.html';
    });

    // ============================================================
    // Init — لازم أدمن مسجل دخول
    // ============================================================
    (async function init() {
        if (!TokenManager.isLoggedIn()) {
            $('lockScreen').hidden = false;
            return;
        }
        try {
            await loadSettings();
            await loadUsers(1);
            $('accWorkspace').hidden = false;
            checkServerStatus();
        } catch (err) {
            $('lockScreen').hidden = false;
        }
    })();
})();
