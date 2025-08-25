export const sanitizeSchema = {
  tagNames: [
    'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'hr', 'img', 'li', 'ol', 'p', 'pre', 'span', 'strong', 'table', 'tbody', 'td', 'th',
    'thead', 'tr', 'ul'
  ],
  attributes: {
    a: ['href', 'title', 'rel', 'target'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    '*': ['className']
  }
} as const;
