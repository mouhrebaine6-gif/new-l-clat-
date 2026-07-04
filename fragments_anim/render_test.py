import bpy

img_path = r"C:\Users\mouhr\Desktop\eclipse.jpg"
out_path = r"D:\LECLAT\fragments_anim\out\eclipse_test.png"

scene = bpy.context.scene
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

bpy.ops.mesh.primitive_plane_add(size=2, location=(0,0,0))
plane = bpy.context.active_object
img = bpy.data.images.load(img_path)
mat = bpy.data.materials.new("frag"); mat.use_nodes = True
nt = mat.node_tree; nt.nodes.clear()
tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = img
emis = nt.nodes.new("ShaderNodeEmission"); emis.inputs["Strength"].default_value = 1.0
out = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(tex.outputs["Color"], emis.inputs["Color"])
nt.links.new(emis.outputs["Emission"], out.inputs["Surface"])
plane.data.materials.append(mat)

cam_data = bpy.data.cameras.new("cam"); cam_data.type='ORTHO'; cam_data.ortho_scale=2.0
cam = bpy.data.objects.new("cam", cam_data); cam.location=(0,0,5)
scene.collection.objects.link(cam); scene.camera = cam

scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 24
scene.render.resolution_x = 1024; scene.render.resolution_y = 1024
w = bpy.data.worlds.new("w"); w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0,0,0,1)
scene.world = w

scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print("DONE", out_path)
