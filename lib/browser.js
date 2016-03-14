/*!
 * Copyright(c) 2016 Jan Blaha
 *
 * This extension adds jsreport-html recipe.
 */

var path = require('path')
var FS = require('q-io/fs')
var extend = require('node.extend')
var distPath = require.resolve('jsreport-browser-client-dist')
var distScript

module.exports = function (reporter, definition) {
  reporter.extensionsManager.recipes.push({
    name: 'jsreport-html',
    execute: function (request, response) {
      response.headers['Content-Type'] = 'text/html'
      response.headers['File-Extension'] = 'html'
      response.headers['Content-Disposition'] = "inline; filename=\'report.html\'"

      var template = extend(true, {}, request.template)
      var options = extend(true, {}, request.options)

      return FS.read(path.join(__dirname, 'wrapper.html')).then(function (wrapper) {
        response.content = wrapper
          .replace('$template', encodeURIComponent(JSON.stringify(template)))
          .replace('$options', encodeURIComponent(JSON.stringify(options)))
          .replace('$data', request.data ? JSON.stringify(request.data, null, 2) : 'null')
          .replace('$html', encodeURIComponent(response.content))
          .replace(/\$serverUrl/g, request.protocol + '://' + request.headers.host)
      })
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
