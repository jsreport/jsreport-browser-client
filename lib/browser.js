/*!
 * Copyright(c) 2016 Jan Blaha
 *
 * This extension adds jsreport-html recipe.
 */

var distPath = require.resolve('jsreport-browser-client-dist')

module.exports = function (reporter, definition) {
  reporter.documentStore.model.entityTypes['TemplateType'].omitDataFromOutput = { type: 'Edm.Boolean' }

  reporter.extensionsManager.recipes.push({
    name: 'html-with-browser-client',
    execute: function (request, response) {
      response.headers['Content-Type'] = 'text/html'
      response.headers['File-Extension'] = 'html'
      response.headers['Content-Disposition'] = "inline; filename='report.html'"

      if (definition.options.scriptLinkRootPath) {
        serverUrl = request.options.preview ? ('../..' + reporter.options.appPath) : definition.options.scriptLinkRootPath
      } else {
        reporter.express.app.enable('trust proxy')
        var serverUrl = request.protocol + '://' + request.get('host') + reporter.options.appPath
      }

      if (serverUrl[serverUrl.length - 1] === '/') {
        serverUrl = serverUrl.substring(0, serverUrl.length - 1)
      }

      var script = '<script src="' + serverUrl + '/extension/browser-client/public/js/jsreport.min.js"></script>'
      script += '<script>jsreport.serverUrl=\'' + serverUrl + '\';'
      script += 'jsreport.template=JSON.parse(decodeURIComponent("' + encodeURIComponent(JSON.stringify(request.template || {})) + '"));'
      script += 'jsreport.options=JSON.parse(decodeURIComponent("' + encodeURIComponent(JSON.stringify(request.options || {})) + '"));'

      if (!JSON.parse(request.template.omitDataFromOutput || 'false')) {
        script += 'jsreport.data=' + JSON.stringify(request.data || {}) + ';'
      }

      script += '</script>'

      var content = response.content.toString()
      var endBody = content.search(/<\/body\s*>/)
      response.content = endBody === -1 ? (script + content) : content.substring(0, endBody) + script + content.substring(endBody)
    }
  })

  reporter.on('express-configure', function (app) {
    app.get('/extension/browser-client/public/js/jsreport.min.js', function (req, res, next) {
      res.sendFile(distPath.replace('jsreport.js', 'jsreport.min.js'))
    })
  })
}
