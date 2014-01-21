describe( 'headway', function() {
  describe( '.IndexedDbAdapter', function() {
    var IndexedDbAdapter, adapter;

    beforeEach(function() {
      IndexedDbAdapter = headway.IndexedDbAdapter;
      adapter = IndexedDbAdapter.create();
    });

    it( "can be instantiated", function() {
      expect( adapter instanceof IndexedDbAdapter ).toBe( true );
    });
  });
});
