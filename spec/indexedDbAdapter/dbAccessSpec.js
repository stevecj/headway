/* JSHint inline configuration  */
/* global jasmine:false, describe:false, beforeEach:false */
/* global afterEach:false, it:false, expect:false */
/* global DOMError:false, indexedDB:false */

describe( 'headway.indexedDbAdapter', function () {
  "use strict";
  var root, indexedDbAdapter;
  root = window;
  indexedDbAdapter = root.headway.indexedDbAdapter;

  beforeEach( function () {
    jasmine.headway.userContextExt.applyTo( this );
  });

  afterEach( function () {
    if( this.specAsyncError ) { throw this.specAsyncError; }
  });

  describe( ".dbAccess", function () {
    var dbAccess = indexedDbAdapter.dbAccess;

    describe( ".Connector", function () {
      var Connector = dbAccess.Connector;

      beforeEach( function () {
        this.def( 'subject', function subject() {
          return new Connector( this.getSchema() );
        });
      });

      describe( "#asyncConnect()", function () {
        var DB_NAME, DB_TARGET_VERSION;
        DB_NAME = 'test';
        DB_TARGET_VERSION = 11;

        beforeEach( function () {
          indexedDB.deleteDatabase( DB_NAME );

          this.def( 'schema', function schema() {
            return {
              version: DB_TARGET_VERSION,
              migrate: jasmine.createSpy('schema.migrate')
            };
          });

          this.def( 'promise', function promise() {
            return this.getSubject().asyncConnect( DB_NAME );
          });
        });

        afterEach( function () {
          if( this.db ) { this.db.close(); }
          indexedDB.deleteDatabase( DB_NAME );
        });

        describe( "when the database does not exist", function () {
          it( "is fulfilled with a connection to the newly created database", function ( done ) {
            this.promiseIsFulfilled( this.getPromise(), done, function ( db ) {
              this.db = db;
              expect( db.name ).toEqual( DB_NAME );
              expect( db.version ).toEqual( DB_TARGET_VERSION );
            });
          });

          it( "invokes the schema migrations for the database", function ( done ) {
            this.promiseIsFulfilled( this.getPromise(), done, function ( db ) {
              var FROM_VERSION, TO_VERSION;
              this.db = db;
              FROM_VERSION = 0;
              TO_VERSION   = DB_TARGET_VERSION;
              expect( this.getSchema().migrate ).toHaveBeenCalledWith(
                db, FROM_VERSION, TO_VERSION
              );
              expect( this.getSchema().migrate.calls.count() ).toEqual( 1 );
            });
          });
        });

        describe( "when the database exists with the schema version", function () {
          beforeEach( function ( done ) {
            this.getSubject().asyncConnect( DB_NAME ).then(
              this.asyncStep( function ( db ) {
                db.close();
                // Only care about calls on re-open, not previous open to create db.
                this.getSchema().migrate.calls.reset();
              })
            ).then( done, done );
          });

          it( "is fulfilled with a connection to the existing database", function ( done ) {
            this.promiseIsFulfilled( this.getPromise(), done, function ( db ) {
              this.db = db;
              expect( db.name ).toEqual( DB_NAME );
              expect( db.version ).toEqual( DB_TARGET_VERSION );
            });
          });

          it( "does not invoke the schema migrations for the database", function ( done ) {
            this.promiseIsFulfilled( this.getPromise(), done, function ( db ) {
              this.db = db;
              expect( this.getSchema().migrate ).not.toHaveBeenCalled();
            });
          });
        });

        describe( "when the database exists with a later version than the schema", function () {
          beforeEach( function ( done ) {
            var connector = new Connector( { version: DB_TARGET_VERSION + 1 } );
            connector.asyncConnect( DB_NAME ).then(
              this.asyncStep( function ( db ) { db.close(); } )
            ).then( done, done );
          });

          it( "is rejected with a DOMError instance", function ( done ) {
            this.promiseIsRejected( this.getPromise(), done, function ( error ) {
              expect( error instanceof DOMError ).toBeTruthy();
            });
          });
        });

      });
    });

    describe( '.ConnectionPool', function () {
      var ConnectionPool, DB_NAME;
      ConnectionPool = dbAccess.ConnectionPool;
      DB_NAME = 'test';

      beforeEach( function () {
        var connector = new dbAccess.Connector({ version: 1 });
        this.def( 'subject', function subject() {
          return new ConnectionPool( connector, DB_NAME );
        });
      });

      afterEach( function () {
        indexedDB.deleteDatabase( DB_NAME );
      });

      // NOTE: #close() is not explicitly tested, but existing examples
      //       covering #asyncConnect() should fail if that's not
      //       working.

      describe( '#asyncConnect()', function () {

        beforeEach( function () {
          indexedDB.deleteDatabase( DB_NAME );

          this.def( 'promise', function promise() {
            return this.getSubject().asyncConnect();
          });
        });

        afterEach( function () {
          indexedDB.deleteDatabase( DB_NAME );
        });

        describe( "on initial invocation", function () {
          it( "is fulfilled with a connection to the database", function ( done ) {
            this.promiseIsFulfilled( this.getPromise(), done, function ( db ) {
              this.db = db;
              expect( db.name ).toEqual( DB_NAME );
              this.getSubject().close();
            });
          });
        });

        describe( "on subsequent invocation", function () {

          beforeEach( function ( done ) {
            this.promiseIsFulfilled( this.getPromise(), done, function ( db ) {
              this.pooledDb = db;
              // Re-define promise so will be re-evaluated.
              this.def( 'promise', function promise() {
                return this.getSubject().asyncConnect();
              });
            });
          });

          it( "is fulfilled again with the prior connection to the database", function ( done ) {
            this.promiseIsFulfilled( this.getPromise(), done, function ( db ) {
              expect( db ).toBe( this.pooledDb );
              this.getSubject().close();
            });
          });
        });
      });
    });

    describe( '.Schema', function () {
      var Schema = dbAccess.Schema;
      var DB_NAME = 'test';

      beforeEach( function () {
        this.def( 'subject', function subject() {
          return new Schema();
        });
      });

      it( "has a version number of 1", function () {
        expect( this.getSubject().version ).toEqual( 1 );
      });

      describe( '#migrate()', function() {
        describe( "invoked in the context of opening/upgrading a database", function () {
          beforeEach( function () {
            var connector;

            indexedDB.deleteDatabase( DB_NAME );

            connector = new dbAccess.Connector( this.getSubject() );

            this.def( 'connectionPool', function () {
              return new dbAccess.ConnectionPool( connector, DB_NAME );
            });
            this.def( 'promise', function () {
              return this.getConnectionPool().asyncConnect();
            });
          });

          afterEach( function () {
            this.getConnectionPool().close();
            indexedDB.deleteDatabase( DB_NAME );
          });

          it( "creates the \"worksheet\" object store", function ( done ) {
            this.promiseIsFulfilled( this.getPromise(), done, function ( db ) {
              var transaction, worksheetStore;
              transaction = db.transaction(['worksheet']);
              worksheetStore = transaction.objectStore('worksheet');
              expect( worksheetStore.keyPath ).toEqual( 'id' );
              expect( worksheetStore.autoIncrement ).toEqual( true );
            });
          });
        });
      });
    });

  });
});
