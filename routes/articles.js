const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const redis = require('redis')

require('dotenv').config()
const Article = require('./../models/article')

const mongodb_username = process.env.MONGODB_USER
const mongodb_password = process.env.MONGODB_PASSWORD
const mongodb_database = process.env.MONGODB_DATABASE
const redis_password = process.env.REDIS_PASSWORD
const redis_server = process.env.REDIS_SERVER
const redis_port = process.env.REDIS_PORT

const uri = `mongodb+srv://${mongodb_username}:${mongodb_password}@abhikatlasmumbaiin.16jmi.mongodb.net/${mongodb_database}?retryWrites=true&w=majority`;

mongoose.connect(uri, { useNewUrlParser: true,  useUnifiedTopology: true, useCreateIndex: true, useFindAndModify:true})

redisClient =  redis.createClient({
    port      : parseInt(redis_port) , //6379          
    host      : redis_server,        
    password  : `${redis_password}`
    })

redisClient.on('connect', function () {
    console.log('redis connected');
    console.log(`connected ${redisClient.connected}`);
}).on('error', function (error) {
    console.log(error);
});


router.put('/:slug/postcomment', async (req, res) => {
    
    let article = await Article.findOne({slug: req.params.slug})
    //console.log("This is Comment Put: ",article)
    let postComment = {
        commenterName: req.body.post_name,
        commentBody: req.body.post_comment
    }
    article.postComments.push(postComment)
    //console.log(article)
    try{
        article = await article.save()
        res.redirect(`/articles/${article.slug}`)
    } catch(err){
        console.log(err)
        res.redirect(`/articles/${article.slug}`)
    }
})


router.get('/new', (req, res) => {
    if(process.env.RUNNING_MODE == 'PRD'){
        res.send('Not Authorized for this page')
    }
    
    res.render('articles/new-article', {article: new Article()})
})
cache = (req, res, next) => {
    const use_redis = process.env.USE_REDIS
    if(use_redis == 'YES'){
        let page = req.query.page
    let limit = 5
    let pagenatedStruct = []
    redisClient.get(`pagenated-${page}-${limit}`, (err, pagenated) => {
        if (err) throw err;
        //console.log(pagenated);
        redisClient.get(`pagenated-pagenatedStruct-${page}-${limit}`, (err, pageStruct) => {
            if (err) throw err;
            //console.log(pageStruct);
            res.pagenated = pagenated;
            res.pageStruct = pageStruct;
            //console.log(res.pagenated )
            console.log('Hit Redis to find data...')
            next();
        });
    });
    }
    else{
        next()
    }
    
}
router.get('/pagenated', cache, async (req, res) => {
    let page = req.query.page || 1
    let limit = 5
    let pagenatedStruct = []

    if(res.pagenated && res.pageStruct){
        res.render('articles/articles', {
            articles: JSON.parse(res.pagenated), 
            mode: process.env.RUNNING_MODE, 
            pagenatedStruct: JSON.parse(res.pageStruct)
        })
    } else{
        let docCount = await Article.countDocuments()
        let countOfPageButton = Math.ceil(docCount/limit)
        //console.log(docCount, "--" ,countOfPageButton)

        pagenatedStruct.push({
            class: 'inactive',
            href: '/articles/pagenated?page=1',
            name: '<<'
        })
        Array(countOfPageButton).fill().map((_, i) => i ).forEach( i => {
            pagenatedStruct.push({
                href: `/articles/pagenated?page=${(i+1)}`,
                class: 'inactive',
                name: `${(i+1)}`
            })
        })
        pagenatedStruct.push({
            class: 'inactive',
            href: `/articles/pagenated?page=${countOfPageButton}`,
            name: '>>'
        })

        pagenatedStruct.map( currentPage => {
            if(page == currentPage.name) 
            currentPage.class = 'active'
        })
        //console.log(pagenatedStruct)

        const articles = await Article.find().sort({createdAt: 'desc'}).limit(limit).skip((page-1)*limit)
        article = articles.map( article => {
            article.createdAt = article.createdAt.toString().substring(4,15)
        })
        redisClient.set(`pagenated-${page}-${limit}`,  JSON.stringify(articles), (err, reply) => {
        if (err) throw err;
        console.log(reply);
        })
        redisClient.set(`pagenated-pagenatedStruct-${page}-${limit}`,  JSON.stringify(pagenatedStruct), (err, reply) => {
        if (err) throw err;
        console.log(reply);
        })
        redisClient.expire(`pagenated-${page}-${limit}`,3600)
        redisClient.expire(`pagenated-pagenatedStruct-${page}-${limit}`,3600)
        console.log("hit db to find pagenated list...")
        console.log(articles.tags)
        res.render('articles/articles', {articles: articles, mode: process.env.RUNNING_MODE, pagenatedStruct: pagenatedStruct})
    }
})

router.get('/edit/:id', async (req, res) => {
    if(process.env.RUNNING_MODE == 'PRD'){
        res.send('Not Authorized for this page')
    }
    var article = await Article.findById(req.params.id)
    //console.log('onlyHtml from DB: ',article.htmlOnly)
    //article.tags = article.tags.join()
    if(article.htmlOnly == "off"){
        article.htmlOnly == null
    }
    res.render("articles/edit-article", {article: article})
})

router.get('/:slug', async (req, res) => {
    let article = await Article.findOne({slug: req.params.slug})
    //article.tags = article.tags.join()
    if(article == null ){
        res.redirect('/')
    }
    //console.log(article)
    res.render('articles/show', {article: article, mode: process.env.RUNNING_MODE})
})

router.post('/', async (req, res) => {
    let article = new Article({
        title: req.body.title,
        description: req.body.description,
        tags: req.body.tags.split(','),
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
    console.log("This is edit: ",article)
    article.title = req.body.title
    article.description = req.body.description
    article.tags = req.body.tags.split(',')
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
    let articles = await Article.find().sort({createdAt: 'desc'})
    //article.tags = article.tags.join()
    res.render('articles/articles', {articles: articles, mode: process.env.RUNNING_MODE, pagenatedStruct: []})
})

router.delete('/:id', async (req, res) => {
    await Article.findByIdAndDelete(req.params.id)
    res.redirect('/articles')
})

router.get('/tags/:tag', async (req, res) => {
    const tag = req.params.tag
    if(tag == 'all'){
        const tags = await Article.aggregate([
            {
                $unwind: "$tags"
            },
            {
                $group: {
                    "_id": "$tags",
                    "hits": {
                        $sum: 1
                    }
                }
            },
            {
                $project: {
                    "_id": 0,
                    "name": "$_id",
                    "hits": 1
                }
            }
        ]).sort({"name": 1})
        //console.log(tags)
        let alphaArr = Array.from(new Set(tags.map(alpha => alpha.name.substring(0,1).toUpperCase())))
        //console.log(alphaArr)
        res.render('tags/show_tags', {tags:tags, alphaArr:alphaArr})
    } else{
        const articles = await Article.find({ tags: `${tag}`})
        res.render('articles/articles_tags', {articles:articles, currentTag:tag})
    }
    
})

module.exports = router