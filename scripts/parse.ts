// test simple parser for the html subset in use
// usage: deno --allow-read scripts/parse.ts posts/1.html posts/229.html

import { readFileStr } from 'https://deno.land/std/fs/mod.ts';

const decoder = new TextDecoder('utf-8')
const tags = RegExp('(<[^>]*>)([^<]*)','g')

type tag = string
type text = string
type token = tag|text
type tree = {tag:tag, text?: (tree|text)[], end?:tag}
type emit = (node:tree) => void

// interface emit {
//   (node:tree): void
// }


for (let file of Deno.args) {
  let html:string = decoder.decode(await Deno.readFile(file))
  let tokens:token[] = scan(html)
  let root:token = tokens.shift()!
  let tree = parse(root,tokens)
  findall(/<title>/, tree, print)
  findall(/<div id="c1">/, tree, c1 => {
    findall(/<pre>|<p>/, c1, print)
  })
}

function scan(html:string):token[] {
  let m, tokens:token[] = []
  while ((m = tags.exec(html)) !== null) {
    tokens.push(m[1])
    if (m[2].length) tokens.push(m[2])
  }
  return tokens
}

function parse(tag:tag, tokens:token[]):tree {
  let text:text[] = []
  let node:tree = ({tag, text})
  while (tokens.length) {
    let token:token = tokens.shift()!
    if (token.startsWith('</')) {
      node.end = token
      return node
    } else if (token.startsWith('<')) {
      node.text.push(parse(token,tokens))
    } else {
      node.text.push(token)
    } 
  }
  return node
}

function findall(pat:RegExp, tree:tree, more:emit) {
  if (pat.exec(tree.tag)) {
    more(tree)
  } else {
    (tree.text||[]).find((each:tree) => findall(pat, each, more))
  }
}

function flatten(node:tree|text):text {
  if (typeof node === 'string') return node
  return (node.text||[]).map((n:tree|text) => flatten(n)).join('')
}

function print(node:tree) {
  console.log(node.tag)
  console.log(flatten(node))
  console.log()
}