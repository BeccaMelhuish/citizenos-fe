'use strict';

var config = require('config');
var express = require('express');
var app = express();
var https = require('https');
var path = require('path');
var http = require('http');
var fs = require('fs');
var _ = require('lodash');
var csp = require('express-csp-header');

var prerender = require('prerender-node');

var configFe = config.util.loadFileConfigs('./public/config');

var pathSettings = path.resolve('./public/settings.js');
try {
    var settingsFileTxt = '(function (window) { window.__config = window.__config || {};';
    _(configFe).forEach(function (value, key) {
        settingsFileTxt += ' window.__config.' + key + ' = ' + JSON.stringify(value) + ';';
    });
    settingsFileTxt += '}(this));';
    fs.writeFileSync(pathSettings, settingsFileTxt);
} catch (err) {
    console.log('Settings.json write FAILED to ' + pathSettings, err);
    process.exit(1);
}
//TODO: list whitelisted urls to github with description
var cspConfig = config.csp;
var cspOptions = _.cloneDeep(cspConfig);
if (cspConfig) {
    if (cspConfig.policies) {
        if (typeof cspConfig.policies === 'string') {
            console.log(Object.values(JSON.parse(cspConfig.policies)));
            cspConfig.policies = JSON.parse(cspConfig.policies);
            cspOptions.policies = {};
        }
        Object.keys(cspConfig.policies).forEach(function(key, index) {
            cspConfig.policies[key].forEach(function (value, k) {
                if (k === 0) {
                    cspOptions.policies[key] = [];
                }
                if (value === 'none') {
                    cspOptions.policies[key].push(csp.NONE);
                } else if (value === 'self') {
                    cspOptions.policies[key].push(csp.SELF);
                } else if (value === 'inline') {
                    cspOptions.policies[key].push(csp.INLINE);
                } else {
                    cspOptions.policies[key].push(value);
                }
            });
        });
    }
    var cspHeader = csp(cspOptions);
    app.use(cspHeader);
}


app.use(prerender.set('prerenderToken', 'CrrAflHAEiF44KMFkrs7'));

app.use(express.static(__dirname + '/public'));

app.get('/*', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

var host = process.env.HOST || null;

var portHttp = process.env.PORT || 3000;
http.createServer(app).listen(portHttp, host, function (err, res) {
    if (err) {
        console.log('Failed to start HTTP server on port' + portHttp, err);
        return;
    }
    console.log('HTTP server listening on port ' + portHttp);
});


if (app.get('env') === 'development') {
    var portHttps = process.env.PORT_SSL || 3001;
    var options = {
        key: fs.readFileSync('./config/certs/dev.citizenos.com.key'),
        cert: fs.readFileSync('./config/certs/dev.citizenos.com.crt')
    };

    https.createServer(options, app).listen(portHttps, host, function (err, res) {
        if (err) {
            console.log('Failed to start HTTPS server on port' + portHttps, err);
            return;
        }
        console.log('HTTPS server listening on port ' + portHttps);
    });
}
