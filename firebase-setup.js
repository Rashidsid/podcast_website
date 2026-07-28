const admin = require('firebase-admin');
const serviceAccount = require('./podcast-9485d-firebase-adminsdk-fbsvc-58c934649e.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'podcast-9485d'
});

const db = admin.firestore();

async function setupFirebase() {
  try {
    console.log('🔧 Setting up Firebase...');

    // Create the youtubeCache collection with initial document
    const youtubeRef = db.collection('youtubeCache').doc('latest_videos');
    
    await youtubeRef.set({
      videos: [],
      lastFetched: admin.firestore.Timestamp.now(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'pending'
    });

    console.log('✅ Collection "youtubeCache" created successfully!');
    console.log('✅ Document "latest_videos" initialized!');

    // Verify the setup
    const doc = await youtubeRef.get();
    console.log('\n📄 Initial Document Data:');
    console.log(JSON.stringify(doc.data(), null, 2));

    console.log('\n✨ Firebase setup complete!');
    console.log('\nNext steps:');
    console.log('1. Copy the Firebase config to your .env file');
    console.log('2. Update your youtube.ts to use Firestore instead of direct API calls');
    console.log('3. Deploy the Cloud Function for automatic daily refreshes');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up Firebase:', error);
    process.exit(1);
  }
}

setupFirebase();
