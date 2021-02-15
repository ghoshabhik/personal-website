const mongoose = require('mongoose')
const marked = require('marked')
const slugify = require('slugify')

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    markdown: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    showHtml: {
        type: String,
        required: true
    },
    htmlOnly: {
        type: String,
        required: false
    },
    prev: {
        type: String,
        required: true
    },
    next: {
        type: String,
        required: true
    },
    postComments: [
        {
            commenterName: {
                type: String,
                required: true
            },
            commentBody: {
                type: String,
                required: true
            },
            commentCreatedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
})

articleSchema.pre('validate', function(next) {
    if(this.title) {
        this.slug = slugify(this.title, {lower: true, strict: true})
        //console.log(this.slug)
    }
    //console.log('htmlOnly passed value: ',this.htmlOnly)
    if(this.markdown && this.htmlOnly == 'off'){
        this.showHtml = marked(this.markdown)
    }
    next()
})

module.exports = mongoose.model('Article', articleSchema)