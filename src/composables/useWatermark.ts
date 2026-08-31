/**
 * 水印功能 Composable
 * 水印功能
 *
 * 在指定元素上绘制文字水印，支持防篡改（MutationObserver）
 */

import { onBeforeUnmount, ref, watch } from 'vue';

interface WatermarkOptions {
  /** 水印文字 */
  content?: string;
  /** 字体 */
  font?: string;
  /** 文字颜色 */
  textColor?: string;
  /** 水印宽度 */
  width?: number;
  /** 水印高度 */
  height?: number;
  /** 旋转角度 */
  rotate?: number;
  /** 透明度 */
  opacity?: number;
  /** z-index */
  zIndex?: number;
}

const defaultOptions: Required<WatermarkOptions> = {
  content: '',
  font: '14px sans-serif',
  height: 200,
  opacity: 0.15,
  rotate: -20,
  textColor: 'rgba(0, 0, 0, 0.15)',
  width: 300,
  zIndex: 9999,
};

export function useWatermark(
  target: HTMLElement | null,
  options: WatermarkOptions = {},
) {
  const watermarkEl = ref<HTMLElement | null>(null);
  let observer: MutationObserver | null = null;
  const mergedOptions = { ...defaultOptions, ...options };

  /** 创建水印 */
  const createWatermark = () => {
    if (!target || !mergedOptions.content) {
      return;
    }

    // 移除旧水印
    removeWatermark();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = mergedOptions.width;
    canvas.height = mergedOptions.height;

    ctx.font = mergedOptions.font;
    ctx.fillStyle = mergedOptions.textColor;
    ctx.globalAlpha = mergedOptions.opacity;
    ctx.translate(mergedOptions.width / 2, mergedOptions.height / 2);
    ctx.rotate((mergedOptions.rotate * Math.PI) / 180);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mergedOptions.content, 0, 0);

    const base64Url = canvas.toDataURL();

    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.pointerEvents = 'none';
    el.style.backgroundImage = `url(${base64Url})`;
    el.style.backgroundRepeat = 'repeat';
    el.style.zIndex = String(mergedOptions.zIndex);

    // 确保目标元素有定位
    const position = getComputedStyle(target).position;
    if (position === 'static') {
      target.style.position = 'relative';
    }

    target.appendChild(el);
    watermarkEl.value = el;

    // 防篡改监听
    setupMutationObserver();
  };

  /** 移除水印 */
  const removeWatermark = () => {
    if (watermarkEl.value && watermarkEl.value.parentNode) {
      watermarkEl.value.parentNode.removeChild(watermarkEl.value);
      watermarkEl.value = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  /** 设置 MutationObserver 防篡改 */
  const setupMutationObserver = () => {
    if (!watermarkEl.value || !target) return;

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // 水印被删除
        if (
          mutation.type === 'childList' &&
          Array.from(mutation.removedNodes).includes(watermarkEl.value!)
        ) {
          createWatermark();
          return;
        }
        // 水印属性被修改
        if (mutation.target === watermarkEl.value) {
          createWatermark();
          return;
        }
      }
    });

    observer.observe(target, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  };

  /** 更新水印内容 */
  const update = (newOptions: WatermarkOptions) => {
    Object.assign(mergedOptions, newOptions);
    createWatermark();
  };

  // 监听目标元素变化
  watch(
    () => mergedOptions.content,
    () => {
      createWatermark();
    },
  );

  // 清理
  onBeforeUnmount(() => {
    removeWatermark();
  });

  return {
    createWatermark,
    removeWatermark,
    update,
    watermarkEl,
  };
}

/** 便捷函数：在 body 上添加水印 */
export function addWatermarkToBody(content: string, options?: WatermarkOptions) {
  if (!content) return;

  const target = document.body;
  const { removeWatermark } = useWatermark(target, {
    content,
    ...options,
  });

  return { removeWatermark };
}
