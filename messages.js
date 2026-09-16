// ============================================================
// TOJI — مركز الرسايل (messages.html)
//    قائمة محادثات + بحث عن ناس جديدة + نافذة دردشة كاملة
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const guestCard = document.getElementById('msgGuestCard');
    const appEl     = document.getElementById('msgApp');
    if (!guestCard || !appEl) return;

    const AccountAPI = window.TojiAccount?.AccountAPI;
    if (!AccountAPI || !window.TojiAccount.isLoggedIn()) {
        guestCard.hidden = false;
        appEl.hidden = true;
        if (window.lucide) window.lucide.createIcons();
        return;
    }
    guestCard.hidden = true;
    appEl.hidden = false;

    const myId = window.TojiAccount.getUser()?.id;
    let activeUsername = new URLSearchParams(window.location.search).get('u') || '';
    let threadsCache = [];

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str ?? '';
        return div.innerHTML;
    }
    function timeAgo(d) {
        if (!d) return '';
        const diff = (Date.now() - new Date(d).getTime()) / 1000;
        if (diff < 60) return 'دلوقتي';
        if (diff < 3600) return Math.floor(diff / 60) + 'د';
        if (diff < 86400) return Math.floor(diff / 3600) + 'س';
        return Math.floor(diff / 86400) + 'ي';
    }
    function initialOf(name) { return (name || '؟').trim().slice(0, 1).toUpperCase(); }

    // ── قائمة المحادثات ──
    async function loadThreads() {
        try {
            const res = await AccountAPI.getThreads();
            threadsCache = res.data || [];
            renderThreads();
        } catch {
            document.getElementById('msgThreadsList').innerHTML = '<p class="acc-empty">تعذر تحميل المحادثات.</p>';
        }
    }

    function renderThreads() {
        const listEl = document.getElementById('msgThreadsList');
        if (!threadsCache.length) {
            listEl.innerHTML = '<p class="acc-empty">لسه مفيش دردشات. دور على حد فوق وابدأ 👋</p>';
            return;
        }
        listEl.innerHTML = threadsCache.map((t) => `
            <button type="button" class="msg-thread-item ${t.key === activeUsername ? 'active' : ''} ${t.unread ? 'has-unread' : ''}" data-username="${t.isAdmin ? 'admin' : escapeHtml(t.other?.username || '')}">
                ${t.other?.avatarUrl
                    ? `<img class="msg-thread-item-avatar" src="${escapeHtml(t.other.avatarUrl)}" alt="">`
                    : `<span class="msg-thread-item-avatar msg-thread-item-fallback">${t.isAdmin ? '👑' : initialOf(t.other?.name)}</span>`}
                <div class="msg-thread-item-body">
                    <strong>${escapeHtml(t.other?.name || 'مستخدم')}</strong>
                    <span>${escapeHtml((t.lastText || '').slice(0, 36))}</span>
                </div>
                <span class="msg-thread-item-time">${timeAgo(t.lastAt)}</span>
            </button>`).join('');
    }

    document.getElementById('msgThreadsList').addEventListener('click', (e) => {
        const btn = e.target.closest('.msg-thread-item');
        if (btn) openThread(btn.dataset.username, btn.querySelector('strong')?.textContent);
    });

    // ── بحث عن ناس جديدة ──
    const searchInput = document.getElementById('msgSearchInput');
    const searchResultsEl = document.getElementById('msgSearchResults');
    let searchTimer = null;

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        const q = searchInput.value.trim();
        if (q.length < 2) { searchResultsEl.hidden = true; return; }
        searchTimer = setTimeout(async () => {
            try {
                const res = await AccountAPI.searchUsers(q);
                const users = res.data || [];
                searchResultsEl.hidden = false;
                searchResultsEl.innerHTML = users.length
                    ? users.map((u) => `
                        <button type="button" class="msg-search-item" data-username="${escapeHtml(u.username)}">
                            ${u.avatarUrl
                                ? `<img src="${escapeHtml(u.avatarUrl)}" alt="">`
                                : `<span class="msg-search-item-fallback">${initialOf(u.name)}</span>`}
                            <div><strong>${escapeHtml(u.name)}</strong><span>@${escapeHtml(u.username)}</span></div>
                        </button>`).join('')
                    : '<p class="acc-empty">مفيش نتايج.</p>';
            } catch {
                searchResultsEl.hidden = true;
            }
        }, 300);
    });

    searchResultsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.msg-search-item');
        if (!btn) return;
        searchInput.value = '';
        searchResultsEl.hidden = true;
        openThread(btn.dataset.username, btn.querySelector('strong')?.textContent);
    });

    // ── نافذة الدردشة ──
    async function openThread(username, displayName) {
        if (!username) return;
        activeUsername = username;
        document.getElementById('msgThreadEmpty').hidden = true;
        document.getElementById('msgThreadActive').hidden = false;
        renderThreads();

        document.getElementById('msgThreadName').textContent = displayName || username;
        const usernameLink = document.getElementById('msgThreadUsernameLink');
        if (username === 'admin') {
            usernameLink.textContent = 'مساعدة Toji المباشرة';
            usernameLink.removeAttribute('href');
        } else {
            usernameLink.textContent = '@' + username;
            usernameLink.href = `profile.html?u=${encodeURIComponent(username)}`;
        }

        const avatarImg = document.getElementById('msgThreadAvatar');
        const avatarFallback = document.getElementById('msgThreadAvatarFallback');
        const thread = threadsCache.find((t) => (t.isAdmin ? 'admin' : t.other?.username) === username);
        if (thread?.other?.avatarUrl) {
            avatarImg.src = thread.other.avatarUrl;
            avatarImg.hidden = false;
            avatarFallback.hidden = true;
        } else {
            avatarImg.hidden = true;
            avatarFallback.hidden = false;
            avatarFallback.textContent = username === 'admin' ? '👑' : initialOf(displayName);
        }

        await loadMessages();
    }

    async function loadMessages() {
        const el = document.getElementById('msgThreadMessages');
        el.innerHTML = '<p class="acc-empty">⏳ جارٍ التحميل...</p>';
        try {
            const res = await AccountAPI.getThread(activeUsername);
            const msgs = res.data || [];
            lastMessagesCache = msgs;
            el.innerHTML = msgs.map((m) => renderBubble(m)).join('') || '<p class="acc-empty">لسه مفيش رسايل، ابدأ الكلام 👋</p>';
            el.scrollTop = el.scrollHeight;
        } catch (err) {
            el.innerHTML = `<p class="acc-empty">${escapeHtml(err.message)}</p>`;
        }
    }

    let lastMessagesCache = [];

    function renderBubble(m) {
        const isMine = activeUsername === 'admin'
            ? !m.isAdminReply
            : String(m.fromUser) === String(myId);
        const reactionsHtml = (m.reactions || []).length
            ? `<div class="msg-bubble-reactions">${m.reactions.map((r) => `<span>${r.emoji}</span>`).join('')}</div>`
            : '';
        // ✅ (Seen) بيظهر بس على آخر رسالة مني لو الطرف التاني قراها
        const seenTick = isMine ? `<span class="msg-seen-tick">${m.readByRecipient ? '✔✔' : '✔'}</span>` : '';
        return `<div class="msg-bubble ${isMine ? 'is-mine' : 'is-theirs'} msg-bubble-in" data-id="${m._id}">
            ${renderBubbleContent(m)}
            <div class="msg-bubble-footer">${seenTick}</div>
            ${reactionsHtml}
        </div>`;
    }

    // ── ريأكشنز — دبل كليك على الرسالة يفتح شريط إيموجي صغير ──
    const REACTION_EMOJIS = ['❤️', '🔥', '😂', '👍', '😮', '😢'];
    document.getElementById('msgThreadMessages').addEventListener('dblclick', (e) => {
        const bubble = e.target.closest('.msg-bubble');
        if (!bubble) return;
        showReactionPicker(bubble);
    });

    function showReactionPicker(bubble) {
        document.querySelector('.msg-reaction-picker')?.remove();
        const picker = document.createElement('div');
        picker.className = 'msg-reaction-picker';
        picker.innerHTML = REACTION_EMOJIS.map((e) => `<button type="button" data-emoji="${e}">${e}</button>`).join('');
        bubble.appendChild(picker);
        picker.addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-emoji]');
            if (!btn) return;
            try {
                await AccountAPI.reactToMessage(bubble.dataset.id, btn.dataset.emoji);
                await loadMessages();
            } catch (err) { window.TojiAccount.toast(err.message); }
            picker.remove();
        });
        setTimeout(() => document.addEventListener('click', function onOutside(ev) {
            if (!picker.contains(ev.target)) { picker.remove(); document.removeEventListener('click', onOutside); }
        }), 10);
    }

    function renderBubbleContent(m) {
        const parts = [];
        if (m.imageUrl) parts.push(`<img class="msg-bubble-image" src="${escapeHtml(m.imageUrl)}" alt="" loading="lazy">`);
        if (m.audioUrl) parts.push(`<audio class="msg-bubble-audio" src="${escapeHtml(m.audioUrl)}" controls preload="metadata"></audio>`);
        if (m.text) parts.push(`<span class="msg-bubble-text">${escapeHtml(m.text)}</span>`);
        return parts.join('');
    }

    // ── إرسال نص و/أو صورة مرفقة سوا ──
    let pendingImageUrl = '';
    document.getElementById('msgThreadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('msgThreadInput');
        const text = input.value.trim();
        const imageUrl = pendingImageUrl;
        if ((!text && !imageUrl) || !activeUsername) return;
        input.value = '';
        pendingImageUrl = '';
        document.getElementById('msgImagePreview').hidden = true;
        input.disabled = true;
        try {
            await AccountAPI.sendMessage(activeUsername, { text, imageUrl });
            await loadMessages();
            await loadThreads();
        } catch (err) {
            window.TojiAccount.toast(err.message);
        } finally {
            input.disabled = false;
            input.focus();
        }
    });

    // ── إرسال صورة ──
    document.getElementById('msgImageInput')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file || !activeUsername) return;
        try {
            const res = await AccountAPI.uploadDmMedia(file, 'image');
            pendingImageUrl = res.url;
            document.getElementById('msgImagePreviewImg').src = res.url;
            document.getElementById('msgImagePreview').hidden = false;
        } catch (err) {
            window.TojiAccount.toast(err.message);
        }
    });
    document.getElementById('msgImageRemoveBtn')?.addEventListener('click', () => {
        pendingImageUrl = '';
        document.getElementById('msgImagePreview').hidden = true;
    });

    // ── رسالة صوتية — تسجيل بحد أقصى دقيقة ──
    let mediaRecorder = null;
    let recordedChunks = [];
    let recordStartAt = 0;
    let recordTimer = null;
    let recordSeconds = 0;

    function updateRecordingTime() {
        recordSeconds = Math.floor((Date.now() - recordStartAt) / 1000);
        const m = Math.floor(recordSeconds / 60);
        const s = String(recordSeconds % 60).padStart(2, '0');
        document.getElementById('msgRecordingTime').textContent = `${m}:${s}`;
        if (recordSeconds >= 60) stopRecording(true); // حد أقصى دقيقة — يوقف تلقائي
    }

    async function startRecording() {
        if (!navigator.mediaDevices?.getUserMedia) {
            window.TojiAccount.toast('المتصفح ده مش بيدعم التسجيل الصوتي.');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recordedChunks = [];
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
            mediaRecorder.start();
            recordStartAt = Date.now();
            document.getElementById('msgRecordingBar').hidden = false;
            document.getElementById('msgThreadForm').hidden = true;
            recordTimer = setInterval(updateRecordingTime, 250);
        } catch {
            window.TojiAccount.toast('محتاج تسمح بالوصول للمايك.');
        }
    }

    function stopRecording(shouldSend) {
        clearInterval(recordTimer);
        document.getElementById('msgRecordingBar').hidden = true;
        document.getElementById('msgThreadForm').hidden = false;
        if (!mediaRecorder) return;
        const duration = recordSeconds;
        mediaRecorder.addEventListener('stop', async () => {
            mediaRecorder.stream.getTracks().forEach((t) => t.stop());
            if (!shouldSend || !recordedChunks.length) return;
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            try {
                const res = await AccountAPI.uploadDmMedia(blob, 'audio', duration);
                await AccountAPI.sendMessage(activeUsername, { audioUrl: res.url, audioDuration: duration });
                await loadMessages();
                await loadThreads();
            } catch (err) {
                window.TojiAccount.toast(err.message);
            }
        }, { once: true });
        mediaRecorder.stop();
        mediaRecorder = null;
    }

    document.getElementById('msgVoiceBtn')?.addEventListener('click', () => {
        if (!activeUsername) return;
        startRecording();
    });
    document.getElementById('msgRecordingCancel')?.addEventListener('click', () => stopRecording(false));
    document.getElementById('msgRecordingSend')?.addEventListener('click', () => stopRecording(true));

    // ── مؤشر "بيكتب..." ──
    let typingSendTimer = null;
    document.getElementById('msgThreadInput')?.addEventListener('input', () => {
        if (!activeUsername || activeUsername === 'admin') return;
        clearTimeout(typingSendTimer);
        typingSendTimer = setTimeout(() => AccountAPI.setTyping(activeUsername).catch(() => {}), 300);
    });

    async function checkTyping() {
        if (!activeUsername || activeUsername === 'admin') return;
        try {
            const res = await AccountAPI.getTyping(activeUsername);
            document.getElementById('msgTypingIndicator')?.remove();
            if (res.isTyping) {
                const el = document.getElementById('msgThreadMessages');
                const indicator = document.createElement('div');
                indicator.id = 'msgTypingIndicator';
                indicator.className = 'msg-bubble is-theirs msg-typing-bubble';
                indicator.innerHTML = '<span></span><span></span><span></span>';
                el.appendChild(indicator);
                el.scrollTop = el.scrollHeight;
            }
        } catch {}
    }

    await loadThreads();
    if (activeUsername) {
        const existing = threadsCache.find((t) => (t.isAdmin ? 'admin' : t.other?.username) === activeUsername);
        openThread(activeUsername, existing?.other?.name || activeUsername);
    }

    if (window.lucide) window.lucide.createIcons();

    // ── تحديث دوري خفيف لقائمة المحادثات (بديل بسيط لـ real-time) ──
    setInterval(() => { loadThreads(); if (activeUsername) loadMessages(); }, 15000);
    setInterval(checkTyping, 3000);
});
