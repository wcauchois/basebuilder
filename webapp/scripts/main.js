
BB.namespace('BB.main');

BB.main.Application = BB.Class.extend({
  initialize: function() {
    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 1, 10000);
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  },
  run: function() {
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

BB.main.Application.getInstance().run();

