/**
 * 拼音音调工具函数
 * 将无声调拼音 + 音调编号 → 带音标拼音
 */

// 音调符号映射
const TONE_MARKS: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  v: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'v'], // v 作为 ü 的替代输入
} as const;

type Vowel = keyof typeof TONE_MARKS;

// 带音标字符 → 无声调字符
const TONE_MARK_TO_PLAIN: Record<string, string> = {};
for (const [plain, tones] of Object.entries(TONE_MARKS)) {
  tones.forEach((mark) => {
    if (mark !== plain) {
      TONE_MARK_TO_PLAIN[mark] = plain;
    }
  });
}

/**
 * 查找音调应该标在哪个字符上
 * 规则：有 a 标 a，有 e 标 e；iu/ui 标在后；其他标主元音
 */
function findTonePosition(syllable: string): number {
  const s = syllable.toLowerCase();

  // 优先级 1: a 或 e
  const aIndex = s.indexOf('a');
  if (aIndex !== -1) return aIndex;
  const eIndex = s.indexOf('e');
  if (eIndex !== -1) return eIndex;

  // 优先级 2: iu 或 ui 标在后
  const iuIndex = s.indexOf('iu');
  if (iuIndex !== -1) return iuIndex + 1;
  const uiIndex = s.indexOf('ui');
  if (uiIndex !== -1) return uiIndex + 1;

  // 优先级 3: 从后往前找主元音 (o, u, i, ü)
  const vowels = new Set(['i', 'o', 'u', 'ü', 'v']);
  for (let i = s.length - 1; i >= 0; i--) {
    const ch = s[i];
    if (ch && vowels.has(ch)) return i;
  }

  return -1;
}

/**
 * 获取拼音音节的所有音调选项
 * @param syllable 无声调拼音，如 "zhong"、"chuan"
 * @returns 5 个音调选项 [1声, 2声, 3声, 4声, 轻声]
 */
export function getToneOptions(syllable: string): string[] {
  if (!syllable) return ['', '', '', '', ''];

  const toneIndex = findTonePosition(syllable);
  if (toneIndex === -1) {
    return [syllable, syllable, syllable, syllable, syllable];
  }

  const vowel = syllable[toneIndex]?.toLowerCase() as undefined | Vowel;
  const marks = vowel ? TONE_MARKS[vowel] : undefined;
  const finalMarks = marks ?? TONE_MARKS.a ?? ['a'];

  return finalMarks.map((mark) => {
    const chars = [...syllable];
    chars[toneIndex] = mark;
    return chars.join('');
  });
}

/**
 * 给拼音音节添加指定音调
 * @param syllable 无声调拼音
 * @param tone 音调 1-5（5=轻声）
 * @returns 带音标拼音
 */
export function applyTone(syllable: string, tone: number): string {
  const options = getToneOptions(syllable);
  return options[tone - 1] ?? syllable;
}

/**
 * 移除拼音中的音调符号，转为无声调
 * @param pinyin 带音标拼音
 * @returns 无声调拼音
 */
export function removeTone(pinyin: string): string {
  return [...pinyin].map((ch) => TONE_MARK_TO_PLAIN[ch] || ch).join('');
}

/**
 * 从带音标拼音中提取音调编号
 * @param tonedPinyin 带音标拼音，如 "zhōng"
 * @returns 音调 1-5，无法识别返回 0
 */
export function getToneFromPinyin(tonedPinyin: string): number {
  for (const ch of tonedPinyin) {
    for (const [, tones] of Object.entries(TONE_MARKS)) {
      const idx = tones.indexOf(ch);
      if (idx !== -1) return idx + 1;
    }
  }
  return 0;
}

/**
 * 将拼音字符串按空格分割为音节数组
 * @param pinyinStr "chuáng qián míng yuè guāng"
 * @returns ["chuáng", "qián", "míng", "yuè", "guāng"]
 */
export function splitPinyinSyllables(pinyinStr: string): string[] {
  return pinyinStr.trim().split(/\s+/).filter(Boolean);
}
