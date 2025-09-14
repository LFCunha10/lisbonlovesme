import 'dotenv/config'

async function main() {
  try {
    const mod = await import('../server/notificationService.ts') as any;
    if (typeof mod.verifyFcmConfig !== 'function') {
      console.error('verifyFcmConfig not found');
      process.exit(2);
    }
    const ok = await mod.verifyFcmConfig();
    if (ok) {
      console.log('FCM config OK: firebase-admin initialized.');
      process.exit(0);
    } else {
      console.error('FCM config missing or invalid: firebase-admin not initialized.');
      process.exit(1);
    }
  } catch (err) {
    console.error('FCM verification failed:', err);
    process.exit(1);
  }
}

main();

