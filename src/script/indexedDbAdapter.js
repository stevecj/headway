/* JSHint inline configuration  */
/* global headway:true */
/* global ayepromise:false, indexedDB:false */

var headway = headway || {};

headway.indexedDbAdapter = headway.indexedDbAdapter || {};

headway.indexedDbAdapter.core = headway.indexedDbAdapter.core || {};

headway.indexedDbAdapter.core.Connector = (function ( module, ayepromise, indexedDB ) {
  "use strict";
  var constructor, proto;

  var constructor = function Connector() {
  };

  proto = constructor.prototype;

  proto.asyncConnect = function asyncConnect( dbName, targetVersion ) {
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

  return constructor;
})( headway.indexedDbAdapter.core || {}, ayepromise, indexedDB );
