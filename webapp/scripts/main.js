
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


BB.namespace('BB.buildings');

BB.buildings.FooBuilding = BB.Class.extend({
  initialize: function(scene, resourceManager, options) {
    this.scene = scene;
    console.log('options: ' + typeof options);
    this.position = options.position || new THREE.Vector2(0, 0);
    console.log(this.position);
    resourceManager.requestGeometry('models/generator_top.js',
      _.bind(function(geometry) {
        var material = new THREE.MeshNormalMaterial();
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.scale.x = 0.07;
        this.mesh.scale.y = 0.15;
        this.mesh.scale.z = 0.07;
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
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
    var injectedParams = params.slice(0, -1);
    var args = [null].concat(_.map(injectedParams, function(p) {
      console.log(this.provides_);
      console.log('"' + p + '"');
      if (!this.provides_.hasOwnProperty(p)) {
        throw new Error('Unsatisfied dependency: ' + p);
      }
      return this.provides_[p];
    }, this));
    // TODO this should only do the last argument thing (that's how it works!)
    _.each(Array.prototype.slice.call(arguments, 1),
      function(x) { args.push(x); });

    // http://stackoverflow.com/a/14378462/1480571
    var Factory = ctor.bind.apply(ctor, args);
    return new Factory();
  }
});

BB.main.IsometricCamera = function() {
  THREE.Camera.call(this);
  // http://stackoverflow.com/questions/1059200/true-isometric-projection-with-opengl
  var dist = Math.sqrt(1.0 / 3.0); // Camera will be one unit away from the origin
  this.position = new THREE.Vector3(dist, dist, dist);
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
    //this.screenWidth = window.innerWidth;
    //this.screenHeight = window.innerHeight;
    this.screenWidth = 1000;
    this.screenHeight = 600;

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
    this.raycaster = new THREE.Raycaster();
    this.projector = new THREE.Projector();
    this.mousePos = new THREE.Vector2();
    document.addEventListener('mousemove', _.bind(function(event) {
      event.preventDefault();
      this.mousePos.x = (event.clientX / this.screenWidth) * 2 - 1;
      this.mousePos.y = -(event.clientY / this.screenHeight) * 2 + 1;
    }, this), false);
    document.body.appendChild(this.renderer.domElement);

    this.provide('resourceManager', new BB.ResourceManager());
    this.provide('scene', this.mainScene);
    this.resourceManager.beginLoad();
    this.foo1 = this.injectNew(BB.buildings.FooBuilding, {});
    this.foo2 = this.injectNew(BB.buildings.FooBuilding, {position: new THREE.Vector2(0.5, 0.1)});
    this.foo2 = this.injectNew(BB.buildings.FooBuilding, {position: new THREE.Vector2(0.7, 0.1)});
    this.foo2 = this.injectNew(BB.buildings.FooBuilding, {position: new THREE.Vector2(0.9, 0.1)});
    this.foo2 = this.injectNew(BB.buildings.FooBuilding, {position: new THREE.Vector2(0.9, 0.3)});
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
    if (typeof this.foo1.mesh !== 'undefined') {
      //this.foo1.mesh.position.y += 0.001;
      //var vector = new THREE.Vector3(this.mousePos.x, this.mousePos.y, 1.0);
      //this.projector.unprojectVector(vector, this.mainCamera);
      //this.foo1.mesh.position.x = vector.z;
      var vector = new THREE.Vector3(this.mousePos.x, this.mousePos.y, 1.0);
      //vector.projectOnVector(new THREE.Vector3(1.0, 0.0, 0.0));
      //vector.applyAxisAngle(new THREE.Vector3(0.0, 1.0, 0.0), Math.PI);
      this.foo1.mesh.position.x = vector.x;
      this.foo1.mesh.position.z = vector.y;
      //this.foo1.mesh.position.x = this.mousePos.x;
      //this.foo1.mesh.position.z = this.mousePos.y;
    }
    var vector = new THREE.Vector3(this.mousePos.x, this.mousePos.y, 1.0);
    //console.log(this.mainCamera.position);
    var X = this.mainCamera.position.clone();
    //X.negate();
    var plane = new THREE.Plane(X, 0.0);
    this.projector.unprojectVector(vector, this.mainCamera);
    this.raycaster.set(this.mainCamera.position, vector.sub(this.mainCamera.position).normalize());
    var RC = this.raycaster;
    //var RC = this.projector.pickingRay(vector, this.mainCamera);
    var intersects = RC.intersectObjects(this.mainScene.children);
    if (intersects.length > 0) {
      console.log(intersects);
    }
    //console.log(this.mousePos);

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

