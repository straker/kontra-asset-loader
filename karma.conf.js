// Karma configuration
// Generated on Tue Apr 07 2015 23:14:35 GMT-0600 (MDT)

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['qunit'],
    files: [
      // assets
      {pattern: 'test/audio/*.*', included: false, served: true },
      {pattern: 'test/css/*.*', included: false, served: true },
      {pattern: 'test/imgs/*.*', included: false, served: true },
      {pattern: 'test/js/*.*', included: false, served: true },
      {pattern: 'test/json/*.*', included: false, served: true },

      'kontraAssetLoader.min.js',
      'test/*.js'
    ],
    browsers: ['Chrome', 'Firefox', 'Safari', 'IE'],
    proxies: {
      '/': 'http://localhost:8100/'
    }
  });
};
