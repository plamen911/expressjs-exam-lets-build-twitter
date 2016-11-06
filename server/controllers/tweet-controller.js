const User = require('mongoose').model('User')
const Tweet = require('../data/Tweet')
const _ = require('underscore')
const moment = require('moment')

module.exports = {
    list: (app, config) => {
        return [
            (req, res, next) => {
                let pageTitle = 'Tweet List'
                let pageSize = 100

                Tweet
                    .find({})
                    .populate('_author') // <-- only works if you pushed refs to children
                    .sort('-createdAt')
                    .limit(pageSize)
                    .then((tweets) => {
                        let data = {
                            pageTitle: pageTitle,
                            rows: tweets,
                            moment: moment
                        }
                        res.render('tweet/list', data)
                    })
                    .catch((err) => {
                        res.render('error', {
                            pageTitle: pageTitle,
                            message: 'Error selecting tweets.',
                            error: err
                        })
                    })
            }
        ]
    },

    add: (app, config) => {
        return [
            (req, res, next) => {
                let pageTitle = 'New Tweet'

                let data = {
                    pageTitle: pageTitle
                }
                data = _.extend(getPostedData(req), data)
                res.render('tweet/form', data)
            }
        ]
    },

    create: (app, config) => {
        let data = {}

        return [
            // Parse and prepare data
            (req, res, next) => {
                let pageTitle = 'New Tweet'

                data = _.extend(getPostedData(req), {
                    pageTitle: pageTitle
                })

                // form validation
                if (!data.message) {
                    data.globalError = 'Message is required'
                    return res.render('tweet/form', data)
                }
                if (data.message.length > 140) {
                    data.globalError = 'Your message cannot contain more than 140 symbols'
                    return res.render('tweet/form', data)
                }

                let parsed = parseMessage(data.message);
                data.tags = parsed.tags
                data.handles = parsed.handles
                next()
            },
            // Get handle IDs
            (req, res, next) => {
                if (!data.handles || !data.handles.length) {
                    return next()
                }

                let handleIds = []
                let handles = []
                let query = { username: { $in: data.handles }}

                User
                    .find(query)
                    .then((users) => {
                        if (!users) {
                            console.log('pass #2');
                            return next()
                        }
                        users.forEach((user) => {
                            handleIds.push(user._id)
                            handles.push(user)
                        })
                        data.handles = handleIds
                        req.handles = handles

                        console.log('pass #22');

                        next()
                    })
                    .catch((err) => {
                        data.globalError = 'Error selecting handles: ' + err.message
                        return res.render('tweet/form', data)
                    })

            },
            (req, res, next) => {
                new Tweet(data)
                    .save()
                    .then((tweet) => {
                        req.tweet = tweet

                        console.log('nexxxxxx: ')

                        next()
                    })
                    .catch((err) => {
                        data.globalError = 'Error saving new tweet: ' + err.message
                        return res.render('tweet/form', data)
                    })
            },
            // update handles
            (req, res, next) => {
                if (!req.handles || !req.handles.length) {
                    return next()
                }

                let idx = 0
                let addMessageToHandle = () => {
                    if (typeof req.handles[idx] === 'undefined') {
                        return next()
                    }

                    let user = req.handles[idx]
                    idx++
                    user.tweets.push(req.tweet._id)

                    user
                        .save()
                        .then((usr) => {
                            addMessageToHandle()
                        })
                        .catch((err) => {
                            console.log('Error pushing tweet to handle: ', err)
                            addMessageToHandle()
                        })
                }

                addMessageToHandle()
            },
            // update tags
            (req, res, next) => {
                /*if (!data.tags || !data.tags.length) {
                    return next()
                }

                Tag
                    .findOne({})
                    .then((tag) => {
                        let allTags = []
                        tags.forEach((tag) => {
                            allTags.push(tag.name)
                        })

                        data.tags.forEach(tag => {
                            ta.push(tag)
                        })



                        allTags = _.uniq(allTags, (name) => {
                            return name.toString()
                        })

                        data.handles = allTags
                        req.handles = handles
                        next()
                    })
                    .catch((err) => {
                        console.log('Error selecting tags: ' + err.message)
                        next()
                    })*/

                next()
            },
            (req, res, next) => {
                res.redirect('/')
            }

        ]
    }
}

// utility functions
function getPostedData (req) {
    let params = (req && req.body) || null

    return {
        _author: req.user._id,
        message: params.message || ''
    }
}

function parseMessage(message) {
    let tags = [];
    let handles = [];

    if (message) {
        let words = message.split(/[\s\.,!\?]+/)
        words.forEach(word => {
            if (word.indexOf('#') === 0) {
                let tag = word.substring(1);
                if (tags.indexOf(tag) === -1) {
                    tags.push(tag)
                }
            }
            if (word.indexOf('@') === 0) {
                let handle = word.substring(1);
                if (handles.indexOf(handle) === -1) {
                    handles.push(handle)
                }
            }
        });
    }

    return {
        tags: tags.sort(),
        handles: handles.sort()
    }
}

