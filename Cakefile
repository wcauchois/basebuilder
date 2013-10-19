fs      = require 'fs'
path    = require 'path'
{exec}  = require 'child_process'
async   = require 'async'
static_ = require 'node-static'
http    = require 'http'

OBJ_ASSETS_DIR = 'assets/obj'
BLENDER_ASSETS_DIR = 'assets/blend'
MODELS_DIR = 'webapp/models'
DEVSERVER_PORT = 8000

change_ext = (file_name, new_ext) ->
  original_ext = path.extname(file_name)
  path.basename(file_name, original_ext) + new_ext

build_blender_asset = (name, cb) ->
  console.log "Converting #{name}"
  blend_path = path.join BLENDER_ASSETS_DIR, name
  obj_path = path.join OBJ_ASSETS_DIR, change_ext(name, '.obj')
  js_path = path.join MODELS_DIR, change_ext(name, '.js')

  blender_convert_cmd = "blender #{blend_path}
    --background --python scripts/blender_export_obj.py
    -- #{obj_path}"
  three_js_convert_cmd = "./scripts/convert_obj_three.py
    -i #{obj_path} -o #{js_path}"

  async.series [
    (cb) -> exec blender_convert_cmd, cb
    (cb) -> exec three_js_convert_cmd, cb
  ], cb

task 'serve', 'Spawn a web server for development', (options) ->
  file_server = new static_.Server('./webapp')
  last_request_time = null
  http.createServer((request, response) ->
    request.on('end', () ->
      date = new Date()
      date_str = "#{date.getHours()}:#{date.getMinutes()}:#{date.getSeconds()}"
      if last_request_time? and (date.getTime() - last_request_time) > 500
        console.log Array(80).join('_')
      console.log "[#{date_str}] #{request.method} #{request.url}"
      file_server.serve(request, response)
      last_request_time = date.getTime()
    ).resume()
  ).listen DEVSERVER_PORT
  console.log "Listening on port #{DEVSERVER_PORT}"

task 'build:assets', 'Convert assets into a JavaScript format', (options) ->
  blender_files = fs.readdirSync(BLENDER_ASSETS_DIR)
  async.each blender_files, build_blender_asset, (err) ->
    throw new Error(err) if err
