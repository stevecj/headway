/* JSHint inline configuration  */
/* global headway:true */
/* global ayepromise:false, indexedDB:false */

var headway = headway || {};

headway.indexedDbAdapter = headway.indexedDbAdapter || {};

headway.indexedDbAdapter.core = headway.indexedDbAdapter.core || {};

headway.indexedDbAdapter.core.Connector = (function ( module, ayepromise, indexedDB ) {
  "use strict";
  var constructor, proto;

  var constructor = function Connector( schema ) {
    this.getSchema = function getSchema() { return schema };
  };

  proto = constructor.prototype;

  proto.asyncConnect = function asyncConnect( dbName ) {
    var schema, asyncRequest, targetVersion;

    targetVersion = this.getSchema().version;

    asyncRequest = ayepromise.defer();
    asyncRequest.resolve();

    schema = this.getSchema();
    return asyncRequest.promise.then( function () {
      var request = indexedDB.open( dbName, targetVersion );
      var asyncResponse = ayepromise.defer();
      request.onsuccess = function () { asyncResponse.resolve ( request.result ); };
      request.onerror   = function () { asyncResponse.reject  ( request.error  ); };
      request.onupgradeneeded = function (evt) { if( schema.migrate ) { schema.migrate(); } console.log(evt.oldVersion); console.log(evt.newVersion); };
      return asyncResponse.promise;
    });
  };

  return constructor;
})( headway.indexedDbAdapter.core, ayepromise, indexedDB );

headway.indexedDbAdapter.core.ConnectionPool = (function ( module ) {
  "use strict";
  var constructor, proto;

  var constructor = function ConnectionPool( connector, dbName) {
    var pooledDb;

    this.asyncConnect = function asyncConnect() {
      var defer, promise;
      if ( pooledDb ) {
        defer = ayepromise.defer();
        defer.resolve( pooledDb );
        return defer.promise;
      } else {
        promise = connector.asyncConnect( dbName );
        promise.then( function( db ) { pooledDb = db; } );
        return promise;
      }
    };

    this.close = function close() {
      if( pooledDb ) {
        pooledDb.close();
        pooledDb = null;
      }
    };
  };

  return constructor;
})( headway.indexedDbAdapter.core );
