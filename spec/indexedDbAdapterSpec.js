describe( 'headway.indexedDbAdapter', function () {
  "use strict";
  var root, indexedDbAdapter;
  root = window;
  indexedDbAdapter = root.headway.indexedDbAdapter;

  beforeEach( function () {
    this.asyncStep = _asyncStep;
    this.asyncErrorRecorder = _asyncErrorRecorder;
    this.promiseIsFulfilled = _promiseIsFulfilled;
    this.promiseIsRejected  = _promiseIsRejected;
  });

  afterEach( function () {
    if( this.specAsyncError ) { throw this.specAsyncError; }
  });

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

  function _asyncErrorRecorder() {
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
        this.asyncErrorRecorder()
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
        var me = this;
        indexedDB.deleteDatabase( DB_NAME );

        this.subject = function subject() {
          me.asyncConnection = me.asyncConnection ||
            core.asyncGetConnection( DB_NAME, DB_TARGET_VERSION );
          return this.asyncConnection;
        };
      });

      afterEach( function () {
        if( this.db ) { this.db.close(); }
        indexedDB.deleteDatabase( DB_NAME );
      });

      describe( "when the database does not exist", function () {
        it( "is fulfilled with a connection to the newly created database", function ( done ) {
          this.promiseIsFulfilled( this.subject(), done, function ( db ) {
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
          this.promiseIsFulfilled( this.subject(), done, function ( db ) {
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
          this.promiseIsRejected( this.subject(), done, function ( error ) {
            expect( error instanceof DOMError ).toBeTruthy();
          });
        });
      });

    });
  });
});
