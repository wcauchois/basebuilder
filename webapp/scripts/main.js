
BB.namespace('BB.buildings');

BB.buildings.FooBuilding = BB.Class.extend({
  initialize: function(scene, resourceManager, options) {
    this.scene = scene;
    this.position = options.position || new THREE.Vector2();
    resourceManager.requestGeometry(BB.timestampedPath('models/extractor.js'),//'models/extractor.js?asdddf',
      _.bind(function(geometry) {
        var material = new THREE.MeshNormalMaterial();
        this.mesh = new THREE.Mesh(geometry, material);
        //this.mesh.side = THREE.DoubleSide;
        //this.mesh.scale.x = 0.07;
        //this.mesh.scale.y = 0.15;
        //this.mesh.scale.z = 0.07;
        this.mesh.scale.set(0.3, 0.3, 0.3);
        //this.mesh.scale.set(0.7, 0.7, 0.7);
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        //this.mesh.position.x = 0.0;
        //this.mesh.position.y = 0.0;
        //this.mesh.position.z = -2.0;
        this.scene.add(this.mesh);
        this.onLoad();
      }, this));
  },

  onLoad: function() {
  }
});

BB.Application = BB.Module.extend({
  setupRTQuad_: function() {
    var materialScreen = new THREE.ShaderMaterial({
      uniforms: {
        tMainDiffuse: {type: "t", value: this.rtTexture},
        tBackgroundDiffuse: {type: "t", value: this.backgroundRTTexture}
      },
      vertexShader: document.getElementById('screenVertexShader').textContent,
      fragmentShader: document.getElementById('screenFragmentShader').textContent,
      depthWrite: false
    });
    var plane = new THREE.PlaneGeometry(this.canvasWidth, this.canvasHeight);
    var quad = new THREE.Mesh(plane, materialScreen);
    quad.position.z = -100;
    this.rtScene.add(quad);
  },

  initialize: function() {
    BB.Application.__super__.initialize.call(this);
    this.canvasWidth = 1000;
    this.canvasHeight = 600;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.canvasWidth, this.canvasHeight);

    // Main camera & scene: where we draw most of the 3D stuff. Gets rendered to
    // a texture for post-processing via the pixel shader.
    this.mainCamera = new THREE.PerspectiveCamera(
      15, this.canvasWidth / this.canvasHeight, 0.0001, 100);
    var dist = Math.sqrt(1.0 / 3.0) * 10.0; // Camera will be one unit away from the origin
    this.mainCamera.position = new THREE.Vector3(dist, dist, dist);
    this.mainCamera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
    this.mainScene = new THREE.Scene();

    // RT scene: we draw the main scene onto a quadrilateral here.
    this.rtScene = new THREE.Scene();
    this.rtCamera = new THREE.OrthographicCamera(
      this.canvasWidth / -2, this.canvasWidth / 2,
      this.canvasHeight / 2, this.canvasHeight / -2,
      -10000, 10000
    );
    this.rtCamera.position.z = 100;
    this.rtTexture = new THREE.WebGLRenderTarget(
      this.canvasWidth, this.canvasHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
      });

    // Background scene: this also gets drawn to the RT texture, however the
    // pixelization post-processing effect is not applied. Fragments in this scene
    // are also "occluded" by fragments in the main scene.
    this.backgroundRTTexture = new THREE.WebGLRenderTarget(
      this.canvasWidth, this.canvasHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
      });
    this.backgroundScene = new THREE.Scene();

    this.setupRTQuad_();

    this.raycaster = new THREE.Raycaster();
    this.projector = new THREE.Projector();

    this.mousePosNDC = new THREE.Vector2(); // Normalized device coordinates
    document.addEventListener('mousemove', _.bind(function(event) {
      event.preventDefault();
      this.mousePosNDC.x = (event.clientX / this.canvasWidth) * 2 - 1;
      this.mousePosNDC.y = -(event.clientY / this.canvasHeight) * 2 + 1;
    }, this), false);

    var planeGeometry = new THREE.PlaneGeometry(10, 10);
    var invisibleMaterial = new THREE.ShaderMaterial({
      vertexShader:
        'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader:
        'void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); }',
      depthWrite: false,
      transparent: true
    });
    invisibleMaterial.side = THREE.DoubleSide;
    this.groundPlane = new THREE.Mesh(planeGeometry, invisibleMaterial);
    this.groundPlane.rotation.x = Math.PI / 2;
    this.mainScene.add(this.groundPlane);
    this.worldMousePos_ = new THREE.Vector3();

    this.addGridLines_();
    this.provide('resourceManager', new BB.ResourceManager());
    this.provide('scene', this.mainScene);
    this.resourceManager.beginLoad();
    this.foo1 = this.injectNew(BB.buildings.FooBuilding, {});
    this.foo2 = this.injectNew(BB.buildings.FooBuilding, {position: new THREE.Vector2(0.5, 0.1)});
    this.foo2 = this.injectNew(BB.buildings.FooBuilding, {position: new THREE.Vector2(0.7, 0.1)});
    this.foo2 = this.injectNew(BB.buildings.FooBuilding, {position: new THREE.Vector2(0.9, 0.1)});
    this.foo2 = this.injectNew(BB.buildings.FooBuilding, {position: new THREE.Vector2(0.9, 0.3)});
    this.resourceManager.endLoad(_.bind(this.animate, this));

    document.body.appendChild(this.renderer.domElement);
  },

  updateWorldMousePos_: function() {
    var vector = new THREE.Vector3(this.mousePosNDC.x, this.mousePosNDC.y, 1.0);
    this.projector.unprojectVector(vector, this.mainCamera);
    this.raycaster.set(this.mainCamera.position,
      vector.sub(this.mainCamera.position).normalize());

    var intersects = this.raycaster.intersectObject(this.groundPlane);
    if (intersects.length > 0) this.worldMousePos_.copy(intersects[0].point);
  },

  animate: function() {
    requestAnimationFrame(_.bind(this.animate, this));

    this.updateWorldMousePos_();
    if (this.foo1 && this.foo1.mesh) {
      this.foo1.mesh.position.copy(this.worldMousePos_);
    }

    this.render();
  },

  render: function() {
    this.renderer.clear();
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.render(this.mainScene, this.mainCamera, this.rtTexture, true);
    this.renderer.render(this.backgroundScene, this.mainCamera, this.backgroundRTTexture, true);
    this.renderer.render(this.rtScene, this.rtCamera);
  },

  addGridLines_: function() {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(0, 0, 10));
    geometry.vertices.push(new THREE.Vector3(0, 0, -10));
    var material = new THREE.LineBasicMaterial({
      color: 0x4d4d4d
    });

    for (var i = -50; i < 50; i++) {
      var line = new THREE.Line(geometry, material);
      line.position.x = i * 0.25;
      this.backgroundScene.add(line);
    }
    for (var i = -50; i < 50; i++) {
      var line = new THREE.Line(geometry, material);
      line.rotation.y = Math.PI / 2;
      line.position.z = i * 0.25;
      this.backgroundScene.add(line);
    }
  },

  run: function() {
  }
}, {
  getInstance: function() {
    if (!BB.Application.instance_) {
      BB.Application.instance_ = new BB.Application();
    }
    return BB.Application.instance_;
  }
});

BB.Application.getInstance().run();
