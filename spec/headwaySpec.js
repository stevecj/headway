describe( 'headway', function() {
  describe( '.IndexedDbAdapter', function() {
    var IndexedDbAdapter;

    function runHeadwayRequest( run, done ) {
      var options, results;

      results = {
        succeeded    : false ,
        errorMessage : null
      };

      options = {
        onSuccess : function()      { results.succeeded = true   ; done() ; } ,
        onError   : function( msg ) { results.errorMessage = msg ; done() ; }
      };

      run( options );

      return results;
    }

    beforeEach(function() {
      IndexedDbAdapter = headway.IndexedDbAdapter;
    });

    describe( '.create()', function() {
      it( "returns an instance", function() {
        expect( IndexedDbAdapter.create() instanceof IndexedDbAdapter ).toBe( true );
      });
    });

    describe( "an instance", function() {
      var adapter;

      beforeEach(function() {
        adapter = IndexedDbAdapter.create();
      });

      describe( '#getWorksheetRepo()', function(){
        it( "returns an instance of WorksheetRepo", function() {
          expect( adapter.getWorksheetRepo() instanceof IndexedDbAdapter.WorksheetRepo ).toBe( true );
        });
      });
    });

    describe( '.WorksheetRepo', function() {
      var repository;

      beforeEach(function() {
        adapter = IndexedDbAdapter.create();
        repository = adapter.getWorksheetRepo();
      });

      describe('#add()', function() {
        describe("given an object without a 'name' property", function() {
          var results;

          beforeEach(function( done ) {

            function run( options ) {
              var worksheet = { wrongWithThisPicture: "something is" };
              repository.add( worksheet, options );
            }

            results = runHeadwayRequest( run, done );
          });

          it("fails with an error", function() {
            expect( results.succeeded ).toBe( false );
            expect( results.errorMessage.length ).toBeGreaterThan( 0 );
          });
        });

      });
    });
  });
});
