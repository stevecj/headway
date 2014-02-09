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

  describe( ".core", function () {
    var core = indexedDbAdapter.core;

    describe( ".Connector", function () {
      var Connector = core.Connector;

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
            return { version: DB_TARGET_VERSION };
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
        });

        describe( "when the database exists with the schema version", function () {
          beforeEach( function ( done ) {
            this.getSubject().asyncConnect( DB_NAME ).then(
              this.asyncStep( function ( db ) { db.close(); } )
            ).then( done, done );
          });

          it( "is fulfilled with a connection to the existing database", function ( done ) {
            this.promiseIsFulfilled( this.getPromise(), done, function ( db ) {
              this.db = db;
              expect( db.name ).toEqual( DB_NAME );
              expect( db.version ).toEqual( DB_TARGET_VERSION );
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
  });
});
