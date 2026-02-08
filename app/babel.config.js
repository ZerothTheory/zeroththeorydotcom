module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'babel-plugin-transform-import-meta',
      /**
       * Custom plugin to handle import.meta.env (used by zustand)
       * and any other remaining import.meta expressions.
       *
       * - import.meta.env.MODE → process.env.NODE_ENV
       * - import.meta.env      → process.env
       * - import.meta           → {}
       */
      function transformImportMetaEnv() {
        return {
          name: 'transform-import-meta-env',
          visitor: {
            MetaProperty(path) {
              // Match: import.meta
              if (
                path.node.meta.name === 'import' &&
                path.node.property.name === 'meta'
              ) {
                const parent = path.parentPath;

                if (
                  parent.isMemberExpression() &&
                  !parent.node.computed &&
                  parent.node.property.name === 'env'
                ) {
                  const grandparent = parent.parentPath;

                  if (
                    grandparent.isMemberExpression() &&
                    !grandparent.node.computed &&
                    grandparent.node.property.name === 'MODE'
                  ) {
                    // import.meta.env.MODE → process.env.NODE_ENV
                    grandparent.replaceWithSourceString('process.env.NODE_ENV');
                    return;
                  }

                  // import.meta.env → process.env
                  parent.replaceWithSourceString('process.env');
                  return;
                }

                // bare import.meta → { url: "" }
                path.replaceWithSourceString('({ url: "" })');
              }
            },
          },
        };
      },
    ],
  };
};
