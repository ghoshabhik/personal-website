const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

require('dotenv').config()
const Article = require('./../models/article')

const mongodb_username = process.env.MONGODB_USER
const mongodb_password = process.env.MONGODB_PASSWORD
const mongodb_database = process.env.MONGODB_DATABASE

const uri = `mongodb+srv://${mongodb_username}:${mongodb_password}@abhikatlasmumbaiin.16jmi.mongodb.net/${mongodb_database}?retryWrites=true&w=majority`;

mongoose.connect(uri, { useNewUrlParser: true,  useUnifiedTopology: true, useCreateIndex: true, useFindAndModify:true})

router.get('/new', (req, res) => {
    if(process.env.RUNNING_MODE == 'PRD'){
        res.send('Not Authorized for this page')
    }
    
    res.render('articles/new-article', {article: new Article()})
})

router.get('/edit/:id', async (req, res) => {
    if(process.env.RUNNING_MODE == 'PRD'){
        res.send('Not Authorized for this page')
    }
    var article = await Article.findById(req.params.id)
    //console.log('onlyHtml from DB: ',article.htmlOnly)
    if(article.htmlOnly == "off"){
        article.htmlOnly == null
    }
    res.render("articles/edit-article", {article: article})
})

router.get('/:slug', async (req, res) => {
    const article = await Article.findOne({slug: req.params.slug})
    if(article == null ){
        res.redirect('/')
    }
    res.render('articles/show', {article: article, mode: process.env.RUNNING_MODE})
})

router.post('/', async (req, res) => {
    let article = new Article({
        title: req.body.title,
        description: req.body.description,
        markdown: req.body.markdown,
        prev: req.body.back,
        next: req.body.next,
        showHtml: req.body.showHtml,
        htmlOnly: req.body.htmlOnly
    })
    //console.log('htmlOnly form: ',req.body.htmlOnly)
    if(!req.body.htmlOnly){
        article.htmlOnly = "off"
    }
    //console.log('htmlOnly to be saved: ',article.htmlOnly)
    try{
        article = await article.save()
        res.redirect(`/articles/${article.slug}`)
    } catch(err){
        console.log(err)
        res.render('articles/new-article', {article : article})
    }
    
})
router.put('/:id', async (req, res) => {
    let article = await Article.findById(req.params.id)
    //console.log(article)
    article.title = req.body.title
    article.description = req.body.description
    article.markdown = req.body.markdown
    article.prev = req.body.back,
    article.next = req.body.next,
    article.showHtml = req.body.showHtml
    //console.log('htmlOnly form: ',req.body.htmlOnly)
    if(!req.body.htmlOnly){
        article.htmlOnly = "off"
    }else {
        article.htmlOnly = req.body.htmlOnly
    }
    //console.log('htmlOnly: ',article.htmlOnly)
    try{
        article = await article.save()
        res.redirect(`/articles/${article.slug}`)
    } catch(err){
        console.log(err)
        res.render('articles/edit-article', {article : article})
    }
    
})

router.get('/', async (req, res) => {
    const articles = await Article.find().sort({createdAt: 'desc'})
    res.render('articles/articles', {articles: articles, mode: process.env.RUNNING_MODE})
})

router.delete('/:id', async (req, res) => {
    await Article.findByIdAndDelete(req.params.id)
    res.redirect('/articles')
})

module.exports = router