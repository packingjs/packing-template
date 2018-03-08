# packing-template

这是 Packing 前端开发工具用来处理网页模版的工具包。本包提供两个方法：

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
这是一个 webpack 插件，提供编译环境根据 entry points 生成网页物理文件。


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
