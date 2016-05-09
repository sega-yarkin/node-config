# node-config
Configuration control for Node.JS apps

# How to use

```js
// Connect the module
const Config = require( '@sega-yarkin/config' );

// Register some module parameter
const SomeModuleInit = ( cfg ) => {
	cfg.$desc( "Some module description" );
	cfg.$reg( 'timeout', "30s", "Connection timeout" );
	cfg.db.$desc( "Database parameters" );
	cfg.db.$reg( 'host', "127.0.0.1", "Database host" );
	cfg.db.$reg( 'port', 3389, "Database port" );
	cfg.db.$reg( 'user', "root", "Database username" );
	cfg.db.$reg( 'pwd' , "root", "Database username password" );
};

// Create config instance
let cfg = Config();
SomeModuleInit( cfg.somemodule );

// Get some parameter
let db_host = cfg.somemodule.db.host.$get();


```
