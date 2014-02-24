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

  // Note that .asyncEmptyDatabase is not directly covered. Hopefully,
  // any problems it may have will become apparent based on how other
  // spec examples are affected.

  describe( '.getConnectionPool()', function () {
    it( "returns a connection pool for the \"headway\" database", function () {
      var pool = indexedDbAdapter.getConnectionPool();
      expect( pool.getDbName() ).toEqual( 'headway' );
    });
  });

  describe( '.WorksheetRepo', function () {
    var WorksheetRepo = indexedDbAdapter.WorksheetRepo;

    beforeEach( function ( done ) {
      // See what I did here? <g>
      var emptyPromise = indexedDbAdapter.asyncEmptyDatabase();
      this.promiseIsFulfilled( emptyPromise, done )
    });

    beforeEach( function () {
      this.def( 'subject', function () {
        return new WorksheetRepo();
      });
    });

    describe( '#asyncAdd', function () {
      beforeEach( function () {
        this.def( 'promise', function () {
          return this.getSubject().asyncAdd({ name: "The Worksheet" });
        });
      });

      it( "is fulfilled with a new storage id number", function ( done ) {
        this.promiseIsFulfilled( this.getPromise(), done, function ( newWorksheetId ) {
          expect( typeof newWorksheetId ).toEqual( "number" );
        });
      });
    });
  });
});
