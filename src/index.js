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
  getItemsFromCategory([], 1)
};

function getItemsFromCategory(items, page) {
  const itemsRoot = 'http://svcs.ebay.com/services/search/FindingService/v1';
  const itemsParams = {
    "OPERATION-NAME": "findItemsAdvanced",
    "SERVICE-VERSION": "1.0.0",
    "SECURITY-APPNAME": appId,
    "GLOBAL-ID": "EBAY-GB",
    "RESPONSE-DATA-FORMAT": "JSON",
    "REST-PAYLOAD": "true",
    //"&keywords=tolkein";
    "categoryId": "7294",
    "paginationInput.pageNumber": page,
    "itemFilter(0).name": "MaxPrice",
    "itemFilter(0).value": "1",
    "itemFilter(1).name": "EndTimeFrom",
    "itemFilter(1).value": "2016-11-04T16:00:00.768Z",
    "itemFilter(2).name": "EndTimeTo",
    "itemFilter(2).value": "2016-11-04T20:00:00.768Z",
    "itemFilter(3).name": "LocatedIn",
    "itemFilter(3).value": "GB"
  }
  const itemsUrl = constructURL(itemsRoot, itemsParams);
  request
    .get(itemsUrl)
    .end((err, res) => {
      if (JSON.parse(res.text).findItemsAdvancedResponse[0].searchResult[0].item) {
        const currentItems = items.concat(JSON.parse(res.text).findItemsAdvancedResponse[0].searchResult[0].item)
        console.log(JSON.parse(res.text).findItemsAdvancedResponse[0].paginationOutput[0])
        if (parseInt(JSON.parse(res.text).findItemsAdvancedResponse[0].paginationOutput[0].totalPages) > page) {
          getItemsFromCategory(currentItems, page + 1)
        } else {
          getBadDescriptions([], currentItems);
        }
      }
    });
}

function getBadDescriptions(currentBadDescriptions, possibleItems) {
  if (possibleItems.length > 4) {
    console.log(possibleItems.length)
    const currentCall = possibleItems.slice(0, 5);
    let promises = currentCall.map((el) => {
      return new Promise((resolve, reject) => {
        const itemId = el.itemId[0];

        const singleItemRoot = 'http://open.api.ebay.com/shopping';
        const singleItemParams = {
          'callname': 'GetSingleItem',
          'responseencoding': 'JSON',
          'appid': appId,
          'siteid': '0',
          'version': '967',
          'ItemID': itemId,
          'IncludeSelector': 'Description,ItemSpecifics'        
        }
        const singleItemUrl = constructURL(singleItemRoot, singleItemParams);
        request
          .get(singleItemUrl)
          .end((err, res) => {
            if(err) reject(err);
            resolve(JSON.parse(res.text));
          })
      })
    }) 
    Promise.all(promises).then((res) => {
      const nextBadDescriptions = res.reduce((acc, el) => {
        const rawDescription = el.Item.Description;
        const itemUrl = el.Item.ViewItemURLForNaturalSearch
        const description = cleanDescription(rawDescription);
        const pictures = el.Item.PictureURL.length;
        return description.length > 50 || pictures > 2 ? acc : acc.concat([{ description, itemUrl }]);
      }, currentBadDescriptions)
      if (nextBadDescriptions.length > 4) {
        console.log(nextBadDescriptions);
      } else {
        getBadDescriptions(nextBadDescriptions, possibleItems.slice(5))
      }

    })
  } else {
    console.log(currentBadDescriptions)
  }
};

function getSingleItem(url, callback) {
  request
    .get(url)
    .end((err, res) => {
      const rawDescription = JSON.parse(res.text).Item.Description;
      const description = cleanDescription(rawDescription);
      console.log(description)
      console.log(JSON.parse(res.text))
    })
}

function constructURL(root, params) {
  return Object.keys(params).reduce((acc, el, index) => {
    return index === 0 ? `${acc}?${el}=${params[el]}` : `${acc}&${el}=${params[el]}`;
  }, root)
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
