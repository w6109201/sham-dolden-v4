// Central contact and social links loaded by public pages.
(function () {
    const API_URL = window.location.protocol === "file:"
        ? "http://localhost:5000/api"
        : `${window.location.origin}/api`;

    const defaults = {
        phone: "",
        whatsapp: "",
        facebook: "https://www.facebook.com/share/1BjkjFqCdR/",
        instagram: "https://www.instagram.com/neccaryesir?igsi=MTV6cDVzZmw0bHczcg==",
        tiktok: "https://www.tiktok.com/@shamdolden?_r=1&_t=ZS-996jdiIObQG",
        x: "https://x.com/shamdolde"
    };
    let activeSettings = { ...defaults };

    function digitsOnly(value) {
        return String(value || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
    }

    function phoneHref(value) {
        const phone = String(value || "").trim();
        return phone ? `tel:${phone}` : "#";
    }

    function whatsappHref(value) {
        const input = String(value || "").trim();
        if (!input) return "#";
        if (/^https?:\/\//i.test(input)) return input;
        const phone = digitsOnly(input);
        return phone ? `https://wa.me/${phone}` : "#";
    }

    function updateLinks(settings) {
        const values = { ...defaults, ...settings };
        document.querySelectorAll('[data-contact-link="phone"]').forEach((link) => {
            link.href = phoneHref(values.phone);
        });
        document.querySelectorAll('[data-contact-link="whatsapp"]').forEach((link) => {
            link.href = whatsappHref(values.whatsapp);
        });
        document.querySelectorAll('.btn-whatsapp').forEach((link) => {
            link.href = whatsappHref(values.whatsapp);
        });
        ["facebook", "instagram", "tiktok", "x"].forEach((network) => {
            document.querySelectorAll(`[data-social-link="${network}"]`).forEach((link) => {
                if (values[network]) link.href = values[network];
            });
        });
    }

    updateLinks(activeSettings);
    fetch(`${API_URL}/settings`)
        .then((response) => response.ok ? response.json() : {})
        .then((settings) => {
            activeSettings = { ...defaults, ...(settings || {}) };
            updateLinks(activeSettings);
        })
        .catch(() => updateLinks(activeSettings));

    new MutationObserver(() => updateLinks(activeSettings)).observe(document.body, {
        childList: true,
        subtree: true
    });
})();
