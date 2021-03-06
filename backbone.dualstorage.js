// Generated by CoffeeScript 1.3.3
(function() {
  'use strict';

  var S4, console, dualsync, localsync, onlineSync, parseRemoteResponse, result;

  console = {
    log: function() {}
  };

  Backbone.Collection.prototype.syncDirty = function(cb) {
    var error, errored, ids, next, queue, store, storeName, success, sync, synced, total,
      _this = this;
    if (cb == null) {
      cb = function() {};
    }
    storeName = this.storeName || this.url;
    store = localStorage.getItem("" + storeName + "_dirty");
    ids = (store && store.split(',')) || [];
    total = ids.length;
    errored = [];
    synced = [];
    queue = [];
    next = function() {
      if (ids.length === 0) {
        return cb(errored, synced);
      }
      return sync(ids.shift());
    };
    error = function(model) {
      errored.push(model);
      if (_.isFunction(model.onSyncError)) {
        model.onSyncError.apply(model, arguments);
      }
      return next();
    };
    success = function(model) {
      if (model.dirty) {
        errored.push(model);
      } else {
        synced.push(model);
      }
      return next();
    };
    sync = function(id) {
      var model;
      model = id.length === 44 ? _this.where({
        id: id
      })[0] : _this.get(id);
      _this.trigger('sync:status', {
        current: model,
        total: total,
        synced: synced.length,
        errored: errored.length
      });
      if (!model) {
        return error(id);
      }
      return model.save({}, {
        success: success,
        error: error
      });
    };
    return next();
  };

  Backbone.Collection.prototype.syncDestroyed = function(cb) {
    var error, errored, ids, next, queue, store, storeName, success, sync, synced, total,
      _this = this;
    if (cb == null) {
      cb = function() {};
    }
    storeName = this.storeName || this.url;
    store = localStorage.getItem("" + storeName + "_destroyed");
    ids = (store && store.split(',')) || [];
    total = ids.length;
    errored = [];
    synced = [];
    queue = [];
    next = function() {
      if (ids.length === 0) {
        return cb(errored, synced);
      }
      return sync(ids.shift());
    };
    error = function(model) {
      errored.push(model);
      if (_.isFunction(model.onSyncError)) {
        model.onSyncError.apply(model, arguments);
      }
      return next();
    };
    success = function(model) {
      if (model.dirty) {
        errored.push(model);
      } else {
        synced.push(model);
      }
      return next();
    };
    sync = function(id) {
      var model;
      model = new _this.model({
        id: id
      });
      _this.trigger('sync:status', {
        current: model,
        total: total,
        synced: synced.length,
        errored: errored.length
      });
      model.collection = _this;
      return model.destroy({
        success: success,
        error: error
      });
    };
    return next();
  };

  Backbone.Collection.prototype.syncDirtyAndDestroyed = function(cb) {
    var _this = this;
    if (cb == null) {
      cb = function() {};
    }
    return this.syncDirty(function(errored, synced) {
      return _this.syncDestroyed(function(errored2, synced2) {
        errored.push.apply(errored, errored2);
        synced.push.apply(synced, synced2);
        return cb(errored, synced);
      });
    });
  };

  Backbone.Collection.prototype.dirtyCount = function() {
    return this.dirtyIds().length;
  };

  Backbone.Collection.prototype.dirtyIds = function() {
    var destroyed_ids, dirty_ids, store, storeName;
    storeName = this.storeName || this.url;
    store = localStorage.getItem("" + storeName + "_dirty");
    dirty_ids = (store && store.split(',')) || [];
    store = localStorage.getItem("" + storeName + "_destroyed");
    destroyed_ids = (store && store.split(',')) || [];
    return _.union(dirty_ids, destroyed_ids);
  };

  Backbone.Collection.prototype.pullData = function(options) {
    var success,
      _this = this;
    if (options == null) {
      options = {};
    }
    options.populateCollection = false;
    success = options.success;
    options.success = function(collection, resp) {
      console.log('updateReady', _this.storeName || _this.url);
      _this.trigger('updateReady', _this, resp);
      if (success) {
        return success.apply(_this, arguments);
      }
    };
    return this.fetch(options);
  };

  Backbone.Collection.prototype.fetchLocal = function(options) {
    var storeName, success,
      _this = this;
    if (options == null) {
      options = {};
    }
    options.remote = false;
    success = options.success;
    storeName = this.storeName || this.url;
    options.success = function() {
      if (success) {
        return success.apply(_this, arguments);
      }
    };
    return this.fetch(options);
  };

  Backbone.Collection.prototype._localstorageWatchCount = 0;

  Backbone.Collection.prototype.watchForLocalUpdates = function() {
    var _this = this;
    this._localstorageWatchCount++;
    if (this._localstorageWatchCount === 1) {
      this.on('updateReady', function(c) {
        return _this.fetchLocal();
      });
      return this.fetchLocal();
    }
  };

  Backbone.Collection.prototype.unwatchLocalUpdates = function() {
    if (this._localstorageWatchCount <= 0 || --this._localstorageWatchCount > 0) {
      return;
    }
    this.off('updateReady');
    this.each(function(model) {
      if (_.isFunction(model.cleanup)) {
        return model.cleanup();
      }
    });
    return this.reset([]);
  };

  S4 = function() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };

  window.Store = (function() {

    Store.prototype.sep = '';

    function Store(name) {
      this.name = name;
      this.records = this.recordsOn(this.name);
      this.recordsNoCollection = this.recordsOn(this.name + '_nocollection');
    }

    Store.prototype.generateId = function() {
      return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4() + S4() + S4();
    };

    Store.prototype.save = function() {
      localStorage.setItem(this.name, this.records.join(','));
      return localStorage.setItem(this.name + '_nocollection', _.uniq(this.recordsNoCollection).join(','));
    };

    Store.prototype.recordsOn = function(key) {
      var store;
      store = localStorage.getItem(key);
      return (store && store.split(',')) || [];
    };

    Store.prototype.dirty = function(model) {
      var dirtyRecords;
      dirtyRecords = this.recordsOn(this.name + '_dirty');
      if (!_.include(dirtyRecords, model.id.toString())) {
        console.log('dirtying', model);
        dirtyRecords.push(model.id);
        localStorage.setItem(this.name + '_dirty', dirtyRecords.join(','));
      }
      model.dirty = true;
      return model;
    };

    Store.prototype.clean = function(model, from) {
      var dirtyRecords, store;
      store = "" + this.name + "_" + from;
      dirtyRecords = this.recordsOn(store);
      if (_.include(dirtyRecords, model.id.toString())) {
        console.log('cleaning', model.id);
        localStorage.setItem(store, _.without(dirtyRecords, model.id.toString()).join(','));
      }
      model.dirty = false;
      return model;
    };

    Store.prototype.destroyed = function(model) {
      var destroyedRecords;
      destroyedRecords = this.recordsOn(this.name + '_destroyed');
      if (!_.include(destroyedRecords, model.id.toString())) {
        destroyedRecords.push(model.id);
        localStorage.setItem(this.name + '_destroyed', destroyedRecords.join(','));
      }
      return model;
    };

    Store.prototype.create = function(model, storeInCollection) {
      if (storeInCollection == null) {
        storeInCollection = true;
      }
      if (model instanceof Backbone.Model) {
        model = model.toJSON();
      }
      console.log('creating', model, 'in', this.name);
      if (!_.isObject(model)) {
        return model;
      }
      if (!model.id) {
        model.id = this.generateId();
      }
      localStorage.setItem(this.name + this.sep + model.id, JSON.stringify(model));
      if (storeInCollection) {
        console.log("storing model " + model.id + " in collection " + this.name);
        this.records.push(model.id.toString());
      } else {
        this.recordsNoCollection.push(model.id.toString());
      }
      this.save();
      return model;
    };

    Store.prototype.update = function(model) {
      console.log('updating', model, 'in', this.name);
      localStorage.setItem(this.name + this.sep + model.id, JSON.stringify(model));
      if (!_.include(this.records, model.id.toString())) {
        this.records.push(model.id.toString());
      }
      this.save();
      return model;
    };

    Store.prototype.clear = function() {
      var id, _i, _len, _ref;
      _ref = this.records;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        localStorage.removeItem(this.name + this.sep + id);
      }
      this.records = [];
      return this.save();
    };

    Store.prototype.clearNoCollection = function() {
      var id, _i, _len, _ref;
      _ref = this.recordsNoCollection;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        localStorage.removeItem(this.name + this.sep + id);
      }
      this.recordsNoCollection = [];
      return this.save();
    };

    Store.prototype.hasDirtyOrDestroyed = function() {
      return !_.isEmpty(localStorage.getItem(this.name + '_dirty')) || !_.isEmpty(localStorage.getItem(this.name + '_destroyed'));
    };

    Store.prototype.find = function(model) {
      console.log('finding', model, 'in', this.name);
      return JSON.parse(localStorage.getItem(this.name + this.sep + model.id));
    };

    Store.prototype.findIds = function(ids) {
      var id, _i, _len, _results;
      console.log('finding ids', ids, 'in', this.name);
      _results = [];
      for (_i = 0, _len = ids.length; _i < _len; _i++) {
        id = ids[_i];
        _results.push(JSON.parse(localStorage.getItem(this.name + this.sep + id)));
      }
      return _results;
    };

    Store.prototype.findAll = function(storeSuffix) {
      var id, records, _i, _len, _results;
      console.log('findAlling');
      records = storeSuffix === 'nocollection' ? this.recordsNoCollection : this.records;
      _results = [];
      for (_i = 0, _len = records.length; _i < _len; _i++) {
        id = records[_i];
        _results.push(JSON.parse(localStorage.getItem(this.name + this.sep + id)));
      }
      return _results;
    };

    Store.prototype.destroy = function(model) {
      console.log('trying to destroy', model, 'in', this.name);
      localStorage.removeItem(this.name + this.sep + model.id);
      this.records = _.reject(this.records, function(record_id) {
        return record_id === model.id.toString();
      });
      this.save();
      return model;
    };

    return Store;

  })();

  localsync = function(method, model, options) {
    var response, skipCollection, store;
    store = new Store(options.storeName);
    response = (function() {
      switch (method) {
        case 'read':
          if (options.onlyIds) {
            return store.findIds(options.onlyIds);
          } else {
            if (model.id) {
              return store.find(model);
            } else {
              return store.findAll(options.storeSuffix);
            }
          }
          break;
        case 'hasDirtyOrDestroyed':
          return store.hasDirtyOrDestroyed();
        case 'clear':
          return store.clear();
        case 'clearNoCollection':
          return store.clearNoCollection();
        case 'create':
          skipCollection = options.skipCollection || false;
          model = store.create(model, !skipCollection);
          if (options.dirty) {
            return store.dirty(model);
          } else {
            return model;
          }
          break;
        case 'update':
          store.update(model);
          if (options.dirty) {
            return store.dirty(model);
          } else {
            return store.clean(model, 'dirty');
          }
          break;
        case 'delete':
          store.destroy(model);
          if (options.dirty) {
            return store.destroyed(model);
          } else {
            if (model.id.toString().length === 44) {
              return store.clean(model, 'dirty');
            } else {
              return store.clean(model, 'destroyed');
            }
          }
      }
    })();
    if (response instanceof Backbone.Model) {
      response = response.toJSON();
    }
    if (!options.ignoreCallbacks) {
      if (response) {
        options.success(response);
      } else {
        options.error('Record not found');
      }
    }
    return response;
  };

  result = function(object, property) {
    var value;
    if (!object) {
      return null;
    }
    value = object[property];
    if (_.isFunction(value)) {
      return value.call(object);
    } else {
      return value;
    }
  };

  parseRemoteResponse = function(object, response) {
    if (!(object && object.parseBeforeLocalSave)) {
      return response;
    }
    if (_.isFunction(object.parseBeforeLocalSave)) {
      return object.parseBeforeLocalSave(response);
    }
  };

  onlineSync = Backbone.sync;

  dualsync = function(method, model, options) {
    var error, local, originalModel, populateCollection, success, _ref, _ref1;
    console.log('dualsync', method, model, options);
    populateCollection = (_ref = options.populateCollection) != null ? _ref : true;
    options.storeName = result(model.collection, 'storeName') || result(model, 'storeName') || result(model.collection, 'url') || result(model, 'url');
    if (result(model, 'remote') || result(model.collection, 'remote') || options.local === false) {
      console.log("only doing online sync");
      return onlineSync(method, model, options);
    }
    local = result(model, 'local') || result(model.collection, 'local');
    if ((_ref1 = options.dirty) == null) {
      options.dirty = options.remote === false && !local;
    }
    if (options.remote === false || local) {
      options.ignoreCallbacks = false;
      console.log("only syncing locally");
      return localsync(method, model, options);
    }
    options.ignoreCallbacks = true;
    success = options.success;
    error = options.error;
    switch (method) {
      case 'read':
        if (!populateCollection) {
          options.add = true;
        }
        if (localsync('hasDirtyOrDestroyed', model, options)) {
          model.trigger('fetchRequested', model);
          console.log("can't clear", options.storeName, "require sync dirty data first");
          model.fromLocal = true;
          if (populateCollection) {
            return success(localsync(method, model, options));
          } else {
            return success([]);
          }
        } else {
          options.success = function(resp, status, xhr) {
            var i, _i, _len;
            console.log('got remote', resp, 'putting into', options.storeName);
            resp = parseRemoteResponse(model, resp);
            model.fromLocal = false;
            if (!options.skipCollection) {
              localsync('clear', model, options);
            }
            localsync('clearNoCollection', model, options);
            if (_.isArray(resp)) {
              for (_i = 0, _len = resp.length; _i < _len; _i++) {
                i = resp[_i];
                console.log('trying to store', i);
                localsync('create', i, options);
              }
            } else {
              localsync('create', resp, options);
            }
            if (!populateCollection) {
              resp = [];
            }
            return success(resp, status, xhr);
          };
          options.error = function(xhr, status, resp) {
            if (xhr.status === 0) {
              console.log('getting local from', options.storeName);
              model.fromLocal = true;
              if (!populateCollection) {
                return success([]);
              } else {
                return success(localsync(method, model, options));
              }
            } else {
              return error(xhr, status, resp);
            }
          };
          return onlineSync(method, model, options);
        }
        break;
      case 'create':
        options.success = function(resp, status, xhr) {
          localsync(method, resp, options);
          return success(resp, status, xhr);
        };
        options.error = function(xhr, status, resp) {
          if (xhr.status === 0) {
            options.dirty = true;
            return success(localsync(method, model, options));
          } else {
            return error(xhr, status, resp);
          }
        };
        return onlineSync(method, model, options);
      case 'update':
        if (_.isString(model.id) && model.id.length === 44) {
          originalModel = model.clone();
          options.success = function(resp, status, xhr) {
            localsync('delete', originalModel, options);
            localsync('create', resp, options);
            return success(resp, status, xhr);
          };
          options.error = function(xhr, status, resp) {
            if (xhr.status === 0) {
              options.dirty = true;
              return success(localsync(method, originalModel, options));
            } else {
              return error(xhr, status, resp);
            }
          };
          model.set({
            id: null
          });
          return onlineSync('create', model, options);
        } else {
          options.success = function(resp, status, xhr) {
            localsync(method, model, options);
            return success(resp, status, xhr);
          };
          options.error = function(xhr, status, resp) {
            if (xhr.status === 0) {
              options.dirty = true;
              return success(localsync(method, model, options), 'success');
            } else {
              return error(xhr, status, resp);
            }
          };
          return onlineSync(method, model, options);
        }
        break;
      case 'delete':
        if (_.isString(model.id) && model.id.length === 44) {
          return localsync(method, model, options);
        } else {
          options.success = function(resp, status, xhr) {
            localsync(method, model, options);
            return success(resp, status, xhr);
          };
          options.error = function(xhr, status, resp) {
            if (xhr.status === 0) {
              options.dirty = true;
              return success(localsync(method, model, options));
            } else {
              return error(xhr, status, resp);
            }
          };
          return onlineSync(method, model, options);
        }
    }
  };

  Backbone.sync = dualsync;

}).call(this);
