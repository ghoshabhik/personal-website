const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

require('dotenv').config()
const Project = require('../models/project')

const mongodb_username = process.env.MONGODB_USER
const mongodb_password = process.env.MONGODB_PASSWORD
const mongodb_database = process.env.MONGODB_DATABASE

const uri = `mongodb+srv://${mongodb_username}:${mongodb_password}@abhikatlasmumbaiin.16jmi.mongodb.net/${mongodb_database}?retryWrites=true&w=majority`;

mongoose.connect(uri, { useNewUrlParser: true,  useUnifiedTopology: true, useCreateIndex: true, useFindAndModify:true})

router.get('/new', (req, res) => {
    if(process.env.RUNNING_MODE == 'PRD'){
        res.send('Not Authorized for this page')
    }
    
    res.render('projects/new-project', {project: new Project()})
})

router.get('/pagenated', async (req, res) => {
    let page = req.query.page || 1
    let limit = 3
    let pagenatedStruct = []
    let docCount = await Project.countDocuments()
    let countOfPageButton = Math.round(docCount/limit)
    console.log(docCount)

    pagenatedStruct.push({
        class: 'inactive',
        href: '/projects/pagenated?page=1',
        name: '<<'
    })
    Array(countOfPageButton).fill().map((_, i) => i ).forEach( i => {
        pagenatedStruct.push({
            href: `/projects/pagenated?page=${(i+1)}`,
            class: 'inactive',
            name: `${(i+1)}`
        })
    })
    pagenatedStruct.push({
        class: 'inactive',
        href: `/projects/pagenated?page=${countOfPageButton}`,
        name: '>>'
    })

    pagenatedStruct.map( currentPage => {
        if(page == currentPage.name) 
        currentPage.class = 'active'
    })
    //console.log(pagenatedStruct)

    const projects = await Project.find().sort({createdAt: 'desc'}).limit(limit).skip((page-1)*limit)
    res.render('projects/projects', {projects: projects, mode: process.env.RUNNING_MODE, pagenatedStruct: pagenatedStruct})
})

router.get('/edit/:id', async (req, res) => {
    if(process.env.RUNNING_MODE == 'PRD'){
        res.send('Not Authorized for this page')
    }
    const project = await Project.findById(req.params.id)
    if(project.htmlOnly == "off"){
        project.htmlOnly == null
    }
    res.render("projects/edit-project", {project: project})
})

router.get('/:slug', async (req, res) => {
    let project = await Project.findOne({slug: req.params.slug})
    // project.createdAt = project.createdAt.toString().substring(4, 14)
    if(project == null ){
        res.redirect('/')
    }
    res.render('projects/show', {project: project, mode: process.env.RUNNING_MODE})
})

router.post('/', async (req, res) => {
    let project = new Project({
        title: req.body.title,
        projectType: req.body.projectType,
        description: req.body.description,
        markdown: req.body.markdown,
        showHtml: req.body.showHtml,
        htmlOnly: req.body.htmlOnly 
    })
    if(!req.body.htmlOnly){
        project.htmlOnly = "off"
    }
    //console.log(project)
    try{
        project = await project.save()
        res.redirect(`/projects/${project.slug}`)
    } catch(err){
        //console.log(err)
        res.render('projects/new-project', {project : project})
    }
    
})
router.put('/:id', async (req, res) => {
    let project = await Project.findById(req.params.id)
    //console.log(article)
    project.title = req.body.title
    project.projectType = req.body.projectType
    project.description = req.body.description
    project.markdown = req.body.markdown 
    project.showHtml = req.body.showHtml
    if(!req.body.htmlOnly){
        project.htmlOnly = "off"
    }else {
        project.htmlOnly = req.body.htmlOnly
    }
    try{
        project = await project.save()
        res.redirect(`/projects/${project.slug}`)
    } catch(err){
        //console.log(err)
        res.render('projects/edit-project', {project : project})
    }
    
})



router.get('/', async (req, res) => {
    //const projects = await Project.find().sort({createdAt: 'desc'})
    const projects = await Project.find()
    .sort({projectType: 'desc'})
    .select({'title':1, 'slug': 1, 'projectType':1, 'description':1})
    //console.log(projects)
    res.render('projects/project-topics', {projects: projects, mode: process.env.RUNNING_MODE, pagenatedStruct: [] })
})


router.delete('/:id', async (req, res) => {
    await Project.findByIdAndDelete(req.params.id)
    res.redirect('/projects')
})

module.exports = router