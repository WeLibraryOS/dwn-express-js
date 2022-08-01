const express = require( "express" );
const app = express();
const port = 8080; // default port to listen

// case #1 DWN will be a promise that when resolved throws
// Uncaught Error Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/pete_o/Documents/Dev/learn_card/dwn-sdk-js/dist/esm/validation/validator' imported from /Users/pete_o/Documents/Dev/learn_card/dwn-sdk-js/dist/esm/dwn.js
// const DWN   = import('dwn-sdk');

// case #2 DWN resolves but is an empty object 
const DWN   = require('dwn-sdk');

// case #3 throws Uncaught Error Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/pete_o/Documents/Dev/learn_card/dwn-sdk-js/dist/esm/validation/validator' imported from /Users/pete_o/Documents/Dev/learn_card/dwn-sdk-js/dist/esm/dwn.js
// import { DWN } from "dwn-sdk";

// define a route handler for the default home page
app.get( "/", ( req, res ) => {
    res.send( "Hello world!" );
} );

// start the Express server
app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
    DWN.then((dwn) => {
        console.log(dwn)
    })
} );