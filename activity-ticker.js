// ============================================================
// TOJI — فيد نشاط حي: بيعرض آخر مشروع/بوست/تحديث بالدور
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const ticker = document.getElementById('activityTicker');
    const textEl = document.getElementById('activityTickerText');
    if (!ticker || !textEl || !window.TojiAPI?.AnalyticsAPI) return;

    let items = [];
    let idx = 0;

    function timeAgo(d) {
        const diff = (Date.now() - new Date(d).getTime()) / 1000;
        if (diff < 3600) return `من ${Math.max(1, Math.floor(diff / 60))} دقيقة`;
        if (diff < 86400) return `من ${Math.floor(diff / 3600)} ساعة`;
        return `من ${Math.floor(diff / 86400)} يوم`;
    }

    function showNext() {
        if (!items.length) return;
        const item = items[idx % items.length];
        idx++;
        textEl.style.opacity = 0;
        setTimeout(() => {
            textEl.textContent = `${item.text} — ${timeAgo(item.at)}`;
            textEl.style.opacity = 1;
        }, 220);
    }

    try {
        const res = await window.TojiAPI.AnalyticsAPI.getActivity();
        items = res.data || [];
        if (!items.length) return;
        ticker.hidden = false;
        if (window.lucide) window.lucide.createIcons();
        showNext();
        setInterval(showNext, 6000);
    } catch {
        // فشل بهدوء — الفيد ده تحسين بصري بس، مش أساسي
    }
});
