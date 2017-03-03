'use strict'

const input = 'docker-compose.deploy.yml'
const output = 'docker-compose-generated.yml'

console.info('Generating ECS compatible YAML.')

let YAML = require('yamljs')
let fs = require('fs')

let obj = YAML.load(input)

var splitEnvs = [
]

var envs = splitEnvs.map(function (e) {
  return `${e}=${process.env[e]}`
})

obj['rra-dashboard']['environment'] = envs

// Also set container version based on hash
let hash = process.env.TRAVIS_COMMIT || 'latest'
obj['rra-dashboard']['image'] = `${obj['rra-dashboard']['image']}:${hash}`

// Turn into YAML and replace single quotes with double, because that's what
// ecs-cli wants.
let yamlString = YAML.stringify(obj, 4, 2).replace(/'/g, '"')

// Save to output file
fs.writeFileSync(output, yamlString)
console.info('Generated ECS compatible YAML.')