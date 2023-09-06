import Airtable from '../lib/main';

function runTests() {
  const airtable = new Airtable();
  console.log(airtable);
  airtable.auth('key');
  console.log(airtable);
}

runTests();
