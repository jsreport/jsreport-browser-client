/*!
 * Copyright(c) 2016 Jan Blaha
 *
 * This extension adds jsreport-html recipe.
 */

var FS = require('q-io/fs')
var distPath = require.resolve('jsreport-browser-client-dist')
var distScript

module.exports = function (reporter, definition) {
  reporter.extensionsManager.recipes.push({
    name: 'html-with-browser-client',
    execute: function (request, response) {
      response.headers['Content-Type'] = 'text/html'
      response.headers['File-Extension'] = 'html'
      response.headers['Content-Disposition'] = "inline; filename=\'report.html\'"

      var script = '<script>' + distScript
      script += ';jsreport.serverUrl=\'' + request.protocol + '://' + request.headers.host + '\';'
      script += 'jsreport.template=JSON.parse(decodeURIComponent(\"' + encodeURIComponent(JSON.stringify(request.template || {})) + '\"));'
      script += 'jsreport.options=JSON.parse(decodeURIComponent(\"' + encodeURIComponent(JSON.stringify(request.options || {})) + '\"));'
      script += 'jsreport.data=' + JSON.stringify(request.data || {}) + ';'

      script += '</script>'

      response.content = script + response.content
    }
  })

  reporter.on('express-configure', function (app) {
    app.get('/extension/browser-client/public/js/jsreport.min.js', function (req, res, next) {
      res.send(distScript)
    })
  })

  return FS.read(distPath.replace('jsreport.js', 'jsreport.min.js')).then(function (script) {
    distScript = script
  })
}
