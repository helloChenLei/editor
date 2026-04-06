/**
 * Markdown 渲染引擎
 * 复用前端 editor-methods.js 的排版逻辑
 */

const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');
const { JSDOM } = require('jsdom');
const { STYLES } = require('./styles');

/**
 * 创建 markdown-it 实例
 * @returns {MarkdownIt}
 */
function createMarkdownParser() {
  return new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
    highlight: function (str, lang) {
      // Mermaid 图表特殊处理
      if (lang && ['mermaid', 'flowchart', 'graph'].includes(lang)) {
        return `<div class="mermaid">${str}</div>`;
      }

      // 代码高亮
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        } catch (_) {
          return str;
        }
      }
      return str;
    }
  });
}

/**
 * 预处理 Markdown 内容
 * @param {string} content
 * @returns {string}
 */
function preprocessMarkdown(content) {
  // 过滤引用角标
  content = stripCitationMarkers(content);

  // 规范化水平分割线格式
  content = content.replace(/^[ ]{0,3}(\*[ ]*\*[ ]*\*[\* ]*)[ \t]*$/gm, '***');
  content = content.replace(/^[ ]{0,3}(-[ ]*-[ ]*-[- ]*)[ \t]*$/gm, '---');
  content = content.replace(/^[ ]{0,3}(_[ ]*_[ ]*_[_ ]*)[ \t]*$/gm, '___');

  // 修复加粗格式断裂问题
  content = content.replace(/\*\*\s+\*\*/g, ' ');
  content = content.replace(/\*{4,}/g, '');
  content = content.replace(/__\s+__/g, ' ');
  content = content.replace(/_{4,}/g, '');

  // 规范化列表项格式
  content = content.replace(/^(\s*(?:\d+\.|-|\*)\s+[^:\n]+)\n\s*:\s*(.+?)$/gm, '$1: $2');
  content = content.replace(/^(\s*(?:\d+\.|-|\*)\s+.+?:)\s*\n\s+(.+?)$/gm, '$1 $2');

  return content;
}

/**
 * 过滤引用角标
 * @param {string} content
 * @returns {string}
 */
function stripCitationMarkers(content) {
  return content.replace(/\uE200cite\uE202[^\uE201]*\uE201/g, '');
}

/**
 * 应用内联样式到 HTML
 * @param {string} html
 * @param {string} styleKey
 * @returns {string}
 */
function applyInlineStyles(html, styleKey) {
  const style = STYLES[styleKey]?.styles || STYLES['wechat-default'].styles;
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // 先处理图片网格布局
  groupConsecutiveImages(doc);

  // 应用样式到各个元素
  Object.keys(style).forEach(selector => {
    if (selector === 'pre' || selector === 'code' || selector === 'pre code' || selector === 'container') {
      return;
    }

    const elements = doc.querySelectorAll(selector);
    elements.forEach(el => {
      // 如果是图片且在网格容器内，跳过样式应用
      if (el.tagName === 'IMG' && el.closest('.image-grid')) {
        return;
      }

      const currentStyle = el.getAttribute('style') || '';
      el.setAttribute('style', currentStyle + '; ' + style[selector]);
    });
  });

  // 标题内的行内元素统一继承标题颜色
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const headingInlineOverrides = {
    strong: 'font-weight: 700; color: inherit !important; background-color: transparent !important;',
    em: 'font-style: italic; color: inherit !important; background-color: transparent !important;',
    a: 'color: inherit !important; text-decoration: none !important; border-bottom: 1px solid currentColor !important; background-color: transparent !important;',
    code: 'color: inherit !important; background-color: transparent !important; border: none !important; padding: 0 !important;',
    span: 'color: inherit !important; background-color: transparent !important;',
    b: 'font-weight: 700; color: inherit !important; background-color: transparent !important;',
    i: 'font-style: italic; color: inherit !important; background-color: transparent !important;',
  };
  const headingInlineSelectorList = Object.keys(headingInlineOverrides).join(', ');

  headings.forEach(heading => {
    const inlineNodes = heading.querySelectorAll(headingInlineSelectorList);
    inlineNodes.forEach(node => {
      const tag = node.tagName.toLowerCase();
      let override = headingInlineOverrides[tag];
      if (!override) return;

      const currentStyle = node.getAttribute('style') || '';
      const sanitizedStyle = currentStyle
        .replace(/color:\s*[^;]+;?/gi, '')
        .replace(/background(?:-color)?:\s*[^;]+;?/gi, '')
        .replace(/border(?:-bottom)?:\s*[^;]+;?/gi, '')
        .replace(/padding:\s*[^;]+;?/gi, '')
        .replace(/;\s*;/g, ';')
        .trim();
      node.setAttribute('style', sanitizedStyle + '; ' + override);
    });
  });

  // 创建容器并应用容器样式
  const container = doc.createElement('div');
  container.setAttribute('style', style.container);
  container.innerHTML = doc.body.innerHTML;

  return container.outerHTML;
}

/**
 * 将连续图片分组为网格布局
 * @param {Document} doc
 */
function groupConsecutiveImages(doc) {
  const body = doc.body;
  const children = Array.from(body.children);

  let imagesToProcess = [];

  children.forEach((child, index) => {
    if (child.tagName === 'P') {
      const images = child.querySelectorAll('img');
      if (images.length > 0) {
        if (images.length > 1) {
          const group = Array.from(images).map(img => ({
            element: child,
            img: img,
            index: index,
            inSameParagraph: true,
            paragraphImageCount: images.length
          }));
          imagesToProcess.push(...group);
        } else if (images.length === 1) {
          imagesToProcess.push({
            element: child,
            img: images[0],
            index: index,
            inSameParagraph: false,
            paragraphImageCount: 1
          });
        }
      }
    } else if (child.tagName === 'IMG') {
      imagesToProcess.push({
        element: child,
        img: child,
        index: index,
        inSameParagraph: false,
        paragraphImageCount: 1
      });
    }
  });

  // 分组逻辑
  let groups = [];
  let currentGroup = [];

  imagesToProcess.forEach((item, i) => {
    if (i === 0) {
      currentGroup.push(item);
    } else {
      const prevItem = imagesToProcess[i - 1];
      let isContinuous = false;

      if (item.index === prevItem.index) {
        isContinuous = true;
      } else if (item.index - prevItem.index === 1) {
        isContinuous = true;
      }

      if (isContinuous) {
        currentGroup.push(item);
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [item];
      }
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // 处理每组图片
  groups.forEach(group => {
    if (group.length < 2) return;

    const imageCount = group.length;
    const firstElement = group[0].element;

    // 创建网格容器
    const gridContainer = doc.createElement('div');
    gridContainer.setAttribute('class', 'image-grid');
    gridContainer.setAttribute('data-image-count', imageCount);

    // 根据图片数量设置网格样式
    let gridStyle = '';
    let columns = 2;

    if (imageCount === 2) {
      gridStyle = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin: 20px auto;
        max-width: 100%;
        align-items: start;
      `;
      columns = 2;
    } else if (imageCount === 3) {
      gridStyle = `
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin: 20px auto;
        max-width: 100%;
        align-items: start;
      `;
      columns = 3;
    } else if (imageCount === 4) {
      gridStyle = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin: 20px auto;
        max-width: 100%;
        align-items: start;
      `;
      columns = 2;
    } else {
      gridStyle = `
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin: 20px auto;
        max-width: 100%;
        align-items: start;
      `;
      columns = 3;
    }

    gridContainer.setAttribute('style', gridStyle);
    gridContainer.setAttribute('data-columns', columns);

    // 将图片添加到容器中
    group.forEach((item) => {
      const imgWrapper = doc.createElement('div');
      imgWrapper.setAttribute('style', `
        width: 100%;
        height: auto;
        overflow: hidden;
      `);

      const img = item.img.cloneNode(true);
      img.setAttribute('style', `
        width: 100%;
        height: auto;
        display: block;
        border-radius: 8px;
      `.trim());

      imgWrapper.appendChild(img);
      gridContainer.appendChild(imgWrapper);
    });

    // 替换原来的图片元素
    firstElement.parentNode.insertBefore(gridContainer, firstElement);

    // 删除原来的图片元素
    const elementsToRemove = new Set();
    group.forEach(item => {
      elementsToRemove.add(item.element);
    });
    elementsToRemove.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
  });
}

/**
 * 渲染 Markdown 为 HTML
 * @param {string} markdown - Markdown 内容
 * @param {string} styleKey - 样式键名
 * @returns {string} HTML 内容
 */
function renderMarkdown(markdown, styleKey = 'wechat-default') {
  const md = createMarkdownParser();

  // 预处理
  const processedContent = preprocessMarkdown(markdown);

  // 渲染
  let html = md.render(processedContent);

  // 应用样式
  html = applyInlineStyles(html, styleKey);

  return html;
}

module.exports = {
  renderMarkdown,
  preprocessMarkdown,
  stripCitationMarkers,
  applyInlineStyles,
};
