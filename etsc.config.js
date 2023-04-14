module.exports = {
  esbuild: {
    minify: false,
    target: 'es2017',
  },
  assets: {
    baseDir: 'src',
    filePatterns: [],
  },
  // Prebuild hook
  prebuild: async () => {
    console.log('prebuild')
  },
  // Postbuild hook
  postbuild: async () => {
    console.log('postbuild')
    const cpy = (await import('cpy')).default
    await cpy(
      [
        'src/**/*.json', // Copy all .json files
      ],
      'dist',
    )
  },
}
