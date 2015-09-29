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

var SlimPay = (function () {
	function SlimPay() {
		_classCallCheck(this, SlimPay);
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
			if (!_config.authPath) {
				console.log('new error, no config.authPath');
				return new Error('config must have authPath');
			}
			if (!_config.endPointUrl) {
				console.log('new error, no config.endPointUrl');
				return new Error('config must have endPointUrl');
			}
			if (!_config.creditor) {
				console.log('new error, no config.creditor');
				return new Error('config must have creditor');
			}
			var https = 'https://';
			this.user = _config.user;
			this.password = _config.password;
			this.creditor = _config.creditor;
			this.endPointUrl = _config.endPointUrl;
			this.authPath = _config.authPath;
			this.endpointURI = https + _config.endPointUrl;
			this.authURI = https + _config.endPointUrl + _config.authPath;
		}
	}, {
		key: 'getAuthConfig',
		value: function getAuthConfig() {
			return {
				uri: this.authURI,
				auth: {
					'user': this.user,
					'pass': this.password,
					'sendImmediately': false
				},
				method: 'GET'
			};
		}
	}, {
		key: 'getAuthenticationToken',
		value: function getAuthenticationToken() {

			var authOptions = this.getAuthConfig();

			return pRequest(authOptions).then(function (data) {
				var parsedBody = JSON.parse(data.body);
				if (parsedBody.error) {
					throw new Error(data.body);
				}
				var bearerToken = JSON.parse(data.body).access_token;
				return bearerToken;
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
					profile: this.endpointURI
				}
			};
		}

		//TODO give signatory and billing address and then build orderRepresentation inside method
		// createSignMandateOrder (orderRepresentation) {
		// 	return this.getAuthenticationToken()
		// 		.then(token => {
		// 			return this.buildOptions(token)
		// 		})
		// 		.then(options => {
		// 			return new Promise((resolve, reject) => {
		// 				traverson
		// 				    .from(this.endpointURI)
		// 				    .jsonHal()
		// 				    .withRequestOptions(options)
		// 				    .follow('https://api.slimpay.net/alps#create-orders')
		// 				    .post(orderRepresentation, (err, res) => {
		// 				        if (err) {
		// 				            reject(err);
		// 				        } else {
		// 				            var result = JSON.parse(res.body);
		// 				            console.log(result);
		// 				            resolve(result);
		// 				            // var link = result['_links']['https://api.slimpay.net/alps#user-approval']['href'];
		// 				            // this.reference = result.reference;
		// 				            // this.link = link;
		// 				            // resolve({
		// 				            // 	orderRef: result.reference,
		// 				            // 	dateCreated: result.dateCreated,
		// 				            // 	state: result.state,
		// 				            // 	link: link
		// 				            // });
		// 				        }
		// 				    });
		// 			});
		// 		});
		// }

		// getOrder (orderRef) {
		// 	return this.getAuthenticationToken()
		// 		.then(token => {
		// 			return this.buildOptions(token)
		// 		})
		// 		.then(options => {
		// 			return new Promise((resolve, reject) => {
		// 				traverson
		// 				    .from(this.endpointURI)
		// 				    .jsonHal()
		// 				    .withRequestOptions(options)
		// 				    .withTemplateParameters({ creditorReference: this.creditor, reference: orderRef })
		// 				    .follow('https://api.slimpay.net/alps#get-orders')
		// 			        .get((err, res) => {
		// 				        if (err) {
		// 				            reject(err);
		// 				        } else {
		// 				            var result = JSON.parse(res.body);
		// 				            var getMandateLink = result['_links']['https://api.slimpay.net/alps#get-mandate']['href'];
		// 				            var rum = getMandateLink.split('/')[6];
		// 				            resolve({
		// 				            	state: result.state,
		// 				            	dateCreated: result.dateCreated,
		// 				            	dateClosed: result.dateClosed,
		// 				            	started: result.started,
		// 				            	mandateReused: result.mandateReused,
		// 				            	rum: rum
		// 				            });
		// 				        }
		// 				    });
		// 			});
		// 		});
		// }

		// getMandate (rum) {
		// 	return this.getAuthenticationToken()
		// 		.then(token => {
		// 			return this.buildOptions(token)
		// 		})
		// 		.then(options => {
		// 			return new Promise((resolve, reject) => {
		// 				traverson
		// 				    .from(this.endpointURI)
		// 				    .jsonHal()
		// 				    .withRequestOptions(options)
		// 				    .withTemplateParameters({ creditorReference: this.creditor, rum: rum })
		// 				    .follow('https://api.slimpay.net/alps#get-mandates')
		// 			        .get((err, res) => {
		// 				        if (err) {
		// 				            reject(err);
		// 				        } else {
		// 				            var result = JSON.parse(res.body);
		// 				            resolve(result);
		// 				        }
		// 				    });
		// 			});
		// 		});
		// }

	}, {
		key: 'follow',
		value: function follow(method, linkToFollow) {
			var options = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

			switch (method) {
				case 'GET':
					if (options) {
						return this.get(linkToFollow, options);
					} else {
						return this.get(linkToFollow);
					}
					break;
				case 'POST':
					if (options) {
						return this.post(linkToFollow, options);
					} else {
						return this.post(linkToFollow);
					}
					break;
				case 'PUT':
					if (options) {
						return this.put(linkToFollow, options);
					} else {
						return this.put(linkToFollow);
					}
					break;
				case 'PATCH':
					if (options) {
						return this.patch(linkToFollow, options);
					} else {
						return this.patch(linkToFollow);
					}
					break;
				default:
					return this.get(linkToFollow);
			}
		}
	}, {
		key: 'getLinks',
		value: function getLinks() {
			var _this = this;

			return this.getAuthenticationToken().then(function (token) {
				return _this.buildOptions(token);
			}).then(function (options) {
				return new _bluebird2['default'](function (resolve, reject) {
					traverson.from(_this.endpointURI).jsonHal().withRequestOptions(options).get(function (err, res) {
						if (err) reject(err);else resolve(JSON.parse(res.body));
					});
				});
			});
		}
	}, {
		key: 'get',
		value: function get(linkToFollow) {
			var _this2 = this;

			var libOptions = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

			if (!libOptions) {
				return this.getAuthenticationToken().then(function (token) {
					return _this2.buildOptions(token);
				}).then(function (options) {
					return new _bluebird2['default'](function (resolve, reject) {
						traverson.from(_this2.endpointURI).jsonHal().withRequestOptions(options).follow(linkToFollow).get(function (err, res) {
							if (err) {
								reject(err);
							} else {
								var result = JSON.parse(res.body);
								resolve(result);
							}
						});
					});
				});
			} else {
				if (libOptions.templateParameters) {
					return this.getAuthenticationToken().then(function (token) {
						return _this2.buildOptions(token);
					}).then(function (options) {
						return new _bluebird2['default'](function (resolve, reject) {
							traverson.from(_this2.endpointURI).jsonHal().withRequestOptions(options).withTemplateParameters(libOptions.templateParameters).follow(linkToFollow).get(function (err, res) {
								if (err) {
									reject(err);
								} else {
									var result = JSON.parse(res.body);
									resolve(result);
								}
							});
						});
					});
				}
			}
		}
	}, {
		key: 'post',
		value: function post(linkToFollow) {
			var _this3 = this;

			var libOptions = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

			if (!libOptions) {
				return this.getAuthenticationToken().then(function (token) {
					return _this3.buildOptions(token);
				}).then(function (options) {
					return new _bluebird2['default'](function (resolve, reject) {
						traverson.from(_this3.endpointURI).jsonHal().withRequestOptions(options).follow(linkToFollow).post(function (err, res) {
							if (err) reject(err);else resolve(JSON.parse(res.body));
						});
					});
				});
			} else {
				if (!libOptions.templateParameters && libOptions.item) {
					return this.getAuthenticationToken().then(function (token) {
						return _this3.buildOptions(token);
					}).then(function (options) {
						return new _bluebird2['default'](function (resolve, reject) {
							traverson.from(_this3.endpointURI).jsonHal().withRequestOptions(options)
							// .withTemplateParameters(libOptions.templateParameters)
							.follow(linkToFollow).post(libOptions.item, function (err, res) {
								if (err) reject(err);else resolve(JSON.parse(res.body));
							});
						});
					});
				} else {
					return this.getAuthenticationToken().then(function (token) {
						return _this3.buildOptions(token);
					}).then(function (options) {
						return new _bluebird2['default'](function (resolve, reject) {
							traverson.from(_this3.endpointURI).jsonHal().withRequestOptions(options).withTemplateParameters(libOptions.templateParameters).follow(linkToFollow).post(libOptions.item, function (err, res) {
								if (err) reject(err);else resolve(JSON.parse(res.body));
							});
						});
					});
				}
			}
		}
	}, {
		key: 'put',
		value: function put(linkToFollow) {
			var _this4 = this;

			var libOptions = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

			if (!libOptions) {
				return this.getAuthenticationToken().then(function (token) {
					return _this4.buildOptions(token);
				}).then(function (options) {
					return new _bluebird2['default'](function (resolve, reject) {
						traverson.from(_this4.endpointURI).jsonHal().withRequestOptions(options).follow(linkToFollow).put(function (err, res) {
							if (err) reject(err);else resolve(JSON.parse(res.body));
						});
					});
				});
			} else {
				if (!libOptions.templateParameters && libOptions.item) {
					return this.getAuthenticationToken().then(function (token) {
						return _this4.buildOptions(token);
					}).then(function (options) {
						return new _bluebird2['default'](function (resolve, reject) {
							traverson.from(_this4.endpointURI).jsonHal().withRequestOptions(options).follow(linkToFollow).put(libOptions.item, function (err, res) {
								if (err) reject(err);else resolve(JSON.parse(res.body));
							});
						});
					});
				} else {
					return this.getAuthenticationToken().then(function (token) {
						return _this4.buildOptions(token);
					}).then(function (options) {
						return new _bluebird2['default'](function (resolve, reject) {
							traverson.from(_this4.endpointURI).jsonHal().withRequestOptions(options).withTemplateParameters(libOptions.templateParameters).follow(linkToFollow).put(libOptions.item, function (err, res) {
								if (err) reject(err);else resolve(JSON.parse(res.body));
							});
						});
					});
				}
			}
		}
	}, {
		key: 'patch',
		value: function patch(linkToFollow) {
			var _this5 = this;

			var libOptions = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

			if (!libOptions) {
				return this.getAuthenticationToken().then(function (token) {
					return _this5.buildOptions(token);
				}).then(function (options) {
					return new _bluebird2['default'](function (resolve, reject) {
						traverson.from(_this5.endpointURI).jsonHal().withRequestOptions(options).follow(linkToFollow).patch(function (err, res) {
							if (err) reject(err);else resolve(JSON.parse(res.body));
						});
					});
				});
			} else {
				if (!libOptions.templateParameters && libOptions.item) {
					return this.getAuthenticationToken().then(function (token) {
						return _this5.buildOptions(token);
					}).then(function (options) {
						return new _bluebird2['default'](function (resolve, reject) {
							traverson.from(_this5.endpointURI).jsonHal().withRequestOptions(options).follow(linkToFollow).patch(libOptions.item, function (err, res) {
								if (err) reject(err);else resolve(JSON.parse(res.body));
							});
						});
					});
				} else {
					return this.getAuthenticationToken().then(function (token) {
						return _this5.buildOptions(token);
					}).then(function (options) {
						return new _bluebird2['default'](function (resolve, reject) {
							traverson.from(_this5.endpointURI).jsonHal().withRequestOptions(options).withTemplateParameters(libOptions.templateParameters).follow(linkToFollow).patch(libOptions.item, function (err, res) {
								if (err) reject(err);else resolve(JSON.parse(res.body));
							});
						});
					});
				}
			}
		}
	}]);

	return SlimPay;
})();

exports = module.exports = new SlimPay();