/**
 * The module helps store and use configuration.
 * @author Sergey I. Yarkin <sega@yark.in>
 */
'use strict';

const fs = require( 'fs' );
const util = require( 'util' );

/**
 * Symbol indicates own container in the root object.
 *
 * @constant
 * @type {Symbol}
 */
const OWN_CONTAINER = Symbol( "OwnContainer" );

/**
 * Symbol indicates the last own object in tree.
 *
 * @constant
 * @type {Symbol}
 */
const FINAL = Symbol( "FinalContainer" );


/**
 * Config object builder.
 *
 * @constructor {Config}
 */
const Config = () => {
	/**
	 * Stores all parameter tree.
	 * @type {Objetc}
	 */
	let root = { [OWN_CONTAINER]: true };
	
	/**
	 * Makes needed containers in the root object.
	 *
	 * @type {Function}
	 * @param path {String[]} Required path
	 * @returns {Object} Destination container
	 */
	const ensurePath = ( path ) => {
		let item = root;
		for( let i=0, len=path.length, name; i<len; i++ ) {
			name = path[i];
			if( name in item ) {
				if( item[name][FINAL] ) {
					return new ReferenceError(
						"Item '"+ path.slice(0,i).join(',') +"' cannot be redeclared"
					);
				}
			}
			else {
				item[ name ] = { [OWN_CONTAINER]: true };
			}
			item = item[ name ];
		}
		return item;
	};
	
	/**
	 * Proxy traps configuration.
	 * @type {Object}
	 */
	const PROXY_HANDLERS = {
		/**
		 * Intercepts getting of properties.
		 */
		get( path, name, recv ) {
			switch( name ) {
				// system's properties
				case '_path':
					return path;
				case '_root':
					return root;
				
				/**
				 * Registers new config parameter.
				 *
				 * @type {Function}
				 * @param name   {String} Parameter name
				 * @param defval {Mixed}  Default value of parameter
				 * @param [desc] {String} Parameter's description
				 * @returns {Proxy} Return the same point after we're done
				 */
				case '$reg':
					return ( name, defval, desc ) => {
						let err = registerParam( path, name, defval, desc );
						if( err instanceof Error ) {
							console.error( err );
						}
						return recv;
					};
				
				/**
				 * Set description for container.
				 *
				 * @type {Function}
				 * @param desc {String} Container's description
				 * @return {Proxy} Return the same point after we're done
				 */
				case '$desc':
					return ( desc ) => {
						let err = setDescription( path, desc );
						if( err instanceof Error ) {
							console.error( err );
						}
						return recv;
					};
				
				/**
				 * Returns value of parameter `name`
				 * or of parent object if `name` is empty.
				 *
				 * @type {Function}
				 * @param [name] {String} Name of parameter
				 * @returns {Mixed}
				 */
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
				
				/**
				 * Default behaviour is returning new Proxy.
				 */
				default:
					return new Proxy( path.concat(name), PROXY_HANDLERS );
			}
		},
		/**
		 * Don't allow setting values.
		 */
		set( path, name, value ) { return false; },
		// TODO: support has trap.
		has( path, name ) {
			console.log('!HAS');
			return false;
		},
	};
	
	/**
	 * Register new parameter.
	 */
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
	
	/**
	 * Set description of container.
	 */
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
	
	/**
	 * Get value of parameter.
	 */
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
};

module.exports = Config;
