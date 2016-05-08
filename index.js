/**
 * The module helps store and use configuration.
 * @author Sergey I. Yarkin <sega@yark.in>
 */
'use strict';

const fs = require( 'fs' );
const util = require( 'util' );


const OWN_CONTAINER = Symbol( "OwnContainer" );
const FINAL = Symbol( "FinalContainer" );

const Config = (() => {
	let root = { [OWN_CONTAINER]: true };
	
	const ensurePath = ( path ) => {
		let i=0, len=path.length, item=root, name;
		for( ; i<len; i++ ) {
			name = path[i];
			if( name in item ) {
				if( item[name][FINAL] ) {
					return new ReferenceError( "Item '"+ path.slice(0,i).join(',') +"' cannot be redeclared" );
				}
			}
			else {
				item[ name ] = { [OWN_CONTAINER]: true };
			}
			item = item[ name ];
		}
		return item;
	};
	
	const PROXY_HANDLERS = {
		get( path, name, recv ) {
			switch( name ) {
				case '_path':
					return path;
				case '_root':
					return root;
				
				case '$reg':
					return ( name, defval, desc ) => {
						let err = registerParam( path, name, defval, desc );
						if( err instanceof Error ) {
							console.error( err );
						}
						return recv;
					};
				case '$regMulti':
					return ( defvals ) => {
						let err = registerParamMulti( path, defvals );
						if( err instanceof Error ) {
							console.error( err );
						}
						return recv;
					};
				
				case '$desc':
					return ( desc ) => {
						let err = setDescription( path, desc );
						if( err instanceof Error ) {
							console.error( err );
						}
						return recv;
					};
				
				case '$get':
					return ( name ) => {
						return getValue( path, name );
					};
					
				// some cases
				case 'valueOf':
				case 'length':
					return undefined;
				case 'toString':
				case 'inspect':
					return () => util.inspect( getValue(path) );
				
				default:
					return new Proxy( path.concat(name), PROXY_HANDLERS );
			}
		},
		set( path, name, value ) { return false; },
		has( path, name ) {
			console.log('!HAS');
			return false;
		},
	};
	
	const registerParam = ( path, name, defval, desc='' ) => {
		if( typeof(defval) === 'undefined' ) {
			return;
		}
		if( typeof(name) !== 'string' ) {
			return new TypeError( "'name' should be a string" );
		}
		let container = ensurePath( path );
		if( container instanceof ReferenceError ) {
			throw container;
		}
		if( name in container ) {
			container[ name ].def = defval;
		}
		else {
			container[ name ] = { [FINAL]: true, 'val': undefined, 'def': defval, 'desc': desc };
		}
	};
	
	const registerParamMulti = ( path, defvals ) => {
		if( ! Array.isArray(defvals) ) {
			return new TypeError( "'defvals' should be an array" );
		}
		if( defvals.length < 1 ) {
			return;
		}
		let container = ensurePath( path );
		if( container instanceof ReferenceError ) {
			throw container;
		}
		for( let i=0, len=defvals.length, name, defval, desc; i<len; i++ ) {
			name   = defvals[i].name;
			defval = defvals[i].defval;
			desc   = defvals[i].desc;
			if( name in container ) {
				container[ name ].def = defval;
			}
			else {
				container[ name ] = { [FINAL]: true, 'val': undefined, 'def': defval, 'desc': desc };
			}
		}
	};
	
	const setDescription = ( path, desc ) => {
		if( typeof(desc) !== 'string' ) {
			return new TypeError( "'desc' should be a string" );
		}
		let container = ensurePath( path );
		if( container instanceof ReferenceError ) {
			return container;
		}
		if( container[OWN_CONTAINER] ) {
			container[ '_desc' ] = desc;
		}
	};
	
	const getValue = ( path, name ) => {
		if( typeof(name)==='string' && name.length>0 ) {
			path = path.concat( name );
		}
		let item = root;
		for( let i=0, len=path.length; i<len; i++ ) {
			item = item[ path[i] ];
			if( ! item ) {
				return undefined;
			}
			if( item[FINAL] ) {
				item = item.val || item.def;
			}
		}
		return item;
	};
	
	
	return new Proxy( [], PROXY_HANDLERS );
});

module.exports = Config;
