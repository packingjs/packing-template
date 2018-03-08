import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { isString } from 'util';
import chunkSorter from './lib/chunksorter';

export default class PackingTemplatePlugin {
  constructor(appConfig, options) {
    this.appConfig = appConfig;
    this.options = options;
  }

  filterChunks(chunks) {
    chunks.filter((chunk) => {
      const chunkName = chunk.names[0];
      // This chunk doesn't have a name. This script can't handled it.
      if (chunkName === undefined) {
        return false;
      }
      // Skip if the chunk should be lazy loaded
      if (typeof chunk.isInitial === 'function') {
        if (!chunk.isInitial()) {
          return false;
        }
      } else if (!chunk.initial) {
        return false;
      }
      return true;
    });
  }

  sortChunks(chunks, sortMode, chunkGroups) {
    // Sort mode auto by default:
    if (typeof sortMode === 'undefined') {
      sortMode = 'reverse';
    }
    // Custom function
    if (typeof sortMode === 'function') {
      return chunks.sort(sortMode);
    }
    // Disabled sorting:
    if (sortMode === 'none') {
      return chunkSorter.none(chunks);
    }
    if (sortMode === 'manual') {
      return chunkSorter.manual(chunks, this.options.chunks);
    }
    // Check if the given sort mode is a valid chunkSorter sort mode
    if (typeof chunkSorter[sortMode] !== 'undefined') {
      return chunkSorter[sortMode](chunks, chunkGroups);
    }
    throw new Error(`"${sortMode}" is not a valid chunk sort mode`);
  }

  apply(compiler) {
    compiler.plugin('done', (stats) => {
      const { CONTEXT } = process.env;
      const projectRootPath = CONTEXT ? resolve(CONTEXT) : process.cwd();
      const { path: { entries }, commonChunks } = this.appConfig;

      const chunkOnlyConfig = {
        assets: false,
        cached: false,
        children: false,
        chunks: true,
        chunkModules: false,
        chunkOrigins: false,
        errorDetails: false,
        hash: false,
        modules: false,
        reasons: false,
        source: false,
        timings: false,
        version: false
      };
      let allChunks = stats.compilation.getStats().toJson(chunkOnlyConfig).chunks;
      // allChunks = allChunks.sort((a, b) => a.names[0] < b.names[0]);
      allChunks = this.sortChunks(
        allChunks,
        this.options.chunksSortMode,
        stats.compilation.chunkGroups
      );

      // 该 entries 信息包含 commonChunks 配置
      Object.keys(entries)
        .filter(entry => Object.keys(commonChunks).indexOf(entry) < 0)
        .forEach((chunkName) => {
          let settings = {};
          if (isString(entries[chunkName])) {
            const settingsFile = resolve(projectRootPath, entries[chunkName].replace('.js', '.settings.js'));
            if (existsSync(settingsFile)) {
              settings = require(settingsFile).default;
            }
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
              template: resolve(__dirname, '../templates/default.html'),
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
            ...this.options,
            ...settings
          };

          /*
          chunks: [ { id: 'b',
              rendered: true,
              initial: true,
              entry: true,
              recorded: undefined,
              reason: undefined,
              size: 102,
              names: [ 'b' ],
              files: [ 'js/b_f4ca94c8.js' ],
              hash: 'f4ca94c8027f4cba2186',
              siblings: [],
              parents: [],
              children: [] }
          */

          // page chunk 样式引用代码
          const styleHtml = allChunks
            .filter(chunk => chunk.files[0].endsWith('.css'))
            .filter((chunk) => {
              const name = chunk.names[0];
              return name === chunkName || Object.keys(commonChunks).indexOf(name) > -1;
            })
            .map(chunk => `  <link href="${chunk.files[0]}" rel="stylesheet">`)
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
          const scriptHtml = allChunks
            .filter(chunk => chunk.files[0].endsWith('.js'))
            .filter((chunk) => {
              const name = chunk.names[0];
              return name === chunkName || Object.keys(commonChunks).indexOf(name) > -1;
            })
            .map(chunk => `  <script src="${chunk.files[0]}"></script>`)
            .join('\n');

          let html = '';
          if (existsSync(template)) {
            const templateString = readFileSync(template, {
              encoding: 'utf-8'
            });
            html = templateString;
          } else {
            console.error('模版地址不存在');
            process.exit(1);
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
          console.log(html);
        });
    });

    // compiler.hooks.compilation.tap('HtmlWebpackPluginHooks', compilation => {
    //
    // });
  }
}
