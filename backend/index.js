const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const path = require('path');
const outfitsRoute = require('./routes/Outfits');
require('dotenv').config();


const app = express();
app.use(express.json());
app.use(cors());


// serve uploaded outfits
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/outfits', outfitsRoute);


const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ar_tryon';
// mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connect(MONGO)
.then(()=> console.log('Mongo connected'))
.catch(e => console.error('Mongo connection error', e));


const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));