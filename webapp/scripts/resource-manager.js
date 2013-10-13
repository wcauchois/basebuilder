
BB.ResourceManager = BB.Class.extend({
  initialize: function() {
    this.jsonLoader = new THREE.JSONLoader();
    this.geometries_ = {}; // Loaded (and in-progress) geometries
    this.geometryBatch_ = [];
    this.batching_ = false;
    this.onDone_ = null;
  },

  allLoaded: function(identifiers) {
    return _.every(identifiers || _.values(this.geometries_),
      function(entry) { return typeof entry !== 'function' });
  },

  beginLoad: function() {
    this.batching_ = true;
  },

  endLoad: function(onDone) {
    this.batching_ = false;
    this.onDone_ = onDone;
    this.maybeFinish_();
  },

  maybeFinish_: function() {
    if (!BB.isNull(this.onDone_) && this.allLoaded(this.geometryBatch_)) {
      this.onDone_();
      this.geometryBatch_ = new Array();
      this.onDone_ = null;
    }
  },

  onLoadDone_: function() {
    this.maybeFinish_();
  },

  requestGeometry: function(identifier, callback) {
    if (this.geometries_.hasOwnProperty(identifier)) {
      if (typeof this.geometries_[identifier] === 'function') {
        // The resource is currently loading; call the function with the
        // callback to add it to the list of waiters.
        this.geometries_[identifier](callback);
      } else {
        callback(this.geometries_[identifier]);
      }
    } else {
      if (this.batching_) {
        this.geometryBatch_.push(identifier);
      }

      _.bind(function() {
        var waiters = [callback];
        this.geometries_[identifier] = function(otherCallback) {
          waiters.push(otherCallback);
        }
        this.jsonLoader.load(identifier, _.bind(function(geometry) {
          this.geometries_[identifier] = geometry;
          _.each(waiters, function(waiter) {
            waiter(geometry);
          });
          this.onLoadDone_();
        }, this));
      }, this)();
    }
  }
});

