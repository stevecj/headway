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
  var constructor;

  constructor = function UserInterface( options ) {
    var dbAdapter = options.dbAdapter;

    this.start = function start() {
      var addWorksheetButton;
      addWorksheetButton = document.forms.addWorksheetForm.addWorksheetButton ;
      addWorksheetButton.addEventListener( 'click', addWorksheet );
      refreshWorksheetList();
    };

    function getWorksheetRepo() { return dbAdapter.getWorksheetRepo() }

    function addWorksheet( event ){
      var newWorksheetNameInp, newWorksheetName, worksheet;

      newWorksheetNameInp = document.forms.addWorksheetForm.newWorksheetName;
      newWorksheetName = newWorksheetNameInp.value;
      worksheet = { name : newWorksheetName };

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
        var listEl, itemEl, containerEl;

        listEl = document.createElement("UL");
        nameList.forEach(function eachName( name ) {
          itemEl = document.createElement("LI");
          itemEl.textContent = name;
          listEl.appendChild( itemEl );
        });
        containerEl = document.getElementById('worksheetListContainer');
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
  var constructor;

  constructor = function IndexedDbAdapter() {
    var my, dbName, targetDbVersion, db;

    my = this;
    dbName = 'headway';
    targetDbVersion = 1;

    this.deleteDb = function deleteDb( options ) {
      var request;

      if( db ) {
        db.close();
        db = null;
      }

      request = indexedDB.deleteDatabase( my.getDbName() );
      request.onsuccess = options.onSuccess;
      request.onerror = function onerror( event ) {
        options.onError( event.message );
      };
    };

    this.getWorksheetRepo = function getWorksheetRepo() {
      return constructor.WorksheetRepo.create( withDb );
    }

    this.getDbName = function getDbName() {
      return dbName;
    };

    function withDb( options ){
      var request;

      if ( db ) {
        options.onSuccess( db );
      } else {
        request = indexedDB.open( my.getDbName(), targetDbVersion );

        request.onupgradeneeded = function onupgradeneeded( event ) {
          upgradeDb( event.target.result );
        };
        request.onsuccess = function onsuccess( event ) {
          db = request.result;
          options.onSuccess( db );
        };
        request.onerror = function onerror( event ) {
          options.onError( event.message );
        };
      }
    }

    function upgradeDb( upgradingDb ) {
      upgradingDb.onerror = function onerror( event ) {
        alert('upgrading database');
      };
      upgradingDb.createObjectStore( 'worksheets', { keyPath: 'name' } );
    }

  };

  constructor.create = function create() {
    return new constructor();
  };

  return constructor;
})( indexedDB );

headway.IndexedDbAdapter.WorksheetRepo = (function() {
  var constructor;

  constructor = function WorksheetRepo( withDb ) {
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
      var transaction, store, request ;

      try{
        transaction = db.transaction(['worksheets'], 'readwrite');
        store = transaction.objectStore('worksheets');
        request = store.add( worksheet );
      } catch(e) {
        options.onError( e.message );
        return;
      }

      request.onsuccess = function onsuccess( event ) {
        options.onSuccess();
      };

      request.onerror = function onerror( event ) {
        options.onError( request.error.message );
      };
    }

    function fetchNameListWithDb( db, options ) {
      var transaction, store, request, nameList;

      transaction = db.transaction(['worksheets'], 'readonly');
      store = transaction.objectStore('worksheets');
      request = store.openCursor();
      nameList = [];

      request.onsuccess = function onsuccess( event ) {
        var cursor = event.target.result;
        if ( cursor ) {
          handleCursorEntry( cursor );
        } else {
          options.onSuccess( nameList );
        }
      };

      request.onerror = function onerror( event ) {
        options.onError( request.error.message );
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
