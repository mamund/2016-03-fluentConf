/*******************************************************
 * task service implementation
 * service implementation (server)
 * March 2016
 * Mike Amundsen (@mamund)
 * Soundtrack : Complete Collection : B.B. King (2008)
 *******************************************************/

// base modules
var http = require('http');
var querystring = require('querystring');

/// internal modules
var representation = require('./representor.js');
var resources = require('./resources/task.js');
var utils = require('./utils.js');

// shared vars
var root = '';
var port = (process.env.PORT || 8181);
var jsonType = 'application/json';
var cjType = 'application/vnd.collection+json';
var repjsonType = 'application/representor+json';
var csType = '';
var csAccept = '';

// routing rules
var reFile = new RegExp('^\/files\/.*','i');
var reTask = new RegExp('^\/.*','i');

// request handler
function handler(req, res) {
  var segments, i, x, parts, rtn, flg, doc, url;

  // set local vars
  root = '//'+req.headers.host;
  csType = cjType;
  flg = false;
  file = false;
  doc = null;

  // rudimentary accept-header handling
  csAccept = req.headers["accept"];
  if(!csAccept || csAccept.indexOf(cjType)!==-1) {
    csType = cjType;
  }
  else {
    csType = csAccept.split(',')[0];
  }
  
  // parse incoming request URL
  parts = [];
  segments = req.url.split('/');
  for(i=0, x=segments.length; i<x; i++) {
    if(segments[i]!=='') {
      parts.push(segments[i]);
    }
  }
  
  // handle options call
  if(req.method==="OPTIONS") {
    sendResponse(req, res, "", 200);
    return;
  }

  // file handler
  flg=false;
  try {
    if(flg===false && reFile.test(req.url)) {
      flg = true;
      utils.file(req, res, parts, handleResponse);
    }
  }
  catch(ex) {}
  
  // task handler
  if(flg===false && reTask.test(req.url)) {
    flg = true;
    doc = resources(req, res, parts, handleResponse);
  }
  
  // final error
  if(flg===false) {
    handleResponse(req, res, utils.errorResponse(req, res, 'Not Found', 404));
  }
}

// handle response work
function handleResponse(req, res, doc) {
  var rtn;
  
  if(doc!==null) {
    if(doc.file===true) {
      rtn = doc.doc;
    }
    else {
      rtn = representation(doc.doc, csType, root);
    }
    sendResponse(req, res, rtn, doc.code, doc.headers);
  }
  else {
    sendResponse(req, res, 'Server Response Error', 500);
  }
}
function sendResponse(req, res, body, code, headers) {
  var hdrs;
  
  if(headers && headers!==null) {
    hdrs = headers;
  }
  else {
    hdrs = {}
  }
  if(!hdrs['content-type']) {
    hdrs['content-type'] = csType;
  }
  
  // always add CORS headers to support external clients
  hdrs["Access-Control-Allow-Origin"] = "*";
  hdrs["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
  hdrs["Access-Control-Allow-Credentials"] = true;
  hdrs["Access-Control-Max-Age"] = '86400'; // 24 hours
  hdrs["Access-Control-Allow-Headers"] = "X-Requested-With, Access-Control-Allow-Origin, X-HTTP-Method-Override, Content-Type, Authorization, Accept";

  res.writeHead(code, hdrs),
  res.end(body);
}

// wait for request
http.createServer(handler).listen(port);
console.log('listening on port '+port);

// EOF

