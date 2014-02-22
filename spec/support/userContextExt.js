/* JSHint inline configuration  */
/* global jasmine:false, expect:false */

jasmine.headway = jasmine.headway || {};

jasmine.headway.userContextExt = (function ( module ) {
  "use strict";

  module.applyTo = function applyTo( userContext ) {
    for ( var prop in this.extensions ) {
      if ( this.extensions.hasOwnProperty(prop) ) {
        userContext[prop] = this.extensions[prop];
      }
    }
  };

  return module;
})( jasmine.headway.userContext || {} );

jasmine.headway.userContextExt.extensions = (function ( module ) {
  "use strict";

  module.def = function def( name, fn ) {
    var me, getterName, memoName;
    me = this;
    getterName = 'get' + name.charAt(0).toUpperCase() + name.substr(1);
    memoName = '_' + name;

    // Unmemoize result when re-defined after previously invoked.
    delete this[memoName];
    this[getterName] = function def() {
      me[memoName] = me[memoName] || fn.call(me);
      return me[memoName];
    };
  };

  module.asyncStep = function asyncStep( fn ) {
    var me = this;
    return function () {
      try {
        fn.apply( me, arguments );
      } catch( e ) {
        me.specAsyncError = e;
      }
    };
  };

  module.getCaptureAsyncError = function getCaptureAsyncError() {
    var me = this;
    return function ( error ) {
      me.specAsyncError = error;
    };
  };

  module.promiseIsFulfilled = function promiseIsFulfilled( promise, done, onFulfilledSpec ) {
    promise.
      then(
        this.asyncStep( onFulfilledSpec ),
        this.getCaptureAsyncError()
      ).then( done, done );
  };

  module.promiseIsRejected = function promiseIsRejected( promise, done, onRejectedSpec ) {
    promise.
      then(
        onUnexpectedlyFulfilled,
        this.asyncStep( onRejectedSpec )
      ).then( done, done );

    function onUnexpectedlyFulfilled( value ) {
      expect( "fulfilled with " + value ).toEqual( "not fulfilled" );
    }
  };

  var exampleNumForLog = 1;
  module.logExampleStep = function logExampleStep( name ) {
    if ( this.exampleNumForLog ) {
      this.exampleStepForLog = this.exampleStepForLog + 1;
    } else {
      this.exampleNumForLog = exampleNumForLog;
      exampleNumForLog = exampleNumForLog + 1;
      this.exampleStepForLog = 1;
    }
    console.log( '' + this.exampleNumForLog + ':' + this.exampleStepForLog + ' : ' + name);
  };

  return module;
})( jasmine.headway.userContextExt.extensions || {} );
