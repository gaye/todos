define(function(require) {
  'use strict';

  indexedDB.open('todos', 1).onupgradeneeded = function(event) {
    var db = event.target.result;
    var objectStore = db.createObjectStore('list', {
      keyPath: 'id',
      autoIncrement: true
    });

    objectStore.transaction.oncomplete = function() {
      // ...
    };
  };

  var api = {};

  api.add = function(todo) {
    indexedDB.open('todos', 1).onsuccess = function(event) {
      var db = event.target.result;
      var transaction = db.transaction('list', 'readwrite');
      var list = transaction.objectStore('list');
      list.add(todo).onsuccess = function(event) {
        // For now we have to simulate change events since
        // indexedDB does not support them.
        var wip = api.onchange.wip;
        wip && wip({ added: [todo], removed: [] });
      };
    };
  };

  api.update = function(todo) {
    indexedDB.open('todos', 1).onsuccess = function(event) {
      var db = event.target.result;
      var transaction = db.transaction('list', 'readwrite');
      var list = transaction.objectStore('list');
      list.put(todo).onsuccess = function(event) {
        // For now we have to simulate change events since
        // indexedDB does not support them.
        var wip = api.onchange.wip,
            done = api.onchange.done;
        wip && wip({ added: [], removed: [todo] });
        done && done({ added: [todo], removed: [] });
      };
    };
  };

  function getAll() {
    return new Promise(function(resolve, reject) {
      var open = indexedDB.open('todos', 1);

      open.onsuccess = function(event) {
        var db = event.target.result;
        var transaction = db.transaction('list', 'readonly');
        var list = transaction.objectStore('list');
        var req = list.mozGetAll();

        req.onsuccess = function(event) {
          var result = event.target.result;
          resolve(result);
        };

        req.onerror = reject;
      };

      open.onerror = reject;
    });
  }

  api.done = function() {
    return getAll().then(function(todos) {
      return todos.filter(function(todo) {
        return todo.done;
      });
    });
  };

  api.wip = function() {
    return getAll().then(function(todos) {
      return todos.filter(function(todo) {
        return !todo.done;
      });
    });
  };

  api.onchange = {
    done: null,
    wip: null
  };

  return api;
});
