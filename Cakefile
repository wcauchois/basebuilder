fs      = require 'fs'
path    = require 'path'
{exec}  = require 'child_process'
async   = require 'async'
static_ = require 'node-static'
http    = require 'http'
AWS     = require 'aws-sdk'
crypto  = require 'crypto'

DEVSERVER_PORT = 8000
AWS_BUCKET = 'basebuilder-assets'

change_ext = (file_name, new_ext) ->
  (file_name.substr 0, file_name.lastIndexOf('.')) + new_ext

create_hashfile = (file_name, cb) ->
  md5sum = crypto.createHash 'md5'
  stream = fs.createReadStream file_name
  stream.on 'data', (data) -> md5sum.update(data)
  stream.on 'end', () ->
    digest = md5sum.digest('hex')
    fs.writeFileSync change_ext(file_name, '.md5'), "#{digest}\n"
    cb null

build_blender_asset = (name, cb) ->
  console.log "Converting #{name}"
  blend_path = path.join 'assets/blend', name
  obj_path = path.join 'build/obj', change_ext(name, '.obj')
  js_path = path.join 'build/models', change_ext(name, '.js')

  blender_convert_cmd = "blender #{blend_path}
    --background --python scripts/blender_export_obj.py
    -- #{obj_path}"
  three_js_convert_cmd = "./scripts/convert_obj_three.py
    -i #{obj_path} -o #{js_path}"

  async.series [
    (cb) -> exec blender_convert_cmd, cb
    (cb) -> exec three_js_convert_cmd, cb
    (cb) -> create_hashfile js_path, cb
  ], cb

task 'serve', 'Spawn a web server for development', (options) ->
  file_server = new static_.Server('./webapp', cache: false)
  last_request_time = null
  http.createServer((request, response) ->
    request.on('end', () ->
      date = new Date()
      date_str = "#{date.getHours()}:#{date.getMinutes()}:#{date.getSeconds()}"
      if last_request_time? and (date.getTime() - last_request_time) > 500
        console.log Array(80).join '_'
      console.log "[#{date_str}] #{request.method} #{request.url}"
      file_server.serve(request, response)
      last_request_time = date.getTime()
    ).resume()
  ).listen DEVSERVER_PORT
  console.log "Listening on port #{DEVSERVER_PORT}"

task 'build:assets', 'Convert assets into a JavaScript format', (options) ->
  ['build', 'build/obj', 'build/models'].forEach (dir) ->
    try
      fs.mkdirSync dir
    catch
  blender_files = fs.readdirSync('assets/blend')
  async.each blender_files, build_blender_asset, (err) ->
    throw new Error(err) if err

task 'upload:assets', 'Upload assets to Amazon S3', (options) ->
  invoke 'build:assets'

  AWS.config.loadFromPath './aws.json'
  s3 = new AWS.S3
  model_files = (f for f in fs.readdirSync 'build/models' when path.extname(f) == '.js')

  async.each model_files, ((file_name, cb) ->
    local_path = path.join 'build/models', file_name
    remote_path = "models/#{file_name}"
    console.log "Uploading #{local_path} to #{remote_path} on S3"
    s3.putObject
      ACL: 'public-read'
      Body: fs.readFileSync local_path
      Bucket: AWS_BUCKET
      ContentType: 'application/json'
      Key: remote_path, cb
  ), (err) ->
    throw new Error(err) if err

