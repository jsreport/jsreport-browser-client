/*!
 * Copyright(c) 2018 Jan Blaha
 *
 * This extension adds jsreport-html recipe.
 */
const path = require('path')

module.exports = (reporter, definition) => {
  const distPath = reporter.execution ? reporter.execution.tempDirectory : path.dirname(require.resolve('jsreport-browser-client-dist'))

  if (reporter.documentStore.model.entityTypes['TemplateType']) {
    reporter.documentStore.model.entityTypes['TemplateType'].omitDataFromOutput = { type: 'Edm.Boolean' }
  }

  function recipe (request, response) {
    response.meta.contentType = 'text/html'
    response.meta.fileExtension = 'html'

    let serverUrl
    if (definition.options.scriptLinkRootPath) {
      serverUrl = (request.options.preview ? ('../../..' + reporter.options.appPath) : definition.options.scriptLinkRootPath).replace(/\/$/, '')
    } else {
      serverUrl = request.context.http.baseUrl
    }

    let script = '<script src="' + serverUrl + '/extension/browser-client/public/js/jsreport.min.js"></script>'
    script += '<script>jsreport.serverUrl=\'' + serverUrl + '\';'
    script += 'jsreport.template=JSON.parse(decodeURIComponent("' + encodeURIComponent(JSON.stringify(request.template || {})) + '"));'
    script += 'jsreport.options=JSON.parse(decodeURIComponent("' + encodeURIComponent(JSON.stringify(request.options || {})) + '"));'

    if (!JSON.parse(request.template.omitDataFromOutput || 'false')) {
      script += 'jsreport.data=' + JSON.stringify(request.data || {}) + ';'
    }

    script += '</script>'

    const content = response.content.toString()
    const endBody = content.search(/<\/body\s*>/)
    response.content = endBody === -1 ? (script + content) : content.substring(0, endBody) + script + content.substring(endBody)
  }

  if (reporter.compilation) {
    reporter.compilation.resourceInTemp('jsreport.min.js', path.join(distPath, 'jsreport.min.js'))
  }

  reporter.extensionsManager.recipes.push({
    name: 'html-with-browser-client',
    execute: recipe
  })

  reporter.on('express-configure', (app) => {
    app.get('/extension/browser-client/public/js/jsreport.min.js', (req, res, next) => {
      res.sendFile(path.join(distPath, 'jsreport.min.js'))
    })
  })
}
