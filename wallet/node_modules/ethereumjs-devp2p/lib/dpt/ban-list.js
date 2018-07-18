'use strict';

const LRUCache = require('lru-cache');
const createDebugLogger = require('debug');
const KBucket = require('./kbucket');

const debug = createDebugLogger('devp2p:dpt:ban-list');

class BanList {
  constructor() {
    this._lru = new LRUCache({ max: 30000 }); // 10k should be enough (each peer obj can has 3 keys)
  }

  add(obj, maxAge) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = KBucket.getKeys(obj)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        let key = _step.value;

        debug(`add ${key}, size: ${this._lru.length}`);
        this._lru.set(key, true, maxAge);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  has(obj) {
    return KBucket.getKeys(obj).some(key => this._lru.get(key));
  }
}

module.exports = BanList;