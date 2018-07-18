'use strict';

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require('events');

const EventEmitter = _require.EventEmitter;

const secp256k1 = require('secp256k1');
const Buffer = require('safe-buffer').Buffer;

var _require2 = require('crypto');

const randomBytes = _require2.randomBytes;

const createDebugLogger = require('debug');
const ms = require('ms');

var _require3 = require('../util');

const pk2id = _require3.pk2id;

const KBucket = require('./kbucket');
const BanList = require('./ban-list');
const DPTServer = require('./server');

const debug = createDebugLogger('devp2p:dpt');

class DPT extends EventEmitter {
  constructor(privateKey, options) {
    super();

    this._privateKey = Buffer.from(privateKey);
    this._id = pk2id(secp256k1.publicKeyCreate(this._privateKey, false));

    this._banlist = new BanList();

    this._kbucket = new KBucket(this._id);
    this._kbucket.on('added', peer => this.emit('peer:added', peer));
    this._kbucket.on('removed', peer => this.emit('peer:removed', peer));
    this._kbucket.on('ping', (...args) => this._onKBucketPing(...args));

    this._server = new DPTServer(this, this._privateKey, {
      createSocket: options.createSocket,
      timeout: options.timeout,
      endpoint: options.endpoint
    });
    this._server.once('listening', () => this.emit('listening'));
    this._server.once('close', () => this.emit('close'));
    this._server.on('peers', peers => this._onServerPeers(peers));
    this._server.on('error', err => this.emit('error', err));

    const refreshInterval = options.refreshInterval || ms('60s');
    this._refreshIntervalId = setInterval(() => this.refresh(), refreshInterval);
  }

  bind(...args) {
    this._server.bind(...args);
  }

  destroy(...args) {
    clearInterval(this._refreshIntervalId);
    this._server.destroy(...args);
  }

  _onKBucketPing(oldPeers, newPeer) {
    if (this._banlist.has(newPeer)) return;

    let count = 0;
    let err = null;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = oldPeers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        let peer = _step.value;

        this._server.ping(peer).catch(_err => {
          this._banlist.add(peer, ms('5m'));
          this._kbucket.remove(peer);
          err = err || _err;
        }).then(() => {
          if (++count < oldPeers.length) return;

          if (err === null) this._banlist.add(newPeer, ms('5m'));else this._kbucket.add(newPeer);
        });
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

  _onServerPeers(peers) {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = peers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        let peer = _step2.value;
        this.addPeer(peer).catch(() => {});
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  }

  bootstrap(peer) {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      debug(`bootstrap with peer ${peer.address}:${peer.udpPort}`);

      peer = yield _this.addPeer(peer);
      _this._server.findneighbours(peer, _this._id);
    })();
  }

  addPeer(obj) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      if (_this2._banlist.has(obj)) throw new Error('Peer is banned');
      debug(`attempt adding peer ${obj.address}:${obj.udpPort}`);

      // check k-bucket first
      const peer = _this2._kbucket.get(obj);
      if (peer !== null) return peer;

      // check that peer is alive
      try {
        const peer = yield _this2._server.ping(obj);
        _this2.emit('peer:new', peer);
        _this2._kbucket.add(peer);
        return peer;
      } catch (err) {
        _this2._banlist.add(obj, ms('5m'));
        throw err;
      }
    })();
  }

  getPeer(obj) {
    return this._kbucket.get(obj);
  }

  getPeers() {
    return this._kbucket.getAll();
  }

  getClosestPeers(id) {
    return this._kbucket.closest(id);
  }

  removePeer(obj) {
    this._kbucket.remove(obj);
  }

  banPeer(obj, maxAge) {
    this._banlist.add(obj, maxAge);
    this._kbucket.remove(obj);
  }

  refresh() {
    const peers = this.getPeers();
    debug(`call .refresh (${peers.length} peers in table)`);

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = peers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        let peer = _step3.value;
        this._server.findneighbours(peer, randomBytes(64));
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }
  }
}

module.exports = DPT;