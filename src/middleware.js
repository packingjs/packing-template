import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { isObject, isFunction } from 'util';

function injectTitle(html, templateEngine, title) {
  if (title) {
    // 为 SEO 准备的页面 meta 信息
    if (templateEngine === 'pug') {
      html = `${html}\nblock title\n  title ${title}\n`;
    } else {
      html = html.replace('__title__', title);
    }
  }
  return html;
}

function injectMeta(html, templateEngine, favicon, keywords, description) {
  if (templateEngine === 'pug') {
    const metaTags = [];
    if (keywords) {
      metaTags.push(`  meta(name="keywords" content="${keywords}")`);
    }
    if (description) {
      metaTags.push(`  meta(name="description" content="${description}")`);
    }
    if (favicon) {
      metaTags.push(`  link(rel="icon" type="image/png" href="${favicon}")`);
    }
    const metaHtml = metaTags.join('\n');
    if (metaHtml) {
      html = `${html}\nblock append meta\n${metaHtml}\n`;
    }
  } else {
    const metaTags = [];
    if (keywords) {
      metaTags.push(`  <meta name="keywords" content="${keywords}">`);
    }
    if (description) {
      metaTags.push(`  <meta name="description" content="${description}">`);
    }
    if (favicon) {
      metaTags.push(`  <link rel="icon" type="image/png" href="${favicon}">`);
    }
    const metaHtml = metaTags.join('\n');
    if (metaHtml) {
      html = html.replace('</head>', `${metaHtml}\n  </head>`);
    }
  }

  return html;
}

function injectStyles(html, templateEngine, chunkName, allChunks, commonChunks) {
  const publicPath = '/';
  const styles = Object.keys(allChunks)
    .filter(key => allChunks[key].endsWith('.css'))
    .filter(key => key === chunkName || Object.keys(commonChunks).indexOf(key) > -1)
    .map(key => allChunks[key]);

  if (styles.length > 0) {
    let styleHtml;
    if (templateEngine === 'pug') {
      styleHtml = `block append style\n${
        styles
          .map(file => `  link(href="${publicPath + file}" rel="stylesheet")`)
          .join('\n')
      }`;
      html = `${html}\n${styleHtml}\n`;
    } else {
      styleHtml = styles
        .map(file => `  <link href="${publicPath + file}" rel="stylesheet">`)
        .join('\n');
      html = html.replace('</head>', `${styleHtml}\n  </head>`);
    }
  }

  return html;
}
function injectScripts(html, templateEngine, chunkName, allChunks, commonChunks, inject) {
  const publicPath = '/';
  const scripts = Object.keys(allChunks)
    .filter(key => allChunks[key].endsWith('.js'))
    .filter(key => key === chunkName || Object.keys(commonChunks).indexOf(key) > -1)
    .map(key => allChunks[key]);

  if (isObject(commonChunks)) {
    Object.keys(commonChunks).forEach((name) => {
      scripts.unshift(`${name}.js`);
    });
  }

  if (scripts.length > 0) {
    let scriptHtml;
    if (templateEngine === 'pug') {
      scriptHtml = `block append script\n${
        scripts
          .map(file => `  script(src="${publicPath + file}")`)
          .join('\n')
      }`;
      html = `${html}\n${scriptHtml}\n`;
    } else {
      scriptHtml = scripts
        .map(file => `  <script src="${publicPath + file}"></script>`)
        .join('\n');
      html = html.replace(`</${inject}>`, `${scriptHtml}\n  </head>`);
    }
  }

  return html;
}

export default (app, appConfig, options) => {
  const { CONTEXT } = process.env;
  const context = CONTEXT ? resolve(CONTEXT) : process.cwd();
  const {
    path: {
      entries,
      templatesPages,
      mockPageInit
    },
    commonChunks,
    templateEngine,
    templateExtension,
    templateInjectPosition,
    rewriteRules
  } = appConfig;

  const basedir = appConfig.path.templates;

  options = {
    ...{
      template: resolve(context, `${templatesPages}/default${templateExtension}`),
      inject: templateInjectPosition,
      charset: 'UTF-8',
      title: '',
      favicon: false,
      keywords: false,
      description: false,
      chunks: null,
      excludeChunks: null,
      chunksSortMode: null
    },
    ...options
  };

  // 根据 entry 信息在 express 中添加路由
  const entryPoints = isFunction(entries) ? entries() : entries;
  Object.keys(entryPoints).forEach((chunkName) => {
    app.get(`/${chunkName}`, (req, res, next) => {
      const settingsFile = resolve(context, entryPoints[chunkName].replace('.js', '.settings.js'));
      let settings = {};
      if (existsSync(settingsFile)) {
        settings = require(settingsFile);
        if (settings.default) {
          settings = settings.default;
        }
      }

      // 配置优先级：
      // 1. entry.settings.js（单个页面有效）
      // 2. 注册路由时传递的选项参数（所有页面有效）
      // 3. 默认参数
      const {
        title,
        template,
        inject,
        favicon,
        keywords,
        description,
        chunks,
        excludeChunks,
        ...templateData
      } = {
        ...options,
        ...settings
      };

      const { assetsByChunkName } = res.locals.webpackStats.toJson();

      let html = '';
      const chunkNameMapTemplate = resolve(context, `${templatesPages}/${chunkName}/${templateExtension}`);
      if (existsSync(template)) {
        const templateString = readFileSync(template, {
          encoding: 'utf-8'
        });
        html = templateString;
      } else if (existsSync(chunkNameMapTemplate)) { // 兼容 v3 以下版本
        const templateString = readFileSync(chunkNameMapTemplate, {
          encoding: 'utf-8'
        });
        html = templateString;
      } else {
        throw new Error(`Not found template at ${template}`);
      }

      html = injectTitle(html, templateEngine, title);
      html = injectMeta(html, templateEngine, favicon, keywords, description);
      if (templateInjectPosition) {
        html = injectStyles(html, templateEngine, chunkName, assetsByChunkName, commonChunks);
        html = injectScripts(html, templateEngine, chunkName, assetsByChunkName, commonChunks, options.inject); // eslint-disable-line
      }
      html = html
        // 替换格式为 __var__ 用户自定义变量
        .replace(/__(\w+)__/gm, (re, $1) => templateData[$1] || '');

      if (templateEngine === 'html') {
        res.send(html);
      } else {
        // 将模版内容传递到下一个中间件处理
        res.filename = template;
        res.basedir = basedir;
        res.template = html;
        next();
      }
    });

    if (templateEngine !== 'html') {
      const parser = require(`packing-template-${templateEngine}`);
      app.get(`/${chunkName}`, parser({
        mockData: mockPageInit,
        templates: templatesPages,
        rewriteRules
      }));
    }
  });
};
