'use strict';

// ----------
// Libs
// ----------
let Promise = require('bluebird');
let express = require('express');
let bodyparser = require('body-parser');
let exec = require('child_process').exec;

Promise.onPossiblyUnhandledRejection(function(error){
    throw error;
});

// ----------
// Express app
// ----------
let app = express();

app.set('view engine', 'jade');
app.set('views', appRoot + '/src/server/views');

app.use(bodyparser.urlencoded({ extended: true }))
app.use(express.static(appRoot + '/public'));

// ----------
// Ready callback
// ----------
function ready() {
    // Start server
    let port = 80;
    let server = app.listen(port);

    console.log('Endomon CMS ::: Running on port ' + port);
    
    // Startup arguments
    for(let k in process.argv) {
        let v = process.argv[k];

        switch(v) {
            case 'create-admin':
                let username = process.argv[(parseInt(k) + 1).toString()];
                let password = process.argv[(parseInt(k) + 2).toString()];

                username = username.replace('u=', '');
                password = password.replace('p=', '');

                AdminHelper.createAdmin(username, password);
                return;
        }
    }
}

// ----------
// Helpers
// ----------
global.AdminHelper = require('./helpers/AdminHelper');
global.ConnectionHelper = require('./helpers/ConnectionHelper');
global.ContentHelper = require('./helpers/ContentHelper');
global.LanguageHelper = require('./helpers/LanguageHelper');
global.MediaHelper = require('./helpers/MediaHelper');
global.MongoHelper = require('./helpers/MongoHelper');
global.PluginHelper = require('./helpers/PluginHelper');
global.ProjectHelper = require('./helpers/ProjectHelper');
global.SchemaHelper = require('./helpers/SchemaHelper');
global.SettingsHelper = require('./helpers/SettingsHelper');

global.debug = require('../common/helpers/DebugHelper');
global.debug.verbosity = 3;

PluginHelper.init(app)
    .then(ready);

// ----------
// Controllers
// ----------
let ApiController = require(appRoot + '/src/server/controllers/ApiController');
let MediaController = require(appRoot + '/src/server/controllers/MediaController');

MediaController.init(app);
ApiController.init(app);

// ----------
// Views
// ----------
// Project list
app.get('/', function(req, res) {
    res.render('index');
});

// Login
app.get('/login/', function(req, res) {
    res.render('login');
});

// Project
app.get('/:project', function(req, res) {
    res.render('project');
});

// Environment
app.get('/:project/:environment/', function(req, res) {
    ProjectHelper.setCurrent(req.params.project, req.params.environment)
    .then(() => {
        res.render('environment', {
            currentProject: ProjectHelper.currentProject,
            currentEnvironment: ProjectHelper.currentEnvironment
        });
    });
});
