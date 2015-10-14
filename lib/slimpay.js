'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var traverson = require('traverson');
var JsonHalAdapter = require('traverson-hal');
traverson.registerMediaType(JsonHalAdapter.mediaType, JsonHalAdapter);

var pRequest = function pRequest(options) {
    return new _bluebird2['default'](function (resolve, reject) {
        (0, _request2['default'])(options, function (err, response, body) {
            if (err) reject(err);
            resolve({ response: response, body: body });
        });
    });
};

function controleResult(err, res, traversal, resolve, reject) {
    if (err) {
        reject(err);
    } else {
        var body = JSON.parse(res.body);
        if (body.code) {
            reject(result);
        } else {
            resolve({ body: body, traversal: traversal });
        }
    }
}

var SlimPay = (function () {
    function SlimPay() {
        _classCallCheck(this, SlimPay);

        this.env = 'development';
    }

    _createClass(SlimPay, [{
        key: 'config',
        value: function config(_config) {
            if (!_config.user) {
                console.log('new error, no config.user');
                return new Error('config must have user');
            }
            if (!_config.password) {
                console.log('new error, no config.password');
                return new Error('config must have password');
            }
            this.user = _config.user;
            this.password = _config.password;
        }
    }, {
        key: 'setCreditor',
        value: function setCreditor(creditor) {
            this.creditor = creditor;
        }
    }, {
        key: 'setEnv',
        value: function setEnv(env) {
            if (env === 'production') this.env = env;else if (env === 'development') this.env = env;else throw new Error('env must be one of "production" or "development"');
        }
    }, {
        key: 'init',
        value: function init() {
            this.endPoint = this.env === 'production' ? "https://api.slimpay.net/" : 'https://api-sandbox.slimpay.net/';
            var authPath = 'oauth/token?grant_type=client_credentials&scope=api';
            this.authURI = this.endPoint + authPath;
            this.authConfig = {
                uri: this.authURI,
                auth: {
                    'user': this.user,
                    'pass': this.password,
                    'sendImmediately': false
                },
                method: 'GET'
            };

            this.getOrRefreshToken();
        }
    }, {
        key: 'tokenIsNotValid',
        value: function tokenIsNotValid() {
            var now = Date.now() / 1000;
            var delta = now - this.tokenConfig.seconds;
            if (delta > this.tokenConfig.ttl) return true;else return false;
        }
    }, {
        key: 'getOrRefreshToken',
        value: function getOrRefreshToken() {
            var _this = this;

            return this.getAuthenticationToken(this.authConfig).then(function (result) {
                _this.tokenConfig = result;
                _this.tokenConfig['seconds'] = Date.now() / 1000;
                return result.token;
            }).then(function (token) {
                return _this.requestOptions = _this.buildOptions(token);
            });
        }
    }, {
        key: 'checkToken',
        value: function checkToken() {
            if (this.tokenIsNotValid()) {
                return this.getOrRefreshToken().then(function (options) {
                    return options;
                });
            } else {
                return _bluebird2['default'].resolve(this.requestOptions);
            }
        }
    }, {
        key: 'getAuthenticationToken',
        value: function getAuthenticationToken(options) {
            return pRequest(options).then(function (data) {
                var parsedBody = JSON.parse(data.body);
                if (parsedBody.error) {
                    throw new Error(data.body);
                }
                var bearerToken = parsedBody.access_token;
                var ttl = parsedBody.expires_in;
                return {
                    token: bearerToken,
                    ttl: ttl
                };
            });
        }
    }, {
        key: 'buildOptions',
        value: function buildOptions(bearerToken) {
            return {
                headers: {
                    Authorization: 'Bearer ' + bearerToken,
                    Accept: 'application/hal+json',
                    'Content-type': 'application/json',
                    profile: '"https://api.slimpay.net/alps/v1"'
                }
            };
        }
    }, {
        key: 'slimPayApi',
        value: function slimPayApi() {
            var _this2 = this;

            return this.checkToken().then(function (requestOptions) {
                return traverson.from(_this2.endPoint).jsonHal().withRequestOptions(requestOptions);
            });
        }
    }, {
        key: 'getLinks',
        value: function getLinks() {
            return this.slimPayApi().then(function (api) {
                return new _bluebird2['default'](function (resolve, reject) {
                    api.get(function (err, res, traversal) {
                        if (err) reject(err);else {
                            var body = JSON.parse(res.body);
                            resolve({ body: body, traversal: traversal });
                        };
                    });
                });
            });
        }
    }, {
        key: 'signMandate',
        value: function signMandate(item) {
            return this.getLinks().then(function (links) {
                return new _bluebird2['default'](function (resolve, reject) {
                    links.traversal['continue']().follow('https://api.slimpay.net/alps#create-orders').post(item, function (err, res, traversal) {
                        return controleResult(err, res, traversal, resolve, reject);
                    });
                });
            });
        }
    }, {
        key: 'getOrders',
        value: function getOrders(orderRef) {
            var templateParameters = {
                creditorReference: this.creditor,
                reference: orderRef
            };
            return this.getLinks().then(function (links) {
                return new _bluebird2['default'](function (resolve, reject) {
                    links.traversal['continue']().follow('https://api.slimpay.net/alps#get-orders').withTemplateParameters(templateParameters).get(function (err, res, traversal) {
                        return controleResult(err, res, traversal, resolve, reject);
                    });
                });
            });
        }
    }, {
        key: 'getMandate',
        value: function getMandate(traversal) {
            return new _bluebird2['default'](function (resolve, reject) {
                return traversal['continue']().follow('https://api.slimpay.net/alps#get-mandate').get(function (err, res, traversal) {
                    return controleResult(err, res, traversal, resolve, reject);
                });
            });
        }
    }, {
        key: 'getCreditor',
        value: function getCreditor(traversal) {
            return new _bluebird2['default'](function (resolve, reject) {
                return traversal['continue']().follow('https://api.slimpay.net/alps#get-creditor').get(function (err, res, traversal) {
                    return controleResult(err, res, traversal, resolve, reject);
                });
            });
        }
    }, {
        key: 'getSubscriber',
        value: function getSubscriber(traversal) {
            return new _bluebird2['default'](function (resolve, reject) {
                return traversal['continue']().follow('https://api.slimpay.net/alps#get-subscriber').get(function (err, res, traversal) {
                    return controleResult(err, res, traversal, resolve, reject);
                });
            });
        }
    }, {
        key: 'follow',
        value: function follow(traversal, _follow) {
            if (!_follow.method) _follow.method = 'GET';
            switch (_follow.method) {
                case 'GET':
                    return new _bluebird2['default'](function (resolve, reject) {
                        return traversal['continue']().follow(_follow.relation).get(function (err, res, traversal) {
                            return controleResult(err, res, traversal, resolve, reject);
                        });
                    });
                case 'POST':
                    if (!_follow.data) throw new Error('must have data to POST');else {
                        if (_follow.templateParameters) {
                            return new _bluebird2['default'](function (resolve, reject) {
                                return traversal['continue']().withTemplateParameters(_follow.templateParameters).follow(_follow.relation).post(_follow.data, function (err, res, traversal) {
                                    return controleResult(err, res, traversal, resolve, reject);
                                });
                            });
                        } else {
                            return new _bluebird2['default'](function (resolve, reject) {
                                return traversal['continue']().follow(_follow.relation).post(_follow.data, function (err, res, traversal) {
                                    return controleResult(err, res, traversal, resolve, reject);
                                });
                            });
                        }
                    }
                case 'PUT':
                    if (!_follow.data) throw new Error('must have data to PUT');else {
                        if (_follow.templateParameters) {
                            return new _bluebird2['default'](function (resolve, reject) {
                                return traversal['continue']().withTemplateParameters(_follow.templateParameters).follow(_follow.relation).put(_follow.data, function (err, res, traversal) {
                                    return controleResult(err, res, traversal, resolve, reject);
                                });
                            });
                        } else {
                            return new _bluebird2['default'](function (resolve, reject) {
                                return traversal['continue']().follow(_follow.relation).put(_follow.data, function (err, res, traversal) {
                                    return controleResult(err, res, traversal, resolve, reject);
                                });
                            });
                        }
                    }
                case 'PATCH':
                    if (!_follow.data) throw new Error('must have data to POST');else {
                        if (_follow.templateParameters) {
                            return new _bluebird2['default'](function (resolve, reject) {
                                return traversal['continue']().withTemplateParameters(_follow.templateParameters).follow(_follow.relation).patch(_follow.data, function (err, res, traversal) {
                                    return controleResult(err, res, traversal, resolve, reject);
                                });
                            });
                        } else {
                            return new _bluebird2['default'](function (resolve, reject) {
                                return traversal['continue']().follow(_follow.relation).patch(_follow.data, function (err, res, traversal) {
                                    return controleResult(err, res, traversal, resolve, reject);
                                });
                            });
                        }
                    }
                case 'DELETE':
                    break;
                default:
                    throw new Error('method must be one of GET | POST | PUT | PATCH | DELETE');
            }
        }
    }]);

    return SlimPay;
})();

exports = module.exports = new SlimPay();