var utils = require('istanbul/lib/object-utils')

var testClass = function(percent) {
  if (percent == 100) return 'pass complete'
  if (percent >= 75) return 'pass high'
  if (percent >= 50) return 'pass medium'

  return 'fail low'
}

var highlightSource = function(source) {
  return source
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\/\/(.*)/gm, '<span class="comment">//$1</span>')
    .replace(/('.*?')/gm, '<span class="string">$1</span>')
    .replace(/(\d+\.\d+)/gm, '<span class="number">$1</span>')
    .replace(/(\d+)/gm, '<span class="number">$1</span>')
    .replace(/\bnew *(\w+)/gm, '<span class="keyword">new</span> <span class="init">$1</span>')
    .replace(/\b(function|new|throw|return|var|if|else)\b/gm, '<span class="keyword">$1</span>')
}

var IstanbulMochaReporter = function(options) {
  this.options = options
}

IstanbulMochaReporter.prototype.renderHTML = function(coverage) {
  var files = Object.keys(coverage).map(function(path) {
    return coverage[path]
  })

  var html = '<h1>Coverage</h1>'
  html += this.tests(files)

  return html
}

IstanbulMochaReporter.prototype.tests = function(files) {
  var html = '<ul>'
  html += files.map(this.file.bind(this)).join('\n')
  html += '</ul>'

  return html
}

IstanbulMochaReporter.prototype.file = function(file) {
  var filename = file.path.replace(/^.*\/|\.[^.]*$/g, ''),
      summary = utils.summarizeFileCoverage(file),
      percent = summary.lines.pct

  var html = '<li class="test ' + testClass(percent) + '">'
  html += '<h2 id="' + filename + '">' + filename
  html += '<span class="coverage">' + Math.round(percent) + '%</span>'
  html += '</h2>'
  html += this.source(file, percent == 100)

  return html
}

IstanbulMochaReporter.prototype.source = function(file, hidden) {
  var html = '<table class="source" style="display: ' + (hidden ? 'none' : 'block') + '">'

  html += '<thead>'
  html += '<tr>'
  html += '<th>Line</th>'
  html += '<th>Hits</th>'
  html += '<th>Source</th>'
  html += '</tr>'
  html += '</thead>'

  html += '<tbody>'
  html += this.sourceRows(file)
  html += '</tbody>'

  html += '</table>'

  return html
}

IstanbulMochaReporter.prototype.sourceRows = function(file) {
  return file.code.map(function(line, index) {
    var number = index + 1,
        executions = file.l[number.toString()],
        covered = executions !== undefined,
        hit = executions > 0,
        miss = executions === 0

    var html = '<tr class="' + (hit ? 'hit' : miss ? 'miss' : '') + '">'
    html += '<td class="line-number">' + number + '</td>'
    html += '<td class="hits">' + (covered ? executions : '') + '</td>'
    html += '<td class="line">' + highlightSource(line) + '</td>'
    html += '</tr>'

    return html
  }).join('\n')
}

IstanbulMochaReporter.report = function(options) {
  var container = document.getElementById('mocha-report')

  if (!container) return

  var reporter = new IstanbulMochaReporter(options)

  var suite = document.createElement('li')
  suite.setAttribute('class', 'suite coverjs')
  suite.innerHTML = reporter.renderHTML(window.__coverage__)
  suite.addEventListener('click', function(event) {
    var target = event.target

    while (target.parentNode) {
      if (target.tagName === 'H2') {
        var source = target.parentNode.querySelector('.source')
        source.style.display = source.style.display == 'none' ? 'block' : 'none'

        return
      }

      target = target.parentNode
    }
  })

  var style = document.createElement('style')
  style.appendChild(document.createTextNode([
    '.coverage { font-size: 9px; margin-left: 5px; padding: 2px 5px; color: #fff; box-shadow: inset 0 1px 1px rgba(0,0,0,.2); border-radius: 5px; }',
    '.complete .coverage { display: none }',
    '.high .coverage{ background: #4ab948; }',
    '.medium .coverage{ background: #c09853; }',
    '.low .coverage{ background: #b94a48; }',
    '.source { width: 80%; margin-top: 10px; margin-bottom: 20px; border-collapse: collapse; border: 1px solid #cbcbcb; color: #363636; -webkit-border-radius: 3px; -moz-border-radius: 3px; border-radius: 3px; }',
    '.source thead { display: none; }',
    '.source .line-number, .source .hits { width: 20px; background: #eaeaea; text-align: center; font-size: 11px; padding: 0 10px; color: #949494; }',
    '.source .hits { width: 10px; padding: 2px 5px; color: rgba(0,0,0,.2); background: #f0f0f0; }',
    '.source .miss .line-number, .source .miss .hits { background: #e6c3c7; }',
    '.source .miss td { background: #f8d5d8; }',
    '.source .line { padding-left: 15px; line-height: 15px; white-space: pre; font: 12px monaco, monospace; }',
    '.source .line .comment { color: #ddd }',
    '.source .line .init { color: #2F6FAD }',
    '.source .line .string { color: #5890AD }',
    '.source .line .keyword { color: #8A6343 }',
    '.source .line .number { color: #2F6FAD }'
  ].join('\n')))

  var head = document.getElementsByTagName('head')[0]
  head.appendChild(style)

  container.appendChild(suite)
}

module.exports = IstanbulMochaReporter
