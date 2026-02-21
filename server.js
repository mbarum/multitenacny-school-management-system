
/**
 * PM2 Entry Point
 * 
 * This file exists to resolve the 'ERR_UNSUPPORTED_DIR_IMPORT' error in ESM environments.
 * In ESM, directory imports are not supported. By providing this 'server.js' file in the root,
 * PM2 will correctly resolve this file instead of attempting to import the 'server' directory.
 */

import './server/dist/main.js';
