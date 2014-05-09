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

      // For now we have to "write through the cache"
      // since indexedDB does not support change events.
      if ('wip' in this.queryToCached) {
        this.queryToCached.wip.push(todo);
        this._publish('wip');
      }
    },

    update: function(todo) {
      api.update(todo);

      // For now we have to "write through the cache"
      // since indexedDB does not support change events.
      var wip = this.queryToCached.wip,
          done = this.queryToCached.done;
      wip.some(function(value, index) {
        if (value.id === todo.id) {
          wip.splice(index, 1);
          done.push(value);
          this._publish('wip');
          this._publish('done');
          return true;
        }
      }.bind(this));
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

      // TODO(gareth): If the api supports it, we should listen for
      //     "change" events here also and publish the changes.

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
