/**
 * 三端渲染一致性快照测试
 *
 * 基准：首页编辑器渲染链路
 * 对比：CLI typeset 渲染链路、分享页渲染链路
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { describe, it } = require('node:test');
const assert = require('node:assert');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');
const { JSDOM } = require('jsdom');
const renderCore = require('../../frontend/render-core.js');
const { renderMarkdown } = require('../src/lib/renderer');
const { STYLES } = require('../src/lib/styles');

const SNAPSHOT_PATH = path.join(__dirname, 'snapshots', 'render-consistency.snapshot.json');
const UPDATE_SNAPSHOT = process.env.UPDATE_SNAPSHOT === '1';

const STYLE_KEYS = ['wechat-default', 'wechat-tech', 'nikkei'];

const SAMPLE_MARKDOWN = `# 一致性回归样例

Hello \uE200cite\uE202turn9search1\uE201 World

## 列表续行

1. 第一项
: 说明应该被并到同一行

- 列表项A

  这段应自动并到上一行

---

## 代码块

\`\`\`js
const x = 1;
console.log(x);
\`\`\`

## Mermaid

\`\`\`mermaid
graph TD;
  A-->B;
\`\`\`

## 多图

![img1](https://example.com/1.png)
![img2](https://example.com/2.png)

### 标题里的 **bold** 和 [link](https://example.com)
`;

function parseHtmlInNode(html) {
  return new JSDOM(html).window.document;
}

function normalizeHtml(html) {
  return String(html).replace(/\r\n/g, '\n');
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function renderHomepagePipeline(markdown, styleKey) {
  const md = renderCore.createMarkdownParser({
    markdownit: MarkdownIt,
    hljs,
  });
  const processed = renderCore.preprocessMarkdown(markdown);
  const html = md.render(processed);
  return renderCore.applyInlineStyles(html, {
    styles: STYLES,
    styleKey,
    parseHtml: parseHtmlInNode,
  });
}

function renderSharePipeline(markdown, styleKey) {
  // 分享页当前使用同一套渲染链路：create parser -> preprocess -> render -> apply styles
  const md = renderCore.createMarkdownParser({
    markdownit: MarkdownIt,
    hljs,
  });
  const processed = renderCore.preprocessMarkdown(markdown);
  const html = md.render(processed);
  return renderCore.applyInlineStyles(html, {
    styles: STYLES,
    styleKey,
    parseHtml: parseHtmlInNode,
  });
}

function ensureSnapshotDir() {
  const dir = path.dirname(SNAPSHOT_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

describe('render consistency snapshot', () => {
  it('homepage baseline should match cli/share and snapshot hashes', () => {
    const homepageOutputs = {};
    const cliOutputs = {};
    const shareOutputs = {};
    const homepageHashes = {};

    for (const styleKey of STYLE_KEYS) {
      const homepageHtml = normalizeHtml(renderHomepagePipeline(SAMPLE_MARKDOWN, styleKey));
      const cliHtml = normalizeHtml(renderMarkdown(SAMPLE_MARKDOWN, styleKey));
      const shareHtml = normalizeHtml(renderSharePipeline(SAMPLE_MARKDOWN, styleKey));

      homepageOutputs[styleKey] = homepageHtml;
      cliOutputs[styleKey] = cliHtml;
      shareOutputs[styleKey] = shareHtml;
      homepageHashes[styleKey] = sha256(homepageHtml);
    }

    for (const styleKey of STYLE_KEYS) {
      assert.strictEqual(
        cliOutputs[styleKey],
        homepageOutputs[styleKey],
        `CLI 与首页渲染不一致: ${styleKey}`
      );
      assert.strictEqual(
        shareOutputs[styleKey],
        homepageOutputs[styleKey],
        `分享页与首页渲染不一致: ${styleKey}`
      );
    }

    const snapshotPayload = {
      version: 1,
      styleKeys: STYLE_KEYS,
      sampleMarkdownSha256: sha256(SAMPLE_MARKDOWN),
      homepageHashes,
    };

    if (UPDATE_SNAPSHOT) {
      ensureSnapshotDir();
      fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshotPayload, null, 2) + '\n', 'utf8');
      return;
    }

    assert.ok(
      fs.existsSync(SNAPSHOT_PATH),
      `快照文件不存在，请先执行: UPDATE_SNAPSHOT=1 pnpm --dir wxmd-cli test\n缺失路径: ${SNAPSHOT_PATH}`
    );

    const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));

    assert.deepStrictEqual(
      snapshot.styleKeys,
      snapshotPayload.styleKeys,
      'styleKeys 发生变化，需更新快照'
    );
    assert.strictEqual(
      snapshot.sampleMarkdownSha256,
      snapshotPayload.sampleMarkdownSha256,
      '样例 Markdown 发生变化，需更新快照'
    );
    assert.deepStrictEqual(
      snapshot.homepageHashes,
      snapshotPayload.homepageHashes,
      '渲染快照哈希不一致，说明输出发生变化'
    );
  });
});

