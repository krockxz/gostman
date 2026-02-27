import { parseVariables, substitute } from './src/lib/variables.js';

const jsonVars = '{"host": "api.github.com", "token": "ghp_token", "user": "octocat"}';
const vars = parseVariables(jsonVars);
console.log('Parsed vars:', JSON.stringify(vars));
console.log('vars.token:', vars.token);
console.log('Has token:', 'token' in vars);
console.log('vars.hasOwnProperty("token"):', vars.hasOwnProperty('token'));

const headers = substitute('{"Authorization": "Bearer {{token}}", "Accept": "application/json"}', vars);
console.log('Result:', headers);

const url = substitute('https://{{host}}/users/{{user}}/repos', vars);
console.log('URL Result:', url);
