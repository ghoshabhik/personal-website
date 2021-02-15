const express = require('express')
const articlesRouter = require('./routes/articles')
const projectsRouter = require('./routes/projects')
const commentsRouter = require('./routes/comments')
const methodOverride = require('method-override')


const app = express()
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended:false }))
app.use(methodOverride('_method'))
app.use('/public', express.static('public'));

app.use('/articles', articlesRouter)
app.use('/projects', projectsRouter)
app.use('/contact', commentsRouter)

app.get('/', (req, res) => {
    res.render('home/index')
})

app.listen(process.env.PORT || 5001)