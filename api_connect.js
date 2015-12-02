var APIConnect = (function() {

  function APIConnect(domain) {

    if (domain[domain.length - 1] === '/') {
      domain = domain.substr(0, domain.length - 1);
    }

    this._domain = domain;
    this._token = undefined;

  }

  APIConnect.prototype.request = function(path) {

    if (path[0] === '/') {
      path = path.substr(1);
    }

    return new APIRequest(this._domain, path, this._token);

  };

  APIConnect.prototype.setToken = function(token) {
    this._token = ((token || '') + '') || undefined;
  };

  function APIRequest(domain, path, token) {
    this._url = [domain, path].join('/');
    this._token = token || undefined;
  }

  APIRequest.prototype.addKey = function(obj) {

    var newObj = {};
    this._token && (newObj.token = this._token);

    Object.keys(obj).forEach(function(k) {
      newObj[k] = obj[k];
    });

    return newObj;

  };

  APIRequest.prototype.index = function(params, callback) {

    return new APIXHR(this._url, callback).get(this.addKey(params));

  };

  APIRequest.prototype.show = function(id, params, callback) {

    return new APIXHR(this._url + (id ? '/' + id : ''), callback).get(this.addKey(params));

  };

  APIRequest.prototype.destroy = function(id, params, callback) {

    return new APIXHR(this._url + (id ? '/' + id : ''), callback).del(this.addKey(params));

  };

  APIRequest.prototype.create = function(params, callback) {

    return new APIXHR(this._url + (this._token ? '?token=' + this._token : ''), callback).post(params);

  };

  APIRequest.prototype.update = function(id, params, callback) {

    return new APIXHR(this._url + (id ? '/' + id : '') + (this._token ? '?token=' + this._token : ''), callback).put(params);

  };

  APIRequest.prototype.upload = function(file, callback) {

    return new APIXHR(this._url, callback).upload(file);

  };

  function APIXHR(url, callback) {

    this._url = url;
    this._active = false;
    this._complete = false;

    var self = this;
    var xhr = new XMLHttpRequest();
    this._xhr = xhr;

    var cb = callback;
    callback = function() {

      self._complete = true;
      cb.apply(this, arguments);

    };

    this._callback = callback;

    xhr.addEventListener('readystatechange', function() {

      var obj;

      if (xhr.readyState === 0) {
        callback.call(self, new Error('Request aborted'), null, []);
        return;
      }

      if (xhr.readyState === 4) {

        if (xhr.status === 0) {
          callback.call(self, new Error('Request aborted'), null, []);
          return;
        }

        try {
          obj = JSON.parse(xhr.responseText);
        } catch(e) {
          callback.call(self, new Error('Expected JSON, could not parse response'), null, []);
          return;
        }

        if (obj.meta && obj.meta.error) {
          callback.call(self, obj.meta.error, obj, obj.data || []);
          return;
        }

        callback.call(self, null, obj, obj.data || []);
        return;

      }

    });

    xhr.addEventListener('error', function(err) {

      callback.call(self, err, null, []);

    });

    return this;

  }

  APIXHR.prototype.serialize = function(obj) {

    var fnConvert = function(keys, isArray, v) {
      isArray = ['', '[]'][isArray | 0];
      return (keys.length < 2) ? (
        [keys[0], isArray, '=', v].join('')
      ) : (
        [keys[0], '[' + keys.slice(1).join(']['), ']', isArray, '=', v].join('')
      );
    };

    var fnSerialize = function(keys, key, i) {

      keys = keys.concat([key]);
      var datum = obj;

      keys.forEach(function(key) {
        datum = datum[key];
      });

      if (datum instanceof Date) {

        datum = [datum.getFullYear(), datum.getMonth() + 1, datum.getDate()].join('-');

      }

      if (datum instanceof Array) {

        return datum.map(fnConvert.bind(null, keys, true)).join('&');

      } else if (typeof(datum) === 'object' && datum !== null) {

        return Object.keys(datum).map(fnSerialize.bind(null, keys)).join('&');

      }

      return fnConvert(keys, false, datum);

    };

    return Object.keys(obj).map(fnSerialize.bind(null, [])).join('&');

  };

  APIXHR.prototype.__checkActiveState__ = function() {
    if (this._active) {
      throw new Error('APIXHR is already active, can only be aborted.');
    }
    return true;
  };

  APIXHR.prototype.__setActiveState__ = function() {
    this._active = true;
  };

  APIXHR.prototype.abort = function() {

    if (!this._active) {
      throw new Error('Cannot abort APIXHR that is not active');
    }

    if (!this._complete) {
      this._xhr.abort();
    }

    return this;

  };

  APIXHR.prototype.get = function(params) {
    this.__checkActiveState__();
    var xhr = this._xhr;
    xhr.open('GET', [this._url, this.serialize(params)].join('?'));
    xhr.send();
    this.__setActiveState__();
    return this;
  };

  APIXHR.prototype.del = function(params) {
    this.__checkActiveState__();
    var xhr = this._xhr;
    xhr.open('DELETE', [this._url, this.serialize(params)].join('?'));
    xhr.send();
    this.__setActiveState__();
    return this;
  };

  APIXHR.prototype.post = function(params) {
    this.__checkActiveState__();
    var xhr = this._xhr;
    xhr.open('POST', this._url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(params));
    this.__setActiveState__();
    return this;
  };

  APIXHR.prototype.put = function(params) {
    this.__checkActiveState__();
    var xhr = this._xhr;
    xhr.open('PUT', this._url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(params));
    this.__setActiveState__();
    return this;
  };

  APIXHR.prototype.upload = function(file) {
    this.__checkActiveState__();
    var xhr = this._xhr;
    xhr.open('POST', this._url);
    xhr.send(file);
    this.__setActiveState__();
    return this;
  };
  
  return APIConnect;

})();
