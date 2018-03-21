# packing-template

这是 Packing 前端开发工具用来处理网页模版的工具包。本包提供两个方法：

- middleware
- plugin

这两个方法的参数可以通过下面两种方式传入：

- 在函数调用处通过 `options` 传入。这种方式传入的参数对所有 entry points 都有效。
- 通过与 `${entry}.js` 同目录的 `${entry}.settings.js` 配置文件传入。这种方式传入的参数仅对单一 entry point 有效。

```js
import path from 'path';

export default {
  template: path.resolve(__dirname, 'template.html'),
  title: 'Page A',
  keywords: 'A AA',
  description: 'A simple text',
  attrs: ['img:src', 'link:href', 'script:src'],
  city: 'Beijing'
};

```

## middleware
这是一个 [express](https://expressjs.com) 中间件，提供开发环境下网页自动生成、脚本注入的功能。

### 用法
```js
import Express from 'express';
import { middleware } from 'packing-template';

const app = new Express();

middleware(app, appConfig, {
    template: path.resolve(__dirname, 'template.html'),
    // inject: 'head',
    // favicon: 'xxx.png'
    // charset: 'gb2312'
});
```

### 参数
#### app
[express](https://expressjs.com) 实例。

#### appConfig
packing 配置。

#### options
可选参数：

##### template
类型: `String`

默认值: `node_modules/packing-template/templates/default.html`

模版文件的绝对路径。

##### inject
类型: `String`

默认值: `body`

可选值:
    - body: 插入在 </body> 标签前面
    - head:: 插入在 </head> 标签前面

js脚本注入到 HTML 代码的位置。

是否在网页中插入 favico meta标签。当取值不是 `false` 时，该值表示 favicon 的路径。

##### chunks
类型: `[String] | null`

默认值: `null`

需要在页面中插入的 chunk 列表。

##### excludeChunks
类型: `[String] | null`

默认值: `null`

不需要在页面中插入的 chunk 列表。

##### chunksSortMode
类型: `String`

默认值: `commonChunksFirst`

可选值:
    - id: 按 chunk id 正序
    - none: 按 entries 中的顺序
    - reverse: 按 entries 中的顺序反转
    - manual: 按 `chunks` 中指定的顺序
    - commonChunksFirst: 公共包优先

chunk 包在页面中插入的顺序。

##### favicon
类型: `Boolean | String`

默认值: `false`

是否在网页中插入 favico meta标签。当取值不是 `false` 时，该值表示 favicon 的路径。

##### title
类型: `String`

默认值: `untitled`

网页标题。

##### charset
类型: `String`

默认值: `utf-8`

网页使用的字符集。

##### keywords
类型: `Boolean | String`

默认值: `utf-8`

是否在网页中插入 keywords meta标签。当取值不是 `false` 时，该值表示 keywords 的值。

##### description
类型: `Boolean | String`

默认值: `utf-8`

是否在网页中插入 description meta标签。当取值不是 `false` 时，该值表示 description 的值。

## plugin
这是一个 webpack 插件，它在发布时会根据 entry points 文件生成对应的网页文件。


### 用法
```js
import Express from 'express';
import { middleware } from 'packing-template';

const app = new Express();

middleware(app, appConfig, {
    template: path.resolve(__dirname, 'template.html'),
    // inject: 'head',
    // favicon: 'xxx.png'
    // charset: 'gb2312'
});
```

### 参数
#### app
[express](https://expressjs.com) 实例。

#### appConfig
packing 配置。

#### options
可选参数：

##### template
类型: `String`

默认值: `node_modules/packing-template/templates/default.html`

模版文件的绝对路径。

##### inject
类型: `String`

默认值: `body`

可选值:
    - body: 插入在 </body> 标签前面
    - head: 插入在 </head> 标签前面

js脚本注入到 HTML 代码的位置。

是否在网页中插入 favico meta标签。当取值不是 `false` 时，该值表示 favicon 的路径。

##### chunks
类型: `[String] | null`

默认值: `null`

需要在页面中插入的 chunk 列表。

##### excludeChunks
类型: `[String] | null`

默认值: `null`

不需要在页面中插入的 chunk 列表。

##### chunksSortMode
类型: `String`

默认值: `commonChunksFirst`

可选值:
    - id: 按 chunk id 正序
    - none: 按 entries 中的顺序
    - reverse: 按 entries 中的顺序反转
    - manual: 按 `chunks` 中指定的顺序
    - commonChunksFirst: 公共包优先

chunk 包在页面中插入的顺序。

##### favicon
类型: `Boolean | String`

默认值: `false`

是否在网页中插入 favico meta标签。当取值不是 `false` 时，该值表示 favicon 的路径。

##### title
类型: `String`

默认值: `untitled`

网页标题。

##### charset
类型: `String`

默认值: `utf-8`

网页使用的字符集。

##### keywords
类型: `Boolean | String`

默认值: `utf-8`

是否在网页中插入 keywords meta标签。当取值不是 `false` 时，该值表示 keywords 的值。

##### description
类型: `Boolean | String`

默认值: `utf-8`

是否在网页中插入 description meta标签。当取值不是 `false` 时，该值表示 description 的值。

##### attrs
类型: `Array`

默认值: `[img:src, link:href]`

网页文件中需要在编译时替换为 `_hash` 的标签属性。格式为 `tag:attribute` 。如果想对所有标签的某个属性替换，请使用 `*` 代替 `tag`，如所有标签的 `src` 属性都需要替换，则使用 `*:src`。

## pug 模版支持的一些约定

`pug` 模版灵活的语法，网页可以被拆分成很多没有规律的代码片段，这种复杂的结构导致了自动注入代码变得很困难，为了简化自动注入代码的逻辑，现对 `pug` 做以下约定：

- 模版分为两类
    - `layout` 布局母模版
    - `pages` 页面入口模版，可以是通用模版，也可以是与 entry points 一一对应的模版（为了兼容 packing v3 以下版本）
- layout 母模版必须包含以下 `block`
    - `meta`: 自动注入的 `favico`、`keywords`、`description` 会 append 在该代码末尾
    - `title`: 自动注入的 `title` 会替换默认网页标题
    - `style`: 自动注入的 `CSS` 样式表会 append 在该代码末尾
    - `script`: 自动注入的 `javascript` 脚本会 append 在该代码末尾
- 使用 `extends` 方式从母模版页面继承入口页面
