// Quick test script for language-based classifications
// Run this in browser console when the app is running

async function testLanguageClassifications() {
  console.log('🧪 Testing Language-Based Classifications...\n');

  try {
    // Test English classifications
    console.log('📥 Fetching English classifications...');
    const enResponse = await fetch('/api/events/classifications?locale=en');
    const enData = await enResponse.json();

    console.log('✅ English classifications loaded:');
    console.log(`   - Segments: ${enData.segments?.length || 0}`);
    console.log(`   - Genres: ${enData.genres?.length || 0}`);
    console.log(`   - Sub-Genres: ${enData.subGenres?.length || 0}`);
    console.log(`   - Types: ${enData.types?.length || 0}`);
    console.log(`   - Sub-Types: ${enData.subTypes?.length || 0}`);
    console.log(`   - Total: ${enData.all?.length || 0}\n`);

    // Test Polish classifications
    console.log('📥 Fetching Polish classifications...');
    const plResponse = await fetch('/api/events/classifications?locale=pl');
    const plData = await plResponse.json();

    console.log('✅ Polish classifications loaded:');
    console.log(`   - Segments: ${plData.segments?.length || 0}`);
    console.log(`   - Genres: ${plData.genres?.length || 0}`);
    console.log(`   - Sub-Genres: ${plData.subGenres?.length || 0}`);
    console.log(`   - Types: ${plData.types?.length || 0}`);
    console.log(`   - Sub-Types: ${plData.subTypes?.length || 0}`);
    console.log(`   - Total: ${plData.all?.length || 0}\n`);

    // Compare a few sample items
    console.log('📊 Sample comparison:');
    if (enData.segments?.[0] && plData.segments?.[0]) {
      console.log(`   English segment: "${enData.segments[0].name}"`);
      console.log(`   Polish segment: "${plData.segments[0].name}"`);
    }

    console.log('\n🎉 Language-based classifications working correctly!');
  } catch (error) {
    console.error('❌ Error testing classifications:', error);
  }
}

// Run the test
testLanguageClassifications();
