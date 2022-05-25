module.exports = {
  name: 'test',
  version: '0.0.1',
  description: 'Test1',
  scripts: [
    {
      name: 'default',
      files: [
        {
          path: 'inject.js',
          inject: true,
        },
      ],
    },
  ],
  rules: [
    {
      hostname: 'twitter.com',
      path: /^\/($|home|search)/,
      // path: /^\/(home|search|[^/]+?\/status)/,
      action: {
        scripts: ['default'],
      },
    },
    {
      hostname: 'ton.local.twitter.com',
      action: {
        response: 404,
      },
    },
  ],
};
