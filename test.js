/**
 * Vows tests.
 */
'use strict';

const vows   = require( 'vows' );
const assert = require( 'assert' );

const Config = require( "./index.js" );

vows.describe('Tests for Config').addBatch({
	'Types of properties': {
		topic: Config(),
		//
		'the object itself is an object':
			( cfg ) => ( typeof(cfg) === 'object' ),
		'$get is a function':
			( cfg ) => ( cfg.$get instanceof Function ),
		'$reg is a function':
			( cfg ) => ( cfg.$reg instanceof Function ),
		'$regMulti is a function':
			( cfg ) => ( cfg.$regMulti instanceof Function ),
		'$desc is a function':
			( cfg ) => ( cfg.$desc instanceof Function ),
		//
		'system props are okay':
			( cfg ) => ( Array.isArray(cfg._path) && cfg._path.length===0
			          && typeof(cfg._root)==='object' && Object.keys(cfg._root).length===0 ),
	},
	'Path wrapping': {
		topic: Config(),
		//
		'getting some path do not throw exception':
			( cfg ) => {
				try {
					let val = cfg.test1.test2.test3.test4.$get();
					return true;
				}
				catch( err ) {
					return false;
				}
			},
		'the path is generated okay':
			( cfg ) => {
				let p = cfg.test1.test2.test3.test4;
				assert.deepEqual( p._path, ['test1', 'test2', 'test3', 'test4'] );
			},
		'access to $get is okay':
			( cfg ) => ( cfg.test1.test2.test3.test4.$get() === undefined ),
	},
	'Setting and getting values': {
		topic: Config(),
		//
		'setting `test1` to a number value':
			( cfg ) => ( cfg.$reg('test1', 10, "Test one") ),
		'getting `test1` is okay':
			( cfg ) => ( cfg.$get('test1') === 10 ),
		'setting `test2.test21` to an object value':
			( cfg ) => ( cfg.test2.$reg('test21', {'key1': 20}, "Test two, 21") ),
		'getting `test2.test21` is okay':
			( cfg ) => ( assert.deepEqual(cfg.test2.test21.$get(), {'key1': 20}) ),
		'getting existing key of `test2.test21` is okay':
			( cfg ) => ( cfg.test2.test21.key1.$get() === 20 ),
		'getting unexisting key of `test2.test21` is okay':
			( cfg ) => ( cfg.test2.test21.key2.$get() === undefined ),
	},
}).export(module);
