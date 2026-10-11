// Arabic → Egyptian uniliteral hieroglyph transliteration.
//
// NOTE: Egyptian hieroglyphs encode the Ancient Egyptian language, not Arabic,
// so this is a phonetic *transliteration cipher* (like Egyptologists use for
// foreign names), not a translation. Fittingly, Egyptian — like Arabic script —
// wrote consonants and omitted short vowels, so we strip Arabic harakat.
// Signs use Gardiner-standard uniliterals from the Unicode Egyptian Hieroglyphs block.

const MAP = {
  // aleph family → ꜣ (vulture, G1)
  'ا': '𓄿', 'أ': '𓄿', 'إ': '𓄿', 'آ': '𓄿', 'ٱ': '𓄿',
  'ء': '𓄿', // hamza ≈ aleph
  'ب': '𓃀', // b — foot (D58)
  'ت': '𓏏', // t — bread loaf (X1)
  'ث': '𓍿', // ṯ — (originally θ)
  'ج': '𓎼', // g — jar stand (W11)
  'ح': '𓎛', // ḥ — wick (V28)
  'خ': '𓐍', // ḫ — placenta (Aa1)
  'د': '𓂧', // d — hand (D46)
  'ذ': '𓆓', // ḏ — cobra (I10)
  'ر': '𓂋', // r — mouth (D21)
  'ز': '𓊃', // z — door bolt (O34)
  'س': '𓋴', // s — folded cloth (S29)
  'ش': '𓈎', // š — pool (N37)
  'ص': '𓊃', // ṣ ≈ z/s family
  'ض': '𓆓', // ḍ ≈ ḏ family
  'ط': '𓏏', // ṭ ≈ t
  'ظ': '𓍿', // ẓ ≈ ṯ
  'ع': '𓂝', // ꜥ — arm (D36)
  'غ': '𓎼', // ġ ≈ g
  'ف': '𓆑', // f — horned viper (I9)
  'ق': '𓈕', // q — hill country (N25)
  'ك': '𓎡', // k — basket (V31)
  'ل': '𓃭', // l — lion (E23, later used for l)
  'م': '𓅓', // m — owl (G17)
  'ن': '𓈖', // n — water ripple (N35)
  'ه': '𓉐', // h — house (O1)
  'ة': '𓏏', // tāʾ marbūṭa → t
  'و': '𓅱', // w — quail chick (G43)
  'ؤ': '𓅱', // hamza on waw
  'ي': '𓇋', // y — reed leaf (M17)
  'ئ': '𓇋', // hamza on ya
  'ى': '𓇋', // alef maqsura → y
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  ' ': ' ', '\n': '\n', ' ': ' ',
};

// Arabic diacritics (harakat, tanween, shadda, sukun, quranic marks) — dropped,
// mirroring how Egyptian omitted vowels.
// eslint-disable-next-line no-misleading-character-class
const DIACRITICS = /[ً-ٰٟۖ-ۭ]/g;

/** Transliterate Arabic text into hieroglyphic signs (unknown chars pass through). */
export function toHieroglyphs(text) {
  const stripped = text.replace(DIACRITICS, '');
  let out = '';
  for (const ch of stripped) {
    out += MAP[ch] !== undefined ? MAP[ch] : (/[ؐ-ؚ٠-٩]/.test(ch) ? '' : ch);
  }
  return out;
}
