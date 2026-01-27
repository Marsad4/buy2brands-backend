const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' }); // Run from backend directory

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const db = mongoose.connection.db;
        const collection = db.collection('catalogs');

        // List indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));

        // Drop the old index
        const indexName = 'type_1_name_1';
        if (indexes.find(i => i.name === indexName)) {
            await collection.dropIndex(indexName);
            console.log(`Dropped index: ${indexName}`);
        } else {
            console.log(`Index ${indexName} not found. It might have a different name.`);
            // Try dropping by key pattern if name doesn't match
            try {
                await collection.dropIndex({ type: 1, name: 1 });
                console.log('Dropped index by key pattern { type: 1, name: 1 }');
            } catch (err) {
                console.log('Could not drop by key pattern (maybe it does not exist):', err.message);
            }
        }

        console.log('Done. You can now restart the server to build the new index.');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

connectDB();
