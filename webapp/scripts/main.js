
BB.namespace('BB.main');

BB.main.Application = BB.Class.extend({
  initialize: function() {
    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 1, 10000);
    this.camera.position.z = 500;
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  },
  run: function() {
    var loader = new THREE.JSONLoader();
    loader.load('models/generator_top.js', _.bind(function(geometry) {
      var material = new THREE.MeshNormalMaterial();
      var mesh = new THREE.Mesh(geometry, material);
      mesh.scale.x = 100;
      mesh.scale.y = 100;
      mesh.scale.z = 100;
      this.scene.add(mesh);
      this.renderer.render(this.scene, this.camera);
    }, this));
    document.body.appendChild(this.renderer.domElement);
  }
}, {
  getInstance: function() {
    if (!BB.main.Application.instance_) {
      BB.main.Application.instance_ = new BB.main.Application();
    }
    return BB.main.Application.instance_;
  }
});


