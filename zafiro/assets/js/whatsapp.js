/** Shared WhatsApp helpers (vendedor activo o contacto central de la marca). */

function activeWhatsAppNumber() {
  const seller =
    (typeof getActiveSeller === 'function' ? getActiveSeller() : null) ||
    (typeof getResolvedSeller === 'function' ? getResolvedSeller() : null);
  return seller?.whatsapp || BRAND_WHATSAPP;
}

function whatsAppUrl(message, phone = activeWhatsAppNumber()) {
  const base = 'https://wa.me/' + phone;
  if (!message) return base;
  return base + '?text=' + encodeURIComponent(message);
}
