
BB.Inject = (function(BB) {
  var registeredServices = {};
  var Inject = BB.Class.extend({
  }, {
    provide: function(serviceName) {
      return function(serviceImpl) {
        registeredServices[serviceName] = serviceImpl;
      };
    },
    extend: function(requires) {
      var cachedServices = {};
      _.each(requires, function(r) {
        if (!registeredServices.has(r)) {
          throw new Error("Service '" + r + "' hasn't been defined yet!");
        }
        cachedServices[r] = registeredServices[r];
      });
      var Injected = Inject.extend({
        initialize: function() {
          this.services = _.extend({}, cachedServices);
        }
      });
      return Injected.extend.apply(Injected, arguments.slice(1));
    }
  });
  return Inject;
})(BB);

