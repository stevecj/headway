/* JSHint inline configuration  */
/* global headway:true */
/* global ayepromise:false, indexedDB:false */

var headway = headway || {};

headway.indexedDbAdapter = ( function ( module ) {
  "use strict";
  var connectionPool;

  module.getConnectionPool = function getConnectionPool() {
    var core, schema, connector;
    if( ! connectionPool ) {
      core = module.core;
      schema = new core.Schema();
      connector = new core.Connector( schema );
      connectionPool = new core.ConnectionPool( connector, 'headway' );
    }
    return connectionPool;
  };

  module.asyncEmptyDatabase = function asyncEmptyDatabase() {
    var connectionPool = module.getConnectionPool();
    function withDb( db ) {
      var transaction, i, name, defer;
      transaction = db.transaction( db.objectStoreNames, 'readwrite' );
      for(i = 0 ; i < db.objectStoreNames.length; i++) {
        name = db.objectStoreNames[i];
        transaction.objectStore( name ).clear();
      }
      defer = ayepromise.defer();
      transaction.onsuccess = defer.resolve;
      transaction.onerror = function () {
        defer.reject( transaction.error );
      };
    }

    return connectionPool.asyncConnect().then( withDb );
  };

  return module;
})( headway.indexedDbAdapter || {} );

headway.indexedDbAdapter.WorksheetRepo = ( function ( module ) {
  "use strict";
  var constructor;

  constructor = function WorksheetRepo() {

    this.asyncAdd = function asyncAdd( worksheet ) {
      var connectionPool = module.getConnectionPool();

      function withDb( db ) {
        var transaction, objectStore, request, defer, newWorksheetId;
        transaction = db.transaction( ['worksheet'], 'readwrite' );
        objectStore = transaction.objectStore('worksheet');
        var request = objectStore.add( worksheet );
        request.onsuccess = function(){ newWorksheetId = request.result; };
        defer = ayepromise.defer();
        transaction.oncomplete = function () { defer.resolve( newWorksheetId ); };
        transaction.onerror = function ( error ) { defer.reject( error ); };
        return defer.promise;
      }

      return connectionPool.asyncConnect().then( withDb );
    };

    this.asyncGet = function asyncGet( id ) {
      var connectionPool = module.getConnectionPool();

      function withDb( db ) {
        var transaction, objectStore, request, defer, worksheet;
        transaction = db.transaction( ['worksheet'] );
        objectStore = transaction.objectStore('worksheet');
        var request = objectStore.get( id );
        request.onsuccess = function(){ worksheet = request.result; };
        defer = ayepromise.defer();
        transaction.oncomplete = function () { defer.resolve( worksheet ); };
        transaction.onerror = function ( error ) { defer.reject( error ); };
        return defer.promise;
      }

      return connectionPool.asyncConnect().then( withDb );
    };
  };

  return constructor;
})( headway.indexedDbAdapter );

headway.indexedDbAdapter.core = headway.indexedDbAdapter.core || {};

headway.indexedDbAdapter.core.Connector = (function ( ayepromise, indexedDB ) {
  "use strict";
  var constructor, proto;

  constructor = function Connector( schema ) {
    this.getSchema = function getSchema() { return schema; };
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
      request.onupgradeneeded = function (evt) {
        if( schema.migrate ) {
          var db = request.result;
          schema.migrate( db, evt.oldVersion, evt.newVersion );
        }
      };
      return asyncResponse.promise;
    });
  };

  return constructor;
})( ayepromise, indexedDB );

headway.indexedDbAdapter.core.ConnectionPool = (function ( ayepromise ) {
  "use strict";
  var constructor = function ConnectionPool( connector, dbName) {
    var pooledDb;

    this.getDbName = function getDbName() {
      return dbName;
    };

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
})( ayepromise );

headway.indexedDbAdapter.core.Schema = (function () {
  "use strict";
  var constructor, proto;

  constructor = function Schema() { };

  proto = constructor.prototype;

  proto.version = 1;

  proto.migrate = function migrate( db, fromVersion, toVersion ) {
    db.createObjectStore( 'worksheet', {
      keyPath       : 'id' ,
      autoIncrement : true
    });
  };

  return constructor;
})();
