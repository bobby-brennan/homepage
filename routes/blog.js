var FS = require('fs');
var Marked = require('marked');
var DateFormat = require('dateformat');
var Router = module.exports = require('express').Router();

var BLOG_DIR = __dirname + '/../blog';
var DATE_FORMAT = 'dddd, mmmm dS, yyyy';

var ENTRIES = null;
var ENTRIES_KEYED = {};

var reloadEntries = function() {
  ENTRIES = FS.readdirSync(BLOG_DIR).filter(function(file) {
    return file.indexOf('.') !== 0;
  }).map(function(file) {
    var contents = FS.readFileSync(BLOG_DIR + '/' + file, 'utf8')
    return contents;
  }).map(function(entry) {
    var metadata = entry.substring(0, entry.indexOf('END_METADATA'));
    metadata = JSON.parse(metadata);
    metadata.contents = entry.substring(entry.indexOf('END_METADATA') + 12);
    metadata.date = Date.parse(metadata.date);
    metadata.dateString = DateFormat(metadata.date, DATE_FORMAT);
    return metadata;
  }).sort(function(e1, e2) {
    return e1.date < e2.date ? -1 : 
           e1.date > e2.date ? 1 : 0;
  });
  ENTRIES.forEach(function(entry) {
    ENTRIES_KEYED[entry.url.substring(1)] = entry;
  })
}
reloadEntries();

if (process.env.DEVELOPMENT) {
  Router.use(function(req, res, next) {
    reloadEntries();
    next();
  })
}

Router.get('/:post', function(req, res) {
  var entry = ENTRIES_KEYED[req.params.post];
  if (!entry) return res.status(404).end();
  res.render('blog-post', {entry: entry, Marked: Marked});
}) 

Router.get('/', function(req, res) {
  res.render('blog', {entries: ENTRIES});
});
