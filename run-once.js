import 'dotenv/config';
import { runDaily } from './runner.js';

console.log('▶️ Running single execution...\n');
runDaily()
  .then(result => {
    console.log(result ? '\n✅ Run complete.' : '\n⏭️ Skipped (already ran or all days done).');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
