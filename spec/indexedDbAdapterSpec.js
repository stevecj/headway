describe( 'headway.indexedDbAdapter', function () {
  "use strict";
  var root, indexedDbAdapter;
  root = window;
  indexedDbAdapter = root.headway.indexedDbAdapter;

  beforeEach( function () {
    this.asyncStep = _asyncStep;
    this.promiseIsFulfilled = _promiseIsFulfilled;
  });

  afterEach( function () {
    if( this.specAsyncError ) { throw this.specAsyncError; }
  });

  function noOp() { }

  function _asyncStep( fn ) {
    var me = this;
    return function () {
      try {
        fn.apply( me, arguments );
      } catch( e ) {
        me.specAsyncError = e;
      }
    };
  }

  function _promiseIsFulfilled( promise, done, onFulfilledSpec ) {
    promise.
      then(
        this.asyncStep( onFulfilledSpec ),
        onRejected
      ).then( done, done );

    function onRejected( error ) {
      expect( error ).toEqual( 'no error result' );
    }
  }

  describe( ".core", function () {
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
        it( "is fulfilled with a connection to the newly created database", function ( done ) {
          var asyncConnection = core.asyncGetConnection( DB_NAME, DB_TARGET_VERSION );
          this.promiseIsFulfilled( asyncConnection, done, function ( db ){
            this.db = db;
            expect( db.name ).toEqual( DB_NAME );
            expect( db.version ).toEqual( DB_TARGET_VERSION );
          });
        });
      });

    });
  });
});
