# SlimPay
SlimPay allows europeans to charge customers using SEPA rather than bank cards.

Full documention can be found [HERE](https://api-sandbox.slimpay.net/docs/)

* sandbox url endpoint : `api-sandbox.slimpay.net/`
* production url endpoint : `api.slimpay.net/`
* authentication URI path : `oauth/token?grant_type=client_credentials&scope=api`

## Usage

First thing to do is configure slimpay with your app credentials and the endpoint URL

```javascript
var slimpay = require('slimpay');

var endPointUrl = 'api-sandbox.slimpay.net/';
var authPath = 'oauth/token?grant_type=client_credentials&scope=api';

var user = 'democreditor01';
var password = 'demosecret01';
var creditor = 'democreditor';

var config = {
  user: user,
  password: password,
  endPointUrl: endPointUrl,
  authPath: authPath,
  creditor: creditor
}

slimpay.config(config);
```
Now slimpay is ready to use. The first thing you can do is get some links that you might want to follow.
```javascript
slimpay.getLinks().then(function (result) {
  console.log(result);
});
```
This will return something like this
```javascript
{
    "_links": {
        "self": {
            "href": "https://api-sandbox.slimpay.net/"
        },
        "https://api.slimpay.net/alps#post-token": {
            "href": "https://api-sandbox.slimpay.net/oauth/token"
        },
        "https://api.slimpay.net/alps#create-orders": {
            "href": "https://api-sandbox.slimpay.net/orders"
        },
        "https://api.slimpay.net/alps#get-orders": {
            "href": "https://api-sandbox.slimpay.net/orders{?creditorReference,reference}",
            "templated": true
        },
        "https://api.slimpay.net/alps#get-creditors": {
            "href": "https://api-sandbox.slimpay.net/creditors{?reference}",
            "templated": true
        },
        "https://api.slimpay.net/alps#create-mandates": {
            "href": "https://api-sandbox.slimpay.net/mandates"
        },
        "https://api.slimpay.net/alps#get-mandates": {
            "href": "https://api-sandbox.slimpay.net/mandates{?creditorReference,rum}",
            "templated": true
        },
        "https://api.slimpay.net/alps#create-documents": {
            "href": "https://api-sandbox.slimpay.net/documents"
        },
        "https://api.slimpay.net/alps#get-documents": {
            "href": "https://api-sandbox.slimpay.net/documents{?creditorReference,entityReference,reference}",
            "templated": true
        },
        "https://api.slimpay.net/alps#create-direct-debits": {
            "href": "https://api-sandbox.slimpay.net/direct-debits"
        },
        "https://api.slimpay.net/alps#get-direct-debits": {
            "href": "https://api-sandbox.slimpay.net/direct-debits{?id}",
            "templated": true
        },
        "https://api.slimpay.net/alps#create-recurrent-direct-debits": {
            "href": "https://api-sandbox.slimpay.net/recurrent-direct-debits"
        },
        "https://api.slimpay.net/alps#get-recurrent-direct-debits": {
            "href": "https://api-sandbox.slimpay.net/recurrent-direct-debits{?id}",
            "templated": true
        },
        "https://api.slimpay.net/alps#get-card-transactions": {
            "href": "https://api-sandbox.slimpay.net/card-transactions{?id}",
            "templated": true
        },
        "https://api.slimpay.net/alps#get-card-aliases": {
            "href": "https://api-sandbox.slimpay.net/card-aliases{?id}",
            "templated": true
        },
        "https://api.slimpay.net/alps#get-recurrent-card-transactions": {
            "href": "https://api-sandbox.slimpay.net/recurrent-card-transactions{?id}",
            "templated": true
        },
        "https://api.slimpay.net/alps#get-card-transaction-issues": {
            "href": "https://api-sandbox.slimpay.net/card-transaction-issues{?id}",
            "templated": true
        },
        "profile": {
            "href": "https://api-sandbox.slimpay.net/alps/v1"
        }
    }
}
```

All you have to do now is follow one of those links. Lets say the first thing you want to do is to create a mandate. (send your user to slimpay for a digital signature.)

```javascript
var orderRepresentation = {
    creditor : {
       reference : "democreditor"
     }, 
     subscriber : {
       reference : "subscriber666"
     },
     items : [{ 
       type : 'signMandate',
       mandate : { 
         signatory : { 
           honorificPrefix : "Mr", 
           familyName : "Doe", 
           givenName : "John", 
           telephone : "+33666666666", 
           email : "email@example.com", 
           billingAddress : { 
             street1 : "666 the number of", 
             street2 : "The BEAST", 
             postalCode : "66666", 
             city : "Paris", 
             country : "FR" 
           } 
         }
       } 
     }],
    started : true 
}
var options = {
  item: orderRepresentation
}
slimpay.follow('POST', 'https://api.slimpay.net/alps#create-orders', options)
  .then(function (result) {
    console.log(result);
  });
```
This should give you something that looks like
```javascript
{
    "_links": {
        "self": {
            "href": "https://api-sandbox.slimpay.net/creditors/democreditor/orders/459e7793-6398-11e5-90a1-c141e74856fd"
        },
        "https://api.slimpay.net/alps#get-creditor": {
            "href": "https://api-sandbox.slimpay.net/creditors/democreditor"
        },
        "https://api.slimpay.net/alps#get-subscriber": {
            "href": "https://api-sandbox.slimpay.net/creditors/democreditor/orders/459e7793-6398-11e5-90a1-c141e74856fd/subscribers/subscriber07"
        },
        "https://api.slimpay.net/alps#user-approval": {
            "href": "https://slimpay.net/slimpaytpe16/userApproval?accessCode=spjd4d87yXcrsfe9jHjgOlXojAts101NeUzyTEF4DHkTVhbdUIKj9X4ZPC3A"
        },
        "https://api.slimpay.net/alps#get-order-items": {
            "href": "https://api-sandbox.slimpay.net/creditors/democreditor/orders/45e7793-6398-11e5-90a1-c141e74856fd/items"
        }
    },
    "reference": "459e7793-6398-11e5-90a1-c141e7456fd",
    "state": "open.running",
    "started": true,
    "dateCreated": "2015-09-25T15:15:35.889+0000"
}
```

slimpay.follow() takes a method, a link, and options.

options is an object which can take two parameters :

* `item` is the object to send, generally during a POST request.
* `templateParameters` is also an object.

Example of `templateParameters` :
```javascript
{ creditorReference: "democreditor", reference: "random-reference" }
```

More coming soon....
