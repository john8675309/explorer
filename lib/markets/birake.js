var request = require('request');

var base_url = 'https://api.birake.com/v6';

function get_summary(coin, exchange, cb) {
  var req_url = base_url + '/ticker/' + coin.toUpperCase() + '_' + exchange.toUpperCase();
  var summary = {};
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.error) {
        return cb(body.error, null);
      } else {
        summary['volume'] = parseFloat(body['quoteVolume24h']).toFixed(8);
        summary['volume_btc'] = parseFloat(body['baseVolume24h']).toFixed(8);
        summary['high'] = parseFloat(body['highestBid']).toFixed(8);
        summary['low'] = parseFloat(body['lowestAsk']).toFixed(8);
        summary['last'] = parseFloat(body['lastPrice']).toFixed(8);
        return cb(null, summary);
      }
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + '/tradehistory?market='+ coin.toUpperCase() + '_' + exchange.toUpperCase();
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.error) {
      return cb(body.error, null);
    } else {
      return cb (null, body);
    }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/orderbook?market='+coin.toUpperCase() + '_' + exchange.toUpperCase();
  console.log(req_url);
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.error) {
      return cb(body.error, [], [])
    } else {
      var orders = body;
      var buys = [];
      var sells = [];
      if (orders['buy'].length > 0){
        for (var i = 0; i < orders['buy'].length; i++) {
          var order = {
            amount: parseFloat(orders.buy[i].amount).toFixed(8),
            price: parseFloat(orders.buy[i].price).toFixed(8),
            //  total: parseFloat(orders.bids[i].Total).toFixed(8)
            // Necessary because API will return 0.00 for small volume transactions
            total: (parseFloat(orders.buy[i].amount).toFixed(8) * parseFloat(orders.buy[i].price)).toFixed(8)
          }
          buys.push(order);
        }
      } else {}
      if (orders['sell'].length > 0) {
        for (var x = 0; x < orders['sell'].length; x++) {
          var order = {
            amount: parseFloat(orders.sell[x].amount).toFixed(8),
            price: parseFloat(orders.sell[x].price).toFixed(8),
            //    total: parseFloat(orders.asks[x].Total).toFixed(8)
            // Necessary because API will return 0.00 for small volume transactions
            total: (parseFloat(orders.sell[x].amount).toFixed(8) * parseFloat(orders.sell[x].price)).toFixed(8)
          }
          sells.push(order);
        }
      } else {}
      var sells = sells.reverse();
      return cb(null, buys, sells);
    }
  });
}

module.exports = {
  get_data: function(settings, cb) {
    var error = null;
    get_orders(settings.coin, settings.exchange, function(err, buys, sells) {
      if (err) { error = err; }
      get_trades(settings.coin, settings.exchange, function(err, trades) {
        if (err) { error = err; }
        get_summary(settings.coin, settings.exchange, function(err, stats) {
          if (err) { error = err; }
          return cb(error, {buys: buys, sells: sells, chartdata: null, trades: trades, stats: stats});
        });
      });
    });
  }
};
