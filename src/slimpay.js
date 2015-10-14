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
        this.creditor = creditor;
    }

    setEnv (env) {
        if (env === 'production') this.env = env;
        else if (env === 'development') this.env = env;
        else throw new Error('env must be one of "production" or "development"');
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
                    return options;
                });
        } else {
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

    getCreditor (traversal) {
        return new Promise((resolve, reject) => {
            return traversal.continue()
                .follow('https://api.slimpay.net/alps#get-creditor')
                .get((err, res, traversal) => {
                    return controleResult(err, res, traversal, resolve, reject);
                });
        });
    }

    getSubscriber (traversal) {
        return new Promise((resolve, reject) => {
            return traversal.continue()
                .follow('https://api.slimpay.net/alps#get-subscriber')
                .get((err, res, traversal) => {
                    return controleResult(err, res, traversal, resolve, reject);
                });
        });
    }

    follow (traversal, follow) {
        if(!follow.method) follow.method = 'GET';
        switch(follow.method) {
            case 'GET':
                return new Promise((resolve, reject) => {
                    return traversal.continue()
                        .follow(follow.relation)
                        .get((err, res, traversal) => {
                            return controleResult(err, res, traversal, resolve, reject);
                        });
                });
            case 'POST':
                if(!follow.data) throw new Error('must have data to POST');
                else {
                    if(follow.templateParameters) {
                        return new Promise((resolve, reject) => {
                            return traversal.continue()
                                .withTemplateParameters(follow.templateParameters)
                                .follow(follow.relation)
                                .post(follow.data, (err, res, traversal) => {
                                    return controleResult(err, res, traversal, resolve, reject);
                                });
                        });
                    } else {
                        return new Promise((resolve, reject) => {
                            return traversal.continue()
                                .follow(follow.relation)
                                .post(follow.data, (err, res, traversal) => {
                                    return controleResult(err, res, traversal, resolve, reject);
                                });
                        });
                    }
                }
            case 'PUT':
                if(!follow.data) throw new Error('must have data to PUT');
                else {
                    if(follow.templateParameters) {
                        return new Promise((resolve, reject) => {
                            return traversal.continue()
                                .withTemplateParameters(follow.templateParameters)
                                .follow(follow.relation)
                                .put(follow.data, (err, res, traversal) => {
                                    return controleResult(err, res, traversal, resolve, reject);
                                });
                        });
                    } else {
                        return new Promise((resolve, reject) => {
                            return traversal.continue()
                                .follow(follow.relation)
                                .put(follow.data, (err, res, traversal) => {
                                    return controleResult(err, res, traversal, resolve, reject);
                                });
                        });
                    }
                }
            case 'PATCH':
                if(!follow.data) throw new Error('must have data to POST');
                else {
                    if(follow.templateParameters) {
                        return new Promise((resolve, reject) => {
                            return traversal.continue()
                                .withTemplateParameters(follow.templateParameters)
                                .follow(follow.relation)
                                .patch(follow.data, (err, res, traversal) => {
                                    return controleResult(err, res, traversal, resolve, reject);
                                });
                        });
                    } else {
                        return new Promise((resolve, reject) => {
                            return traversal.continue()
                                .follow(follow.relation)
                                .patch(follow.data, (err, res, traversal) => {
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
}

exports = module.exports = new SlimPay();