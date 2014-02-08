var headway = headway || {};

headway.indexedDbAdapter = headway.indexedDbAdapter || {};

headway.indexedDbAdapter.core = (function ( module ) {

  module.asyncGetConnection = function asyncGetConnection( dbName, targetVersion ) {
    var bootstrap = ayepromise.defer();
    bootstrap.resolve();

    return bootstrap.promise.then( function () {
      var request = indexedDB.open( dbName, targetVersion );
      var defer = ayepromise.defer();
      request.onsuccess = function () { defer.resolve ( request.result ); };
      request.onerror   = function () { defer.reject  ( request.error  ); };
      return defer.promise;
    });
  };

  return module;
})( headway.indexedDbAdapter.core || {} );
