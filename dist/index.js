'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _got = require('got');

var _got2 = _interopRequireDefault(_got);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var INVALID_PRICE = -1;
var KINDLE_EDITION_TEXT = '(Kindle Edition)';

var AmazonListScraper = function () {
  function AmazonListScraper(options) {
    _classCallCheck(this, AmazonListScraper);

    this.options = Object.assign({}, options);
  }

  _createClass(AmazonListScraper, [{
    key: 'scrape',
    value: function scrape(listUrl) {
      var _this = this;

      if (!listUrl) {
        return Promise.reject(new Error('URL required'));
      }

      return new Promise(function (resolve, reject) {
        (0, _got2.default)(listUrl).then(function (response) {
          var $ = _cheerio2.default.load(response.body, {
            normalizeWhitespace: true,
            xmlMode: true
          });

          // Find all itemInfo divs and map them to item object which has title, price and link
          var items = $('#item-page-wrapper').find('div').filter(function (i, ele) {
            return AmazonListScraper.isElementAnItemInfoDiv($, ele);
          }).map(function (i, ele) {
            return AmazonListScraper.convertItemInfoElementToItem($, ele, _this.options);
          }).get().filter(function (item) {
            return item;
          });

          // Scrape next page if available
          var baseURL = _this.options.baseURL || 'https://www.amazon.com';
          var nextPageUrl = AmazonListScraper.getNextPageUrl($, baseURL);
          if (nextPageUrl) {
            _this.scrape(nextPageUrl).then(function (result) {
              Array.prototype.push.apply(items, result);
              resolve(items);
            }).catch(function () {
              resolve(items);
            });
          } else {
            resolve(items);
          }
        }).catch(function (error) {
          reject(error);
        });
      });
    }
  }], [{
    key: 'isElementAnItemInfoDiv',
    value: function isElementAnItemInfoDiv($, ele) {
      return $(ele).attr('id') && $(ele).attr('id').slice(0, 'itemInfo'.length) === 'itemInfo';
    }
  }, {
    key: 'convertItemInfoElementToItem',
    value: function convertItemInfoElementToItem($, ele, options) {
      var titleNode = $(ele).find('a').filter(function (ii, elee) {
        return $(elee).attr('title');
      });

      var title = titleNode.attr('title').trim();

      if (options.kindleOnly) {
        var subtitle = titleNode.closest('.a-row .a-size-small').text();
        if (!subtitle || subtitle.indexOf(KINDLE_EDITION_TEXT) === -1) {
          return null;
        }
      }

      var link = '' + (options.baseURL || 'https://www.amazon.com') + titleNode.attr('href');

      var price = function price() {
        switch (options.baseURL || 'https://www.amazon.com') {
          case 'https://www.amazon.co.jp':
            {
              return $(ele).find('.a-color-price').text().trim().split(' ')[1].replace(/,/g, '');
            }
          default:
            {
              var priceInfo = $(ele).find('.a-color-price').text().trim().split(' ')[0];
              return parseFloat(priceInfo.slice(1));
            }
        }
      }();

      if (isNaN(price)) {
        price = INVALID_PRICE;
      }

      return { title: title, price: price, link: link };
    }
  }, {
    key: 'getNextPageUrl',
    value: function getNextPageUrl($, baseURL) {
      var nextElementLink = $('.a-last').find('a');
      if (nextElementLink.is('a')) {
        return '' + baseURL + nextElementLink.attr('href');
      }
      return null;
    }
  }]);

  return AmazonListScraper;
}();

exports.default = AmazonListScraper;
module.exports = exports['default'];