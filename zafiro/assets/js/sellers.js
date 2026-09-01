/** Zafiro — contacto central (sin vendedor en la URL). */
const BRAND_WHATSAPP = '50495002199';

/**
 * Vendedores del portal (tarjetas NFC) — compartidos entre todas las marcas.
 * URL canónica portal: /v/{slug} → /?vendedor={slug}
 * URL por marca: /zafiro/v/{slug} → /zafiro?vendedor={slug}
 */
const SELLERS = {
  ramon: {
    name: 'Ramón Euceda',
    firstName: 'Ramón',
    whatsapp: '50432928908',
  },
  isaac: {
    name: 'Isaac Rodriguez',
    firstName: 'Isaac',
    whatsapp: '50431848938',
  },
  edson: {
    name: 'Edson Nuñez',
    firstName: 'Edson',
    whatsapp: '50432925571',
  },
  yeison: {
    name: 'Yeison Padilla',
    firstName: 'Yeison',
    whatsapp: '50432300141',
  },
  marvin: {
    name: 'Marvin Reyes',
    firstName: 'Marvin',
    whatsapp: '50498366204',
  },
  'jose-carlos': {
    name: 'Jose Carlos Dias',
    firstName: 'José Carlos',
    whatsapp: '50431527927',
  },
  nelson: {
    name: 'Nelson Leiva',
    firstName: 'Nelson',
    whatsapp: '50431548087',
  },
  edwin: {
    name: 'Edwin Ramos',
    firstName: 'Edwin',
    whatsapp: '50497811893',
  },
  ruth: {
    name: 'Ruth Alcerro',
    firstName: 'Ruth',
    whatsapp: '50494378923',
  },
  marwan: {
    name: 'Marwan Khaliliyeh',
    firstName: 'Marwan',
    whatsapp: '50496534139',
  },
  santiago: {
    name: 'Santiago',
    firstName: 'Santiago',
    whatsapp: '50496784674',
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
