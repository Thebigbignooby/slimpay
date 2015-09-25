import Promise from 'bluebird';
import request from 'request';

var traverson = require('traverson');
var JsonHalAdapter = require('traverson-hal');
traverson.registerMediaType(JsonHalAdapter.mediaType, JsonHalAdapter);

var pRequest = function(options){
    return new Promise(function(resolve, reject){
        request(options, function(err, response, body){
            if(err) reject(err);
            resolve({response: response, body: body});
        });
    });
}

class SlimPay {

	config (config) {
		if(!config.user) {
			console.log('new error, no config.user');
			return new Error('config must have user');
		}
		if(!config.password) {
			console.log('new error, no config.password');
			return new Error('config must have password');
		}
		if(!config.authPath) {
			console.log('new error, no config.authPath');
			return new Error('config must have authPath');
		}
		if(!config.endPointUrl) {
			console.log('new error, no config.endPointUrl');
			return new Error('config must have endPointUrl');
		}
		if(!config.creditor) {
			console.log('new error, no config.creditor');
			return new Error('config must have creditor');
		}
		let https = 'https://';
		this.user = config.user;
		this.password = config.password;
		this.creditor = config.creditor;
		this.endPointUrl = config.endPointUrl;
		this.authPath = config.authPath;
		this.endpointURI = https + config.endPointUrl;
		this.authURI = https + config.endPointUrl + config.authPath;
	}

	getAuthConfig () {
		return {
			uri: this.authURI,
			auth:{
			    'user': this.user,
			    'pass': this.password,
			    'sendImmediately': false
			},
			method: 'GET'
		};
	}

	getAuthenticationToken () {

		let authOptions = this.getAuthConfig();

		return pRequest(authOptions)
			.then( data => {
				var parsedBody = JSON.parse(data.body);
				if(parsedBody.error){
					throw new Error(data.body);
				}
				var bearerToken = JSON.parse(data.body).access_token;
				return bearerToken;
			});
	}

	buildOptions (bearerToken) {
		return {
		    headers: {
		        Authorization: 'Bearer '+bearerToken,
		        Accept : 'application/hal+json',
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

	follow (method, linkToFollow, options = null) {
		switch(method) {
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

	getLinks () {
		return this.getAuthenticationToken()
			.then(token => {
				return this.buildOptions(token)
			})
			.then(options => {
				return new Promise((resolve, reject) => {
					traverson.from(this.endpointURI).jsonHal().withRequestOptions(options)
				        .get((err, res) => {
					        if (err) reject(err);
					        else resolve(JSON.parse(res.body));
					    });
				});
			});
	}

	get (linkToFollow, libOptions = null) {
		if(!libOptions) {
			return this.getAuthenticationToken()
				.then(token => {
					return this.buildOptions(token)
				})
				.then(options => {
					return new Promise((resolve, reject) => {
						traverson
						    .from(this.endpointURI)
						    .jsonHal()
						    .withRequestOptions(options)
						    .follow(linkToFollow)
					        .get((err, res) => {
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
				return this.getAuthenticationToken()
					.then(token => {
						return this.buildOptions(token)
					})
					.then(options => {
						return new Promise((resolve, reject) => {
							traverson.from(this.endpointURI).jsonHal().withRequestOptions(options)
							    .withTemplateParameters(libOptions.templateParameters)
							    .follow(linkToFollow)
						        .get((err, res) => {
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

	post (linkToFollow, libOptions = null) {
		if(!libOptions){
			return this.getAuthenticationToken()
				.then(token => {
					return this.buildOptions(token)
				})
				.then(options => {
					return new Promise((resolve, reject) => {
						traverson.from(this.endpointURI).jsonHal().withRequestOptions(options)
						    .follow(linkToFollow)
						    .post((err, res) => {
						        if (err) reject(err);
						        else resolve(JSON.parse(res.body));
						    });
					});
				});
		} else {
			if(!libOptions.templateParameters && libOptions.item) {
				return this.getAuthenticationToken()
					.then(token => {
						return this.buildOptions(token)
					})
					.then(options => {
						return new Promise((resolve, reject) => {
							traverson.from(this.endpointURI).jsonHal().withRequestOptions(options)
								// .withTemplateParameters(libOptions.templateParameters)
							    .follow(linkToFollow)
							    .post(libOptions.item, (err, res) => {
							        if (err) reject(err);
							        else resolve(JSON.parse(res.body));
							    });
						});
					});
			} else {
				return this.getAuthenticationToken()
					.then(token => {
						return this.buildOptions(token)
					})
					.then(options => {
						return new Promise((resolve, reject) => {
							traverson.from(this.endpointURI).jsonHal().withRequestOptions(options)
								.withTemplateParameters(libOptions.templateParameters)
							    .follow(linkToFollow)
							    .post(libOptions.item, (err, res) => {
							        if (err) reject(err);
							        else resolve(JSON.parse(res.body));
							    });
						});
					});
			}
		}
	}

	put (linkToFollow, libOptions = null) {
		if (!libOptions) {
			return this.getAuthenticationToken()
				.then(token => {
					return this.buildOptions(token)
				})
				.then(options => {
					return new Promise((resolve, reject) => {
						traverson.from(this.endpointURI).jsonHal().withRequestOptions(options)
						    .follow(linkToFollow)
						    .put((err, res) => {
						        if (err) reject(err);
						        else resolve(JSON.parse(res.body));
						    });
					});
				});
		} else {
			if(!libOptions.templateParameters && libOptions.item){
				return this.getAuthenticationToken()
					.then(token => {
						return this.buildOptions(token)
					})
					.then(options => {
						return new Promise((resolve, reject) => {
							traverson.from(this.endpointURI).jsonHal().withRequestOptions(options)
							    .follow(linkToFollow)
							    .put(libOptions.item, (err, res) => {
							        if (err) reject(err);
							        else resolve(JSON.parse(res.body));
							    });
						});
					});
			} else {
				return this.getAuthenticationToken()
					.then(token => {
						return this.buildOptions(token)
					})
					.then(options => {
						return new Promise((resolve, reject) => {
							traverson.from(this.endpointURI).jsonHal().withRequestOptions(options)
								.withTemplateParameters(libOptions.templateParameters)
							    .follow(linkToFollow)
							    .put(libOptions.item, (err, res) => {
							        if (err) reject(err);
							        else resolve(JSON.parse(res.body));
							    });
						});
					});
			}
		}
	}

	patch (linkToFollow, libOptions = null) {
		if (!libOptions) {
			return this.getAuthenticationToken()
				.then(token => {
					return this.buildOptions(token)
				})
				.then(options => {
					return new Promise((resolve, reject) => {
						traverson.from(this.endpointURI).jsonHal().withRequestOptions(options)
						    .follow(linkToFollow)
						    .patch((err, res) => {
						        if (err) reject(err);
						        else resolve(JSON.parse(res.body));
						    });
					});
				});
		} else {
			if(!libOptions.templateParameters && libOptions.item){
				return this.getAuthenticationToken()
					.then(token => {
						return this.buildOptions(token)
					})
					.then(options => {
						return new Promise((resolve, reject) => {
							traverson.from(this.endpointURI).jsonHal().withRequestOptions(options)
							    .follow(linkToFollow)
							    .patch(libOptions.item, (err, res) => {
							        if (err) reject(err);
							        else resolve(JSON.parse(res.body));
							    });
						});
					});
			} else {
				return this.getAuthenticationToken()
					.then(token => {
						return this.buildOptions(token)
					})
					.then(options => {
						return new Promise((resolve, reject) => {
							traverson.from(this.endpointURI).jsonHal().withRequestOptions(options)
								.withTemplateParameters(libOptions.templateParameters)
							    .follow(linkToFollow)
							    .patch(libOptions.item, (err, res) => {
							        if (err) reject(err);
							        else resolve(JSON.parse(res.body));
							    });
						});
					});
			}
		}
	}
}

exports = module.exports = new SlimPay();