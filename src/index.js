const Hapi = require('hapi');
const path = require('path');
const request = require('superagent');
const striptags = require('striptags');

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
  let url = "http://svcs.ebay.com/services/search/FindingService/v1";
  url += "?OPERATION-NAME=findItemsAdvanced";
  url += "&SERVICE-VERSION=1.0.0";
  url += "&SECURITY-APPNAME=" + appId;
  url += "&GLOBAL-ID=EBAY-GB";
  url += "&RESPONSE-DATA-FORMAT=JSON";
  url += "&REST-PAYLOAD=true";
  //url += "&keywords=tolkein";
  url += "&categoryId=7294";
  url += "&itemFilter(0).name=MaxPrice";
  url += "&itemFilter(0).value=1";
  url += "&itemFilter(1).name=EndTimeFrom";
  url += "&itemFilter(1).value=2016-11-04T16:00:00.768Z";
  url += "&itemFilter(2).name=EndTimeTo";
  url += "&itemFilter(2).value=2016-11-04T20:00:00.768Z";
  url += "&itemFilter(3).name=LocatedIn";
  url += "&itemFilter(3).value=GB";

  request
    .get(url)
    .end((err, res) => {
      //console.log(Object.keys(res))
      //console.log(JSON.parse(res.text).findItemsAdvancedResponse[0].searchResult[0].item[0].sellingStatus[0].currentPrice)
      //console.log(JSON.parse(res.text).findItemsAdvancedResponse[0].searchResult[0].item[0])
      const itemId = JSON.parse(res.text).findItemsAdvancedResponse[0].searchResult[0].item[10].itemId[0];
      getItem(appId, 'Description,ItemSpecifics', itemId)
    });
};

function getItem(appId, selectors, itemId, callback) {
  let url = "http://open.api.ebay.com/shopping";
  url += "?callname=GetSingleItem";
  url += "&responseencoding=JSON";
  url += "&appid=" + appId;
  url += "&siteid=0";
  url += "&version=967";
  url += "&ItemID=" + itemId;
  url += "&IncludeSelector=" + selectors;
  request
    .get(url)
    .end((err, res) => {
      const rawDescription = JSON.parse(res.text).Item.Description;
      const description = cleanDescription(rawDescription);
      console.log(description)
      console.log(JSON.parse(res.text))
    })
}



function cleanDescription(rawDescription) {
  if (rawDescription.indexOf('<style') > -1) {
    return striptags(cut(rawDescription, rawDescription.indexOf('<style'), rawDescription.indexOf('</style>') + 8)).trim()
  }
  return striptags(rawDescription).trim()
}

function cut(str, cutStart, cutEnd){
  return str.substr(0,cutStart) + str.substr(cutEnd+1);
}
