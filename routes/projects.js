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

router.get('/edit/:id', async (req, res) => {
    if(process.env.RUNNING_MODE == 'PRD'){
        res.send('Not Authorized for this page')
    }
    const project = await Project.findById(req.params.id)
    res.render("projects/edit-project", {project: project})
})

router.get('/:slug', async (req, res) => {
    const project = await Project.findOne({slug: req.params.slug})
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
        markdown: req.body.markdown 
    })
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
    try{
        project = await project.save()
        res.redirect(`/projects/${project.slug}`)
    } catch(err){
        //console.log(err)
        res.render('projects/edit-project', {project : project})
    }
    
})

router.get('/', async (req, res) => {
    const projects = await Project.find().sort({createdAt: 'desc'})
    res.render('projects/projects', {projects: projects, mode: process.env.RUNNING_MODE})
})

router.delete('/:id', async (req, res) => {
    await Project.findByIdAndDelete(req.params.id)
    res.redirect('/projects')
})

module.exports = router