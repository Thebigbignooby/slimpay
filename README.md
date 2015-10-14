# SlimPay
SlimPay allows europeans to charge customers using SEPA rather than bank cards.

The Single Euro Payments Area (SEPA) is a payment-integration initiative of the European Union for simplification of bank transfers denominated in euro.

Full documention can be found [HERE](https://api-sandbox.slimpay.net/docs/)

## Installing

## Getting started

1) First thing to do is configure slimpay with your app credentials.
2) Next you need to set the creditor.
3) Optional : set the environnment. Defaults to `development`.
4) Call the `init()` method. This triggers a request to get an initial Authorization Bearer token.

```javascript
var slimpay = require('slimpay');

var user = 'democreditor01';
var password = 'demosecret01';
var creditor = 'democreditor';

var config = {
  user: user,
  password: password
}

slimpay.config(config);
slimpay.setCreditor(creditor);

slimpay.setEnv('development'); // Optional.
// must be one of 'development' or 'production'.
// defaults to 'development'
slimpay.init();
```
Now slimpay is ready to use. The first thing you can do is get some links that you might want to follow.
```javascript
slimpay.getLinks().then(function (result) {
  console.log(result);
});
```
This will return something like this
```javascript
{ body: 
   { _links: 
      { self: [Object],
        'https://api.slimpay.net/alps#post-token': [Object],
        'https://api.slimpay.net/alps#create-orders': [Object],
        'https://api.slimpay.net/alps#get-orders': [Object],
        'https://api.slimpay.net/alps#get-creditors': [Object],
        'https://api.slimpay.net/alps#create-mandates': [Object],
        'https://api.slimpay.net/alps#get-mandates': [Object],
        'https://api.slimpay.net/alps#create-documents': [Object],
        'https://api.slimpay.net/alps#get-documents': [Object],
        'https://api.slimpay.net/alps#create-direct-debits': [Object],
        'https://api.slimpay.net/alps#get-direct-debits': [Object],
        'https://api.slimpay.net/alps#get-direct-debit-issues': [Object],
        'https://api.slimpay.net/alps#create-recurrent-direct-debits': [Object],
        'https://api.slimpay.net/alps#get-recurrent-direct-debits': [Object],
        'https://api.slimpay.net/alps#get-card-transactions': [Object],
        'https://api.slimpay.net/alps#get-card-aliases': [Object],
        'https://api.slimpay.net/alps#get-recurrent-card-transactions': [Object],
        'https://api.slimpay.net/alps#get-card-transaction-issues': [Object],
        profile: [Object] } },
  traversal: { continue: [Function] } }
```
-> a more detailed view : 
```javascript
{
    "body": {
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
                "href": "https://api-sandbox.slimpay.net/mandates{?creditorReference,rum,id}",
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
            "https://api.slimpay.net/alps#get-direct-debit-issues": {
                "href": "https://api-sandbox.slimpay.net/direct-debit-issues{?id}",
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
    },
    "traversal": {}
}
```

`traversal` is the current state of the ressource. If you want to follow up with another request, instead of doing another new request to the API, you can pass this `traversal` object into the `follow()` method : `slimpay.follow(traversal, options)`.

`options` is an object which contains several parameters :
- `method` : defaults to `GET`. Must be one of `GET` `POST` `PUT` `PATCH` or `DELETE`.
- `relation` is the link you want to follow.
- `data` is the request-data object to be sent to SlimPay by way of a `POST`, `PUT` or `PATCH`.

```javascript
// Example
var options = {
  method: 'GET',
    relation: 'https://api.slimpay.net/alps#get-orders'
};
slimpay.follow(traversal, options).then(function(response){
  console.log(response);
});
```

## Standard usecase : Sign a mandate

The steps are rather straight-forward :

1) Create an order-representation which will be `POST`ed to the `#create-orders` link.

2) Call the `signMandate()` with the order-representation as a parameter.

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

slimpay.signMandate(orderRepresentation)
  .then(function (result) {
    console.log(result);
  });
```
This should give you something that looks like this:
```javascript
{
    "body": {
        "_links": {
            "self": {
                "href": "https://api-sandbox.slimpay.net/creditors/democreditor/orders/6e888b6d-70fc-11e5-93ea-c3067b41b733"
            },
            "https://api.slimpay.net/alps#get-creditor": {
                "href": "https://api-sandbox.slimpay.net/creditors/democreditor"
            },
            "https://api.slimpay.net/alps#get-subscriber": {
                "href": "https://api-sandbox.slimpay.net/creditors/democreditor/orders/6e888b6d-70fc-11e5-93ea-c3067b41b733/subscribers/subscriber666"
            },
            "https://api.slimpay.net/alps#user-approval": {
                "href": "https://slimpay.net/slimpaytpe16/userApproval?accessCode=spSP7t3xcvP78l1i14JB00jIvbh06eykpAuxsDQW76dIvQGQBmZfnxXFwiVU"
            },
            "https://api.slimpay.net/alps#get-order-items": {
                "href": "https://api-sandbox.slimpay.net/creditors/democreditor/orders/6e888b6d-70fc-11e5-93ea-c3067b41b733/items"
            }
        },
        "reference": "6e888b6d-70fc-11e5-93ea-c3067d41b733",
        "state": "open.running",
        "started": true,
        "dateCreated": "2015-10-12T16:15:19.321+0000"
    },
    "traversal": {}
}
```

3) What you want to do now is redirect your user to the URL provide in the `user-approval` link. This is a secure page hosted by SlimPay where your user can sign the mandate electronically by filling in a code he will have received by text-message on the phone number provided in the initial order-representation.

4) In the classic scenario where you user has successfully signed the mandate, he is then redirected to a return-url which you determine when generating your slimpay API credentials. At this point you must retrieve the `order` and check its state is `'closed.completed'`.

5) If the state is `'closed.completed'` you may then get the mandate by doing a `getMandate()`.

Lets say your visitor has signed a mandate and returns to your website. You want to get the mandate to confirm that it is active. To do that, you must first do a `get-order` and check if `state === 'closed.completed'`. If this is the case you can then do a `get-mandate` simply by calling `slimpay.getMandate(traversal)` where traversal is the ressource given by the `get-order` action.

Example : 
```javascript
return slimpay.getOrders(orderRef)
            .then(function(result){
                if (result.body.state === 'closed.completed') {
                    return slimpay.getMandate(result.traversal);
                } else {
                    return result;
                }
            });
```

This documentation is a work in progress (WIP)
