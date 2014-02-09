describe( 'headway.indexedDbAdapter', function () {
  "use strict";
  var root, indexedDbAdapter;
  root = window;
  indexedDbAdapter = root.headway.indexedDbAdapter;

  beforeEach( function () {
    this.def                  = _def;
    this.asyncStep            = _asyncStep;
    this.getCaptureAsyncError = _getCaptureAsyncError;
    this.promiseIsFulfilled   = _promiseIsFulfilled;
    this.promiseIsRejected    = _promiseIsRejected;
  });

  afterEach( function () {
    if( this.specAsyncError ) { throw this.specAsyncError; }
  });

  function _def( name, fn ) {
    var me, getterName, memoName;
    me = this;
    getterName = 'get' + name.charAt(0).toUpperCase() + name.substr(1)
    memoName = '_' + name;

    this[getterName] = function def() {
      me[memoName] = me[memoName] || fn.call(me);
      return me[memoName];
    }
  }

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

  function _getCaptureAsyncError() {
    var me = this;
    return function ( error ) {
      me.specAsyncError = error;
    }
    this.specAsyncError = error;
  }

  function _promiseIsFulfilled( promise, done, onFulfilledSpec ) {
    promise.
      then(
        this.asyncStep( onFulfilledSpec ),
        this.getCaptureAsyncError()
      ).then( done, done );
  }

  function _promiseIsRejected( promise, done, onRejectedSpec ) {
    promise.
      then(
        onUnexpectedlyFulfilled,
        this.asyncStep( onRejectedSpec )
      ).then( done, done );

    function onUnexpectedlyFulfilled( value ) {
      expect( "fulfilled with " + value ).toEqual( "not fulfilled" );
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

        this.def( 'promise', function promise() {
          return core.asyncGetConnection( DB_NAME, DB_TARGET_VERSION );
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

      describe( "when the database exists with the target version", function () {
        beforeEach( function ( done ) {
          core.asyncGetConnection( DB_NAME, DB_TARGET_VERSION ).then(
            this.asyncStep( function ( db ) { db.close(); } )
          ).then( done, done );
        });

        it( "is fulfilled with a connection to the existing database", function ( done ) {
          //var asyncConnection = core.asyncGetConnection( DB_NAME, DB_TARGET_VERSION );
          this.promiseIsFulfilled( this.getPromise(), done, function ( db ) {
            this.db = db;
            expect( db.name ).toEqual( DB_NAME );
            expect( db.version ).toEqual( DB_TARGET_VERSION );
          });
        });
      });

      describe( "when the database exists with a later version than the target", function () {
        beforeEach( function ( done ) {
          core.asyncGetConnection( DB_NAME, DB_TARGET_VERSION + 1 ).then(
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
