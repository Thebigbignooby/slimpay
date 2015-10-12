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

function controleResult (err, res, traversal, resolve, reject) {
    if (err) {
        reject(err);
    } else {
        var body = JSON.parse(res.body);
        if (body.code){
            reject(result);
        } else {
            resolve({body, traversal});
        }
    }
}

class SlimPay {

    constructor () {
        this.env = 'development';
    }

    config (config) {
        console.log(config);
        if(!config.user) {
            console.log('new error, no config.user');
            return new Error('config must have user');
        }
        if(!config.password) {
            console.log('new error, no config.password');
            return new Error('config must have password');
        }
        this.user = config.user;
        this.password = config.password;
    }

    setCreditor (creditor) {
        console.log(creditor);
        this.creditor = creditor;
    }

    setEnv (env) {
        console.log(env);
        if (env === 'production') this.env = env;
        else if (env === 'development') this.env = env;
        else throw new Error('env must be one of production or development');
    }

    init () {
        this.endPoint = this.env === 'production'
            ? "https://api.slimpay.net/"
            : 'https://api-sandbox.slimpay.net/';
        var authPath = 'oauth/token?grant_type=client_credentials&scope=api';
        this.authURI = this.endPoint + authPath;
        this.authConfig = {
            uri: this.authURI,
            auth:{
                'user': this.user,
                'pass': this.password,
                'sendImmediately': false
            },
            method: 'GET'
        };

        this.getOrRefreshToken();
            
    }

    tokenIsNotValid () {
        var now = Date.now() / 1000;
        var delta = now - this.tokenConfig.seconds;
        if( delta > this.tokenConfig.ttl) return true;
        else return false;
    }

    getOrRefreshToken () {
        return this.getAuthenticationToken(this.authConfig)
            .then( result => {
                this.tokenConfig = result;
                this.tokenConfig['seconds'] = Date.now() / 1000;
                console.log('this.tokenConfig = ', this.tokenConfig);
                return result.token;
            })
            .then( token => {
                return this.requestOptions = this.buildOptions(token);
            });
    }

    checkToken () {
        if(this.tokenIsNotValid()) {
            return this.getOrRefreshToken()
                .then( options => {
                    console.log('options ==> ', options);            
                    return options;
                });
        } else {
            console.log('didn\'t need to');
            console.log('this.requestOptions ===> ', this.requestOptions);
            return Promise.resolve(this.requestOptions);
        }
    }

    getAuthenticationToken (options) {
        return pRequest(options)
            .then( data => {
                var parsedBody = JSON.parse(data.body);
                if(parsedBody.error){
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

    buildOptions (bearerToken) {
        return {
            headers: {
                Authorization: 'Bearer ' + bearerToken,
                Accept: 'application/hal+json',
                'Content-type': 'application/json',
                profile: '"https://api.slimpay.net/alps/v1"'
            }
        };
    }

    slimPayApi () {
        // console.log('in slimPayApi');
        return this.checkToken()
            .then( requestOptions => traverson.from(this.endPoint).jsonHal().withRequestOptions(requestOptions));
    }

    getLinks () {
        return this.slimPayApi()
            .then( api => {
                return new Promise((resolve, reject) => {
                    api.get((err, res, traversal) => {
                        if (err) reject(err);
                        else {
                            var body = JSON.parse(res.body);
                            resolve({body, traversal});
                        };
                    });
                });
            })
    }

    signMandate (item) {
        return this.getLinks().then( links => {
            return new Promise((resolve, reject) => {
                links.traversal.continue()
                    .follow('https://api.slimpay.net/alps#create-orders')
                    .post(item, (err, res, traversal) => {
                        return controleResult(err, res, traversal, resolve, reject);
                    });
            });
                
        });
    }

    getOrders (orderRef) {
        let templateParameters = {
            creditorReference: this.creditor,
            reference: orderRef
        };
        return this.getLinks().then( links => {
            return new Promise((resolve, reject) => {
                links.traversal.continue()
                    .follow('https://api.slimpay.net/alps#get-orders')
                    .withTemplateParameters(templateParameters)
                    .get((err, res, traversal) => {
                        return controleResult(err, res, traversal, resolve, reject);
                    });
            });
                
        });
    }

    getMandate (traversal) {
        return new Promise((resolve, reject) => {
            return traversal.continue()
                .follow('https://api.slimpay.net/alps#get-mandate')
                .get((err, res, traversal) => {
                    return controleResult(err, res, traversal, resolve, reject);
                });
        });
    }   

    follow (method, linkToFollow, options = null) {
        // test METHOD IS ONE OF GET POST PUT PATCH OR DELETE
        // test if options has a traversal here ?
        // some for request data or template parameters?
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
            return this.getLinks().then( links => {
                return new Promise((resolve, reject) => {
                    links.traversal.continue()
                        .follow(linkToFollow)
                        .post((err, res, traversal) => {
                            return controleResult(err, res, traversal, resolve, reject);
                        });
                });
                    
            });
        } else {
            if(!libOptions.templateParameters && libOptions.item) {
                return this.getLinks().then( links => {
                    return new Promise((resolve, reject) => {
                        links.traversal.continue()
                            .follow(linkToFollow)
                            .post(item, (err, res, traversal) => {
                                return controleResult(err, res, traversal, resolve, reject);
                            });
                    });
                        
                });
            } else {
                return this.getLinks().then( links => {
                    return new Promise((resolve, reject) => {
                        links.traversal.continue()
                            .withTemplateParameters(libOptions.templateParameters)
                            .follow(linkToFollow)
                            .post(item, (err, res, traversal) => {
                                return controleResult(err, res, traversal, resolve, reject);
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