//---------------Imports-----------

//--------Express----------------
const express = require('express');
const app = express();
//-------------------------------


//------------Mongoose + Validator------------
const mongoose = require('mongoose');
require('dotenv').config();
const validator = require('validator');
mongoose.connect(process.env.MONGO_URL);
const db = mongoose.connection;
//------------------------------------

//--------Configuration Express pour les entrées utilisateurs------
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//---------------------------------------------------------

//-------------JWT---------------
const jwt = require('jsonwebtoken');
const secretKey = 'UneCle';
//-------------------------------

//-----------Démarrer le serveur-----------

//------------Chemin vers l'index.html----------
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
//-----------------------------------------

//-----------Route Principale----------
app.get("/", (req,res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})
//---------------------------------

//--------------Démarrage du serveur--------
app.listen(3000, () => {
  console.log('Serveur démarré');
});
//-----------------------------------

//--------------Partie base de données-------------

//---------------Connection MongoDB------------
db.on('error', console.error.bind(console, 'Erreur de connexion à MongoDB:'));
db.once('open', () => {
  console.log('Connecté à MongoDB');
});
//--------------------------------------

//---------------Modèle---------------
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, 
        lowercase: true,
        trim: true,
        validate(v){
            if(!validator.isEmail(v)) throw new Error('Email non valide');
        }
    },

    passwd: {
        type: String,
        required: true
    },
});  
const User = mongoose.model('User', userSchema);
//-------------------------------------------------------

//--------------ROUTES--------------------

//-----------Route Principale----------
app.get("/", (req,res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
})
//---------------------------------

//---------------Route lors de l'inscription---------------
app.post('/register', async (req, res) => {
    const { email, passwd } = req.body;
  
    const user = new User({ email, passwd });
  
    try {
      await user.save()
      .then(() => {
        console.log(`Utilisateur créé avec l'email: ${email}`);
        setTimeout(() => {
          res.redirect('/index.html');
        }, 3000); // délai de 3 secondes
      })
      //res.status(201).send('Vous avez été enregistré avec succès. Vous allez être redirigé vers la page de connexion dans 5 secondes');
      
    } catch (err) {
      console.error('Erreur lors de l inscription', err);
      res.status(500).send('Erreur lors de l inscription');
    }
  });
//-----------------------------------------

//----------------Route lors de la connexion---------------
  app.post('/login', async (req, res) => {
    const { email, passwd } = req.body;
  
    try {
      const user = await User.findOne({ email: email });
  
      if (user && user.passwd === passwd) {
        console.log('Utilisateur connecté');
  
        // Le JWT 
        const payload = { email: email };
        const token = jwt.sign(payload, secretKey);
  
        // On met le token en cookie et on le signe
        res.cookie('token', token, { httpOnly: true });
  
        res.redirect('/users.html');
      } else {
        console.log('Erreur lors de la connexion');
        res.redirect('/log.html');
      }
    } catch (err) {
      console.error(err);
      res.redirect('/log.html');
    }
  });
  //------------------------------------------

  //------------Route pour lister les utilisateurs--------
  app.get('/users', async (req, res) => {
    try {
      const users = await User.find();
      const emails = users.map(user => user.email);
      res.json(emails);
    } catch (err) {
      console.error(err);
      res.send('Erreur lors de la requête users');
    }
  });
  //-------------------------------------