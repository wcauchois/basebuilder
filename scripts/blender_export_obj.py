"""
Example: blender foobar.blend --background --python convert_blend_to_obj.py -- foobar.obj
"""
# http://wiki.blender.org/index.php/Extensions:2.6/Py/Scripts/Import-Export/Wavefront_OBJ
import bpy
import sys

argv = sys.argv
argv = argv[argv.index('--') + 1:] # Get all args after '--'

obj_out = argv[0]

# http://www.blender.org/documentation/blender_python_api_2_57_release/bpy.ops.export_scene.html
bpy.ops.export_scene.obj(
    filepath=obj_out,
    axis_forward='-Z',
    axis_up='Y',
    use_materials=False,
    use_blen_objects=False)

