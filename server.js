const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const { kStringMaxLength } = require('buffer');
const { auth , requiresAuth } = require('express-openid-connect');
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const cloudinary = require("cloudinary").v2;
const app = express()
const config = {
  authRequired: false,
  auth0Logout: true,
  baseURL: 'https://myfb.onrender.com',
  clientID: '9xDK4O0zsyC2cbCuba9VzBrQhK0lcU8z',
  issuerBaseURL: 'https://dev-tdco1d5t.us.auth0.com',
  secret: 'jzz2meKNJ0MSDWmZ43ee6e23e95jlanKXNp14ZFnk3q-HVbN7XZurIlXqjjYEPG0'
};

cloudinary.config({
  cloud_name: 'dyfa5afhe',
  api_key: '524616499598873',
  api_secret: 'NlG-R9Ensf7tTg_xWyhCNPhqsFQ',
  secure: true
});


app.use(bodyParser.urlencoded({extended: true}))
app.use(express.json())
mongoose.connect('mongodb+srv://testdb:testdb@cluster0.6v96k.mongodb.net/SocialApp',{useNewUrlParser: true} , {useUnifiedTopology: true})

const com = new mongoose.Schema({
    name: String,
    email: String,
    pic: String,
    desc: String,
    user_id: String,
    img: {
        type: String,
        default: ' '
     },
    img_id: {
        type: String,
        default: ' '
     }, 
    date: {type: String,
    default: new Date().toString().substring(0, 21)}
})


const save = mongoose.model("posts" , com )


const upload = multer({
  storage: multer.diskStorage({})
});




// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));
app.use(express.static(path.join(__dirname, 'static')));
app.set('view engine', 'ejs');
// req.isAuthenticated is provided from the auth router
app.get('/', (req, res) => {
        const number = save.find({ user_id: req.oidc.user.sub}).count(function (err, count) {
	save.find ({}).sort({_id:  -1}).exec( function (err,detail){
        res.render(req.oidc.isAuthenticated() ? 'index' : 'index2' , { user: req.oidc.user , details: detail, count: count})
      })
   })
});

app.get('/profile', requiresAuth(), (req, res) => {
  //res.send//(req.oidc//.user);
  const number = save.find({ user_id: req.oidc.user.sub}).count(function (err, count){
  save.find ({user_id: req.oidc.user.sub}).sort({_id:  -1}).exec( function (err,detail){
  res.render('profile' , { user: req.oidc.user , details: detail , count: count})
  
  })
 })
});


app.get('/post', requiresAuth(), (req, res) =>{
  //res.send//(req.oidc//.user);
  res.render('write' , { user: req.oidc.user})

});

app.post('/post', upload.single("image") , requiresAuth(), async (req, res) =>{
    try {
    
    let post = {
        name: req.oidc.user.name,
        email: req.oidc.user.email,
        pic: req.oidc.user.picture,
        desc: req.body.desc ,
        user_id: req.oidc.user.sub
    }
    if (req.file) {
     const result = await cloudinary.uploader.upload(req.file.path , { resource_type: "auto"})
     
     post.img = result.secure_url,
     post.img_id = result.public_id
     }
    const recived = new save(post)
    await recived.save()
    await res.redirect('/')
    }
    catch (err) {
    	console.log(err)
    }
})




app.get('/post/delete/:id', requiresAuth(), (req, res) =>{
   save.find ({_id: req.params.id}).exec( function (err,detail){
   	
        if (req.oidc.user.sub == detail[0].user_id ) {
            cloudinary.uploader.destroy(detail.img_id)
        	save.findByIdAndDelete(req.params.id , (err,d) => { console.log(" ")})
            
            res.redirect('/profile')
            
        }
        else { res.redirect('/')}
      })
      
});
app.listen(3000, () => {
    console.log('running on port 3000')
})
