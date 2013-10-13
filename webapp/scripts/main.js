
BB.namespace('BB.main');

BB.namespace('BB.debug'); // XXX
BB.debug.Debugger = BB.Class.extend({
  initialize: function() {
    //this.debugSlidersEl = document.getElementById('debugSliders');
  }
});

/*
BB.EventTarget = BB.Class.extend({
  initialize: function() {
    this.listenerMap_ = {};
  },

  getListeners_: function(eventName) {
    if (!this.listenerMap_.hasOwnProperty(eventName)) {
      this.listenerMap_[eventName] = new Array();
    }
    return this.listenerMap_[eventName];
  },

  on: function(eventName, callback) {
    this.getListeners_(eventName).push(callback);
  },

  trigger: function(eventName) {
    var listeners = this.getListeners_(eventName);
    var listenerArgs = arguments.slice(1);
    listeners.forEach(function(listener) {
      listener.apply(
    });
  }
});
*/

//BB.Debug = new BB.debug.Debugger(); // Convenient alias for instance.

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
      if (typeof this.geometries[identifier] === 'function') {
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


BB.getParameters = (function() {
  var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
  var FN_ARG_SPLIT = /,/;
  var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

  return function(target) {
    var text = target.toString();
    return _.map(text.match(FN_ARGS)[1].split(','),
      function(s) { return s.trim(); });
  };
})();

BB.namespace('BB.building');
BB.building.FooBuilding = BB.Class.extend({
  initialize: function(scene, resourceManager, options) {
    this.scene = scene;
    resourceManager.requestGeometry('models/generator_top.js',
      _.bind(function(geometry) {
        var material = new THREE.MeshNormalMaterial();
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.scale.x = 0.07;
        this.mesh.scale.y = 0.15;
        this.mesh.scale.z = 0.07;
        this.scene.add(this.mesh);
        this.onLoad();
      }, this));
  },

  onLoad: function() {
  }
});

BB.Module = BB.Class.extend({
  initialize: function(defaultProvisions) {
    this.provides_ =
      BB.isDefined(defaultProvisions) ? _.extend({}, defaultProvisions) : {};
  },

  provide: function(name, inst) {
    this[name] = inst;
    this.provides_[name] = inst;
  },

  injectNew: function(ctor) {
    var params = BB.getParameters(ctor.prototype.initialize);
    console.log(params);
    console.log(this.provides_);
    console.log('resourceManager' in this.provides_);
    console.log(this.provides_.hasOwnProperty('resourceManager'));

    var injectedParams = params.slice(0, -1);
    var args = [null].concat(_.map(injectedParams, function(p) {
      console.log(this.provides_);
      console.log('"' + p + '"');
      if (!this.provides_.hasOwnProperty(p)) {
        throw new Error('Unsatisfied dependency: ' + p);
      }
      return this.provides_[p];
    }, this));
    // The last parameter is provided as-is.
    args.push(params[params.length - 1]);

    // http://stackoverflow.com/a/14378462/1480571
    var Factory = ctor.bind.apply(ctor, args);
    return new Factory();
  }
});

BB.main.IsometricCamera = function() {
  THREE.Camera.call(this);
  // http://stackoverflow.com/questions/1059200/true-isometric-projection-with-opengl
  var dist = Math.sqrt(1.0 / 3.0); // Camera will be one unit away from the origin
  this.position = new THREE.Vector3(dist, dist + 0.05, dist);
  this.up = new THREE.Vector3(0.0, 1.0, 0.0);
  this.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
  //this.lookAt(dist, dist, dist, /* Camera position */
    //0.0, 0.0, 0.0,              /* Where the camera is pointing at */
    //0.0, 1.0, 0.0);             /* Which direction is up */
};
BB.main.IsometricCamera.prototype = Object.create(THREE.Camera.prototype);

BB.main.Application = BB.Module.extend({
  initialize: function() {
    BB.main.Application.__super__.initialize.call(this);
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.screenWidth, this.screenHeight);

    //this.mainCamera = new THREE.PerspectiveCamera(
    //  75, this.screenWidth / this.screenHeight, 1, 10000);
    this.mainCamera = new BB.main.IsometricCamera();
    //this.mainCamera.position.z = 500;
    this.mainScene = new THREE.Scene();

    this.rtScene = new THREE.Scene();
    this.rtCamera = new THREE.OrthographicCamera(
      this.screenWidth / -2, this.screenWidth / 2,
      this.screenHeight / 2, this.screenHeight / -2,
      -10000, 10000
    );
    this.rtCamera.position.z = 100;
    this.rtTexture = new THREE.WebGLRenderTarget(
      this.screenWidth, this.screenHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
      });
    var materialScreen = new THREE.ShaderMaterial({
      uniforms: {tDiffuse: {type: "t", value: this.rtTexture}},
      vertexShader: document.getElementById('screenVertexShader').textContent,
      fragmentShader: document.getElementById('screenFragmentShader').textContent,
      depthWrite: false
    });
    var plane = new THREE.PlaneGeometry(this.screenWidth, this.screenHeight);
    var quad = new THREE.Mesh(plane, materialScreen);
    quad.position.z = -100;
    this.rtScene.add(quad);

    /*var loader = new THREE.JSONLoader();
    loader.load('models/generator_top.js', _.bind(function(geometry) {
      var material = new THREE.MeshNormalMaterial();
      //material.side = THREE.DoubleSide;
      var mesh = new THREE.Mesh(geometry, material);
      //mesh.scale.x = 10;
      //mesh.scale.y = 10;
      //mesh.scale.z = 10;
      //mesh.position.z = -10;
      this.mainScene.add(mesh);
      this.theMesh = mesh;
      var mesh2 = new THREE.Mesh(geometry, material);
      mesh2.scale.x = 100;
      mesh2.scale.y = 100;
      mesh2.scale.z = 100;
      mesh2.position.y = 200;
      //this.mainScene.add(mesh2);
      this.animate();
    }, this));*/
    //this.addGridLines();
    document.body.appendChild(this.renderer.domElement);

    this.provide('resourceManager', new BB.ResourceManager());
    this.provide('scene', this.mainScene);
    this.resourceManager.beginLoad();
    this.foo1 = this.injectNew(BB.building.FooBuilding, {});
    this.resourceManager.endLoad(_.bind(this.animate, this));
  },

  animate: function() {
    requestAnimationFrame(_.bind(this.animate, this));
    ///this.theMesh.rotation.y += 0.02;
    //this.theMesh.rotation.z = 1.02;
    /*this.theMesh.position.x = Math.random() * 100.0 - 50.0;
    this.theMesh.position.y = Math.random() * 100.0 - 50.0;
    this.theMesh.position.z = Math.random() * 100.0 - 50.0;*/
    //this.theMesh.position.y = 0.2;
    /**this.theMesh.position.z += 0.002;
    this.theMesh.scale.x = 0.07;
    this.theMesh.scale.y = 0.15;
    this.theMesh.scale.z = 0.07;*/
    this.render();
  },

  render: function() {
    this.renderer.clear();
    this.renderer.render(this.mainScene, this.mainCamera, this.rtTexture, true);
    this.renderer.render(this.rtScene, this.rtCamera);
  },

  addGridLines: function() {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(-800, 0, 0));
    geometry.vertices.push(new THREE.Vector3(800, 0, 0));
    var material = new THREE.LineBasicMaterial({
      color: 0x66FF99,
    });
    for (var i = -50; i < 50; i++) {
      var line = new THREE.Line(geometry, material);
      line.position.y = i * 100;
      this.scene.add(line);
    }
    for (var i = -50; i < 50; i++) {
      var line = new THREE.Line(geometry, material);
      line.rotation.z = Math.PI / 2;
      line.position.x = i * 100;
      this.scene.add(line);
    }
  },

  run: function() {
  }
}, {
  getInstance: function() {
    if (!BB.main.Application.instance_) {
      BB.main.Application.instance_ = new BB.main.Application();
    }
    return BB.main.Application.instance_;
  }
});

BB.main.Application.getInstance().run();

