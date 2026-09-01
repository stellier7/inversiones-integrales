/** Celima — contacto central (sin vendedor en la URL). */
const BRAND_WHATSAPP = '50495002199';

/**
 * Vendedores Celima (tarjetas NFC).
 * URL canónica: /celima/v/{slug} → redirige a /celima?vendedor={slug}
 */
const SELLERS = {
  ejemplo: {
    name: 'Vendedor Ejemplo',
    firstName: 'Ejemplo',
    whatsapp: '50400000000',
  },
};

function normalizeSellerKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** issaacc → isac, yeisson → yeison (typos con letras repetidas). */
function collapseSellerKey(value) {
  return normalizeSellerKey(value).replace(/(.)\1+/g, '$1');
}

function sellerEditDistance(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const prev = new Array(right.length + 1);
  const next = new Array(right.length + 1);
  for (let j = 0; j <= right.length; j += 1) prev[j] = j;

  for (let i = 1; i <= left.length; i += 1) {
    next[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      next[j] = Math.min(next[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= right.length; j += 1) prev[j] = next[j];
  }

  return prev[right.length];
}

function sellerMatchCandidates(sellerSlug, seller) {
  return [
    sellerSlug,
    normalizeSellerKey(seller.name),
    normalizeSellerKey(seller.firstName),
    collapseSellerKey(sellerSlug),
    collapseSellerKey(seller.name),
    collapseSellerKey(seller.firstName),
  ].filter(Boolean);
}

/** @returns {{ slug: string, name: string, firstName: string, whatsapp: string } | null} */
function resolveSeller(raw) {
  if (!raw) return null;

  const key = normalizeSellerKey(raw);
  if (!key) return null;

  if (SELLERS[key]) {
    return { slug: key, ...SELLERS[key] };
  }

  for (const [slug, seller] of Object.entries(SELLERS)) {
    if (normalizeSellerKey(seller.name) === key || normalizeSellerKey(seller.firstName) === key) {
      return { slug, ...seller };
    }
  }

  const collapsedKey = collapseSellerKey(key);
  const collapsedMatches = [];
  for (const [slug, seller] of Object.entries(SELLERS)) {
    const candidates = sellerMatchCandidates(slug, seller);
    if (candidates.includes(collapsedKey) || candidates.includes(key)) {
      collapsedMatches.push(slug);
    }
  }
  if (collapsedMatches.length === 1) {
    const slug = collapsedMatches[0];
    return { slug, ...SELLERS[slug] };
  }

  // Typos cercanos (ej. issaacc → isaac, yeisson → yeison), solo si hay un único mejor match.
  const fuzzyLimit = Math.min(2, Math.max(1, Math.floor(key.length / 4)));
  let bestSlug = null;
  let bestDistance = Infinity;
  let tie = false;

  for (const [slug, seller] of Object.entries(SELLERS)) {
    let distance = Infinity;
    for (const candidate of sellerMatchCandidates(slug, seller)) {
      distance = Math.min(distance, sellerEditDistance(key, candidate));
      distance = Math.min(distance, sellerEditDistance(collapsedKey, collapseSellerKey(candidate)));
    }
    if (distance < bestDistance) {
      bestDistance = distance;
      bestSlug = slug;
      tie = false;
    } else if (distance === bestDistance) {
      tie = true;
    }
  }

  if (bestSlug && !tie && bestDistance <= fuzzyLimit) {
    return { slug: bestSlug, ...SELLERS[bestSlug] };
  }

  return null;
}
