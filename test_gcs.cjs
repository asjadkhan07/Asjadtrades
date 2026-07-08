const { Storage } = require('@google-cloud/storage');

async function test() {
  const projectId = 'ais-asia-southeast1-afdf48270b';
  console.log('Testing GCS with project ID:', projectId);
  
  try {
    const storage = new Storage({
      projectId,
    });
    
    console.log('Listing buckets...');
    const [buckets] = await storage.getBuckets();
    console.log('Buckets:');
    buckets.forEach(b => console.log('- ', b.name));
    
    if (buckets.length > 0) {
      const bucketName = buckets[0].name;
      console.log('Using bucket:', bucketName);
      const file = storage.bucket(bucketName).file('db_test.json');
      console.log('Writing test file...');
      await file.save(JSON.stringify({ test: 'hello', date: new Date().toISOString() }));
      console.log('File written successfully!');
      
      console.log('Reading test file...');
      const [contents] = await file.download();
      console.log('Contents:', contents.toString());
    } else {
      console.log('No buckets found! Attempting to create a bucket...');
      const bucketName = `${projectId}-atfunding-storage`;
      const [bucket] = await storage.createBucket(bucketName, {
        location: 'asia-southeast1'
      });
      console.log('Bucket created successfully:', bucket.name);
    }
  } catch (err) {
    console.error('GCS Error:', err);
  }
}

test();
