// ==========================================
// إعدادات لوحة التحكم - متوافقة مع سيرفر Node.js & MySQL
// ==========================================
const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    loadBaronSettings();
    loadAdminBotReplies();

    // ربط أزرار الحفظ الفردية للإعدادات
    document.getElementById("save-phone-btn")?.addEventListener("click", () => saveSingleField('phone', document.getElementById('set-phone').value, "رقم الهاتف"));
    document.getElementById("save-whatsapp-btn")?.addEventListener("click", () => saveSingleField('whatsapp', document.getElementById('set-whatsapp').value, "رقم الواتساب"));
    document.getElementById("save-facebook-btn")?.addEventListener("click", () => saveSingleField('facebook', document.getElementById('set-facebook').value, "رابط الفيسبوك"));
    document.getElementById("save-instagram-btn")?.addEventListener("click", () => saveSingleField('instagram', document.getElementById('set-instagram').value, "رابط الانستغرام"));
    document.getElementById("save-tiktok-btn")?.addEventListener("click", () => saveSingleField('tiktok', document.getElementById('set-tiktok').value, "رابط التيك توك"));
    document.getElementById("save-x-btn")?.addEventListener("click", () => saveSingleField('x', document.getElementById('set-x').value, "رابط إكس"));

    // ربط أزرار المجيب الآلي
    document.getElementById("add-bot-reply-btn")?.addEventListener("click", addNewBotReply);
    document.getElementById("save-edit-btn")?.addEventListener("click", saveEditedBotReply);
    document.getElementById("cancel-edit-btn")?.addEventListener("click", cancelEditBotReply);
});

// دالة لعرض الإشعارات المرئية العائمة
function showNotification(message, type = 'success') {
    let notif = document.getElementById('admin-floating-notification');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'admin-floating-notification';
        notif.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 9999;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: inherit;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: opacity 0.3s ease;
            direction: rtl;
        `;
        document.body.appendChild(notif);
    }

    notif.style.background = type === 'success' ? '#27ae60' : '#e74c3c';
    notif.style.color = '#fff';
    notif.textContent = message;
    notif.style.opacity = '1';

    setTimeout(() => {
        notif.style.opacity = '0';
    }, 3500);
}

// 1. جلب الإعدادات من MySQL عبر سيرفر Node.js
async function loadBaronSettings() {
    try {
        const response = await fetch(`${API_URL}/settings`);
        const data = await response.json();

        if (data) {
            document.getElementById('set-phone').value = data.phone || '';
            document.getElementById('set-whatsapp').value = data.whatsapp || '';
            document.getElementById('set-facebook').value = data.facebook || '';

            const setInstagram = document.getElementById('set-instagram');
            if (setInstagram) setInstagram.value = data.instagram || '';

            const setTiktok = document.getElementById('set-tiktok');
            if (setTiktok) setTiktok.value = data.tiktok || '';

            const setX = document.getElementById('set-x');
            if (setX) setX.value = data.x || '';
        }
    } catch (error) {
        console.error("خطأ في جلب الإعدادات:", error);
    }
}

// 2. حفظ حقل منفرد في جدول settings عبر MySQL
async function saveSingleField(fieldName, fieldValue, fieldNameAr) {
    try {
        const response = await fetch(`${API_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [fieldName]: fieldValue })
        });

        const result = await response.json();
        if (response.ok && result && result.error === undefined) {
            showNotification(`✅ تم تحديث ${fieldNameAr} بنجاح!`, "success");
        } else {
            showNotification(`❌ فشل حفظ ${fieldNameAr}`, "error");
        }
    } catch (error) {
        showNotification(`❌ خطأ في الاتصال بالسيرفر`, "error");
    }
}

// ==========================================
// 🤖 قسم إدارة ردود المجيب الآلي (MySQL - bot_replies)
// ==========================================

async function loadAdminBotReplies() {
    const tableBody = document.getElementById("bot-replies-table-body");
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_URL}/bot-replies`);
        const data = await response.json();

        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">لا توجد ردود مسجلة حالياً</td></tr>`;
            return;
        }

        tableBody.innerHTML = data.map(item => {
            const isActive = item.is_active === 1 || item.is_active === true;
            const publishBtnText = isActive ? "إلغاء النشر" : "نشر";
            const publishBtnColor = isActive ? "#f39c12" : "#27ae60";

            return `
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 10px; font-weight: bold;">${item.trigger_keyword || ''}</td>
              <td style="padding: 10px; color: var(--text-muted);">${item.reply_text || ''}</td>
              <td style="padding: 10px; text-align: center;">
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${isActive ? 'rgba(39, 174, 96, 0.2)' : 'rgba(231, 76, 60, 0.2)'}; color: ${isActive ? '#27ae60' : '#e74c3c'};">
                    ${isActive ? 'منشور' : 'غير منشور'}
                </span>
              </td>
              <td style="padding: 10px; text-align: center;">
                <button class="btn-primary" onclick="prepareEditBotReply(${item.id}, '${encodeURIComponent(item.trigger_keyword || '')}', '${encodeURIComponent(item.reply_text || '')}')" style="background: #3498db; color: white;">تعديل</button>
                <button class="btn-primary" onclick="togglePublishBotReply(${item.id}, ${isActive})" style="background: ${publishBtnColor}; color: white;">${publishBtnText}</button>
                <button class="btn-primary" onclick="deleteBotReply(${item.id})" style="background: #e74c3c; color: white;">حذف</button>
              </td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("خطأ في جلب الردود الآلية:", error);
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">فشل في تحميل الردود من السيرفر</td></tr>`;
    }
}

// إضافة رد جديد عبر MySQL
async function addNewBotReply() {
    const pageTargetInput = document.getElementById("new-page-target");
    const triggerInput = document.getElementById("new-trigger");
    const replyInput = document.getElementById("new-reply");

    const page_target = pageTargetInput ? pageTargetInput.value : "general";
    const trigger_keyword = triggerInput.value.trim();
    const reply_text = replyInput.value.trim();

    if (!trigger_keyword || !reply_text) {
        showNotification("يرجى ملء حقل السؤال وحقل الرد قبل الإضافة.", "error");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/bot-replies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page_target, trigger_keyword, reply_text, is_active: true })
        });

        const result = await response.json();
        if (result.success) {
            triggerInput.value = "";
            replyInput.value = "";
            if (pageTargetInput) pageTargetInput.value = "general";
            loadAdminBotReplies();
            showNotification("✅ تم إضافة الرد بنجاح!", "success");
        } else {
            showNotification("❌ فشل إضافة الرد", "error");
        }
    } catch (error) {
        showNotification("❌ خطأ في الاتصال بالسيرفر", "error");
    }
}

// تبديل حالة النشر في MySQL
async function togglePublishBotReply(id, currentState) {
    const newState = !currentState;

    try {
        const response = await fetch(`${API_URL}/bot-replies/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: newState })
        });

        const result = await response.json();
        if (result.success) {
            loadAdminBotReplies();
            showNotification("🔄 تم تحديث حالة النشر بنجاح", "success");
        }
    } catch (error) {
        showNotification("❌ خطأ في الاتصال بالسيرفر", "error");
    }
}

function prepareEditBotReply(id, encodedKeyword, encodedReply) {
    document.getElementById("edit-form-container").style.display = "block";
    document.getElementById("edit-id").value = id;
    document.getElementById("edit-trigger").value = decodeURIComponent(encodedKeyword);
    document.getElementById("edit-reply").value = decodeURIComponent(encodedReply);
    document.getElementById("edit-form-container").scrollIntoView({ behavior: 'smooth' });
}

// حفظ التعديل في MySQL
async function saveEditedBotReply() {
    const id = document.getElementById("edit-id").value;
    const trigger_keyword = document.getElementById("edit-trigger").value.trim();
    const reply_text = document.getElementById("edit-reply").value.trim();

    if (!trigger_keyword || !reply_text) {
        showNotification("لا يمكن ترك الحقول فارغة!", "error");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/bot-replies/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trigger_keyword, reply_text })
        });

        const result = await response.json();
        if (result.success) {
            document.getElementById("edit-form-container").style.display = "none";
            loadAdminBotReplies();
            showNotification("✅ تم حفظ التعديلات بنجاح", "success");
        }
    } catch (error) {
        showNotification("❌ خطأ في الاتصال بالسيرفر", "error");
    }
}

function cancelEditBotReply() {
    document.getElementById("edit-form-container").style.display = "none";
}

// حذف رد من MySQL
async function deleteBotReply(id) {
    if (!confirm("هل أنت متأكد من حذف هذا الرد الآلي؟")) return;

    try {
        const response = await fetch(`${API_URL}/bot-replies/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
            loadAdminBotReplies();
            showNotification("🗑️ تم حذف الرد بنجاح", "success");
        }
    } catch (error) {
        showNotification("❌ خطأ في الاتصال بالسيرفر", "error");
    }
}