
BB.namespace('BB.main');

BB.main.Application = BB.Class.extend({
  run: function() {
  }
});

console.log(BB.foo.bar); // XXX

new BB.main.Application().run();

