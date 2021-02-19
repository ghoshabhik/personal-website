const express = require('express')
const cors = require('cors')
const articlesRouter = require('./routes/articles')
const projectsRouter = require('./routes/projects')
const commentsRouter = require('./routes/comments')
const searchRouter = require('./routes/search')
const methodOverride = require('method-override')


const app = express()
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended:false }))
app.use(methodOverride('_method'))
app.use('/public', express.static('public'));

var corsOptions = {
    optionSuccessStatus: 200
}

app.use('/search', searchRouter)
app.use('/articles', articlesRouter)
app.use('/projects', projectsRouter)
app.use('/contact', commentsRouter)

app.get('/status', cors(corsOptions), (req, res, next) => {
    res.send('UP')
})
app.get('/', (req, res) => {
    res.render('home/index')
})


app.listen(process.env.PORT || 5002)