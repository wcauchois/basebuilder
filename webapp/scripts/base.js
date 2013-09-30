
var BB = BB || {};

BB.namespace = function(name) {
  var parts = name.split('.');
  if (parts[0] !== 'BB') {
    throw new Exception("Namespace must start with 'BB'");
  }
  _.reduce(_.rest(parts), function(memo, part) {
    memo[part] = memo[part] || {};
  }, BB);
};

BB.isDefined = function(v) {
  return typeof v !== 'undefined';
};

BB.Class = function() {
  if (BB.isDefined(this['initialize'])) {
    this.initialize.apply(this, arguments);
  }
};

// Basically poached from BackboneJS
BB.Class.extend = function(protoProps, staticProps) {
  var parent = this, child;
  var child = function() { return parent.apply(this, arguments); };
  _.extend(child, parent, staticProps);

  var Surrogate = function() { this.constructor = child; };
  Surrogate.prototype = parent.prototype;
  child.prototype = new Surrogate();

  if (protoProps) _.extend(child.prototype, protoProps);

  child.__super__ = parent.prototype;

  return child;
};

BB.getJSON = function(path, cb) {
  var req = new XMLHttpRequest();
  req.overrideMimeType('application/json');
  req.addEventListener('load', function(evt) {
    if (req.status == 200) {
      cb(JSON.parse(req.responseText));
    } else {
      console.error('GET ' + path + ' responded with ' + req.status);
    }
  }, false);
  req.open('get', path, true);
  req.send();
};

BB.noop = function() {};

BB.abstractMethod = function() {
  throw new Error("Abstract method not implemented!");
};

