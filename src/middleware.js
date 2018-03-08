import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
/**
 *
  // template: path.join(__dirname, 'default_index.ejs'),
  // inject: true,
  // favicon: false,
  // chunks: 'all',
  // excludeChunks: [],
  // title: 'Webpack App',
 */
export default (app, appConfig, options) => {
  const { CONTEXT } = process.env;
  const projectRootPath = CONTEXT ? resolve(CONTEXT) : process.cwd();
  const { path: { entries }, commonChunks } = appConfig;

  // 根据 entry 信息在 express 中添加路由
  Object.keys(entries).forEach((chunkName) => {
    app.get(`/${chunkName}`, (req, res) => {
      const settingsFile = resolve(projectRootPath, entries[chunkName].replace('.js', '.settings.js'));
      let settings = {};
      if (existsSync(settingsFile)) {
        settings = require(settingsFile).default;
      }

      // 配置优先级：
      // 1. entry.settings.js（单个页面有效）
      // 2. 注册路由时传递的选项参数（所有页面有效）
      // 3. 默认参数
      const {
        template,
        inject,
        favicon,
        keywords,
        description,
        chunks,
        excludeChunks,
        ...templateData
      } = {
        ...{
          template: resolve(__dirname, 'templates/default.html'),
          inject: 'body',
          charset: 'UTF-8',
          title: 'untitled',
          favicon: false,
          keywords: false,
          description: false,
          chunks: null,
          excludeChunks: null,
          chunksSortMode: null
        },
        ...options,
        ...settings
      };

      const { assetsByChunkName } = res.locals.webpackStats.toJson();
      // page chunk 样式引用代码
      const styleHtml = Object.keys(assetsByChunkName)
        .filter(key => assetsByChunkName[key].endsWith('.css'))
        .filter(key => key === chunkName || Object.keys(commonChunks).indexOf(key) > -1)
        .map(key => `  <link href="${assetsByChunkName[key]}" rel="stylesheet">`)
        .join('\n');

      // 为 SEO 准备的页面 meta 信息
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

      // common chunks 和 page chunk 脚本引用代码
      const scriptHtml = Object.keys(commonChunks)
        .map(key => `  <script src="${key}.js"></script>`)
        .concat(Object.keys(assetsByChunkName)
          .filter(key => assetsByChunkName[key].endsWith('.js'))
          .filter(key => key === chunkName || Object.keys(commonChunks).indexOf(key) > -1)
          .map(key => `  <script src="${assetsByChunkName[key]}"></script>`))
        .join('\n');

      let html = '';
      if (existsSync(template)) {
        const templateString = readFileSync(template, {
          encoding: 'utf-8'
        });
        html = templateString;
      } else {
        throw new Error(`Not found template at ${template}`);
      }

      html = html
        // 替换格式为 __var__ 用户自定义变量
        .replace(/__(\w+)__/gm, (re, $1) => templateData[$1] || '');

      if (metaHtml) {
        html = html.replace('</head>', `${metaHtml}\n  </head>`);
      }

      if (styleHtml) {
        html = html.replace('</head>', `${styleHtml}\n  </head>`);
      }

      if (scriptHtml) {
        html = html.replace(`</${inject}>`, `${scriptHtml}\n  </${inject}>`);
      }

      res.send(html);
    });
  });
};
