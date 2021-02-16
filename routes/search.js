const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('dotenv').config()
const Article = require('./../models/article')
const Project = require('./../models/project')

const mongodb_username = process.env.MONGODB_USER
const mongodb_password = process.env.MONGODB_PASSWORD
const mongodb_database = process.env.MONGODB_DATABASE

const uri = `mongodb+srv://${mongodb_username}:${mongodb_password}@abhikatlasmumbaiin.16jmi.mongodb.net/${mongodb_database}?retryWrites=true&w=majority`;
mongoose.connect(uri, { useNewUrlParser: true,  useUnifiedTopology: true, useCreateIndex: true, useFindAndModify:true})


router.post('/', async (req, res) => {
    let q = req.body.q.trim().replace(/[&\/\\#+()$~%'":*?<>{}]/g,'')
    let resultFlag = {
        articles: null,
        projects: null
    }
    try{
        articles = await Article.find( 
            {'$or':[
                {'showHtml':{'$regex':new RegExp(q), '$options':'i'}},
                {'title':{'$regex':new RegExp(q), '$options':'i'}}]
            }, 
            {
            _id: 0,
            __v:0         
            }, (err, data) => {
                if(err){
                    console.log(err)
                } else { 
                    //if(data.length >0)
                    resultFlag.articles = 'found'  
                    //console.log('Articles Flag: ',resultFlag.articles)
                }
            }
        )

        projects = await Project.find( 
            {'$or':[
                {'showHtml':{'$regex':new RegExp(q), '$options':'i'}},
                {'title':{'$regex':new RegExp(q), '$options':'i'}}]
            }, 
            {
            _id: 0,
            __v:0         
            }, (err, data) => {
                if(err){
                    console.log(err)
                } else {
                    //if(data.length >0)  
                    resultFlag.projects = 'found'
                    //console.log('Projects Flag: ',resultFlag.projects)
                }
            }
        )

        res.render('search/search_results',{articles: articles, 
            q:q, 
            projects: projects, 
            resultFlag: resultFlag})

    } catch(err){
        console.log(err)
        res.render('home/index')
    }
    
})


module.exports = router