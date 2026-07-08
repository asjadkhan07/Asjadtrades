const { Firestore } = require('@google-cloud/firestore');

async function test() {
  const projectId = 'ais-asia-southeast1-afdf48270b';
  console.log('Testing Firestore with project ID:', projectId);
  
  try {
    const firestore = new Firestore({
      projectId,
    });
    
    const docRef = firestore.collection('app_state').doc('test_doc');
    console.log('Writing test document...');
    await docRef.set({
      message: 'Hello from ATFunding!',
      timestamp: new Date().toISOString()
    });
    console.log('Successfully wrote to Firestore!');
    
    console.log('Reading test document...');
    const doc = await docRef.get();
    if (doc.exists) {
      console.log('Document data:', doc.data());
    } else {
      console.log('Document does not exist!');
    }
  } catch (err) {
    console.error('Firestore Error:', err);
  }
}

test();
