import bpy
from math import radians
img_path=r"C:\Users\mouhr\Desktop\eclipse.jpg"
out=r"D:\LECLAT\fragments_anim\out\eclipse_glow40.png"
scene=bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o,do_unlink=True)
for m in list(bpy.data.materials): bpy.data.materials.remove(m)
LAITON=(0.85,0.64,0.33,1.0)

# base image
bpy.ops.mesh.primitive_plane_add(size=2.4)
pl=bpy.context.active_object
img=bpy.data.images.load(img_path)
m=bpy.data.materials.new("img"); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear()
t=nt.nodes.new("ShaderNodeTexImage"); t.image=img
e=nt.nodes.new("ShaderNodeEmission"); o=nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(t.outputs["Color"],e.inputs["Color"]); nt.links.new(e.outputs["Emission"],o.inputs["Surface"])
pl.data.materials.append(m)

def faille(zname,z,thick,strength,alpha):
    bpy.ops.mesh.primitive_plane_add(size=1.0,location=(0,0,z))
    ob=bpy.context.active_object; ob.scale=(thick,1.7,1.0); ob.rotation_euler[2]=radians(-29)
    mt=bpy.data.materials.new(zname); mt.use_nodes=True
    try: mt.surface_render_method='BLENDED'
    except Exception as ex: print("be",ex)
    n=mt.node_tree; n.nodes.clear()
    # taper alpha along length (object Y via generated coord)
    tc=n.nodes.new("ShaderNodeTexCoord")
    sep=n.nodes.new("ShaderNodeSeparateXYZ")
    n.links.new(tc.outputs["Generated"],sep.inputs["Vector"])
    ramp=n.nodes.new("ShaderNodeValToRGB")  # fade at both ends
    cr=ramp.color_ramp
    cr.elements[0].position=0.0; cr.elements[0].color=(0,0,0,1)
    cr.elements[1].position=0.12; cr.elements[1].color=(1,1,1,1)
    e2=cr.elements.new(0.88); e2.color=(1,1,1,1)
    e3=cr.elements.new(1.0); e3.color=(0,0,0,1)
    n.links.new(sep.outputs["Y"],ramp.inputs["Fac"])
    mul=n.nodes.new("ShaderNodeMath"); mul.operation='MULTIPLY'; mul.inputs[1].default_value=alpha
    n.links.new(ramp.outputs["Color"],mul.inputs[0])
    p=n.nodes.new("ShaderNodeBsdfPrincipled")
    p.inputs["Base Color"].default_value=(0,0,0,1)
    p.inputs["Emission Color"].default_value=LAITON
    p.inputs["Emission Strength"].default_value=strength
    n.links.new(mul.outputs["Value"],p.inputs["Alpha"])
    out_n=n.nodes.new("ShaderNodeOutputMaterial")
    n.links.new(p.outputs["BSDF"],out_n.inputs["Surface"])
    ob.data.materials.append(mt)

faille("glow",0.04,0.060,2.5,0.55)   # soft halo
faille("core",0.05,0.008,7.0,1.0)    # bright thin core

# camera frame 40 look (slightly zoomed)
cd=bpy.data.cameras.new("c"); cd.type='ORTHO'; cd.ortho_scale=1.97
cam=bpy.data.objects.new("c",cd); cam.location=(0,0.0,5); scene.collection.objects.link(cam); scene.camera=cam

scene.render.engine='BLENDER_EEVEE'; scene.eevee.taa_render_samples=32
scene.render.resolution_x=1024; scene.render.resolution_y=1024
w=bpy.data.worlds.new("w"); w.use_nodes=True
w.node_tree.nodes["Background"].inputs[0].default_value=(0,0,0,1); scene.world=w

# --- compositor (Blender 5.1: compositing_node_group) ---
try:
    ng=bpy.data.node_groups.new("Comp","CompositorNodeTree")
    scene.compositing_node_group=ng
    nodes=ng.nodes; links=ng.links
    rl=nodes.new("CompositorNodeRLayers")
    gl=nodes.new("CompositorNodeGlare")
    print("GLARE_TYPES",[i.identifier for i in bpy.types.CompositorNodeGlare.bl_rna.properties['glare_type'].enum_items])
    gl.glare_type='BLOOM' if 'BLOOM' in [i.identifier for i in bpy.types.CompositorNodeGlare.bl_rna.properties['glare_type'].enum_items] else 'FOG_GLOW'
    try: gl.threshold=0.78
    except Exception as ex: print("thr",ex)
    cp=nodes.new("CompositorNodeComposite")
    links.new(rl.outputs["Image"],gl.inputs["Image"])
    links.new(gl.outputs["Image"],cp.inputs["Image"])
    print("COMPOSITOR_OK")
except Exception as ex:
    import traceback; traceback.print_exc(); print("COMPOSITOR_FAIL",ex)

scene.render.image_settings.file_format='PNG'
scene.render.filepath=out
bpy.ops.render.render(write_still=True)
print("STILL_DONE")
