// ============================================================
// TOJI — صفحة البروفايل العام (view من منظور شخص تاني)
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const loadingEl = document.getElementById('profileLoading');
    const errorEl   = document.getElementById('profileError');
    const contentEl = document.getElementById('profileContent');

    const AccountAPI = window.TojiAccount?.AccountAPI;
    // ✅ اليوزرنيم ممكن ييجي من ?u=username (لينك مباشر) أو من /account/username
    //    (اللينك الجميل عن طريق vercel rewrite — بيوصل السيرفر بس مش بيتحدث في
    //    window.location على المتصفح، فلازم نستخرجه من الـ path كمان)
    function getUsernameFromUrl() {
        const fromQuery = new URLSearchParams(window.location.search).get('u');
        if (fromQuery) return fromQuery;
        const match = window.location.pathname.match(/\/account\/([^/?#]+)/i);
        return match ? decodeURIComponent(match[1]) : null;
    }
    const username = getUsernameFromUrl();

    if (!username || !AccountAPI) {
        loadingEl.hidden = true;
        errorEl.hidden = false;
        return;
    }

    let profile = null;

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str ?? '';
        return div.innerHTML;
    }

    function formatDate(d) {
        if (!d) return '';
        return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
    }

    async function load() {
        try {
            const res = await AccountAPI.getPublicProfile(username);
            profile = res.data;
            render();
        } catch (err) {
            loadingEl.hidden = true;
            errorEl.hidden = false;
            document.getElementById('profileErrorTitle').textContent =
                err.message?.includes('خاص') ? 'الحساب ده خاص' : 'الحساب مش موجود';
            document.getElementById('profileErrorText').textContent =
                err.message?.includes('خاص') ? 'صاحب الحساب ده مخلي بروفايله خاص.' : 'تأكد من الرابط وجرب تاني.';
        }
    }

    function render() {
        loadingEl.hidden = true;
        contentEl.hidden = false;
        document.title = `${profile.name} (@${profile.username}) | TOJI`;
        document.getElementById('pHeroTitle').textContent = profile.name;

        document.getElementById('pName').textContent = profile.name;
        document.getElementById('pUsername').textContent = '@' + profile.username;
        document.getElementById('pBio').textContent = profile.bio || '';
        document.getElementById('pFollowersCount').textContent = profile.followersCount || 0;
        document.getElementById('pFollowingCount').textContent = profile.followingCount || 0;
        document.getElementById('pMemberSince').textContent = profile.memberSince ? `عضو من ${formatDate(profile.memberSince)}` : '';

        const coverEl = document.getElementById('pProfileCover');
        const cardEl  = document.getElementById('pProfileCard');
        if (profile.coverImageUrl) {
            coverEl.style.backgroundImage = `url(${profile.coverImageUrl})`;
            coverEl.hidden = false;
            cardEl.classList.add('has-cover');
        } else {
            coverEl.hidden = true;
            cardEl.classList.remove('has-cover');
        }
        const tagLabels = { developer: '👨‍💻 مطور', designer: '🎨 مصمم', client: '🤝 عميل', other: '✨ تاني' };
        const tagChip = document.getElementById('pTagChip');
        if (profile.accountTag && tagLabels[profile.accountTag]) {
            tagChip.textContent = tagLabels[profile.accountTag];
            tagChip.hidden = false;
        } else {
            tagChip.hidden = true;
        }
        const pinnedEl = document.getElementById('pPinnedNote');
        if (profile.pinnedItem?.note) {
            pinnedEl.textContent = `📌 ${profile.pinnedItem.note}`;
            pinnedEl.hidden = false;
        } else {
            pinnedEl.hidden = true;
        }

        renderStories(profile.username);

        const pointsStat = document.getElementById('pPointsStat');
        if (profile.points) {
            pointsStat.hidden = false;
            document.getElementById('pPointsTotal').textContent = profile.points.total;
        } else {
            pointsStat.hidden = true;
        }

        if (profile.level) {
            document.getElementById('pLevelEmoji').textContent = profile.level.emoji;
            document.getElementById('pLevelLabel').textContent = profile.level.label;
        }

        renderBadges(profile.badgeKeys || []);
        renderProjects(profile.savedProjectIds || []);
        renderSongs(profile.songs || []);

        const img = document.getElementById('pAvatarImg');
        const fallback = document.getElementById('pAvatarFallback');
        if (profile.avatarUrl) {
            img.src = profile.avatarUrl;
            img.hidden = false;
            fallback.hidden = true;
        } else {
            img.hidden = true;
            fallback.hidden = false;
            fallback.textContent = (profile.name || '؟').trim().slice(0, 1).toUpperCase();
        }

        const followBtn = document.getElementById('pFollowBtn');
        const msgBtn     = document.getElementById('pMessageBtn');
        const isSelf = window.TojiAccount?.isLoggedIn() && window.TojiAccount.getUser()?.username === profile.username;

        if (isSelf) {
            followBtn.hidden = true;
            msgBtn.hidden = true;
        } else {
            followBtn.hidden = false;
            msgBtn.hidden = false;
            updateFollowBtn(profile.isFollowing);
        }

        if (window.lucide) window.lucide.createIcons();
    }

    async function renderBadges(keys) {
        const row = document.getElementById('pBadgesRow');
        if (!keys.length) { row.innerHTML = ''; return; }
        try {
            const res = await AccountAPI.getBadges();
            const defs = res.data || [];
            row.innerHTML = defs
                .filter((b) => keys.includes(b.key))
                .map((b) => `<span class="acc-badge-chip" title="${(b.description || b.label).replace(/"/g, '&quot;')}">${
                    b.imageUrl ? `<img src="${b.imageUrl}" alt="">` : b.emoji
                } ${b.label}</span>`).join('');
        } catch { row.innerHTML = ''; }
    }

    async function renderProjects(ids) {
        const card = document.getElementById('pProjectsCard');
        const listEl = document.getElementById('pProjectsList');
        if (!ids.length) { card.hidden = true; return; }
        try {
            const all = await window.TojiAPI.ProjectsAPI.getPublic();
            const projects = (all.data || []).filter((p) => ids.includes(String(p._id)));
            if (!projects.length) { card.hidden = true; return; }
            card.hidden = false;
            listEl.innerHTML = projects.map((p) => `
                <div class="acc-list-item">
                    <div><strong>${escapeHtml(p.title || 'مشروع')}</strong><span>${escapeHtml((p.description || '').slice(0, 80))}</span></div>
                    <div class="acc-list-meta"><a class="btn-secondary" href="index.html#projects">شوفه</a></div>
                </div>`).join('');
        } catch { card.hidden = true; }
    }

    function renderSongs(songs) {
        const card = document.getElementById('pSongsCard');
        const listEl = document.getElementById('pSongsList');
        if (!songs.length) { card.hidden = true; return; }
        card.hidden = false;
        listEl.innerHTML = songs.map((s) => `
            <div class="acc-list-item">
                <div><strong>${escapeHtml(s.title)}</strong><span>${escapeHtml(s.artist || '')}</span></div>
                <div class="acc-list-meta"><a class="btn-secondary" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">▶️ سماع</a></div>
            </div>`).join('');
    }

    function updateFollowBtn(isFollowing) {
        const btn = document.getElementById('pFollowBtn');
        btn.textContent = isFollowing ? 'إلغاء المتابعة' : 'تابعه';
        btn.classList.toggle('is-following', isFollowing);
    }

    document.getElementById('pFollowBtn')?.addEventListener('click', async () => {
        if (!window.TojiAccount?.isLoggedIn()) { window.TojiAccount?.openAuthModal?.(); return; }
        const btn = document.getElementById('pFollowBtn');
        btn.disabled = true;
        try {
            const isFollowing = btn.classList.contains('is-following');
            const res = isFollowing ? await AccountAPI.unfollow(username) : await AccountAPI.follow(username);
            updateFollowBtn(res.following);
            profile.followersCount += res.following ? 1 : -1;
            document.getElementById('pFollowersCount').textContent = profile.followersCount;
        } catch (err) {
            window.TojiAccount.toast(err.message);
        } finally {
            btn.disabled = false;
        }
    });

    document.getElementById('pMessageBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!window.TojiAccount?.isLoggedIn()) {
            window.TojiAccount?.openAuthModal?.();
            return;
        }
        window.location.href = `messages.html?u=${encodeURIComponent(username)}`;
    });

    // ── ستوريز صاحب البروفايل ──
    let activeStories = [];
    let activeStoryIndex = 0;

    async function renderStories(uname) {
        try {
            const res = await AccountAPI.getStories(uname);
            activeStories = res.data || [];
            document.getElementById('pAvatarWrap')?.classList.toggle('has-story', activeStories.length > 0);
        } catch { activeStories = []; }
    }

    document.getElementById('pAvatarWrap')?.addEventListener('click', () => {
        if (!activeStories.length) return;
        activeStoryIndex = 0;
        openStoryViewer();
    });

    function openStoryViewer() {
        const story = activeStories[activeStoryIndex];
        if (!story) { closeStoryViewer(); return; }
        document.getElementById('storyViewer').hidden = false;
        document.getElementById('storyViewerContent').innerHTML = story.imageUrl
            ? `<img src="${story.imageUrl}" alt="">`
            : `<p>${escapeHtml(story.text || '')}</p>`;
        document.getElementById('storyProgress').style.width = `${((activeStoryIndex + 1) / activeStories.length) * 100}%`;
        if (window.TojiAccount?.isLoggedIn()) AccountAPI.viewStory(story._id).catch(() => {});
    }
    function closeStoryViewer() { document.getElementById('storyViewer').hidden = true; }
    document.getElementById('storyViewerClose')?.addEventListener('click', closeStoryViewer);
    document.getElementById('storyNextBtn')?.addEventListener('click', () => { activeStoryIndex++; openStoryViewer(); });
    document.getElementById('storyPrevBtn')?.addEventListener('click', () => { activeStoryIndex = Math.max(0, activeStoryIndex - 1); openStoryViewer(); });

    load();
});
