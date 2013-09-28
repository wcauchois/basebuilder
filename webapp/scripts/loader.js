
(function(BB) {
  BB.getJSON('bundles.json', function(bundles) {
    var names = _.keys(bundles);

    var deps = {}; // Bundle dependencies (ONLY unsatisfied ones)
    var ordered = []; // List of bundles in the order they should be loaded
    var satisfied = []; // Bundles that currently don't have any dependencies

    _.each(names, function(name) {
      deps[name] = bundles[name]['deps'] || [];
      if (deps[name].length === 0) {
        satisfied.push(name);
      }
    });

    while (satisfied.length > 0) {
      var cur = satisfied.pop();
      ordered.push(cur);
      _.each(names, function(name) {
        if (name !== cur) {
          deps[name] = _.filter(deps[name], function(d) { return d !== cur; });
          if (deps[name].length === 0 && _.indexOf(ordered, name) === -1) {
            satisfied.push(name);
          }
        }
      });
    }
    
    var hasCycles = _.some(names, function(n) { return deps[n].length > 0; });
    if (hasCycles) throw new Error("There was a cycle in the list of dependencies");
    console.log('Loading bundles in this order: ' + ordered.join(', '));
    
    var head = document.getElementsByTagName('head')[0];
    var orderedBundles = _.map(ordered, function(n) { return bundles[n]; });
    _.each(orderedBundles, function(bundle) {
      _.each(bundle['sources'] || [], function(sourceFile) {
        var scriptElem = document.createElement('script');
        scriptElem.type = 'text/javascript';
        scriptElem.src = sourceFile;
        head.appendChild(scriptElem);
      });
    });
  });
})(BB);

