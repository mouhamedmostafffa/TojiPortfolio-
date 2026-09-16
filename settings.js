// ============================================================
// TOJI — مركز الحساب (settings.html)
//    بيانات الحساب، كلمة المرور، لينك البروفايل، ومنطقة الخطر
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const guestCard = document.getElementById('settingsGuestCard');
    const content   = document.getElementById('settingsContent');
    if (!guestCard || !content) return;

    const AccountAPI = window.TojiAccount?.AccountAPI;
    if (!AccountAPI || !window.TojiAccount.isLoggedIn()) {
        guestCard.hidden = false;
        content.hidden = true;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    guestCard.hidden = true;
    content.hidden = false;

    async function load() {
        try {
            const res = await AccountAPI.me();
            const user = res.user;
            document.getElementById('accNameInput').value = user.name || '';
            document.getElementById('accUsernameInput').value = user.username || '';
            document.getElementById('accBioInput').value = user.bio || '';
            document.getElementById('accPhoneInput').value = user.phone || '';
            document.getElementById('accVisibilitySelect').value = user.profileVisibility || 'public';
            document.getElementById('accHidePoints').checked = !!user.hidePoints;
            document.getElementById('accHideBadges').checked = !!user.hideBadges;
            document.getElementById('accRedirectSelect').value = user.postLoginRedirect || 'none';

            const link = user.username ? `${window.location.origin}/account/${user.username}` : '';
            document.getElementById('settingsProfileLink').textContent = link || 'اختار يوزرنيم الأول';

            // إيميل: عرض القيمة الحالية كـ placeholder
            const emailInput = document.getElementById('accNewEmail');
            emailInput.placeholder = user.email || 'إيميلك الجديد';

            // حساب جوجل
            const googleCard = document.getElementById('googleLinkCard');
            if (user.hasGoogle) {
                googleCard.hidden = false;
                document.getElementById('googleLinkStatus').textContent = user.hasPassword
                    ? 'مربوط بحساب جوجل. تقدر تفك الربط لأن عندك كلمة مرور كمان.'
                    : 'مربوط بحساب جوجل. لازم تحط كلمة مرور الأول قبل ما تفك الربط.';
                document.getElementById('googleUnlinkBtn').disabled = !user.hasPassword;
            } else {
                googleCard.hidden = true;
            }

            // تفضيلات التنبيهات
            const prefs = user.notifyPrefs || { broadcasts: true, welcomeMessages: true, follows: true };
            document.querySelectorAll('#notifyPrefsRow input[data-pref]').forEach((input) => {
                input.checked = prefs[input.dataset.pref] !== false;
            });

            renderSongs(user.songs || []);
            renderLoginHistory(user.loginHistory || []);
            loadBlockedList();

            // تخصيص البروفايل
            document.getElementById('accentColorInput').value = user.accentColor || '#632626';
            document.getElementById('accountTagSelect').value = user.accountTag || '';
            document.getElementById('pinnedNoteInput').value = user.pinnedItem?.note || '';
            if (user.coverImageUrl) {
                document.getElementById('coverPreviewImg').src = user.coverImageUrl;
                document.getElementById('coverPreviewImg').hidden = false;
            }

            updatePushButton(user.hasPushSubscription);
        } catch {}
        if (window.lucide) window.lucide.createIcons();
    }
    load();

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str ?? '';
        return div.innerHTML;
    }

    document.getElementById('settingsCopyLinkBtn')?.addEventListener('click', () => {
        const text = document.getElementById('settingsProfileLink').textContent;
        if (!text || text.includes('اختار')) return;
        navigator.clipboard?.writeText(text).then(() => {
            window.TojiAccount.toast('اتنسخ اللينك! 🎉');
        }).catch(() => window.TojiAccount.toast(text));
    });

    document.getElementById('accProfileForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('accNameStatus');
        status.textContent = '...';
        status.className = 'form-status';
        try {
            const res = await AccountAPI.updateProfile({
                name: document.getElementById('accNameInput').value.trim(),
                username: document.getElementById('accUsernameInput').value.trim(),
                bio: document.getElementById('accBioInput').value,
                phone: document.getElementById('accPhoneInput').value,
                profileVisibility: document.getElementById('accVisibilitySelect').value,
                hidePoints: document.getElementById('accHidePoints').checked,
                hideBadges: document.getElementById('accHideBadges').checked,
                postLoginRedirect: document.getElementById('accRedirectSelect').value
            });
            status.textContent = 'اتحفظ! ✅';
            status.className = 'form-status is-success';
            const link = res.user.username ? `${window.location.origin}/account/${res.user.username}` : '';
            document.getElementById('settingsProfileLink').textContent = link || 'اختار يوزرنيم الأول';
        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status is-error';
        }
    });

    document.getElementById('accPassForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('accPassStatus');
        const current = document.getElementById('accCurrentPass').value;
        const next = document.getElementById('accNewPass').value;
        status.textContent = '...';
        status.className = 'form-status';
        try {
            await AccountAPI.changePassword(current, next);
            status.textContent = 'اتغيّرت كلمة المرور!';
            status.className = 'form-status is-success';
            e.target.reset();
        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status is-error';
        }
    });

    document.getElementById('accEmailForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('accEmailStatus');
        status.textContent = '...';
        status.className = 'form-status';
        try {
            await AccountAPI.changeEmail(
                document.getElementById('accNewEmail').value.trim(),
                document.getElementById('accEmailPassword').value
            );
            status.textContent = 'اتغيّر الإيميل! ✅';
            status.className = 'form-status is-success';
            e.target.reset();
        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status is-error';
        }
    });

    document.getElementById('googleUnlinkBtn')?.addEventListener('click', async () => {
        const status = document.getElementById('googleUnlinkStatus');
        status.textContent = '...';
        status.className = 'form-status';
        try {
            await AccountAPI.unlinkGoogle();
            status.textContent = 'اتفك الربط ✅';
            status.className = 'form-status is-success';
            document.getElementById('googleLinkCard').hidden = true;
        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status is-error';
        }
    });

    document.querySelectorAll('#notifyPrefsRow input[data-pref]').forEach((input) => {
        input.addEventListener('change', async () => {
            const status = document.getElementById('notifyPrefsStatus');
            try {
                await AccountAPI.updateNotifyPrefs({ [input.dataset.pref]: input.checked });
                status.textContent = 'اتحفظ ✅';
                status.className = 'form-status is-success';
            } catch (err) {
                input.checked = !input.checked;
                status.textContent = err.message;
                status.className = 'form-status is-error';
            }
        });
    });

    // ── أغانيّ المفضلة ──
    function renderSongs(songs) {
        const el = document.getElementById('songsList');
        if (!songs.length) { el.innerHTML = '<p class="acc-empty">لسه مضفتش أي أغنية.</p>'; return; }
        el.innerHTML = songs.map((s) => `
            <div class="acc-list-item">
                <div><strong>${escapeHtml(s.title)}</strong><span>${escapeHtml(s.artist || '')}</span></div>
                <div class="acc-list-meta">
                    <a class="btn-secondary" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">▶️</a>
                    <button type="button" class="acc-song-remove" data-id="${s._id}">حذف</button>
                </div>
            </div>`).join('');
    }
    document.getElementById('accSongForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('songFormStatus');
        status.textContent = '...';
        status.className = 'form-status';
        try {
            const res = await AccountAPI.addSong(
                document.getElementById('songTitleInput').value.trim(),
                document.getElementById('songArtistInput').value.trim(),
                document.getElementById('songUrlInput').value.trim()
            );
            renderSongs(res.songs);
            e.target.reset();
            status.textContent = 'اتضافت! 🎵';
            status.className = 'form-status is-success';
        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status is-error';
        }
    });
    document.getElementById('songsList')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('.acc-song-remove');
        if (!btn) return;
        try {
            const res = await AccountAPI.removeSong(btn.dataset.id);
            renderSongs(res.songs);
        } catch (err) { window.TojiAccount.toast(err.message); }
    });

    // ── الأمان ──
    function renderLoginHistory(history) {
        const el = document.getElementById('loginHistoryList');
        if (!history.length) { el.innerHTML = '<p class="acc-empty">لسه مفيش سجل دخول.</p>'; return; }
        el.innerHTML = history.slice().reverse().map((h) => `
            <div class="acc-list-item">
                <div><strong>${new Date(h.at).toLocaleString('ar-EG')}</strong><span>${escapeHtml(h.ip || '')}</span></div>
            </div>`).join('');
    }
    document.getElementById('logoutAllBtn')?.addEventListener('click', async () => {
        const status = document.getElementById('logoutAllStatus');
        status.textContent = '...';
        status.className = 'form-status';
        try {
            await AccountAPI.logoutAllDevices();
            status.textContent = 'اتقفلت كل الجلسات التانية ✅ (الجلسة دي فضلت شغالة)';
            status.className = 'form-status is-success';
        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status is-error';
        }
    });

    // ── الحسابات المحظورة ──
    async function loadBlockedList() {
        const el = document.getElementById('blockedList');
        try {
            const res = await AccountAPI.getBlocked();
            const users = res.data || [];
            if (!users.length) { el.innerHTML = '<p class="acc-empty">مفيش حسابات محظورة.</p>'; return; }
            el.innerHTML = users.map((u) => `
                <div class="acc-list-item">
                    <div><strong>${escapeHtml(u.name)}</strong><span>@${escapeHtml(u.username)}</span></div>
                    <button type="button" class="btn-secondary acc-unblock-btn" data-username="${escapeHtml(u.username)}">فك الحظر</button>
                </div>`).join('');
        } catch {
            el.innerHTML = '<p class="acc-empty">تعذر التحميل.</p>';
        }
    }
    document.getElementById('blockedList')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('.acc-unblock-btn');
        if (!btn) return;
        try {
            await AccountAPI.unblockUser(btn.dataset.username);
            loadBlockedList();
        } catch (err) { window.TojiAccount.toast(err.message); }
    });

    document.getElementById('accExportBtn')?.addEventListener('click', async () => {
        try {
            const data = await AccountAPI.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'toji-my-data.json';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            window.TojiAccount.toast(err.message || 'تعذر تصدير بياناتك');
        }
    });

    document.getElementById('accDeleteBtn')?.addEventListener('click', () => {
        document.getElementById('accDeleteConfirm').hidden = false;
    });
    document.getElementById('accDeleteCancelBtn')?.addEventListener('click', () => {
        document.getElementById('accDeleteConfirm').hidden = true;
    });
    document.getElementById('accDeleteConfirmBtn')?.addEventListener('click', async () => {
        const status = document.getElementById('accDeleteStatus');
        status.textContent = 'جارٍ الحذف...';
        status.className = 'form-status';
        try {
            await AccountAPI.deleteAccount();
            window.TojiAccount.logout();
            window.location.href = 'index.html';
        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status is-error';
        }
    });

    // ── تخصيص البروفايل: غلاف، لون، تصنيف، تثبيت ──
    document.getElementById('coverInput')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        try {
            const res = await AccountAPI.uploadCover(file);
            document.getElementById('coverPreviewImg').src = res.user.coverImageUrl;
            document.getElementById('coverPreviewImg').hidden = false;
            window.TojiAccount.toast('اتغيّر الغلاف! 🖼️');
        } catch (err) {
            window.TojiAccount.toast(err.message);
        }
    });

    document.getElementById('customizeSaveBtn')?.addEventListener('click', async () => {
        const status = document.getElementById('customizeStatus');
        status.textContent = '...';
        status.className = 'form-status';
        try {
            await AccountAPI.customizeProfile({
                accentColor: document.getElementById('accentColorInput').value,
                accountTag: document.getElementById('accountTagSelect').value,
                pinnedItem: { type: 'note', note: document.getElementById('pinnedNoteInput').value.trim() }
            });
            status.textContent = 'اتحفظ! ✅';
            status.className = 'form-status is-success';
        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status is-error';
        }
    });

    // ── تنبيهات المتصفح (Web Push) ──
    function updatePushButton(isSubscribed) {
        const btn = document.getElementById('pushEnableBtn');
        if (!btn) return;
        btn.textContent = isSubscribed ? '🔕 قفل تنبيهات المتصفح' : '🔔 فعّل تنبيهات المتصفح';
        btn.dataset.subscribed = isSubscribed ? '1' : '0';
    }

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const raw = atob(base64);
        return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
    }

    document.getElementById('pushEnableBtn')?.addEventListener('click', async () => {
        const status = document.getElementById('pushStatus');
        const btn = document.getElementById('pushEnableBtn');
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            status.textContent = 'المتصفح ده مش بيدعم تنبيهات المتصفح.';
            status.className = 'form-status is-error';
            return;
        }
        try {
            if (btn.dataset.subscribed === '1') {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.getSubscription();
                if (sub) {
                    await AccountAPI.unsubscribePush(sub.endpoint);
                    await sub.unsubscribe();
                }
                updatePushButton(false);
                status.textContent = 'اتقفلت التنبيهات.';
                status.className = 'form-status is-success';
                return;
            }

            const keyRes = await AccountAPI.getVapidKey();
            if (!keyRes.enabled) {
                status.textContent = 'التنبيهات دي مش مفعّلة من صاحب الموقع لسه.';
                status.className = 'form-status is-error';
                return;
            }
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                status.textContent = 'محتاج توافق على إذن التنبيهات من المتصفح.';
                status.className = 'form-status is-error';
                return;
            }
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(keyRes.publicKey)
            });
            await AccountAPI.subscribePush(sub.toJSON());
            updatePushButton(true);
            status.textContent = 'اتفعّلت التنبيهات! 🔔';
            status.className = 'form-status is-success';
        } catch (err) {
            status.textContent = err.message || 'حصل خطأ.';
            status.className = 'form-status is-error';
        }
    });
});
