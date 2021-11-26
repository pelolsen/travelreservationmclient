if (process.env.Node_ENV !== 'production') {
    require('dotenv').config()
}
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./database');
}

//require everything I need
const express = require('express');
const app = express();
let bcrypt = require('bcrypt')
const passport = require("passport")
const flash = require("express-flash")
const sessions = require("express-session")
const methodOverride = require("method-override")

const initializePassport = require('./models/passport-config')
initializePassport(
  passport,
  email => todbarray.find(user => user.email === email),
  id => todbarray.find(user => user.id === id)
)

//user
const users = []

//travels array
const todbarray =[]

//So I can use ejs to frontend
app.set("view-engine", "ejs")

//Make a public foldel so my css and pictures work
app.use('/public', express.static('public'))

//put the diffetent librarys at work
app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use(sessions({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get("/", checkNotAuthenticated, (req,res) => {
    res.render("clientindex.ejs")
})

app.post("/", checkNotAuthenticated, (req,res) =>{
    const destination = req.body.myCountry
    res.redirect("/book?destination=" + destination)
})

app.get("/book", checkNotAuthenticated, (req, res) => {
    const destination = req.query.destination
    res.render("book.ejs", {destination: destination})
})
//.get is mostly used to render the ejs files
app.get("/menu", checkAuthenticated, (req,res)=> {
    res.render("menu.ejs")
})

app.post("/menu", checkAuthenticated, (req,res) => {
    try{
        const gruppe = [{
            id: "1",
            name: "patrick",
            email: "p@p",
            destination: "sao paulo",
            package: "gold"    
        },
        {
            id: "2",
            name: "milla",
            email: "m@m",
            destination: "budapest",
            package: "silver"    
        },
        {
            id: "3",
            name: "jen",
            email: "j@j",
            destination: "moskow",
            package: "bronze"    
        }]
        todbarray.push(gruppe[0])
        todbarray.push(gruppe[1])
        todbarray.push(gruppe[2])
        console.log(todbarray);
        res.redirect("/menu")
    }catch{
        
    
    }
    localStorage.setItem('reservations',JSON.stringify(todbarray));
})
app.get("/booked", checkNotAuthenticated, (req, res) =>{
    const destination = req.query.destination
    const name = req.query.name
    res.render("booked.ejs", {destination: destination, name: name})
})
//register process - working fine
app.post("/book", checkNotAuthenticated, async (req,res) => {
    try{
        //encrypt the Uses password, so "we" cant see it
        const hashedPassword = await bcrypt.hash(req.body.password, 10); 
        const travel ={
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            destination: req.body.destination,
            package: req.body.package
        }
        todbarray.push(travel)
   
        //if all the above is right, than redirect the user to login page
        //res.render("booked.ejs", {name: travel.name, destination: travel.destination})
        res.redirect("/booked?destination=" + travel.destination + "&name=" +travel.name)
        console.log(todbarray);
        
        
    }catch{
        //if for some reason there is a failure, redirect back to register
        res.redirect("/registeruser")
    }
    localStorage.setItem('reservations',JSON.stringify(todbarray));
})

app.get("/login", checkNotAuthenticated, (req, res) => {
    res.render("login.ejs")
})

app.post("/login", checkNotAuthenticated,  passport.authenticate('local', {
    successRedirect: "/clientmenu",
    failureRedirect: "/login",
    failureFlash: true
}))

app.get("/clientmenu", checkAuthenticated, (req,res) =>{
    res.render("clientmenu.ejs", {name: req.user.name, destination: req.user.destination, package: req.user.package, id: req.user.id})
})

app.delete('/logout', async (req,res) => {
    req.logOut()
    res.redirect('/')
})

app.get('/clientchange', checkAuthenticated, (req,res) =>{
    res.render("clientchange.ejs")
})

function updateReservation(reservations, id){
    for(i=0; i<Object.keys(reservations).length; i++){
        if(reservations[i].id === id){
            reservations[i].name = req.body.name
            reservations[i].email = req.body.email
            reservations[i].destination = req.body.destination
            reservations[i].package = req.body.package
            return reservations
        }
    }
}

app.post('/clientchange', checkAuthenticated, (req,res) =>{
    const id = req.user.id
    const fromdb = JSON.parse(localStorage.getItem('reservations'))
    const todb = updateReservation(fromdb, id)
    todbarray.splice(0, todbarray.length)
    todbarray.push(todb)
    console.log(todbarray);
    localStorage.clear('reservations');
    localStorage.setItem('reservations', JSON.stringify(todbarray))

})

function checkAuthenticated(req, res, next){
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/menu')
    }
    next()
}

//Listen on port 3000... "localhost:3000/"
app.listen(3001);