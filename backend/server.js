const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});


const uri = 'mongodb://localhost:27017/annotationData';

MongoClient.connect(uri, (err, client) => {
  if (err) {
    console.error('Failed to connect to MongoDB:', err);
    return;
  }
  console.log('Connected to MongoDB');

  const db = client.db();

  // Define Express.js routes here
  app.get('/annotations', (req, res) => {
    // Retrieve annotations from the database and send the response
    const annotations = db.collection('annotations').find().toArray();
    res.json(annotations);
  });

  app.post('/annotations', (req, res) => {
    // Create a new annotation in the database based on the request body
    const newAnnotation = req.body;
    db.collection('annotations').insertOne(newAnnotation);
    res.sendStatus(201);
  });

  // ...

  // Start the server
  const port = 3000;
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
});