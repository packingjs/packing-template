// import loaderUtils from 'loader-utils'; // eslint-disable-line

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

import path from 'path';

export default (html, options) => {
  const reg = /(?:src|href)\s*=\s*["']([^"']+)/g;

  const {
    assets, publicPath, rules
  } = {
    ...{
      assets: [],
      publicPath: '/',
      rules: {}
    },
    ...options
  };

  const matches = [];
  let result;
  while(result = reg.exec(html)) { // eslint-disable-line
    const a = result[0].replace(result[1], '');
    matches.push({
      start: result.index + a.length,
      length: result[1].length,
      value: result[1]
    });
  }

  html = html.split('');
  matches.reverse().forEach((link) => {
    /*
    assets:
    [ { name: '_/test/cases/html-template-require/logo_51d3681d.jpg',
           size: 9058,
           chunks: [],
           chunkNames: [],
           emitted: true,
           isOverSizeLimit: undefined },
         { name: 'js/a_2244d22d.js',
           size: 1008,
           chunks: [Array],
           chunkNames: [Array],
           emitted: true,
           isOverSizeLimit: undefined } ]
    */
    const {
      name,
      ext,
      dir // ,
      // base
    } = path.parse(link.value);

    const asset = assets
      // 这里需要过滤 js/css，js/css 走的是脚本注入机制
      .filter(file => !file.name.endsWith('.js'))
      .filter((file) => {
        let nameFormat = '';
        /*
        rules:
        [ { test: /\.js$/i, exclude: /node_modules/, use: [ [Object] ] },
    { test: /\.css$/i,
      loader: [ [Object], [Object], [Object], [Object] ] },
    { test: /\.(scss|sass)$/i,
      loader: [ [Object], [Object], [Object], [Object], [Object] ] },
    { test: /\.less$/i,
      loader: [ [Object], [Object], [Object], [Object], [Object] ] },
    { test: /.(jpg|jpeg|png|gif|mp3|ttf|woff|woff2|eot|svg)$/i,
      loader: 'url-loader',
      options: { name: '[path][name]_[hash:8].[ext]', limit: 100 } } ]
        */
        rules.forEach((rule) => {
          if (rule.test.test(file.name) && rule.options && rule.options.name) {
            // [path][name]_[hash:8].[ext]
            nameFormat = rule.options.name;
          }
        });

        const pattern = nameFormat
          .replace('[path]', dir ? `${dir}/` : '')
          .replace('[name]', name)
          .replace('[ext]', ext.replace('.', ''))
          .replace(/\[hash:(\d+)\]/, '\\w{$1}');
        return new RegExp(pattern).test(file.name);
      });
    if (asset.length > 0) {
      const url = publicPath + asset[0].name;
      html.splice(link.start, link.length, url);
    }
  });
  html = html.join('');
  return html;
};
