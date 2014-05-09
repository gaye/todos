(function() {
  require.config({
    baseUrl: '/js',
    paths: {
      knockout: '/bower_components/knockoutjs/build/output/knockout-latest'
    }
  });

  require([
    'api',
    'knockout',
    'model',
    'views/done',
    'views/wip'
  ], function(api, ko, model, Done, Wip) {
    ko.applyBindings(new Done(), document.querySelector('.done'));
    ko.applyBindings(new Wip(), document.querySelector('.wip'));
  });
})();
