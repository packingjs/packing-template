module.exports = {
  extends: [
    'eslint-config-qunar/base'
  ].map(require.resolve),
  rules: {
    'import/no-dynamic-require': 0,
    'global-require': 0,
    complexity: 0
  }
};
