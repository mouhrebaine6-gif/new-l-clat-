import bpy
from math import radians
img_path=r"C:\Users\mouhr\Desktop\eclipse.jpg"
out=r"D:\LECLAT\fragments_anim\out\eclipse_glow40b.png"
scene=bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o,do_unlink=True)
for m in list(bpy.data.materials): bpy.data.materials.remove(m)
LAITON=(0.95,0.70,0.34,1.0)

bpy.ops.mesh.primitive_plane_add(size=2.4)
pl=bpy.context.active_object
img=bpy.data.images.load(img_path)
m=bpy.data.materials.new("img"); nt=m.node_tree; nt.nodes.clear()
t=nt.nodes.new("ShaderNodeTexImage"); t.image=img
e=nt.nodes.new("ShaderNodeEmission"); e.inputs["Strength"].default_value=1.0
o=nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(t.outputs["Color"],e.inputs["Color"]); nt.links.new(e.outputs["Emission"],o.inputs["Surface"])
pl.data.materials.append(m)

def faille(zname,z,thick,strength,alpha):
    bpy.ops.mesh.primitive_plane_add(size=1.0,location=(0,0,z))
    ob=bpy.context.active_object; ob.scale=(thick,1.7,1.0); ob.rotation_euler[2]=radians(-29)
    mt=bpy.data.materials.new(zname)
    try: mt.surface_render_method='BLENDED'
    except Exception as ex: print("be",ex)
    n=mt.node_tree; n.nodes.clear()
    tc=n.nodes.new("ShaderNodeTexCoord"); sep=n.nodes.new("ShaderNodeSeparateXYZ")
    n.links.new(tc.outputs["Generated"],sep.inputs["Vector"])
    ramp=n.nodes.new("ShaderNodeValToRGB"); cr=ramp.color_ramp
    cr.elements[0].position=0.0; cr.elements[0].color=(0,0,0,1)
    cr.elements[1].position=0.13; cr.elements[1].color=(1,1,1,1)
    e2=cr.elements.new(0.87); e2.color=(1,1,1,1)
    e3=cr.elements.new(1.0); e3.color=(0,0,0,1)
    n.links.new(sep.outputs["Y"],ramp.inputs["Fac"])
    mul=n.nodes.new("ShaderNodeMath"); mul.operation='MULTIPLY'; mul.inputs[1].default_value=alpha
    n.links.new(ramp.outputs["Color"],mul.inputs[0])
    p=n.nodes.new("ShaderNodeBsdfPrincipled")
    p.inputs["Base Color"].default_value=(0,0,0,1)
    p.inputs["Emission Color"].default_value=LAITON
    p.inputs["Emission Strength"].default_value=strength
    n.links.new(mul.outputs["Value"],p.inputs["Alpha"])
    out_n=n.nodes.new("ShaderNodeOutputMaterial"); n.links.new(p.outputs["BSDF"],out_n.inputs["Surface"])
    ob.data.materials.append(mt)

faille("glow",0.04,0.050,3.0,0.5)
faille("core",0.05,0.007,12.0,1.0)   # HDR-bright core (>1) -> only this blooms

cd=bpy.data.cameras.new("c"); cd.type='ORTHO'; cd.ortho_scale=1.97
cam=bpy.data.objects.new("c",cd); cam.location=(0,0,5); scene.collection.objects.link(cam); scene.camera=cam
scene.render.engine='BLENDER_EEVEE'; scene.eevee.taa_render_samples=32
scene.render.resolution_x=1024; scene.render.resolution_y=1024
w=bpy.data.worlds.new("w"); w.node_tree.nodes["Background"].inputs[0].default_value=(0,0,0,1); scene.world=w

# compositor 5.1 — glare settings are INPUT sockets
ng=bpy.data.node_groups.new("Comp","CompositorNodeTree"); scene.compositing_node_group=ng
rl=ng.nodes.new("CompositorNodeRLayers"); gl=ng.nodes.new("CompositorNodeGlare"); cp=ng.nodes.new("CompositorNodeComposite")
tsock=gl.inputs["Type"]
try:
    print("TYPE_ENUM",[i.identifier for i in tsock.bl_rna.properties['default_value'].enum_items])
except Exception as ex: print("noenum",ex)
for val in ('FOG_GLOW','BLOOM','Fog Glow'):
    try: tsock.default_value=val; print("SET_TYPE",val); break
    except Exception as ex: print("type_fail",val,ex)
for k,v in [("Threshold",0.95),("Strength",1.0),("Size",8.0),("Smoothness",0.2)]:
    if k in gl.inputs:
        try: gl.inputs[k].default_value=v
        except Exception as ex: print("in_fail",k,ex)
ng.links.new(rl.outputs["Image"],gl.inputs["Image"])
ng.links.new(gl.outputs["Image"],cp.inputs["Image"])
print("COMP_OK")

scene.render.image_settings.file_format='PNG'; scene.render.filepath=out
bpy.ops.render.render(write_still=True); print("STILL_DONE")
