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
        adapter.deleteDb({
          onSuccess: function() {
            repository = adapter.getWorksheetRepo();
          },
          onError: function( msg ) {
            expect( "onError receieved " + msg ).toBe( "not received" );
          }
        });
        repository = adapter.getWorksheetRepo();
      });

      describe('#add()', function() {
        describe("given an object without a 'name' property", function() {
          var results;

          beforeEach(function( done ) {
            var worksheet = { wrongWithThisPicture: "something is" };

            function run( options ) {
              repository.add( worksheet, options );
            }

            results = runHeadwayRequest( run, done );
          });

          it("reports and error", function() {
            expect( results.succeeded ).toBe( false );
            expect( results.errorMessage.length ).toBeGreaterThan( 0 );
          });
        });

        describe("given an object with a unique 'name' string", function() {
          var results;

          beforeEach(function( done ) {
            var worksheet = { name: "Some unique name" };

            function run( options ) {
              repository.add( worksheet, options );
            }

            results = runHeadwayRequest( run, done );
          });

          it("reports success", function() {
            expect( results.succeeded ).toBe( true );
          });
        });
      });
    });
  });
});
