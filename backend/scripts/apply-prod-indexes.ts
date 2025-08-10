import { system } from '~encore/clients';

async function main() {
  console.log('Requesting to apply production database indexes...');
  
  try {
    const response = await system.applyProductionIndexes();
    console.log('API call successful. Details:');
    response.details.forEach(line => console.log(line));
    if (!response.success) {
      throw new Error('Applying indexes failed on the server.');
    }
    console.log('Production database indexes applied successfully.');
  } catch (err) {
    console.error('Failed to apply production indexes:', err);
    process.exit(1);
  }
}

main();
