// Shamelessly stolen from Christopher Chudzicki, creator of Math3D.org
// https://github.com/ChristopherChudzicki/math3d-react/blob/master/client/src/utils/mathParsing/preprocessors/preprocessMathQuill.js

function escapeRegExp(str) {
  // from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
  // $& means the whole matched string
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceAll(str, find, replaceWith) {
  // from https://stackoverflow.com/a/1144788/2747370
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replaceWith)
}

function findClosingBrace(str, startIdx) {
  const braces = {
    '[': ']',
    '<': '>',
    '(': ')',
    '{': '}'
  }

  const openingBrace = str[startIdx]

  const closingBrace = braces[openingBrace]

  if (closingBrace === undefined) {
    throw Error(`${str} does not contain an opening brace at position ${startIdx}.`)
  }

  let stack = 1

  // eslint-disable-next-line no-plusplus
  for (let j = startIdx + 1; j < str.length; j++) {
    if (str[j] === openingBrace) {
      stack += +1
    }
    else if (str[j] === closingBrace) {
      stack += -1
    }
    if (stack === 0) {
      return j
    }
  }

  // stack !== 0
  throw Error(`${str} has a brace that opens at position ${startIdx} but does not close.`)
}

/**
 * Makes a series of replacements on MathQuill-generated LaTeX strings so that
 * they can be parsed by MathJS.
 *
 * Notes:
 *  1. This is pretty heuristic. Might discover updates needed.
 *  2. Much of this could be used to preprocess LaTeX generated by other means
 * (i.e., not MathQuill.) The main bit that is MathQuill-specific is probably
 * the operatorname replacements.
 *
 * @param  {string} fromMQ a MathQuill-generated LaTeX expression
 * @return {string} the input expression with LaTeX commands converted to mathjs
 */
function mathquillToMathJS(fromMQ) {
  const replacements = [
    { tex: '\\operatorname{diff}', mathjs: 'diff' },
    { tex: '\\operatorname{pdiff}', mathjs: 'pdiff' },
    { tex: '\\operatorname{curl}', mathjs: 'curl' },
    { tex: '\\operatorname{div}', mathjs: 'div' },
    { tex: '\\operatorname{norm}', mathjs: 'norm' },
    { tex: '\\operatorname{mod}', mathjs: 'mod' },
    { tex: '\\operatorname{abs}', mathjs: 'abs' },
    { tex: '\\operatorname{unitT}', mathjs: 'unitT' },
    { tex: '\\operatorname{unitN}', mathjs: 'unitN' },
    { tex: '\\operatorname{unitB}', mathjs: 'unitB' },
    { tex: '\\operatorname{arccosh}', mathjs: 'arccosh' },
    { tex: '\\operatorname{arcsinh}', mathjs: 'arcsinh' },
    { tex: '\\operatorname{arctanh}', mathjs: 'arctanh' },
    { tex: '\\cdot', mathjs: ' * ' },
    { tex: '\\left', mathjs: '' },
    { tex: '\\right', mathjs: '' },
    { tex: '{', mathjs: '(' },
    { tex: '}', mathjs: ')' },
    { tex: '~', mathjs: ' ' },
    { tex: '\\', mathjs: ' ' }
  ]

  // remove fractions, then apply replacements
  const noFrac = fracToDivision(fromMQ)
  const noBraceSub = convertSubscript(noFrac)
  return replacements.reduce(
    (acc, r) => replaceAll(acc, r['tex'], r['mathjs'] ),
    noBraceSub)
}

/**
 * Recursively removes braces from LaTeX subscripts
 *   - example: x_{12foo_{bar123_{evenlower}}} --> x_12foo_bar123_evenlower
 */
function convertSubscript(expr) {
  const sub = '_{'
  const subStart = expr.indexOf(sub)

  if (subStart < 0) { return expr }

  const numStart = subStart + sub.length
  const closingBrace = expr.indexOf('}', numStart)
  const newExpr = expr.slice(0, subStart) +
    '_' +
    expr.slice(numStart, closingBrace) +
    expr.slice(closingBrace + 1)

  return convertSubscript(newExpr)
}

/**
 * Recursively replaces LaTeX fractions with normal divison
 *   - example: \frac{a}{1 + \frac{b}{c}} --> {a}/{1 + {b}/{c}}
 */
function fracToDivision(expr) {
  const frac = '\\frac'
  const fracStart = expr.indexOf(frac)
  const numStart = fracStart + frac.length

  if (fracStart < 0) { return expr }

  const divIdx = findClosingBrace(expr, numStart)
  // Remove frac, and add "/"
  const newExpr = expr.slice(0, fracStart) +
    expr.slice(numStart, divIdx + 1) + '/' +
    expr.slice(divIdx + 1)

  return fracToDivision(newExpr)
}