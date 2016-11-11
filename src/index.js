const Hapi = require('hapi');
const path = require('path');
const queryEbay = require('./helpers/ebayQuery')

const server = new Hapi.Server();
server.connection({ port: process.env.PORT || 8080 });

server.register(require('inert'), (err) => {
  if (err) {
    throw err;
  }
  server.route({
    method: 'GET',
    path: '/items',
    handler: {
      queryEbay((items) => {
        reply(items).code(200)
      });
    }
  })
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
  });
});



