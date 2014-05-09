define(function(require) {
  'use strict';

  var ko = require('knockout'),
      model = require('model');

  return function() {
    var view = this;

    view.todos = model.wip();

    view.name = ko.observable('Type shit here!');

    view.addTodo = function() {
      model.add(view.name());
      view.name('');
    };

    view.finishTodo = function() {
      this.done = true;
      model.update(this);
    };
  };
});
