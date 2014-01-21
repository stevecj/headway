var headway = (function( my ) {
  my.start = function start() {
    var userInterface;

    userInterface = my.UserInterface.create({
      dbAdapter: my.IndexedDbAdapter.create()
    });

    userInterface.start();
  };

  return my;
})( headway || {} );

headway.UserInterface = (function() {
  var constructor = function UserInterface( options ) {
    var dbAdapter = options.dbAdapter;

    this.start = function start() {
      var addWorksheetButton = document.forms.addWorksheetForm.addWorksheetButton ;
      addWorksheetButton.addEventListener( 'click', addWorksheet );
      refreshWorksheetList();
    };

    function getWorksheetRepo() { return dbAdapter.getWorksheetRepo() }

    function addWorksheet( event ){
      var
        newWorksheetNameInp = document.forms.addWorksheetForm.newWorksheetName ,
        newWorksheetName = newWorksheetNameInp.value ,
        worksheet = { name : newWorksheetName } ;

      getWorksheetRepo().add( worksheet, {
        onSuccess : refreshWorksheetList ,
        onError   : function onError( message ) { alert( "Error adding worksheet: " + message ); }
      });
    }

    function refreshWorksheetList() {
      getWorksheetRepo().fetchNameList({
        onSuccess: function onSuccess( nameList ) {
          renderWorksheetListForNames( nameList );
        },
        onError: function eachName( message ) {
          alert( "Error retrieving worksheet name list: " + message );
        }
      });

      function renderWorksheetListForNames( nameList ) {
        var listEl = document.createElement("UL");
        nameList.forEach(function eachName( name ) {
          var itemEl = document.createElement("LI");
          itemEl.textContent = name;
          listEl.appendChild( itemEl );
        });
        var containerEl = document.getElementById('worksheetListContainer');
        containerEl.innerHTML = '';
        containerEl.appendChild( listEl );
      }
    }
  };

  constructor.create = function create( options ) {
    return new constructor( options );
  };

  return constructor;
})();

headway.IndexedDbAdapter = (function( indexedDB ) {
  var constructor = function IndexedDbAdapter() {
    var targetDbVersion = 1 ,
        db ;

    function withDb( options ){
      var request;
      if ( db ) {
        options.onSuccess( db );
      } else {
        request = indexedDB.open( 'headway', targetDbVersion );

        request.onupgradeneeded = function onupgradeneeded( event ) {
          upgradeDb( event.target.result );
        };
        request.onsuccess = function onsuccess( event ) {
          db = request.result;
          options.onSuccess( db );
        };
        request.onerror = function onerror( event ) {
          var message = event.message;
          options.onError( message );
        };
      }
    }

    function upgradeDb( upgradingDb ) {
      upgradingDb.onerror = function onerror( event ) {
        alert('upgrading database');
      };
      upgradingDb.createObjectStore( 'worksheets', { keyPath: 'name' } );
    }

    this.getWorksheetRepo = function getWorksheetRepo() {
      return constructor.WorksheetRepo.create( withDb );
    }
  };

  constructor.create = function create() {
    return new constructor();
  };

  return constructor;
})( indexedDB );

headway.IndexedDbAdapter.WorksheetRepo = (function() {
  var constructor = function WorksheetRepo( withDb ) {
    this.add = function add( worksheet, options ) {
      withDb({
        onSuccess : function onSuccess( db ) {
          addWithDb( db, worksheet, options );
        },
        onError : options.onError
      });
    };

    this.fetchNameList = function fetchNameList( options ) {
      withDb({
        onSuccess : function onSuccess( db ) {
          fetchNameListWithDb( db, options );
        },
        onError : options.onError
      });
    };

    function addWithDb( db, worksheet, options ) {
      var transaction = db.transaction(['worksheets'], 'readwrite') ,
        store = transaction.objectStore('worksheets') ,
        request = store.add( worksheet ) ;

      request.onsuccess = function onsuccess( event ) {
        options.onSuccess();
      };

      request.onerror = function onerror( event ) {
        var message = request.error.message;
        options.onError( message );
      };
    }

    function fetchNameListWithDb( db, options ) {
      var transaction = db.transaction(['worksheets'], 'readonly') ,
        store = transaction.objectStore('worksheets') ,
        request = store.openCursor() ,
        nameList = [] ;

      request.onsuccess = function onsuccess( event ) {
        var cursor = event.target.result;
        if ( cursor ) {
          handleCursorEntry( cursor );
        } else {
          options.onSuccess( nameList );
        }
      };

      request.onerror = function onerror( event ) {
        var message = request.error.message;
        options.onError( message );
      };

      function handleCursorEntry( cursor ) {
        nameList.push( cursor.key );
        cursor.continue();
      }
    }
  };

  constructor.create = function create( dbAdapter ) {
    return new constructor( dbAdapter );
  };

  return constructor;
})();
