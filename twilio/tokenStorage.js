const fs = require('fs').promises;
const path = require('path');

const TOKEN_FILE_PATH = path.join(__dirname, 'hubspot_tokens.json');

async function saveTokensToFile(tokens) {
  tokens.expires_at = Date.now() + tokens.expires_in * 1000;
  await fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(tokens, null, 2));
}

async function readTokensFromFile() {
  try {
    const data = await fs.readFile(TOKEN_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No token file found. Need to authenticate.');
      return null;
    }
    throw error;
  }
}