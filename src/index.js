const Hapi = require('hapi');
const path = require('path');
const request = require('superagent')

const server = new Hapi.Server();
server.connection({ port: process.env.PORT || 8080 });

server.register(require('inert'), (err) => {
  if (err) {
    throw err;
  }
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'public',
        listing: true
      }
    }
  });
  server.start((err) => {
    if (err) {
      throw err;
    }
    console.log('Server running at:', server.info.uri);
    queryEbay();
  });
});

const appId = 'MatthewS-ebayauct-PRD-2bff6a2ad-3463f427';

function queryEbay() {
  var url = "http://svcs.ebay.com/services/search/FindingService/v1";
  url += "?OPERATION-NAME=findItemsAdvanced";
  url += "&SERVICE-VERSION=1.0.0";
  url += "&SECURITY-APPNAME=" + appId;
  url += "&GLOBAL-ID=EBAY-GB";
  url += "&RESPONSE-DATA-FORMAT=JSON";
  url += "&REST-PAYLOAD=true";
  url += "&keywords=tolkein";
  url += "&categoryId=1";
  url += "&itemFilter.name=MaxPrice";
  url += "&itemFilter.value=1";
  url += "&itemFilter.name=EndTimeFrom";
  url += "&itemFilter.value="

  request
    .get(url)
    .end((err, res) => {
      console.log(Object.keys(res))
      console.log(JSON.parse(res.text).findItemsAdvancedResponse[0].searchResult[0].item[0].sellingStatus[0].currentPrice)
    })
}

