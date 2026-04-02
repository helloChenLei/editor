/**
 * 分享页与主站共享的渲染工具
 */
(() => {
  const wechatEditorModules = window.WechatEditorModules || {};
  const globalStyles = typeof STYLES !== 'undefined' ? STYLES : {};
  const styleRegistry = wechatEditorModules.STYLES || globalStyles;
  const MERMAID_LANGUAGES = new Set([
    'mermaid',
    'flowchart',
    'graph',
    'sequenceDiagram',
    'gantt',
    'classDiagram',
    'stateDiagram',
    'erDiagram',
    'journey',
    'pie',
    'gitGraph',
    'requirementDiagram'
  ]);

  function normalizeStyleAlias(rawValue) {
    return String(rawValue || '')
      .trim()
      .toLowerCase()
      .replace(/[()]/g, '')
      .replace(/[（）]/g, '')
      .replace(/隐藏/g, '')
      .replace(/\s+/g, '-')
      .replace(/_+/g, '-')
      .replace(/-+/g, '-');
  }

  function createStyleAliasMap() {
    const aliases = {
      'claude': 'wechat-anthropic',
      'anthropic': 'wechat-anthropic',
      'claude-song': 'wechat-claude-song',
      'claude-song-serif': 'wechat-claude-song',
      'default': 'wechat-default'
    };

    Object.entries(styleRegistry).forEach(([styleKey, styleConfig]) => {
      const normalizedKey = normalizeStyleAlias(styleKey);
      if (normalizedKey) {
        aliases[normalizedKey] = styleKey;
      }

      const styleName = normalizeStyleAlias(styleConfig && styleConfig.name);
      if (styleName && !aliases[styleName]) {
        aliases[styleName] = styleKey;
      }
    });

    return aliases;
  }

  const styleAliasMap = createStyleAliasMap();

  function resolveStyleKey(styleKey) {
    if (styleKey && styleRegistry[styleKey]) {
      return styleKey;
    }

    const normalizedStyleKey = normalizeStyleAlias(styleKey);
    const resolvedStyleKey = styleAliasMap[normalizedStyleKey];

    if (resolvedStyleKey && styleRegistry[resolvedStyleKey]) {
      return resolvedStyleKey;
    }

    return styleRegistry['wechat-default'] ? 'wechat-default' : Object.keys(styleRegistry)[0];
  }

  function createMarkdownRenderer() {
    const escapeHtml = window.markdownit().utils.escapeHtml;

    return window.markdownit({
      html: true,
      linkify: true,
      typographer: false,
      highlight: function(str, lang) {
        if (lang && MERMAID_LANGUAGES.has(lang)) {
          const escapedSource = escapeHtml(str);
          return `<div class="mermaid" style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; overflow-x: auto;">${escapedSource}</div>`;
        }

        const dots = '<div style="display: flex; align-items: center; gap: 6px; padding: 10px 12px; background: #2a2c33; border-bottom: 1px solid #1e1f24;"><span style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f56;"></span><span style="width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e;"></span><span style="width: 12px; height: 12px; border-radius: 50%; background: #27c93f;"></span></div>';

        let codeContent = '';
        if (lang && typeof hljs !== 'undefined') {
          try {
            if (hljs.getLanguage(lang)) {
              codeContent = hljs.highlight(str, { language: lang }).value;
            } else {
              codeContent = escapeHtml(str);
            }
          } catch (error) {
            codeContent = escapeHtml(str);
          }
        } else {
          codeContent = escapeHtml(str);
        }

        return `<div style="margin: 20px 0; border-radius: 8px; overflow: hidden; background: #383a42; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">${dots}<div style="padding: 16px; overflow-x: auto; background: #383a42;"><code style="display: block; color: #abb2bf; font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace; font-size: 14px; line-height: 1.6; white-space: pre;">${codeContent}</code></div></div>`;
      }
    });
  }

  window.WechatEditorModules = window.WechatEditorModules || {};
  window.WechatEditorModules.RenderUtils = {
    MERMAID_LANGUAGES,
    createMarkdownRenderer,
    resolveStyleKey
  };
})();
