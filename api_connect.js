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

  function APIXHR(url, callback) {

    this._url = url;
    this._callback = callback;

    var self = this;
    var xhr = new XMLHttpRequest();
    this._xhr = xhr;

    xhr.addEventListener('readystatechange', function() {

      var obj;

      if (xhr.readyState === 0) {
        callback.call(self, new Error('Request aborted'), null, []);
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
      datum = obj;

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

  APIXHR.prototype.abort = function() {
    this._xhr.abort();
  };

  APIXHR.prototype.get = function(params) {
    var xhr = this._xhr;
    xhr.open('GET', [this._url, this.serialize(params)].join('?'));
    xhr.send();
  };

  APIXHR.prototype.del = function(params) {
    var xhr = this._xhr;
    xhr.open('DELETE', [this._url, this.serialize(params)].join('?'));
    xhr.send();
  };

  APIXHR.prototype.post = function(params) {
    var xhr = this._xhr;
    xhr.open('POST', this._url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(params));
  };

  APIXHR.prototype.put = function(params) {
    var xhr = this._xhr;
    xhr.open('PUT', this._url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(params));
  };
  
  return APIConnect;

})();
