fs     = require 'fs'
path   = require 'path'
{exec} = require 'child_process'
async  = require 'async'

OBJ_ASSETS_DIR = 'assets/obj'
BLENDER_ASSETS_DIR = 'assets/blend'
MODELS_DIR = 'webapp/models'

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

task 'build:assets', 'Convert assets into a JavaScript format', (options) ->
  blender_files = fs.readdirSync(BLENDER_ASSETS_DIR)
  async.each blender_files, build_blender_asset, (err) ->
    throw new Error(err) if err
