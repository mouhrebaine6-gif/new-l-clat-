import bpy, sys, math
from math import radians

# ---- args after -- : image_path  name  out_dir  ----
argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
img_path = argv[0] if len(argv)>0 else r"C:\Users\mouhr\Desktop\eclipse.jpg"
name     = argv[1] if len(argv)>1 else "eclipse"
out_dir  = argv[2] if len(argv)>2 else r"D:\LECLAT\fragments_anim\out"

FR_END = 60
scene = bpy.context.scene
scene.frame_start = 1; scene.frame_end = FR_END
scene.render.fps = 30
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
for m in list(bpy.data.materials): bpy.data.materials.remove(m)

LAITON = (0.80, 0.62, 0.34, 1.0)

def emis_image(plane, img):
    mat = bpy.data.materials.new("img"); mat.use_nodes=True
    nt=mat.node_tree; nt.nodes.clear()
    t=nt.nodes.new("ShaderNodeTexImage"); t.image=img
    e=nt.nodes.new("ShaderNodeEmission")
    o=nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(t.outputs["Color"],e.inputs["Color"])
    nt.links.new(e.outputs["Emission"],o.inputs["Surface"])
    plane.data.materials.append(mat)

def emis_solid(name,color,strength):
    mat=bpy.data.materials.new(name); mat.use_nodes=True
    try: mat.surface_render_method='BLENDED'
    except Exception as ex: print("blend_err",ex)
    nt=mat.node_tree; nt.nodes.clear()
    p=nt.nodes.new("ShaderNodeBsdfPrincipled")
    p.inputs["Base Color"].default_value=(0,0,0,1)
    p.inputs["Emission Color"].default_value=color
    p.inputs["Emission Strength"].default_value=strength
    p.inputs["Alpha"].default_value=0.0
    o=nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(p.outputs["BSDF"],o.inputs["Surface"])
    return mat,p

# --- base image plane ---
bpy.ops.mesh.primitive_plane_add(size=2.4, location=(0,0,0))
plane=bpy.context.active_object
img=bpy.data.images.load(img_path)
emis_image(plane,img)

# --- faille (thin bright diagonal line) ---
bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0,0,0.05))
faille=bpy.context.active_object
faille.scale=(0.010, 1.7, 1.0)
faille.rotation_euler[2]=radians(-29)   # top toward right -> bottom left
fm,fp=emis_solid("faille",LAITON,4.0); faille.data.materials.append(fm)

# --- faille glow (wider, softer) ---
bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0,0,0.04))
glow=bpy.context.active_object
glow.scale=(0.045, 1.7, 1.0)
glow.rotation_euler[2]=radians(-29)
gm,gp=emis_solid("glow",LAITON,2.0); glow.data.materials.append(gm)

# alpha keyframes: invisible at 0 and 60, fade in 8-22, fade out 46-58
def key_alpha(node_input, frames_vals):
    for f,v in frames_vals:
        node_input.default_value=v
        node_input.keyframe_insert("default_value",frame=f)
key_alpha(fp.inputs["Alpha"], [(1,0.0),(10,0.0),(22,0.95),(46,0.95),(58,0.0),(60,0.0)])
key_alpha(gp.inputs["Alpha"], [(1,0.0),(10,0.0),(22,0.30),(46,0.30),(58,0.0),(60,0.0)])

# --- camera (ortho Ken Burns, seamless) ---
cd=bpy.data.cameras.new("cam"); cd.type='ORTHO'
cam=bpy.data.objects.new("cam",cd); cam.location=(0,0,5)
scene.collection.objects.link(cam); scene.camera=cam
def key(obj,data_path,frames_vals,index=-1):
    for f,v in frames_vals:
        if index<0: setattr(obj,data_path,v)
        else:
            arr=getattr(obj,data_path); arr[index]=v; setattr(obj,data_path,arr)
        obj.keyframe_insert(data_path,frame=f,index=index)
# ortho_scale breathe
for f,v in [(1,2.08),(30,1.95),(60,2.08)]:
    cd.ortho_scale=v; cd.keyframe_insert("ortho_scale",frame=f)
key(cam,"location",[(1,0.0),(15,0.035),(30,0.0),(45,-0.035),(60,0.0)],index=0)
key(cam,"location",[(1,0.0),(30,0.022),(60,0.0)],index=1)

# --- render settings ---
scene.render.engine='BLENDER_EEVEE'; scene.eevee.taa_render_samples=24
scene.render.resolution_x=1024; scene.render.resolution_y=1024
w=bpy.data.worlds.new("w"); w.use_nodes=True
w.node_tree.nodes["Background"].inputs[0].default_value=(0,0,0,1); scene.world=w
scene.render.image_settings.file_format='PNG'
scene.render.filepath = out_dir + "\\" + name + "_"
bpy.ops.render.render(animation=True)
print("ANIM_DONE", name)
