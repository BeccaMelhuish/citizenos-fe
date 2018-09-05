'use strict';

var config = require('config');
var express = require('express');
var app = express();
var https = require('https');
var path = require('path');
var http = require('http');
var fs = require('fs');
var _ = require('lodash');

var prerender = require('prerender-node');

var pathSettings = path.resolve('./public/settings.js');
try {
    var settingsFileTxt = '(function (window) { window.__config = window.__config || {};';
    _(config).forEach(function (value, key) {
        settingsFileTxt += ' window.__config.' + key + ' = ' + JSON.stringify(value) + ';';
    });
    settingsFileTxt += '}(this));';
    fs.writeFileSync(pathSettings, settingsFileTxt);
} catch (err) {
    console.log('Settings.json write FAILED to ' + pathSettings, err);
    process.exit(1);
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
