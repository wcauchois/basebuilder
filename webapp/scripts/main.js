
BB.namespace('BB.main');

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

BB.main.Application = BB.Class.extend({
  initialize: function() {
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

    var loader = new THREE.JSONLoader();
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
    }, this));
    //this.addGridLines();
    document.body.appendChild(this.renderer.domElement);
  },

  animate: function() {
    requestAnimationFrame(_.bind(this.animate, this));
    this.theMesh.rotation.y += 0.02;
    //this.theMesh.rotation.x += 0.02;
    /*this.theMesh.position.x = Math.random() * 100.0 - 50.0;
    this.theMesh.position.y = Math.random() * 100.0 - 50.0;
    this.theMesh.position.z = Math.random() * 100.0 - 50.0;*/
    this.theMesh.position.y = 0.2;
    this.theMesh.scale.x = 0.2;
    this.theMesh.scale.y = 0.2;
    this.theMesh.scale.z = 0.2;
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

