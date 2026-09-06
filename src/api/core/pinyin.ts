import { requestClient } from '#/api/request';

/**
 * 根据汉字生成拼音
 * @param text 汉字文本
 * @returns 拼音字符串（空格分隔，行间用 | 分隔）
 */
export async function generatePinyinApi(text: string): Promise<string> {
  return requestClient.post<string>('/tools/generate-pinyin', { text });
}
