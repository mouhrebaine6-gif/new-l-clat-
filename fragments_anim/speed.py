import bpy, time
img_path = r"C:\Users\mouhr\Desktop\eclipse.jpg"
scene = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.mesh.primitive_plane_add(size=2)
plane = bpy.context.active_object
img = bpy.data.images.load(img_path)
mat = bpy.data.materials.new("f"); mat.use_nodes=True
nt=mat.node_tree; nt.nodes.clear()
tex=nt.nodes.new("ShaderNodeTexImage"); tex.image=img
em=nt.nodes.new("ShaderNodeEmission")
out=nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(tex.outputs["Color"],em.inputs["Color"])
nt.links.new(em.outputs["Emission"],out.inputs["Surface"])
plane.data.materials.append(mat)
cd=bpy.data.cameras.new("c"); cd.type='ORTHO'; cd.ortho_scale=2.0
cam=bpy.data.objects.new("c",cd); cam.location=(0,0,5)
scene.collection.objects.link(cam); scene.camera=cam
scene.render.engine='BLENDER_EEVEE'; scene.eevee.taa_render_samples=16
scene.render.resolution_x=1024; scene.render.resolution_y=1024
scene.render.image_settings.file_format='PNG'
for i in range(1,6):
    scene.render.filepath = r"D:\LECLAT\fragments_anim\out\spd_%02d.png" % i
    t=time.time()
    bpy.ops.render.render(write_still=True)
    print("FRAME %d  %.2fs" % (i, time.time()-t))
