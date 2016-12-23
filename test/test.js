import test from 'ava';
import AmazonListScraper from '../dist';

const testListURL = 'https://www.amazon.com/gp/registry/wishlist/1JMCNHNT959X2';
const testListJPURL = 'https://www.amazon.co.jp/gp/registry/wishlist/3772KOSSSKRDB';
const multiPagesListURL = 'https://www.amazon.com/gp/registry/wishlist/1EL6CUGB5P0ZV';

test('expose a constructor', t => t.is(typeof AmazonListScraper, 'function'));

test('error if no url is specified', t => (
  new AmazonListScraper().scrape().catch((err) => {
    t.ok(err);
    t.is(err.message, 'URL required');
  })
));

test('error if url is not found', t => (
  new AmazonListScraper().scrape('https://www.amazon.com/notfound').catch((err) => {
    t.ok(err);
  })
));

test('return list of items with title, price and link', t => (
  new AmazonListScraper().scrape(testListURL).then((items) => {
    t.is(items.length, 2);
    const { title, price, link } = items[0];
    // eslint-disable-next-line no-script-url
    t.is(title, 'JavaScript: The Good Parts: The Good Parts');
    t.true(!isNaN(parseFloat(price)));
    t.true(link.startsWith('https://www.amazon.com/dp/B0026OR2ZY'));
    t.is(items[1].title, 'Clean Code: A Handbook of Agile Software Craftsmanship');
  })
));

test('return list of items with title, price and link when www.amazon.co.jp', t => (
  new AmazonListScraper({ baseURL: 'https://www.amazon.co.jp' }).scrape(testListJPURL).then((items) => {
    t.is(items.length, 21);
    const { title, price, link, itemId } = items[0];
    // eslint-disable-next-line no-script-url
    t.is(title, 'クダンノゴトシ（５） (ヤングマガジンコミックス)');
    t.true(!isNaN(parseFloat(price)));
    t.true(link.startsWith('https://www.amazon.co.jp/dp/'));
    t.true(itemId === 'B01N2O5MAC');
    t.is(items[1].title, '40歳からは股関節と肩甲骨を鍛​えなさい!');
  })
));

test('scrape next page of the list', t => (
  new AmazonListScraper().scrape(multiPagesListURL).then((items) => {
    t.is(items.length, 27);
  })
));

test('return empty list if not an Amazon list', t => (
  new AmazonListScraper().scrape('https://google.com').then((items) => {
    t.is(items.length, 0);
  })
));

test('return only Kindle books if kindleOnly option is true', t => (
  new AmazonListScraper({ kindleOnly: true }).scrape(testListURL).then((items) => {
    t.is(items.length, 1);
    const { title } = items[0];
    // eslint-disable-next-line no-script-url
    t.is(title, 'JavaScript: The Good Parts: The Good Parts');
  })
));
