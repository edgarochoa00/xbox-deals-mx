// Compatibility entry point: all scheduled/manual updates share one policy.
import('./update-deals.js').then(({ main }) => main()).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
