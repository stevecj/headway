describe( 'headway.indexedDbAdapter', function () {
  "use strict";
  var root, indexedDbAdapter;
  root = window;
  indexedDbAdapter = root.headway.indexedDbAdapter;

  describe( ".core", function() {
    var core = indexedDbAdapter.core;

    describe( ".asyncGetConnection()", function () {
      var DB_NAME, DB_TARGET_VERSION;
      DB_NAME = 'test';
      DB_TARGET_VERSION = 11;

      beforeEach( function () {
        indexedDB.deleteDatabase( DB_NAME );
      });

      afterEach( function () {
        if( this.db ) { this.db.close(); }
        indexedDB.deleteDatabase( DB_NAME );
      });

      describe( "when the database does not exist", function () {

        it( "is fulfilled with a connection to the database", function( done ) {
          var me, asyncConnection;
          me = this;
          asyncConnection = core.asyncGetConnection( DB_NAME, DB_TARGET_VERSION );
          asyncConnection.then(
            function ( db ) {
              me.db = db;
              expect( db.name ).toEqual( DB_NAME );
              expect( db.version ).toEqual( DB_TARGET_VERSION );
            },
            function ( e ) {
              expect( e ).toEqual( 'no error result' );
            }
          ).fail( function (e) {
            expect( e ).toEqual( 'no error result' );
          });
          asyncConnection.then( done, done );
        });
      });
    });
  });
});
