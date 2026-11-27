/**
 * Utilidades de Sanitización y Neutralización de HTML (WCAG 2.2 / OWASP ASVS).
 * Diseñado con enfoque fail-closed: opera de manera nativa sin dependencias externas obligatorias
 * utilizando el DOMParser del navegador, previniendo XSS, inyecciones en iframe y URLs javascript:.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'span', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'table', 'thead',
  'tbody', 'tr', 'th', 'td', 'a', 'div', 'hr', 'code', 'pre', 'figure',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'title', 'target', 'rel', 'class', 'className',
  'aria-label', 'aria-hidden', 'role',
]);

export function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function convertYouTubeEmbedsToCards(html) {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const iframes = doc.querySelectorAll('iframe');
    if (iframes.length === 0) return html;

    iframes.forEach((iframe) => {
      const src = iframe.getAttribute('src') || '';
      const ytMatch = src.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]+)/i);
      if (ytMatch) {
        const videoId = ytMatch[1];
        const card = doc.createElement('div');
        card.className =
          'my-4 p-4 rounded-xl border border-blue-200 bg-blue-50/70 dark:bg-slate-800/80 dark:border-blue-900/40 text-sm';
        const headerDiv = doc.createElement('div');
        headerDiv.className = 'flex items-center gap-2';
        const titleSpan = doc.createElement('span');
        titleSpan.className = 'font-semibold text-blue-900 dark:text-blue-300';
        titleSpan.textContent = '📹 Video Tutorial Institucional';
        headerDiv.appendChild(titleSpan);

        const descP = doc.createElement('p');
        descP.className = 'mt-1 text-slate-600 dark:text-slate-400';
        descP.textContent = 'Puedes ver este instructivo en YouTube:';

        const linkA = doc.createElement('a');
        linkA.href = `https://www.youtube.com/watch?v=${videoId}`;
        linkA.target = '_blank';
        linkA.rel = 'noopener noreferrer';
        linkA.className =
          'inline-flex items-center gap-1 mt-2 font-medium text-blue-700 dark:text-blue-400 hover:underline';
        linkA.textContent = 'Abrir video en YouTube ↗';

        card.appendChild(headerDiv);
        card.appendChild(descP);
        card.appendChild(linkA);
        iframe.replaceWith(card);
      } else {
        iframe.remove();
      }
    });

    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

function cleanElementTree(element) {
  const children = Array.from(element.childNodes);

  for (const node of children) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      // SonarQube & OWASP: Rechazar etiquetas no permitidas como script, iframe, embed, object
      if (!ALLOWED_TAGS.has(tagName)) {
        node.remove();
        continue;
      }

      // Filtrar atributos
      const attrs = Array.from(node.attributes);
      for (const attr of attrs) {
        const attrName = attr.name.toLowerCase();

        // Eliminar manejadores de eventos (onclick, onerror, onload, etc.)
        if (attrName.startsWith('on') || !ALLOWED_ATTRS.has(attrName)) {
          node.removeAttribute(attr.name);
          continue;
        }

        // Validar URIs seguras en enlaces (bloquear javascript:, vbscript:, data:)
        if (attrName === 'href') {
          const val = attr.value.trim().toLowerCase();
          if (val.startsWith('javascript:') || val.startsWith('vbscript:') || val.startsWith('data:')) {
            node.removeAttribute('href');
          }
        }
      }

      // Endurecer enlaces externos
      if (tagName === 'a') {
        const href = node.getAttribute('href') || '';
        if (/^https?:\/\//i.test(href)) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }

      // Recursión sobre nodos hijos
      cleanElementTree(node);
    } else if (node.nodeType !== Node.TEXT_NODE && node.nodeType !== Node.COMMENT_NODE) {
      node.remove();
    }
  }
}

/**
 * Sanitiza contenido HTML para visualización segura en la interfaz.
 * Fallback fail-closed ante cualquier error.
 */
export function sanitizeArticleHtml(html) {
  if (typeof html !== 'string' || !html) return '';

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return escapeHtml(html);
  }

  try {
    const preprocessed = convertYouTubeEmbedsToCards(html);
    const parser = new DOMParser();
    const doc = parser.parseFromString(preprocessed, 'text/html');

    cleanElementTree(doc.body);
    return doc.body.innerHTML;
  } catch {
    return escapeHtml(html);
  }
}
