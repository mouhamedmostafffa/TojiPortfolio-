// ============================================================
// TOJI Admin — Extra Content Manager
// محرك واحد بيدير كل الأنواع الجديدة (pricing, process, blog,
// changelog, stack) + صناديق الطلبات (quote, booking)
// عشان منكررش نفس كود الـ CRUD 7 مرات
// ============================================================
(function () {
    function el(id) { return document.getElementById(id); }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str ?? '';
        return div.innerHTML;
    }

    // ------------------------------------------------------------
    // إعداد كل نوع محتوى: الـ API، حقول الفورم، وشكل عرض العنصر بالقائمة
    // ------------------------------------------------------------
    const CONTENT_TYPES = {
        pricing: {
            api: () => window.TojiAPI.PricingAPI,
            title: 'باقة جديدة',
            fields: [
                { id: 'name', label: 'اسم الباقة', type: 'text' },
                { id: 'price', label: 'السعر', type: 'text', placeholder: '$50' },
                { id: 'period', label: 'الفترة (اختياري)', type: 'text', placeholder: '/page' },
                { id: 'description', label: 'وصف قصير', type: 'textarea' },
                { id: 'features', label: 'المميزات (سطر لكل ميزة)', type: 'lines' },
                { id: 'ctaText', label: 'نص الزرار', type: 'text', placeholder: 'Get Started' },
                { id: 'order', label: 'الترتيب', type: 'number', default: 0 },
                { id: 'highlighted', label: 'باقة مميزة', type: 'checkbox' },
                { id: 'isVisible', label: 'ظاهر على الموقع', type: 'checkbox', default: true }
            ],
            renderItem: (it) => ({
                title: it.name,
                sub: [it.price + (it.period || ''), it.highlighted ? '⭐ مميزة' : ''].filter(Boolean).join(' · '),
                visible: it.isVisible
            })
        },
        process: {
            api: () => window.TojiAPI.ProcessAPI,
            title: 'خطوة جديدة',
            fields: [
                { id: 'title', label: 'العنوان', type: 'text' },
                { id: 'description', label: 'الوصف', type: 'textarea' },
                { id: 'icon', label: 'أيقونة (lucide)', type: 'text', placeholder: 'circle-dot' },
                { id: 'duration', label: 'المدة (اختياري)', type: 'text', placeholder: '1-2 days' },
                { id: 'order', label: 'الترتيب', type: 'number', default: 0 },
                { id: 'isVisible', label: 'ظاهر على الموقع', type: 'checkbox', default: true }
            ],
            renderItem: (it) => ({ title: it.title, sub: it.duration || '', visible: it.isVisible })
        },
        changelog: {
            api: () => window.TojiAPI.ChangelogAPI,
            title: 'تحديث جديد',
            fields: [
                { id: 'title', label: 'العنوان', type: 'text' },
                { id: 'description', label: 'الوصف', type: 'textarea' },
                {
                    id: 'type',
                    label: 'النوع',
                    type: 'select',
                    options: [
                        ['feature', 'ميزة جديدة'],
                        ['fix', 'إصلاح'],
                        ['improvement', 'تحسين']
                    ]
                },
                { id: 'date', label: 'التاريخ', type: 'date' },
                { id: 'isVisible', label: 'ظاهر على الموقع', type: 'checkbox', default: true }
            ],
            renderItem: (it) => ({ title: it.title, sub: it.type, visible: it.isVisible })
        },
        stack: {
            api: () => window.TojiAPI.StackAPI,
            title: 'عنصر جديد',
            fields: [
                { id: 'name', label: 'الاسم', type: 'text' },
                {
                    id: 'category',
                    label: 'الفئة',
                    type: 'select',
                    options: [
                        ['frontend', 'Frontend'],
                        ['backend', 'Backend'],
                        ['database', 'Database'],
                        ['hosting', 'Hosting'],
                        ['tools', 'Tools']
                    ]
                },
                { id: 'description', label: 'وصف قصير', type: 'textarea' },
                { id: 'icon', label: 'أيقونة (lucide)', type: 'text', placeholder: 'box' },
                { id: 'order', label: 'الترتيب', type: 'number', default: 0 },
                { id: 'isVisible', label: 'ظاهر على الموقع', type: 'checkbox', default: true }
            ],
            renderItem: (it) => ({ title: it.name, sub: it.category, visible: it.isVisible })
        },
        moods: {
            api: () => window.TojiAPI.AiMoodAPI,
            title: 'مود جديد',
            fields: [
                { id: 'key', label: 'المفتاح (إنجليزي، بدون مسافات)', type: 'text', placeholder: 'chill' },
                { id: 'label', label: 'الاسم الظاهر للزوار', type: 'text', placeholder: 'هادي' },
                { id: 'emoji', label: 'إيموجي', type: 'text', placeholder: '😌' },
                { id: 'instruction', label: 'تعليمات الشخصية (إنجليزي، بتتبعت لـ AI)', type: 'textarea-lg' },
                { id: 'order', label: 'الترتيب', type: 'number', default: 0 },
                { id: 'enabled', label: 'ظاهر للزوار', type: 'checkbox', default: true }
            ],
            renderItem: (it) => ({ title: `${it.emoji || '✨'} ${it.label}`, sub: it.key, visible: it.enabled })
        },
        badges: {
            api: () => window.TojiAPI.BadgeAPI,
            title: 'إنجاز جديد',
            fields: [
                { id: 'key', label: 'المفتاح (إنجليزي، بدون مسافات)', type: 'text', placeholder: 'first_project' },
                { id: 'label', label: 'الاسم الظاهر', type: 'text', placeholder: 'أول مشروع' },
                { id: 'emoji', label: 'إيموجي (لو مفيش صورة)', type: 'text', placeholder: '🏆' },
                { id: 'imageUrl', label: 'رابط صورة (اختياري)', type: 'text' },
                { id: 'description', label: 'وصف قصير', type: 'textarea' },
                { id: 'order', label: 'الترتيب', type: 'number', default: 0 },
                { id: 'enabled', label: 'مفعّل', type: 'checkbox', default: true }
            ],
            renderItem: (it) => ({ title: `${it.emoji || '🏆'} ${it.label}`, sub: it.key, visible: it.enabled })
        },
        templates: {
            api: () => window.TojiAPI.ReplyTemplateAPI,
            title: 'رد جاهز جديد',
            fields: [
                { id: 'title', label: 'اسم الرد (يظهر لك بس)', type: 'text', placeholder: 'أهلًا وسهلًا' },
                { id: 'text', label: 'نص الرد', type: 'textarea' },
                { id: 'order', label: 'الترتيب', type: 'number', default: 0 }
            ],
            renderItem: (it) => ({ title: it.title, sub: (it.text || '').slice(0, 60) })
        }
    };

    // ------------------------------------------------------------
    // بناء الفورم ديناميكيًا جوه الحاوية
    // ------------------------------------------------------------
    function buildForm(containerId, config) {
        const container = el(containerId);
        if (!container) return;
        container.innerHTML = config.fields.map((f) => {
            const fid = `${containerId}_${f.id}`;
            if (f.type === 'textarea' || f.type === 'lines' || f.type === 'tags') {
                return `<label>${f.label}<textarea id="${fid}" rows="3" placeholder="${f.placeholder || ''}"></textarea></label>`;
            }
            if (f.type === 'textarea-lg') {
                return `<label>${f.label}<textarea id="${fid}" rows="8" placeholder="${f.placeholder || ''}"></textarea></label>`;
            }
            if (f.type === 'checkbox') {
                return `<label class="checkbox-label"><input type="checkbox" id="${fid}" ${f.default ? 'checked' : ''}> ${f.label}</label>`;
            }
            if (f.type === 'select') {
                const opts = f.options.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
                return `<label>${f.label}<select id="${fid}">${opts}</select></label>`;
            }
            if (f.type === 'date') {
                return `<label>${f.label}<input type="date" id="${fid}"></label>`;
            }
            if (f.type === 'number') {
                return `<label>${f.label}<input type="number" id="${fid}" value="${f.default ?? 0}"></label>`;
            }
            return `<label>${f.label}<input type="text" id="${fid}" placeholder="${f.placeholder || ''}"></label>`;
        }).join('');
    }

    function readForm(containerId, config) {
        const data = {};
        config.fields.forEach((f) => {
            const fid = `${containerId}_${f.id}`;
            const node = el(fid);
            if (!node) return;
            if (f.type === 'checkbox') {
                data[f.id] = node.checked;
            } else if (f.type === 'number') {
                data[f.id] = Number(node.value) || 0;
            } else if (f.type === 'lines') {
                data[f.id] = node.value.split('\n').map((s) => s.trim()).filter(Boolean);
            } else if (f.type === 'tags') {
                data[f.id] = node.value.split(',').map((s) => s.trim()).filter(Boolean);
            } else {
                data[f.id] = node.value.trim();
            }
        });
        return data;
    }

    function fillForm(containerId, config, item) {
        config.fields.forEach((f) => {
            const fid = `${containerId}_${f.id}`;
            const node = el(fid);
            if (!node) return;
            const val = item[f.id];
            if (f.type === 'checkbox') {
                node.checked = Boolean(val);
            } else if (f.type === 'lines') {
                node.value = (val || []).join('\n');
            } else if (f.type === 'tags') {
                node.value = (val || []).join(', ');
            } else if (f.type === 'date') {
                node.value = val ? new Date(val).toISOString().slice(0, 10) : '';
            } else {
                node.value = val ?? '';
            }
        });
    }

    function clearForm(containerId, config) {
        config.fields.forEach((f) => {
            const fid = `${containerId}_${f.id}`;
            const node = el(fid);
            if (!node) return;
            if (f.type === 'checkbox') node.checked = Boolean(f.default);
            else if (f.type === 'number') node.value = f.default ?? 0;
            else node.value = '';
        });
    }

    // ------------------------------------------------------------
    // تفعيل بانل نوع محتوى واحد (list + form + toolbar)
    // ------------------------------------------------------------
    function initContentPanel(key) {
        const config = CONTENT_TYPES[key];
        if (!config) return;

        const listEl = el(`${key}List`);
        const formEl = el(`${key}Form`);
        const msgEl = el(`${key}FormMsg`);
        const idField = el(`${key}FormId`);
        const loadBtn = el(`${key}LoadBtn`);
        const addBtn = el(`${key}AddBtn`);
        const saveBtn = el(`${key}SaveBtn`);
        const cancelBtn = el(`${key}CancelBtn`);
        const formTitle = el(`${key}FormTitle`);

        if (!listEl) return; // البانل مش موجود في الصفحة دي

        buildForm(`${key}Fields`, config);

        async function load() {
            listEl.innerHTML = '<p class="projects-hint">⏳ جارٍ التحميل...</p>';
            try {
                const res = await config.api().getAll();
                const items = res?.data || [];
                if (!items.length) {
                    listEl.innerHTML = '<p class="projects-hint">لا يوجد عناصر بعد.</p>';
                    return;
                }
                listEl.innerHTML = items.map((it) => {
                    const view = config.renderItem(it);
                    return `
                    <div class="project-item" data-id="${it._id}">
                        <div class="project-item-main">
                            <div class="project-item-info">
                                <strong>${escapeHtml(view.title || '')}</strong>
                                ${view.sub ? `<span class="project-item-sub">${escapeHtml(view.sub)}</span>` : ''}
                            </div>
                            <span class="project-visibility">${view.visible ? '👁 ظاهر' : '🙈 مخفي'}</span>
                        </div>
                        <div class="project-item-actions">
                            <button class="btn-sm btn-edit" data-edit="${it._id}" type="button">✏️ تعديل</button>
                            <button class="btn-sm btn-delete" data-delete="${it._id}" type="button">🗑 حذف</button>
                        </div>
                    </div>`;
                }).join('');

                listEl.querySelectorAll('[data-edit]').forEach((btn) => {
                    btn.addEventListener('click', () => {
                        const item = items.find((x) => x._id === btn.dataset.edit);
                        if (!item) return;
                        idField.value = item._id;
                        fillForm(`${key}Fields`, config, item);
                        formTitle.textContent = `تعديل: ${config.title}`;
                        formEl.hidden = false;
                        formEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    });
                });
                listEl.querySelectorAll('[data-delete]').forEach((btn) => {
                    btn.addEventListener('click', async () => {
                        if (!confirm('متأكد من الحذف؟')) return;
                        try {
                            await config.api().remove(btn.dataset.delete);
                            load();
                        } catch (err) {
                            alert('فشل الحذف: ' + err.message);
                        }
                    });
                });
            } catch (err) {
                listEl.innerHTML = `<p class="projects-hint error">❌ فشل التحميل: ${escapeHtml(err.message)}</p>`;
            }
        }

        loadBtn?.addEventListener('click', load);

        addBtn?.addEventListener('click', () => {
            idField.value = '';
            clearForm(`${key}Fields`, config);
            formTitle.textContent = config.title;
            formEl.hidden = false;
            formEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        cancelBtn?.addEventListener('click', () => { formEl.hidden = true; });

        saveBtn?.addEventListener('click', async () => {
            const data = readForm(`${key}Fields`, config);
            msgEl.textContent = 'جارٍ الحفظ...';
            msgEl.className = 'form-msg';
            try {
                if (idField.value) {
                    await config.api().update(idField.value, data);
                } else {
                    await config.api().create(data);
                }
                msgEl.textContent = '✅ اتحفظ.';
                formEl.hidden = true;
                load();
            } catch (err) {
                msgEl.textContent = '❌ ' + err.message;
                msgEl.className = 'form-msg error';
            }
        });

        // تحميل تلقائي أول مرة يتفتح فيها البانل
        const panel = listEl.closest('details.panel');
        if (panel) {
            panel.addEventListener('toggle', () => {
                if (panel.open && listEl.dataset.loaded !== '1') {
                    listEl.dataset.loaded = '1';
                    load();
                }
            });
        }
    }

    // ------------------------------------------------------------
    // صناديق الطلبات (quote / booking) — عرض + تغيير حالة + حذف
    // ------------------------------------------------------------
    const INBOX_TYPES = {
        quote: {
            api: () => window.TojiAPI.QuoteAPI,
            statuses: [['new', 'جديد'], ['contacted', 'تم التواصل'], ['closed', 'مغلق']],
            render: (it) => `
                <strong>${escapeHtml(it.name)}</strong>
                <span class="project-item-sub">${escapeHtml(it.contact)} · ${escapeHtml(it.projectType || '')} ${it.budget ? '· ' + escapeHtml(it.budget) : ''}</span>
                ${it.description ? `<span class="project-item-sub">${escapeHtml(it.description)}</span>` : ''}`
        },
        booking: {
            api: () => window.TojiAPI.BookingAPI,
            statuses: [['pending', 'قيد الانتظار'], ['confirmed', 'متأكد'], ['done', 'تم'], ['cancelled', 'ملغي']],
            render: (it) => `
                <strong>${escapeHtml(it.name)}</strong>
                <span class="project-item-sub">${escapeHtml(it.contact)} · ${escapeHtml(it.preferredDate || '')} ${it.preferredTime ? '· ' + escapeHtml(it.preferredTime) : ''}</span>
                ${it.message ? `<span class="project-item-sub">${escapeHtml(it.message)}</span>` : ''}`
        }
    };

    function initInboxPanel(key) {
        const config = INBOX_TYPES[key];
        const listEl = el(`${key}List`);
        const loadBtn = el(`${key}LoadBtn`);
        if (!listEl) return;

        async function load() {
            listEl.innerHTML = '<p class="projects-hint">⏳ جارٍ التحميل...</p>';
            try {
                const res = await config.api().getAll();
                const items = res?.data || [];
                if (!items.length) {
                    listEl.innerHTML = '<p class="projects-hint">لا يوجد طلبات بعد.</p>';
                    return;
                }
                const statusOpts = config.statuses.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
                listEl.innerHTML = items.map((it) => `
                    <div class="project-item" data-id="${it._id}">
                        <div class="project-item-main">
                            <div class="project-item-info">${config.render(it)}</div>
                            <select class="inbox-status" data-status="${it._id}">
                                ${config.statuses.map(([v, l]) => `<option value="${v}" ${v === it.status ? 'selected' : ''}>${l}</option>`).join('')}
                            </select>
                        </div>
                        <div class="project-item-actions">
                            <button class="btn-sm btn-delete" data-delete="${it._id}" type="button">🗑 حذف</button>
                        </div>
                    </div>`).join('');

                listEl.querySelectorAll('[data-status]').forEach((sel) => {
                    sel.addEventListener('change', async () => {
                        try { await config.api().updateStatus(sel.dataset.status, sel.value); }
                        catch (err) { alert('فشل التحديث: ' + err.message); }
                    });
                });
                listEl.querySelectorAll('[data-delete]').forEach((btn) => {
                    btn.addEventListener('click', async () => {
                        if (!confirm('متأكد من الحذف؟')) return;
                        try { await config.api().remove(btn.dataset.delete); load(); }
                        catch (err) { alert('فشل الحذف: ' + err.message); }
                    });
                });
            } catch (err) {
                listEl.innerHTML = `<p class="projects-hint error">❌ فشل التحميل: ${escapeHtml(err.message)}</p>`;
            }
        }

        loadBtn?.addEventListener('click', load);
        const panel = listEl.closest('details.panel');
        if (panel) {
            panel.addEventListener('toggle', () => {
                if (panel.open && listEl.dataset.loaded !== '1') {
                    listEl.dataset.loaded = '1';
                    load();
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!window.TojiAPI?.TokenManager?.isLoggedIn?.()) return; // اللوجين شاشة عادي هيبقى قبل كده
        Object.keys(CONTENT_TYPES).forEach(initContentPanel);
        Object.keys(INBOX_TYPES).forEach(initInboxPanel);
    });

    // إعادة التفعيل بعد اللوجين (لو الصفحة متبنية على إظهار الأدمن بعد نجاح تسجيل الدخول)
    window.initExtraContentPanels = () => {
        Object.keys(CONTENT_TYPES).forEach(initContentPanel);
        Object.keys(INBOX_TYPES).forEach(initInboxPanel);
    };
})();
