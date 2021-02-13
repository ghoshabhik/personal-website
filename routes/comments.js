const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('dotenv').config()
const Comment = require('./../models/comment')

const mongodb_username = process.env.MONGODB_USER
const mongodb_password = process.env.MONGODB_PASSWORD
const mongodb_database = process.env.MONGODB_DATABASE

const uri = `mongodb+srv://${mongodb_username}:${mongodb_password}@abhikatlasmumbaiin.16jmi.mongodb.net/${mongodb_database}?retryWrites=true&w=majority`;
mongoose.connect(uri, { useNewUrlParser: true,  useUnifiedTopology: true, useCreateIndex: true, useFindAndModify:true})

router.get('/new', (req, res) => {
    
    res.render('contact/new-contact', {comment: new Comment()})
})



router.post('/', async (req, res) => {
    let comment = new Comment({
        name: req.body.name.replace(/[&\/\\#+()$~%'":*?<>{}]/g,'_'),
        comment: req.body.comment.replace(/[&\/\\#+()$~%'":*?<>{}]/g,'_')
    })
    try{
        comment = await comment.save()
        res.redirect("/")
    } catch(err){
        console.log(err)
        res.render('contact/new-contact', {comment : comment})
    }
    
})

router.get('/', async (req, res) => {
    
    if( process.env.RUNNING_MODE != 'DEV'){
        res.setHeader('Content-Type', 'text/html')
        res.redirect("/contact/new")
    } else {
        const comments = await Comment.find().sort({createdAt: 'desc'})
        res.render('contact/contacts', {comments: comments, mode: process.env.RUNNING_MODE})
    }
    
})



module.exports = router