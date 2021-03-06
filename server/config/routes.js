const controllers = require('../controllers')
const auth = require('../config/auth')

module.exports = (app, config) => {
  app.get('/', controllers.tweet.list(app, config))
  app.get('/tweet', [].concat(auth.isAuthenticated, controllers.tweet.add(app, config)))
  app.post('/tweet', [].concat(auth.isAuthenticated, controllers.tweet.create(app, config)))
  app.get('/tag/:tagName', controllers.tweet.list(app, config))
  app.get('/profile/:username', [].concat(auth.isAuthenticated, controllers.tweet.author(app, config)))

  app.get('/tweet/like/:id', [].concat(auth.isAuthenticated, controllers.tweet.like(app, config)))
  app.get('/tweet/unlike/:id', [].concat(auth.isAuthenticated, controllers.tweet.unlike(app, config)))

  // admin functionality
  app.get('/edit/:id/:ref', [].concat(auth.isInRole('Admin'), controllers.tweet.edit(app, config)))
  app.post('/edit/:id/:ref', [].concat(auth.isInRole('Admin'), controllers.tweet.save(app, config)))
  app.get('/delete/:id/:ref', [].concat(auth.isInRole('Admin'), controllers.tweet.delete(app, config)))
  app.get('/admins/all', [].concat(auth.isInRole('Admin'), controllers.admin.list(app, config)))
  app.get('/admins/add', [].concat(auth.isInRole('Admin'), controllers.admin.add(app, config)))
  app.post('/admins/add', [].concat(auth.isInRole('Admin'), controllers.admin.create(app, config)))

  app.get('/users/register', controllers.users.register)
  app.post('/users/create', controllers.users.create)
  app.get('/users/login', controllers.users.login)
  app.post('/users/authenticate', controllers.users.authenticate)
  app.post('/users/logout', controllers.users.logout)

  app.all('*', (req, res) => {
    res.status(404)
    res.send('404 Not Found')
    res.end()
  })
}
