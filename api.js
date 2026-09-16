// ============================================================
// TOJI Frontend - API Integration Module
// احفظ الملف ده: api.js  (في نفس مجلد script.js)
// ============================================================

// ✅ Auto-detects environment: local dev vs. Railway production
const API_BASE_URL =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'                                          // Local development
        : 'https://portfolio-backend-production-3dc5.up.railway.app/api';     // Railway production

// ============================================================
// Token Management
// ✅ السبب: بنحفظ الـ JWT في sessionStorage مش localStorage
//    عشان لو أغلقت المتصفح الـ Token بيتمسح تلقائي
//    (أآمن لأنه مش بيفضل على الجهاز للأبد)
// ============================================================
const TokenManager = {
    get: () => sessionStorage.getItem('toji_admin_token'),
    set: (token) => sessionStorage.setItem('toji_admin_token', token),
    remove: () => sessionStorage.removeItem('toji_admin_token'),
    isLoggedIn: () => !!sessionStorage.getItem('toji_admin_token')
};

// ============================================================
// Base Fetch Helper
// ============================================================
async function apiFetch(endpoint, options = {}) {
    // توكن الأدمن ليه الأولوية. لو مش موجود ولكن الزائر مسجل دخول بحساب
    // اختياري (ميزة الحسابات)، بنبعت توكن الحساب بدل منه — عشان طلبات
    // زي الشات وعروض الأسعار تتربط بحسابه تلقائيًا
    const token = TokenManager.get() || (window.TojiAccount?.getToken?.() || null);

    const defaultHeaders = {
        'Content-Type': 'application/json',
        // لو في Token، بنبعته في كل Request تلقائي
        ...(token && { Authorization: `Bearer ${token}` })
    };

    // ✅ حد أقصى 25 ثانية للطلب — لو السيرفر مش بيرد، بنوقف الطلب
    //    ونرجّع خطأ واضح بدل ما الزرار يفضل شغال (loading) للأبد
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers },
            signal: controller.signal
        });

        const data = await response.json();

        // لو التوكن انتهى، طرد المستخدم
        if (response.status === 401) {
            TokenManager.remove();
            window.location.href = '/admin.html';
            return;
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || 'حدث خطأ في السيرفر');
        }

        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            const timeoutError = new Error('السيرفر مبيردش. جرب تاني بعد شوية أو تأكد إن الباك إند شغال.');
            console.error('API Error: request timed out ->', endpoint);
            throw timeoutError;
        }
        console.error('API Error:', error.message);
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

// ============================================================
// Auth API
// ============================================================
const AuthAPI = {
    login: (email, password) =>
        apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }),

    verify: () => apiFetch('/auth/verify'),

    logout: () => TokenManager.remove(),

    // "نسيت كلمة المرور" — يبعت كود تحقق بالإيميل أو الهاتف
    forgotPassword: (method) =>
        apiFetch('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ method })
        }),

    // تأكيد الكود وتغيير كلمة المرور
    resetPassword: (code, newPassword) =>
        apiFetch('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ code, newPassword })
        })
};

// ============================================================
// Projects API
// ============================================================
const ProjectsAPI = {
    // جيب المشاريع الظاهرة (للعامة - بدون توكن)
    getPublic: () => apiFetch('/projects'),

    // جيب كل المشاريع (أدمن فقط)
    getAll: () => apiFetch('/projects/all'),

    // أضف مشروع جديد
    create: (projectData) =>
        apiFetch('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        }),

    // عدّل مشروع
    update: (id, projectData) =>
        apiFetch(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        }),

    // جيب مشروع واحد بالـ id (صفحة تفاصيل منفصلة)
    getOne: (id) => apiFetch(`/projects/${id}`),

    // احذف مشروع
    delete: (id) =>
        apiFetch(`/projects/${id}`, { method: 'DELETE' })
};

// ============================================================
// Messages API
// ============================================================
const MessagesAPI = {
    // إرسال رسالة (للعامة - بدون توكن)
    send: (messageData) =>
        apiFetch('/messages', {
            method: 'POST',
            body: JSON.stringify(messageData)
        }),

    // جيب كل الرسائل (أدمن فقط)
    getAll: () => apiFetch('/messages'),

    // غيّر حالة الرسالة
    updateStatus: (id, status) =>
        apiFetch(`/messages/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        }),

    // احذف رسالة
    delete: (id) =>
        apiFetch(`/messages/${id}`, { method: 'DELETE' })
};

// ============================================================
// Config API — إعدادات الموقع الحية
// ✅ الأدمن يحفظ الإعدادات هنا فتظهر للزوار فورًا
// ============================================================
const ConfigAPI = {
    get: () => apiFetch('/config'),
    save: (configData) =>
        apiFetch('/config', {
            method: 'POST',
            body: JSON.stringify({ data: configData })
        })
};

// ============================================================
// Analytics API
// ============================================================
const AnalyticsAPI = {
    getStats: () => apiFetch('/analytics/stats'),
    getVisitors: (page = 1, limit = 20) =>
        apiFetch(`/analytics/visitors?page=${page}&limit=${limit}`),
    sendDailySummary: () => apiFetch('/analytics/send-daily-summary', { method: 'POST' }),
    getActivity: () => apiFetch('/analytics/activity')
};

// تصدير موحد لكل الـ APIs

// ============================================================
// Songs API
// ============================================================
const SongsAPI = {
    getPublic: ()      => apiFetch('/songs'),
    getAll:    ()      => apiFetch('/songs/all'),
    add:       (data)  => apiFetch('/songs',       { method: 'POST',   body: JSON.stringify(data) }),
    update:    (id, d) => apiFetch('/songs/' + id, { method: 'PUT',    body: JSON.stringify(d)    }),
    remove:    (id)    => apiFetch('/songs/' + id, { method: 'DELETE' })
};

// ============================================================
// WIP API — Work in Progress Board
// ============================================================
const WipAPI = {
    getAll:  ()              => apiFetch('/wip'),
    create:  (data)          => apiFetch('/wip', { method: 'POST',  body: JSON.stringify(data) }),
    update:  (id, data)      => apiFetch(`/wip/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete:  (id)            => apiFetch(`/wip/${id}`, { method: 'DELETE' })
};

// ============================================================
// AI API — Gemini-powered chat assistant (server-side proxy)
// ============================================================
const AiAPI = {
    // messages: [{ role: 'user'|'assistant', content: string }, ...]
    chat: (messages, clientId, userName, mode, moodKey, imageUrl) => apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, clientId, userName, mode, moodKey, imageUrl })
    }),
    status: ()           => apiFetch('/ai/status'),
    rateLog: (id, rating) => apiFetch(`/ai/logs/${id}/rate`, { method: 'PATCH', body: JSON.stringify({ rating }) }),

    // صورة الشات — صورة واحدة بس في اليوم لكل زائر
    imageQuota: (clientId) => apiFetch(`/ai/chat-image/quota?clientId=${encodeURIComponent(clientId)}`),
    uploadChatImage: async (file, clientId) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('clientId', clientId);
        const res = await fetch(`${API_BASE_URL}/ai/chat-image`, { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'فشل رفع الصورة');
        return data;
    },

    // Admin
    getSettings:    ()      => apiFetch('/ai/settings'),
    updateSettings: (data)  => apiFetch('/ai/settings', { method: 'PUT', body: JSON.stringify(data) }),
    // شات لكل شخص لوحده
    getThreads:     ()      => apiFetch('/ai/logs/threads'),
    getThread:      (key)   => apiFetch(`/ai/logs/thread/${encodeURIComponent(key)}`),
    deleteThread:   (key)   => apiFetch(`/ai/logs/thread/${encodeURIComponent(key)}`, { method: 'DELETE' }),
    // تعليمات خاصة بشخص/محادثة بعينها (شخصية زعزع مع الشخص ده تحديدًا)
    getPersona:     (key)              => apiFetch(`/ai/persona/${encodeURIComponent(key)}`),
    updatePersona:  (key, instruction) => apiFetch(`/ai/persona/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ instruction }) }),
    deletePersona:  (key)              => apiFetch(`/ai/persona/${encodeURIComponent(key)}`, { method: 'DELETE' }),
    // (Legacy) قائمة مسطحة
    getLogs:        (page = 1) => apiFetch(`/ai/logs?page=${page}`),
    deleteLog:      (id)    => apiFetch(`/ai/logs/${id}`, { method: 'DELETE' }),
    deleteAllLogs:  ()      => apiFetch('/ai/logs', { method: 'DELETE' })
};

// ============================================================
// AI Moods API — المودات الإضافية اللي الأدمن بيتحكم فيها
// ============================================================
const AiMoodAPI = {
    getPublic: ()      => apiFetch('/ai/moods'),
    getAll:    ()      => apiFetch('/ai/moods/all'),
    create:    (data)  => apiFetch('/ai/moods',       { method: 'POST',   body: JSON.stringify(data) }),
    update:    (id, d) => apiFetch('/ai/moods/' + id, { method: 'PUT',    body: JSON.stringify(d)    }),
    remove:    (id)    => apiFetch('/ai/moods/' + id, { method: 'DELETE' })
};

// ============================================================
// Badge API — الإنجازات (Badges) المتاحة للحسابات
// ============================================================
const BadgeAPI = {
    getPublic: ()      => apiFetch('/admin/users/badges'),
    getAll:    ()      => apiFetch('/admin/users/badges/all'),
    create:    (data)  => apiFetch('/admin/users/badges',       { method: 'POST',   body: JSON.stringify(data) }),
    update:    (id, d) => apiFetch('/admin/users/badges/' + id, { method: 'PUT',    body: JSON.stringify(d)    }),
    remove:    (id)    => apiFetch('/admin/users/badges/' + id, { method: 'DELETE' }),
    award:     (userId, key) => apiFetch(`/admin/users/${userId}/badges/${encodeURIComponent(key)}`, { method: 'POST' }),
    revoke:    (userId, key) => apiFetch(`/admin/users/${userId}/badges/${encodeURIComponent(key)}`, { method: 'DELETE' })
};

// ============================================================
// Reply Template API — ردود جاهزة للأدمن في صندوق الرسايل
// ============================================================
const ReplyTemplateAPI = {
    getAll:    ()      => apiFetch('/admin/users/reply-templates'),
    create:    (data)  => apiFetch('/admin/users/reply-templates',       { method: 'POST',   body: JSON.stringify(data) }),
    update:    (id, d) => apiFetch('/admin/users/reply-templates/' + id, { method: 'PUT',    body: JSON.stringify(d)    }),
    remove:    (id)    => apiFetch('/admin/users/reply-templates/' + id, { method: 'DELETE' })
};

// ============================================================
// Links API — قسم اللينكات (Connect) في الموقع
// ============================================================
const LinksAPI = {
    getPublic: ()      => apiFetch('/links'),
    getAll:    ()      => apiFetch('/links/all'),
    create:    (data)  => apiFetch('/links',       { method: 'POST',   body: JSON.stringify(data) }),
    update:    (id, d) => apiFetch('/links/' + id, { method: 'PUT',    body: JSON.stringify(d)    }),
    remove:    (id)    => apiFetch('/links/' + id, { method: 'DELETE' })
};

// ============================================================
// Guestbook API — دفتر الزوار
// ============================================================
const GuestbookAPI = {
    getPublic:      (limit = 60)  => apiFetch(`/guestbook?limit=${limit}`),
    getAll:         ()            => apiFetch('/guestbook/all'),
    create:         (data)        => apiFetch('/guestbook', { method: 'POST', body: JSON.stringify(data) }),
    setVisibility:  (id, visible) => apiFetch(`/guestbook/${id}/visibility`, { method: 'PATCH', body: JSON.stringify({ visible }) }),
    remove:         (id)          => apiFetch(`/guestbook/${id}`, { method: 'DELETE' })
};

// ============================================================
// Reactions API — 🔥 / ❤️ على المشاريع
// ============================================================
const ReactionsAPI = {
    getAll: ()               => apiFetch('/reactions'),
    react:  (key, type, action) => apiFetch(`/reactions/${encodeURIComponent(key)}`, { method: 'POST', body: JSON.stringify({ type, action }) })
};

// ============================================================
// Pricing API — باقات الأسعار
// ============================================================
const PricingAPI = {
    getPublic: ()      => apiFetch('/pricing'),
    getAll:    ()      => apiFetch('/pricing/all'),
    create:    (data)  => apiFetch('/pricing',       { method: 'POST', body: JSON.stringify(data) }),
    update:    (id, d) => apiFetch('/pricing/' + id, { method: 'PUT',  body: JSON.stringify(d)    }),
    remove:    (id)    => apiFetch('/pricing/' + id, { method: 'DELETE' })
};

// ============================================================
// Process API — خطوات العمل
// ============================================================
const ProcessAPI = {
    getPublic: ()      => apiFetch('/process'),
    getAll:    ()      => apiFetch('/process/all'),
    create:    (data)  => apiFetch('/process',       { method: 'POST', body: JSON.stringify(data) }),
    update:    (id, d) => apiFetch('/process/' + id, { method: 'PUT',  body: JSON.stringify(d)    }),
    remove:    (id)    => apiFetch('/process/' + id, { method: 'DELETE' })
};

// ============================================================
// Blog API — مقالات
// ============================================================
const BlogAPI = {
    getPublic: ()      => apiFetch('/blog'),
    getAll:    ()      => apiFetch('/blog/all'),
    getBySlug: (slug)  => apiFetch(`/blog/post/${encodeURIComponent(slug)}`),
    create:    (data)  => apiFetch('/blog',       { method: 'POST', body: JSON.stringify(data) }),
    update:    (id, d) => apiFetch('/blog/' + id, { method: 'PUT',  body: JSON.stringify(d)    }),
    remove:    (id)    => apiFetch('/blog/' + id, { method: 'DELETE' })
};

// ============================================================
// Changelog API — سجل التحديثات
// ============================================================
const ChangelogAPI = {
    getPublic: ()      => apiFetch('/changelog'),
    getAll:    ()      => apiFetch('/changelog/all'),
    create:    (data)  => apiFetch('/changelog',       { method: 'POST', body: JSON.stringify(data) }),
    update:    (id, d) => apiFetch('/changelog/' + id, { method: 'PUT',  body: JSON.stringify(d)    }),
    remove:    (id)    => apiFetch('/changelog/' + id, { method: 'DELETE' })
};

// ============================================================
// Stack API — التقنيات المستخدمة
// ============================================================
const StackAPI = {
    getPublic: ()      => apiFetch('/stack'),
    getAll:    ()      => apiFetch('/stack/all'),
    create:    (data)  => apiFetch('/stack',       { method: 'POST', body: JSON.stringify(data) }),
    update:    (id, d) => apiFetch('/stack/' + id, { method: 'PUT',  body: JSON.stringify(d)    }),
    remove:    (id)    => apiFetch('/stack/' + id, { method: 'DELETE' })
};

// ============================================================
// Quote API — طلبات عروض أسعار
// ============================================================
const QuoteAPI = {
    send:         (data)     => apiFetch('/quote', { method: 'POST', body: JSON.stringify(data) }),
    getAll:       ()         => apiFetch('/quote'),
    updateStatus: (id, s)    => apiFetch(`/quote/${id}`, { method: 'PATCH', body: JSON.stringify({ status: s }) }),
    remove:       (id)       => apiFetch(`/quote/${id}`, { method: 'DELETE' })
};

// ============================================================
// Booking API — طلبات حجز مكالمة
// ============================================================
const BookingAPI = {
    send:         (data)     => apiFetch('/booking', { method: 'POST', body: JSON.stringify(data) }),
    getAll:       ()         => apiFetch('/booking'),
    updateStatus: (id, s)    => apiFetch(`/booking/${id}`, { method: 'PATCH', body: JSON.stringify({ status: s }) }),
    remove:       (id)       => apiFetch(`/booking/${id}`, { method: 'DELETE' })
};

window.TojiAPI = { TokenManager, AuthAPI, ProjectsAPI, MessagesAPI, ConfigAPI, AnalyticsAPI, SongsAPI, WipAPI, AiAPI, AiMoodAPI, BadgeAPI, ReplyTemplateAPI, LinksAPI, GuestbookAPI, ReactionsAPI, PricingAPI, ProcessAPI, BlogAPI, ChangelogAPI, StackAPI, QuoteAPI, BookingAPI, API_BASE_URL };
