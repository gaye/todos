define(function(require) {
  'use strict';

  var api = require('api'),
      ko = require('knockout');

  function Model() {
    this.queryToObservables = { done: [], wip: [] };
    this.queryToCached = {};
  }

  Model.prototype = {
    add: function(description) {
      var todo = {
        description: description,
        done: false
      };

      api.add(todo);
    },

    update: function(todo) {
      api.update(todo);
    },

    done: function() {
      return this._subscribe('done');
    },

    wip: function() {
      return this._subscribe('wip');
    },

    _subscribe: function(query) {
      var result = ko.observableArray();
      this.queryToObservables[query].push(result);

      if (query in this.queryToCached) {
        console.log('Cached!');
        var cached = this.queryToCached[query];
        setObservableArray(result, cached);
      } else {
        console.log('Cache miss!');
        api[query]().then(function(fetched) {
          console.log('Pulled ' + query + ' into cache, found ' + fetched);
          this.queryToCached[query] = fetched;
          this._publish(query);
        }.bind(this));
      }

      api.onchange[query] = function(change) {
        console.log('Change in ' + query + '!');
        var cached = this.queryToCached[query];

        change.added.forEach(function(added) {
          cached.push(added);
        });

        change.removed.forEach(function(removed) {
          cached.some(function(value, index) {
            if (value.id === removed.id) {
              cached.splice(index, 1);
              return true;
            }
          });
        });

        this._publish(query);
      }.bind(this);

      return result;
    },

    _publish: function(query) {
      var newValue = this.queryToCached[query];
      var observables = this.queryToObservables[query];
      console.log('Publishing ' + query + ' to ' +
                  observables.length + ' subscribers.');
      observables.forEach(function(observable) {
        setObservableArray(observable, newValue);
      });
    }
  };


  /**
   * Copy the data in one array to the other in lieu of =
   */
  function setObservableArray(writeTo, readFrom) {
    writeTo.removeAll();
    readFrom.forEach(function(value) {
      writeTo.push(value);
    });
  }

  return new Model();
});
