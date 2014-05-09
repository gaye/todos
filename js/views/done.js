define(function(require) {
  'use strict';

  var model = require('model');

  return function() {
    var view = this;

    view.todos = model.done();
  };
});
